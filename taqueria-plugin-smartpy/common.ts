import { execCmd, sendErr, sendWarn } from '@taqueria/node-sdk';
import { RequestArgs } from '@taqueria/node-sdk/types';
import { access } from 'fs/promises';
import { join } from 'path';

export interface CompileOpts extends RequestArgs.ProxyRequestArgs {
	sourceFile: string;
	json: boolean;
}

export interface TestOpts extends RequestArgs.ProxyRequestArgs {
	sourceFile: string;
}

export type IntersectionOpts = CompileOpts & TestOpts;

type UnionOpts = CompileOpts | TestOpts;

const SMARTPY_ARTIFACTS_DIR = '.smartpy';

const SMARTPY_INSTALL_CMD =
	'curl -s https://smartpy.io/cli/install.sh > ~/SmartPyCliInstaller.sh; bash ~/SmartPyCliInstaller.sh --yes; rm ~/SmartPyCliInstaller.sh';

export const addPyExtensionIfMissing = (sourceFile: string): string =>
	/\.py$/.test(sourceFile) ? sourceFile : `${sourceFile}.py`;

const extractExt = (path: string): string => {
	const matchResult = path.match(/\.py$/);
	return matchResult ? matchResult[0] : '';
};

const removeExt = (path: string): string => {
	const extRegex = new RegExp(extractExt(path));
	return path.replace(extRegex, '');
};

export const getSmartPyCli = (): string => `${process.env.HOME}/smartpy-cli/SmartPy.sh`;

export const getInputFilename = (parsedArgs: UnionOpts, sourceFile: string): string =>
	join(parsedArgs.config.contractsDir, sourceFile);

export const getCompilationTargetsDirname = (parsedArgs: UnionOpts, sourceFile: string): string =>
	join(parsedArgs.config.artifactsDir, SMARTPY_ARTIFACTS_DIR, removeExt(sourceFile));

export const installSmartPyCliIfNotExist = () =>
	access(getSmartPyCli())
		.catch(() => {
			sendWarn('SmartPy CLI not found. Installing it now...');
			return execCmd(SMARTPY_INSTALL_CMD)
				.then(({ stderr }) => {
					if (stderr.length > 0) sendWarn(stderr);
				});
		});

export const emitExternalError = (err: unknown, sourceFile: string): void => {
	sendErr(`\n=== Error messages for ${sourceFile} ===`);
	err instanceof Error ? sendErr(err.message.replace(/Command failed.+?\n/, '')) : sendErr(err as any);
	sendErr(`\n===`);
};
