import { noop, RequestArgs, sendAsyncErr, sendAsyncRes } from '@taqueria/node-sdk';
import { SanitizedAbsPath, SanitizedPath } from '@taqueria/node-sdk/types';
import { mkdir, stat, writeFile } from 'fs/promises';
import { defaults } from 'jest-config';
import { join, relative } from 'path';
import JestConfig from './config';

export type DefaultConfig = typeof defaults;

export interface CustomRequestArgs extends RequestArgs.t {
	config: JestConfig;
	partition?: string;
	init?: string;
	testPattern?: string;
}

export const toRequestArgs = (args: RequestArgs.t): CustomRequestArgs => {
	const config = {
		...args.config,
		jest: {
			testsRootDir: 'tests',
		},
	};

	return {
		...args,
		config,
	};
};

export const getDefaultConfig = (defaultConfig: DefaultConfig) => {
	const settings = { ...defaults, preset: 'ts-jest', testEnvironment: 'node' };
	return (
		`
module.exports = ${JSON.stringify(settings, null, 4)}
`
	);
};

export const ensureRootConfigExists = (projectDir: SanitizedAbsPath.t) => {
	const jestRootConfig = getRootConfigAbspath(projectDir);
	return stat(jestRootConfig)
		.catch(_ => writeFile(jestRootConfig, getDefaultConfig(defaults)))
		.then(_ => jestRootConfig);
};

export const getRootConfigAbspath = (projectDir: SanitizedAbsPath.t) =>
	SanitizedAbsPath.create(
		join(projectDir, '.taq', 'jest.config.js'),
	);

export const getTestsRootDir = (config: JestConfig) => {
	return config.jest.testsRootDir;
};

export const toPartitionCfg = (partitionRelpath: SanitizedPath.t, rootConfigRelPath: SanitizedPath.t) => `
const parentConfig = require('${rootConfigRelPath}')

module.exports = {
    ...parentConfig,
    roots: [
        "${partitionRelpath}"
    ]
}
`;

export const getPartitionAbspath = (partitionDir: string) => SanitizedAbsPath.create(partitionDir);

export const getPartitionConfigAbspath = (partitionDir: string) =>
	SanitizedAbsPath.create(join(partitionDir, 'jest.config.js'));

export const initPartition = (partitionDir: SanitizedAbsPath.t, projectDir: SanitizedAbsPath.t) => {
	return writeFile(
		getPartitionConfigAbspath(partitionDir),
		toPartitionCfg(
			SanitizedPath.create('./'),
			SanitizedPath.create(relative(partitionDir, getRootConfigAbspath(projectDir))),
		),
	);
};

export const ensurePartitionExists = async (
	partitionDir: SanitizedAbsPath.t,
	projectDir: SanitizedAbsPath.t,
	forceCreate = false,
) =>
	ensureRootConfigExists(projectDir)
		.then(_ => stat(partitionDir))
		.then(stats =>
			stats.isFile()
				? sendAsyncErr(`${partitionDir} is an invalid partition directory`)
				: stats
		)
		.catch(_ => mkdir(partitionDir, { recursive: true }))
		.then(_ => getPartitionConfigAbspath(partitionDir))
		.then(partitionCfgAbsPath =>
			stat(partitionCfgAbsPath)
				.then(_ => forceCreate ? initPartition(partitionDir, projectDir) : undefined)
				.catch(_ => initPartition(partitionDir, projectDir))
		)
		.then(_ => getPartitionConfigAbspath(partitionDir));

export const ensureSelectedPartitionExists = (args: CustomRequestArgs, forceCreate = false) =>
	args.partition
		? ensurePartitionExists(
			SanitizedAbsPath.create(join(args.projectDir, args.partition)),
			SanitizedPath.create(args.projectDir),
			forceCreate,
		)
		: ensurePartitionExists(
			SanitizedAbsPath.create(
				join(args.projectDir, getTestsRootDir(args.config)),
			),
			SanitizedPath.create(args.projectDir),
			forceCreate,
		);
