// out/types/PositionalArg.ts
import { toParseErr, toParseUnknownErr } from "@taqueria/protocol/TaqError";
import { resolve, reject } from "fluture";
import { ZodError } from "zod";
import { positionalArgSchema } from "@taqueria/protocol/out/types-zod";
var from = (input) => {
  try {
    return positionalArgSchema.parse(input);
  } catch (previous) {
    if (previous instanceof ZodError) {
      const msgs = previous.errors.reduce(
        (retval, issue) => {
          const path = issue.path.join(" \u2192 ");
          const msg = path + ": " + issue.message;
          return [...retval, msg];
        },
        ["PositionalArg is invalid:"]
      );
      const validationErr = msgs.join("\n") + "\n";
      throw toParseErr(previous, validationErr);
    }
    throw toParseUnknownErr(previous, "There was a problem trying to parse a PositionalArg.");
  }
};
var create = (input) => from(input);
var of = (input) => {
  try {
    return resolve(from(input));
  } catch (err) {
    return reject(err);
  }
};
var make = (input) => of(input);
var schemas = {
  rawSchema: positionalArgSchema,
  schema: positionalArgSchema.transform((val) => val)
};
var rawSchema = schemas.rawSchema;
var internalSchema = positionalArgSchema;
export {
  create,
  from,
  internalSchema,
  make,
  of,
  rawSchema,
  schemas
};
//# sourceMappingURL=PositionalArg.mjs.map