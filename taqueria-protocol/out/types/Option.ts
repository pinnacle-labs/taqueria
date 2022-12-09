// Generated file: Do not edit 
// generated from @taqueria-protocol-types
    
import { TaqError, toFutureParseErr, toFutureParseUnknownErr, toParseErr, toParseUnknownErr } from '@taqueria/protocol/TaqError';
import { FutureInstance, resolve, reject } from 'fluture';
import { ZodError } from 'zod';
import { Option } from '@taqueria/protocol/types';
import { Option as OptionStrict } from '@taqueria/protocol/out/types-strict';
import { optionSchema } from '@taqueria/protocol/out/types-zod';

export type { OptionStrict as Option };

export const from = (input: unknown): OptionStrict => {
	try {
		return optionSchema.parse(input) as OptionStrict;
	}
	catch (previous: unknown) {
		if (previous instanceof ZodError) {
			const msgs: string[] = previous.errors.reduce(
				(retval, issue) => {
					const path = issue.path.join(' → ');
					const msg = path + ': ' + issue.message;
					return [...retval, msg];
				},
				["Option is invalid:"],
			);
			const validationErr = msgs.join('\n') + '\n';
			throw toParseErr(previous, validationErr);
		}
		throw toParseUnknownErr(previous, "There was a problem trying to parse a Option.")
	}
    
};

export const create = (input: Option): OptionStrict => from(input);

export const of = (input: unknown): FutureInstance<TaqError, OptionStrict> => {
	try {
		return resolve(from(input))
	}
	catch (err){
		return reject(err) as FutureInstance<TaqError, never>
	}
};

export const make = (input: Omit<OptionStrict, '__type'>): FutureInstance<TaqError, OptionStrict> => of(input);

// TEMP: for interoperation with old protocol types during transition
export const schemas = {
	rawSchema: optionSchema,
	schema: optionSchema.transform(val => val as OptionStrict),
};
export const rawSchema = schemas.rawSchema;
export const internalSchema = optionSchema;

export type t = OptionStrict;
        