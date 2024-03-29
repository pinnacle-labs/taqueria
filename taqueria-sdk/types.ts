import { ProxyTaskArgs, RequestArgs } from '@taqueria/protocol';
import * as Protocol from '@taqueria/protocol';
import * as Environment from '@taqueria/protocol/Environment';
import type { i18n } from '@taqueria/protocol/i18n';
import * as LoadedConfig from '@taqueria/protocol/LoadedConfig';
import * as MetadataConfig from '@taqueria/protocol/MetadataConfig';
import * as NetworkConfig from '@taqueria/protocol/NetworkConfig';
import * as Operation from '@taqueria/protocol/Operation';
import * as Option from '@taqueria/protocol/Option';
import * as PersistentState from '@taqueria/protocol/PersistentState';
import * as PluginInfo from '@taqueria/protocol/PluginInfo';
import * as PluginSchema from '@taqueria/protocol/PluginSchema';
import * as PositionalArg from '@taqueria/protocol/PositionalArg';
import * as SandboxAccountConfig from '@taqueria/protocol/SandboxAccountConfig';
import * as SandboxConfig from '@taqueria/protocol/SandboxConfig';
import * as SanitizedAbsPath from '@taqueria/protocol/SanitizedAbsPath';
import * as SanitizedPath from '@taqueria/protocol/SanitizedPath';
import * as TaqError from '@taqueria/protocol/TaqError';
import * as Task from '@taqueria/protocol/Task';
import * as Template from '@taqueria/protocol/Template';
export {
	Environment,
	LoadedConfig,
	MetadataConfig,
	NetworkConfig,
	Operation,
	Option,
	PersistentState,
	PluginSchema,
	PositionalArg,
	Protocol,
	SandboxAccountConfig,
	SandboxConfig,
	SanitizedAbsPath,
	SanitizedPath,
	TaqError,
	Task,
	Template,
};

export type { ProxyTaskArgs, RequestArgs };

export interface LikeAPromise<Success, TaqError> extends Promise<Success> {
}

export type PositiveInt = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

export type i18nMessage = string | { message: string; numOfArguments: PositiveInt };

export interface StdIO {
	stdout: string;
	stderr: string;
}

export type pluginDefiner = <T extends RequestArgs.t>(parsedArgs: T, i18n: i18n) => PluginSchema.RawPluginSchema;
