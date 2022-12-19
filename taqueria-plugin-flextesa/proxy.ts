import {
	execCmd,
	getArch,
	getDefaultSandboxAccount,
	getDockerImage,
	NonEmptyString,
	noop,
	readJsonFile,
	sendAsyncErr,
	sendAsyncRes,
	sendErr,
	sendJsonRes,
	spawnCmd,
	stringToSHA256,
	writeJsonFile,
} from '@taqueria/node-sdk';
import { Config, RequestArgs } from '@taqueria/node-sdk';
import { LoadedConfig, Protocol, SandboxAccountConfig, SandboxConfig, StdIO } from '@taqueria/node-sdk/types';
import { SanitizedArgs, TaqError } from '@taqueria/protocol/taqueria-protocol-types';
import { Config as RawConfig } from '@taqueria/protocol/types';
import retry from 'async-retry';
import type { ExecException } from 'child_process';
import { getPortPromise } from 'portfinder';
import { getTzKtContainerNames, getTzKtStartCommands } from './tzkt-manager';

const { Url } = Protocol;

export interface Opts extends RequestArgs.t {
	sandboxName?: string;
	task?: string;
}

export interface ValidLoadedConfig extends LoadedConfig.t {
	sandbox: Record<string, SandboxConfig.t>;
	accounts: Record<string, Protocol.Tz.t>;
}

export interface ValidOpts extends RequestArgs.t {
	sandboxName: string;
	task: string;
	config: ValidLoadedConfig;
}

/*** @int ***/
type BlockTime = number;

type FlextesaBakingEnabled = {
	baking: 'enabled';
	block_time?: BlockTime;
};

type FlextesaBakingDisabled = {
	baking: 'disabled';
};

type FlextesaBakingAuto = {
	baking: 'auto';
};

// Assigned to SandboxConfig->annotations
type FlextesaAnnotations = FlextesaBakingEnabled | FlextesaBakingDisabled | FlextesaBakingAuto;

const ECAD_FLEXTESA_IMAGE_ENV_VAR = 'TAQ_ECAD_FLEXTESA_IMAGE';
const PROTOCOL_IDENTIFIER = 'PtKathmankSp';
const PROTOCOL_NAME = 'Kathmandu';

const getDefaultDockerImage = (opts: ValidOpts) => `oxheadalpha/flextesa:20221026`;

// ATTENTION: There is a duplicate of this function in taqueria-vscode-extension/src/lib/gui/SandboxesDataProvider.ts
// Please make sure the two are kept in-sync
export const getUniqueSandboxName = async (sandboxName: string, projectDir: string) => {
	const hash = await stringToSHA256(sandboxName + projectDir);
	return `${sandboxName.substring(0, 10)}-${hash.substring(0, 5)}`;
};

export const getContainerName = async (parsedArgs: ValidOpts) => {
	const uniqueSandboxName = await getUniqueSandboxName(parsedArgs.sandboxName, parsedArgs.projectDir);
	return `taq-flextesa-${uniqueSandboxName}`;
};

export const getNewPortIfPortInUse = async (port: number): Promise<number> => {
	const newPort = await getPortPromise({ port });
	return newPort;
};

const replaceRpcUrlInConfig = async (newPort: string, oldUrl: string, sandboxName: string, opts: ValidOpts) => {
	await updateConfig(opts, (config: RawConfig) => {
		const newUrl = oldUrl.replace(/:\d+/, ':' + newPort) as Protocol.Url.t;
		const sandbox = config.sandbox;
		const sandboxConfig = sandbox ? sandbox[sandboxName] : undefined;
		if (typeof sandboxConfig === 'string' || sandboxConfig === undefined) {
			return;
		}
		const updatedConfig: RawConfig = {
			...config,
			sandbox: {
				...sandbox,
				[sandboxName]: {
					...sandboxConfig,
					rpcUrl: newUrl,
				},
			},
		};
		return updatedConfig;
	});
};

export const updateConfig = async (opts: ValidOpts, update: (config: RawConfig) => RawConfig | undefined) => {
	const config = await readJsonFile<RawConfig>(opts.config.configFile);
	const updatedConfig = update(config);
	if (!updatedConfig) {
		return;
	}

	await writeJsonFile(opts.config.configFile)(updatedConfig);
	return config;
};

// TODO: We should adjust our plugins to have a types.ts file just like the taqueria-protocol, and
// have our code generator generate type modules that use Zod schemas.
//
// We can then use those modules to parse things like annotations into plugin-specifc types
// For now, I'll do things the old-fashioned way and just manually validate the annotations
const getFlextesaAnnotations = (sandbox: SandboxConfig.t): Promise<FlextesaAnnotations> => {
	const defaults = {
		baking: 'enabled',
		block_time: 5,
	};

	const settings = {
		...defaults,
		...sandbox.annotations,
	};

	if (!['enabled', 'disabled', 'auto'].includes(settings.baking)) {
		return Promise.reject(
			'The "baking" setting of a Flextesa Sandbox must to set to either "enabled", "disabled", or "auto".',
		);
	} else if (!Number.isInteger(settings.block_time)) {
		return Promise.reject(
			'The "block_time" setting of a Flextesa Sandbox must be an integer, and set to a value greater than 0.',
		);
	} else if (settings.block_time <= 0) {
		return Promise.reject(
			'The "block_time" setting of a Flextesa Sandbox must be set to a value greater than 0. If you are trying to disable baking, please set the "baking" setting to "disabled" instead.',
		);
	}

	return Promise.resolve(settings as FlextesaAnnotations);
};

const getAccountFlags = (sandbox: SandboxConfig.t, config: ValidLoadedConfig) =>
	Object.entries(sandbox.accounts ?? {}).reduce(
		(retval, [accountName, accountDetails], _index, _) => {
			if (accountName === 'default') return retval;
			const desiredBalance = config.accounts[accountName];
			const account = accountDetails as SandboxAccountConfig.t;
			return [
				...retval,
				`--add-bootstrap-account "${accountName},${account.encryptedKey},${account.publicKeyHash},${account.secretKey}@${desiredBalance}"`,
				`--no-daemons-for=${accountName}`,
			];
		},
		[] as string[],
	);

const getBakingFlags = (sandbox: SandboxConfig.t) =>
	getFlextesaAnnotations(sandbox)
		.then(settings => {
			// Enabled
			if (settings.baking === 'enabled') {
				return [
					'--number-of-b 1',
					`--time-b ${settings.block_time}`,
				];
			} // Disabled
			else if (settings.baking === 'disabled') {
				return [
					'--no-baking',
					`--time-b 1`,
				];
			}

			// Auto
			return [
				'--no-baking',
				`--time-b 1`,
			];
		});

const getMininetCommand = (sandboxName: string, sandbox: SandboxConfig.t, opts: ValidOpts) =>
	Promise.all([
		getAccountFlags(sandbox, opts.config),
		getBakingFlags(sandbox),
	])
		.then(([accountFlags, bakingFlags]) => [
			'flextesa mini-net',
			'--root /tmp/mini-box',
			'--set-history-mode N000:archive', // TODO: Add annotation for this setting
			'--until-level 200_000_000', // TODO: Add annotation for this setting
			`--protocol-kind ${PROTOCOL_NAME}`,
			`--number-of-b 1`,
			...accountFlags,
			...bakingFlags,
		])
		.then(flags => flags.join(' '));

const getStartCommand = async (sandboxName: string, sandbox: SandboxConfig.t, opts: ValidOpts) => {
	const port = new URL(sandbox.rpcUrl).port;
	const newPort = (await getNewPortIfPortInUse(parseInt(port))).toString();
	if (newPort !== port) {
		console.log(
			`${port} is already in use, ${newPort} will be used for sandbox ${sandboxName} instead and .taq/config.json will be updated to reflect this.`,
		);
		await replaceRpcUrlInConfig(newPort, sandbox.rpcUrl.toString(), sandboxName, opts);
	}
	const ports = `-p ${newPort}:20000`;

	const containerName = await getContainerName(opts);
	const arch = await getArch();
	const image = getDockerImage(getDefaultDockerImage(opts), ECAD_FLEXTESA_IMAGE_ENV_VAR);
	const projectDir = process.env.PROJECT_DIR ?? opts.config.projectDir;

	return `docker run -i --network sandbox_${sandboxName}_net --name ${containerName} --rm --detach --platform ${arch} ${ports} -v ${projectDir}:/project -w /app ${image} /bin/sh`;
};

const startMininet = async (sandboxName: string, sandbox: SandboxConfig.t, opts: ValidOpts) => {
	const containerName = await getContainerName(opts);
	const mininetCmd = await getMininetCommand(sandboxName, sandbox, opts);
	return execCmd(`docker exec -d ${containerName} ${mininetCmd}`);
};

const getConfigureCommand = async (opts: ValidOpts): Promise<string> => {
	const containerName = await getContainerName(opts);
	return `docker exec ${containerName} octez-client --endpoint http://localhost:20000 config update`;
};

const doesUseFlextesa = (sandbox: SandboxConfig.t) => !sandbox.plugin || sandbox.plugin === 'flextesa';

const doesNotUseFlextesa = (sandbox: SandboxConfig.t) => !doesUseFlextesa(sandbox);

const startSandbox = (sandboxName: string, sandbox: SandboxConfig.t, opts: ValidOpts): Promise<void> => {
	if (doesNotUseFlextesa(sandbox)) {
		return sendAsyncErr(`Cannot start ${sandbox.label} as its configured to use the ${sandbox.plugin} plugin.`);
	}

	return Promise.resolve(opts)
		.then(addSandboxAccounts)
		.then(() => {
			console.log('Booting sandbox...');
			return getStartCommand(sandboxName, sandbox, opts);
		})
		.then(execCmd)
		.then(() => importSandboxAccounts(opts))
		.then(() => importBaker(opts))
		.then(() => startMininet(sandboxName, sandbox, opts))
		.then(() => configureTezosClient(sandboxName, opts))
		.then(() => {
			console.log('Sandbox started');
		});
};

const startContainer = async (container: { name: string; command: string }): Promise<void> => {
	console.log(`Starting ${container.name}`);
	try {
		const result = await execCmd(container.command);
		if (result.stderr) {
			console.error(result.stderr);
		}
		console.log(result.stdout);
	} catch (e: unknown) {
		throw e;
	}
};

const startInstance = async (sandboxName: string, sandbox: SandboxConfig.t, opts: ValidOpts): Promise<void> => {
	await execCmd(
		`docker network ls | grep 'sandbox_${sandboxName}_net' > /dev/null || docker network create --driver bridge sandbox_${sandboxName}_net`,
	);

	const isRunning = await isSandboxRunning(opts.sandboxName, opts);
	if (isRunning) {
		await sendAsyncRes('Already running.');
		return;
	}

	await startSandbox(sandboxName, sandbox, opts);

	if (sandbox.tzkt?.disableAutostartWithSandbox === true) {
		return;
	}
	const { postgres, sync, api } = await getTzKtStartCommands(sandboxName, sandbox, opts);
	const tzKtContainers = [
		{ name: 'postgresql', command: postgres },
		{ name: 'TzKt.Sync', command: sync },
		{ name: 'TzKt.Api', command: api },
	];
	for (const container of tzKtContainers) {
		await startContainer(container);
	}
};

const configureTezosClient = (sandboxName: string, opts: ValidOpts): Promise<StdIO> =>
	retry(
		() =>
			getConfigureCommand(opts)
				.then(execCmd)
				.then(({ stderr, stdout }) => {
					if (stderr.length) return Promise.reject(stderr);
					return ({ stderr, stdout });
				}),
	);

const importBaker = (opts: ValidOpts) =>
	getContainerName(opts)
		.then(container =>
			`docker exec ${container} octez-client import secret key b0 unencrypted:edsk3RFgDiCt7tWB2oe96w1eRw72iYiiqZPLu9nnEY23MYRp2d8Kkx`
		)
		.then(execCmd);

const startAll = (opts: ValidOpts): Promise<void> => {
	if (opts.config.sandbox === undefined) return sendAsyncErr('No sandboxes configured to start');

	const processes = Object.entries(opts.config.sandbox).reduce(
		(retval, [sandboxName, sandboxDetails]) => {
			if (sandboxName === 'default') return retval;
			return [...retval, startInstance(sandboxName, sandboxDetails as SandboxConfig.t, opts)];
		},
		[] as Promise<void>[],
	);

	return Promise.all(processes).then(_ => sendAsyncRes('Done.'));
};

const getSandbox = ({ sandboxName, config }: Opts) => {
	if (sandboxName && config.sandbox && config.sandbox[sandboxName]) {
		const sandboxConfig = config.sandbox![sandboxName] as SandboxConfig.t;
		return sandboxConfig;
	}
	return undefined;
};

const getValidSandbox = (sandboxName: string, config: ValidLoadedConfig) => {
	return config.sandbox[sandboxName] as SandboxConfig.t;
};

const startSandboxTask = (parsedArgs: ValidOpts): Promise<void> => {
	const sandbox = getValidSandbox(parsedArgs.sandboxName, parsedArgs.config);
	return sandbox
		? startInstance(parsedArgs.sandboxName, sandbox, parsedArgs)
		: sendAsyncErr(`There is no sandbox configuration with the name ${parsedArgs.sandboxName}.`);
};

const isSandboxRunning = (sandboxName: string, opts: ValidOpts) => {
	return getContainerName(opts)
		.then(containerName => execCmd(`docker ps --filter name=${containerName} | grep -w ${containerName}`))
		.then(_ => true)
		.catch(_ => false);
};

type AccountBalance = { account: string; balance: string; address: string | undefined };
const getAccountBalances = (
	sandboxName: string,
	sandbox: SandboxConfig.t,
	opts: ValidOpts,
): Promise<AccountBalance[]> => {
	const processes = Object.entries(sandbox.accounts ?? {}).reduce(
		(retval: Promise<AccountBalance>[], [accountName, accountDetails]) => {
			if (accountName === 'default') return retval;

			const getBalanceProcess = getArch()
				.then(_ => getContainerName(opts))
				.then(containerName => `docker exec ${containerName} octez-client get balance for ${accountName.trim()}`)
				.then(execCmd)
				.then(({ stdout, stderr }) => {
					if (stderr.length > 0) sendErr(stderr);
					return {
						account: accountName,
						balance: stdout.trim(),
						address: (accountDetails as SandboxAccountConfig.t).publicKeyHash,
					};
				})
				.catch((err: ExecException) => {
					sendErr(err.message);
					return {
						account: accountName,
						balance: 'Error',
						address: (accountDetails as SandboxAccountConfig.t).publicKeyHash,
					};
				});
			return [...retval, getBalanceProcess];
		},
		[],
	);

	return Promise.all(processes);
};

const listAccountsTask = async <T>(parsedArgs: ValidOpts): Promise<void> => {
	if (parsedArgs.sandboxName) {
		const sandbox = getSandbox(parsedArgs);
		if (sandbox) {
			if (doesUseFlextesa(sandbox)) {
				return await isSandboxRunning(parsedArgs.sandboxName, parsedArgs)
					? getAccountBalances(parsedArgs.sandboxName, sandbox, parsedArgs)
						.then(sendJsonRes)
					: sendAsyncErr(`The ${parsedArgs.sandboxName} sandbox is not running.`);
			}
			return sendAsyncErr(
				`Cannot start ${sandbox.label} as its configured to use the ${sandbox.plugin} plugin.`,
			);
		}
		return sendAsyncErr(`There is no sandbox configuration with the name ${parsedArgs.sandboxName}.`);
	}
	return sendAsyncErr(`Please specify a sandbox. E.g. taq list accounts local`);
};

const stopSandboxTask = async (parsedArgs: ValidOpts): Promise<void> => {
	if (parsedArgs.sandboxName) {
		const sandbox = getSandbox(parsedArgs);
		if (sandbox) {
			if (doesUseFlextesa(sandbox)) {
				await isSandboxRunning(parsedArgs.sandboxName, parsedArgs)
					? execCmd(`docker kill ${await getContainerName(parsedArgs)}`)
						.then(_ => sendAsyncRes(`Stopped ${parsedArgs.sandboxName}.`))
					: sendAsyncRes(`The ${parsedArgs.sandboxName} sandbox was not running.`);
				await stopTzKtContainers(parsedArgs.sandboxName, sandbox, parsedArgs);
				return;
			}
			return sendAsyncErr(`Cannot stop ${sandbox.label} as its configured to use the ${sandbox.plugin} plugin.`);
		}
		return sendAsyncErr(`There is no sandbox configuration with the name ${parsedArgs.sandboxName}.`);
	}
	return sendAsyncErr(`No sandbox specified`);
};

const stopTzKtContainers = async (
	sandboxName: string,
	sandbox: SandboxConfig.t,
	parsedArgs: ValidOpts,
): Promise<void> => {
	const containerNames = await getTzKtContainerNames(sandboxName, parsedArgs);
	const containersToStop = [containerNames.api, containerNames.sync, containerNames.postgres];
	for (const container of containersToStop) {
		try {
			const result = await execCmd(`docker stop ${container}`);
			if (result.stderr) {
				console.error(result.stderr);
			}
			console.log(result.stdout);
		} catch (e: unknown) {
			// ignore
		}
	}
};

const bake = (parsedArgs: ValidOpts) =>
	getContainerName(parsedArgs)
		.then(containerName => {
			return spawnCmd(`docker exec ${containerName} octez-client bake for b0`).then(noop);
		});

const instantiateAccounts = (parsedArgs: ValidOpts) =>
	getContainerName(parsedArgs)
		.then(containerName =>
			Object.entries(parsedArgs.config.accounts).reduce(
				(lastConfig, [accountName, _]) =>
					// TODO: This could probably be more performant by generating the key pairs using TS rather than proxy to docker/flextesa
					lastConfig
						.then(_ => execCmd(`docker exec ${containerName} flextesa key ${accountName}`))
						.then(result => result.stdout.trim().split(','))
						.then(([_alias, encryptedKey, publicKeyHash, secretKey]) =>
							SandboxAccountConfig.create({
								encryptedKey,
								publicKeyHash,
								secretKey,
							})
						)
						.then(async accountConfig => {
							const config = await lastConfig;
							const accounts = config.sandbox[parsedArgs.sandboxName].accounts ?? {};
							accounts[accountName] = accountConfig;
							config.sandbox[parsedArgs.sandboxName].accounts = accounts;
							return config;
						}),
				Promise.resolve(parsedArgs.config),
			)
		)
		.then(Config.create)
		.then(config => writeJsonFile(parsedArgs.config.configFile)(config).then(_ => config))
		.then(config =>
			LoadedConfig.create({
				...parsedArgs.config,
				...config,
			}) as ValidLoadedConfig
		);

const hasInstantiatedAccounts = (parsedArgs: ValidOpts) => {
	const sandbox = getValidSandbox(parsedArgs.sandboxName, parsedArgs.config);
	const accounts = sandbox.accounts ?? {};
	return Object.keys(accounts).length > 0;
};

const maybeInstantiateAccounts = (parsedArgs: ValidOpts) => {
	return hasInstantiatedAccounts(parsedArgs)
		? Promise.resolve(parsedArgs.config)
		: instantiateAccounts(parsedArgs);
};

const importSandboxAccounts = (parsedArgs: ValidOpts) =>
	(updatedConfig: ValidLoadedConfig) =>
		getContainerName(parsedArgs)
			.then(containerName =>
				Object.entries(getValidSandbox(parsedArgs.sandboxName, updatedConfig).accounts ?? {}).reduce(
					(retval, [accountName, account]) =>
						retval
							.then(() =>
								typeof account === 'string'
									? noop()
									: execCmd(
										`docker exec ${containerName} octez-client --protocol ${PROTOCOL_IDENTIFIER} import secret key ${accountName} ${account.secretKey} --force | tee /tmp/import-key.log`,
									).then(noop)
							),
					Promise.resolve(noop()),
				)
			);

const addSandboxAccounts = (parsedArgs: ValidOpts) => maybeInstantiateAccounts(parsedArgs);

const monitor = (parsedArgs: ValidOpts): Promise<void> => {
	const sandbox = getSandbox(parsedArgs);
	if (sandbox) {
		return getContainerName(parsedArgs)
			.then(container => spawnCmd(`docker exec ${container} octez-client rpc get /monitor/valid_blocks`))
			.then(() => {});
	} else return sendAsyncErr('Please specify the name of a sandbox to monitor.');
};

const getDefaultSandboxName = (parsedArgs: Opts) => {
	return Object.keys(parsedArgs.config.sandbox ?? {}).shift() ?? 'local';
};

const validateRequest = async (unparsedArgs: Opts) => {
	// Validate that we have what we need
	const sandboxName = unparsedArgs.sandboxName ?? getDefaultSandboxName(unparsedArgs);
	const sandbox = getSandbox(unparsedArgs);
	if (!sandbox) {
		await sendAsyncErr(
			unparsedArgs.sandboxName
				? `There is no sandbox called ${unparsedArgs.sandboxName} in your .taq/config.json.`
				: `No sandbox name was specified. We tried using ${unparsedArgs.sandboxName} but couldn't find a valid sandbox config for a sandbox with that name`,
		);
		return false;
	}

	if (!unparsedArgs.task || !/list accounts|start sandbox|stop sandbox|monitor|bake/.test(unparsedArgs.task)) {
		await sendAsyncErr(`${unparsedArgs.task} is not an understood task by the Flextesa plugin`);
		return false;
	}

	if (doesNotUseFlextesa(sandbox)) {
		await sendAsyncErr(
			`Cannot ${unparsedArgs.task} for ${sandbox.label} as its configured to use the ${sandbox.plugin} plugin.`,
		);
		return false;
	}

	if (!unparsedArgs.config.accounts) {
		await sendAsyncErr(`This task required a list of declared accounts in your .taq/config.json.`);
	}

	return true;
};

export const proxy = (unparsedArgs: Opts): Promise<void> =>
	validateRequest(unparsedArgs).then(success => {
		if (success) {
			const parsedArgs = unparsedArgs as ValidOpts;

			switch (parsedArgs.task) {
				case 'list accounts':
					return listAccountsTask(parsedArgs);
				case 'start sandbox':
					return startSandboxTask(parsedArgs);
				case 'stop sandbox':
					return stopSandboxTask(parsedArgs);
				case 'monitor':
					return monitor(parsedArgs);
				case 'bake':
					return bake(parsedArgs);
				default:
					return sendAsyncErr(`${parsedArgs.task} is not an understood task by the Flextesa plugin`);
			}
		}
	});

export default proxy;
