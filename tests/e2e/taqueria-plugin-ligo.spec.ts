import { exec as exec1 } from 'child_process';
import { createHash } from 'crypto';
import fsPromises from 'fs/promises';
import path from 'path';
import util from 'util';
import * as contents from './data/help-contents/ligo-contents';
import { checkFolderExistsWithTimeout, generateTestProject } from './utils/utils';
const exec = util.promisify(exec1);

const taqueriaProjectPath = 'scrap/auto-test-ligo-plugin';

describe('E2E Testing for taqueria ligo plugin', () => {
	beforeAll(async () => {
		await generateTestProject(taqueriaProjectPath, ['ligo']);
		// TODO: This can removed after this is resolved:
		// https://github.com/ecadlabs/taqueria/issues/528
		try {
			await exec(`taq -p ${taqueriaProjectPath}`);
		} catch (_) {}
	});

	// Remove all files from artifacts folder without removing folder itself
	afterEach(async () => {
		try {
			const files = await fsPromises.readdir(`${taqueriaProjectPath}/artifacts/`);
			for (const file of files) {
				await fsPromises.rm(path.join(`${taqueriaProjectPath}/artifacts/`, file));
			}
		} catch (error) {
			throw new Error(`error: ${error}`);
		}
	});

	// Clean up process to remove taquified project folder
	// Comment if need to debug
	afterAll(async () => {
		try {
			await fsPromises.rm(taqueriaProjectPath, { recursive: true });
		} catch (error) {
			throw new Error(`error: ${error}`);
		}
	});

	// Skipping due to changes in the help output text
	test.skip('Verify that the ligo plugin exposes the associated commands in the help menu', async () => {
		try {
			const ligoHelpContents = await exec(`taq --help --projectDir=${taqueriaProjectPath}`);
			expect(ligoHelpContents.stdout).toBe(contents.helpContentsLigoPlugin);
		} catch (error) {
			throw new Error(`error: ${error}`);
		}
	});

	// Skipping due to changes in the help output text
	test.skip('Verify that the ligo plugin exposes the associated options in the help menu', async () => {
		try {
			const ligoHelpContents = await exec(`taq compile --help --projectDir=${taqueriaProjectPath}`);
			expect(ligoHelpContents.stdout).toBe(contents.helpContentsLigoPluginSpecific);
		} catch (error) {
			throw new Error(`error: ${error}`);
		}
	});

	// Skipping due to changes in the help output text
	test.skip('Verify that the ligo plugin aliases expose the correct info in the help menu', async () => {
		try {
			const ligoAliasCHelpContents = await exec(`taq c --help --projectDir=${taqueriaProjectPath}`);
			expect(ligoAliasCHelpContents.stdout).toBe(contents.helpContentsLigoPluginSpecific);

			const ligoAliasCompileLigoHelpContents = await exec(
				`taq compile-ligo --help --projectDir=${taqueriaProjectPath}`,
			);
			expect(ligoAliasCompileLigoHelpContents.stdout).toBe(contents.helpContentsLigoPluginSpecific);
		} catch (error) {
			throw new Error(`error: ${error}`);
		}
	});

	// Skipping due to changes in the help output text
	test.skip('Verify that taqueria ligo plugin outputs no contracts message if no contracts exist', async () => {
		try {
			await exec(`taq compile`, { cwd: `./${taqueriaProjectPath}` });
		} catch (error) {
			expect(String(error)).toContain(contents.ligoNoContractSource);
		}
	});

	// Skipping due to changes in the help output text
	test.skip('Verify that taqueria ligo plugin throw an error message if contract name is not specified', async () => {
		try {
			// 1. Copy contract from data folder to taqueria project folder
			await exec(`cp e2e/data/hello-tacos.mligo ${taqueriaProjectPath}/contracts`);

			// 2. Register the contracts
			await exec(`taq add-contract hello-tacos.mligo`, { cwd: `./${taqueriaProjectPath}` });

			// 3. Run taq compile ${contractName}
			await exec(`taq compile`, { cwd: `./${taqueriaProjectPath}` });
		} catch (error) {
			// 4. Verify that taqueria outputs an error message
			expect(String(error)).toContain(contents.ligoNoContractSource);
		}
	});

	test('Verify that taqueria ligo plugin can compile one contract using compile <sourceFile> command', async () => {
		try {
			// 1. Copy contract from data folder to taqueria project folder
			await exec(`cp e2e/data/hello-tacos.mligo ${taqueriaProjectPath}/contracts`);

			// 2. Register the contracts
			// await exec(`taq add-contract hello-tacos.mligo`, { cwd: `./${taqueriaProjectPath}` });

			// 2. Run taq compile ${contractName}
			await exec(`taq compile hello-tacos.mligo`, { cwd: `./${taqueriaProjectPath}` });

			// 3. Verify that compiled michelson version has been generated
			await checkFolderExistsWithTimeout(`./${taqueriaProjectPath}/artifacts/hello-tacos.tz`);
		} catch (error) {
			throw new Error(`error: ${error}`);
		}
	});

	test('Verify that taqueria ligo plugin will display proper message if user tries to compile contract that does not exist', async () => {
		try {
			// 1. Run taq compile ${contractName} for contract that does not exist
			const { stdout, stderr } = await exec(`taq compile test.mligo`, { cwd: `./${taqueriaProjectPath}` });

			// 2. Verify that output includes next messages:
			// There was a compilation error.
			// contracts/test.mligo: No such file or directory
			expect(stdout).toBe(contents.compileNonExistent);
			expect(stderr).toContain('contracts/test.mligo: No such file or directory');
		} catch (error) {
			throw new Error(`error: ${error}`);
		}
	});

	test('Verify that taqueria ligo plugin emits error and yet displays table if contract is invalid', async () => {
		try {
			await exec(`cp e2e/data/invalid-contract.mligo ${taqueriaProjectPath}/contracts`);
			await exec(`taq add-contract invalid-contract.mligo`, { cwd: `./${taqueriaProjectPath}` });

			const { stdout, stderr } = await exec(`taq compile invalid-contract.mligo`, { cwd: `./${taqueriaProjectPath}` });

			expect(stdout).toBe(contents.compileInvalid);
			expect(stderr).toContain('File "contracts/invalid-contract.mligo", line 1, characters 23-27');
		} catch (error) {
			throw new Error(`error: ${error}`);
		}
	});

	test('Verify that taqueria ligo plugin can run ligo test using taq test <sourceFile> command', async () => {
		try {
			// 1. Copy contract  and tests files from data folder to taqueria project folder
			await exec(`cp e2e/data/hello-tacos-tests.mligo ${taqueriaProjectPath}/contracts`);

			// 2. Run taq test ${testFileName}
			const { stdout, stderr } = await exec(`taq test hello-tacos-tests.mligo`, { cwd: `./${taqueriaProjectPath}` });
			expect(stdout).toContain('All tests passed');
		} catch (error) {
			throw new Error(`error: ${error}`);
		}
	});

	test('Verify that taqueria ligo plugin will output proper error message running taq test <sourceFile> command against invalid test file', async () => {
		try {
			// 1. Copy contract  and tests files from data folder to taqueria project folder
			await exec(`cp e2e/data/hello-tacos-invalid-tests.mligo ${taqueriaProjectPath}/contracts`);

			// 2. Run taq test ${testFileName}
			// const output =   await exec(`taq test hello-tacos-invalid-tests.mligo`, { cwd: `./${taqueriaProjectPath}` });
			const { stdout, stderr } = await exec(`taq test hello-tacos-invalid-tests.mligo`, {
				cwd: `./${taqueriaProjectPath}`,
			});
			expect(stdout).toContain('Some tests failed :(');
			expect(stderr).toContain('Variable "initial_storage" not found.');
		} catch (error) {
			throw new Error(`error: ${error}`);
		}
	});

	test('Verify that taqueria ligo plugin will output proper error message running taq test <sourceFile> command against non-existing file', async () => {
		try {
			// 1. Run taq test ${testFileName} against file that does not exist
			const { stdout, stderr } = await exec(`taq test hello-tacos-test.mligo`, { cwd: `./${taqueriaProjectPath}` });
			expect(stderr).toContain('contracts/hello-tacos-test.mligo: No such file or directory');
		} catch (error) {
			throw new Error(`error: ${error}`);
		}
	});

	test('Verify that a different version of the LIGO image can be used', async () => {
		const imageName = 'ligolang/ligo:0.54.1';

		const result = await exec(`TAQ_LIGO_IMAGE=${imageName} taq get-image --plugin ligo`, {
			cwd: `./${taqueriaProjectPath}`,
		});

		expect(result.stdout.trim()).toBe(imageName);

		// 1. Copy contract from data folder to taqueria project folder
		const contractName = 'hello-custom-image.mligo';
		await exec(`cp e2e/data/hello-tacos.mligo ${taqueriaProjectPath}/contracts/${contractName}`);

		// 2. Run taq compile ${contractName}
		await exec(`taq compile ${contractName}`, { cwd: `./${taqueriaProjectPath}` });

		// 3. Verify that compiled michelson version has been generated
		await checkFolderExistsWithTimeout(`./${taqueriaProjectPath}/artifacts/${contractName.replace('mligo', 'tz')}`);
	});

	test('Verify that the LIGO contract template is instantiated with the right content and registered', async () => {
		try {
			await exec(`taq create contract counter.mligo`, { cwd: `./${taqueriaProjectPath}` });
			const artifactsContents = await exec(`ls ${taqueriaProjectPath}/contracts`);
			expect(artifactsContents.stdout).toContain('counter.mligo');

			const bytes = await fsPromises.readFile(path.join(taqueriaProjectPath, 'contracts', 'counter.mligo'));
			const digest = createHash('sha256');
			digest.update(bytes);
			const hash = digest.digest('hex');

			const configFile = path.join(taqueriaProjectPath, '.taq', 'config.json');
			const config = await fsPromises.readFile(configFile, { encoding: 'utf-8' });
			const json = JSON.parse(config);
			expect(json).toBeInstanceOf(Object);
			expect(json).toHaveProperty('contracts');
			return expect(json.contracts).toEqual({
				'counter.mligo': {
					'hash': '241556bb7f849d22564378991ce6c15ffd7fd5727620f207fb53e6dc538e66ef',
					'sourceFile': 'counter.mligo',
				},
				'invalid-contract.mligo': {
					'hash': '2c7affa29be3adc8cb8b751a27a880165327e96cf8b446a9f73df323b1dceb0f',
					'sourceFile': 'invalid-contract.mligo',
				},
			});
		} catch (error) {
			throw new Error(`error: ${error}`);
		}
	});
});
