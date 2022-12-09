// Generated file: Do not edit 
// generated from @taqueria-protocol-types
    
import { TaqError, toFutureParseErr, toFutureParseUnknownErr, toParseErr, toParseUnknownErr } from '@taqueria/protocol/TaqError';
import { FutureInstance, resolve, reject } from 'fluture';
import { ZodError } from 'zod';
import { NetworkAccountConfig } from '@taqueria/protocol/types';
import { NetworkAccountConfig as NetworkAccountConfigStrict } from '@taqueria/protocol/out/types-strict';
import { networkAccountConfigSchema } from '@taqueria/protocol/out/types-zod';

export type { NetworkAccountConfigStrict as NetworkAccountConfig };

export const from = (input: unknown): NetworkAccountConfigStrict => {
	try {
		return networkAccountConfigSchema.parse(input) as NetworkAccountConfigStrict;
	}
	catch (previous: unknown) {
		if (previous instanceof ZodError) {
			const msgs: string[] = previous.errors.reduce(
				(retval, issue) => {
					const path = issue.path.join(' → ');
					const msg = path + ': ' + issue.message;
					return [...retval, msg];
				},
				["NetworkAccountConfig is invalid:"],
			);
			const validationErr = msgs.join('\n') + '\n';
			throw toParseErr(previous, validationErr);
		}
		throw toParseUnknownErr(previous, "There was a problem trying to parse a NetworkAccountConfig.")
	}
    
};

export const create = (input: NetworkAccountConfig): NetworkAccountConfigStrict => from(input);

export const of = (input: unknown): FutureInstance<TaqError, NetworkAccountConfigStrict> => {
	try {
		return resolve(from(input))
	}
	catch (err){
		return reject(err) as FutureInstance<TaqError, never>
	}
};

export const make = (input: Omit<NetworkAccountConfigStrict, '__type'>): FutureInstance<TaqError, NetworkAccountConfigStrict> => of(input);

// TEMP: for interoperation with old protocol types during transition
export const schemas = {
	rawSchema: networkAccountConfigSchema,
	schema: networkAccountConfigSchema.transform(val => val as NetworkAccountConfigStrict),
};
export const rawSchema = schemas.rawSchema;
export const internalSchema = networkAccountConfigSchema;

export type t = NetworkAccountConfigStrict;
        