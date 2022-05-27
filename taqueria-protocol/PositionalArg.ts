import {z} from 'zod'
import * as HumanReadableIdentifier from '@taqueria/protocol/HumanReadableIdentifier'
import createType from "@taqueria/protocol/Base"

export const rawSchema = z.object({
    placeholder: HumanReadableIdentifier.rawSchema.describe("Positional Arg Placeholder"),
    description: z.string({description: "Positional Arg Description"}).min(1),
    defaultValue: z.union(
        [z.string(), z.number(), z.boolean()],
        {description: "Positional Arg Default Value"}
    ).optional(),
    type: z.union(
        [z.literal('string'), z.literal('number'), z.literal('boolean')],
        {description: "Positional Arg Datatype"}
    ).optional()
}).describe("Positional Arg")

const internalSchema = z.object({
    placeholder: HumanReadableIdentifier.schemas.schema.describe("Positional Arg Placeholder"),
    description: z.string({description: "Positional Arg Description"}).min(1),
    defaultValue: z.union(
        [z.string(), z.number(), z.boolean()],
        {description: "Positional Arg Default Value"}
    ).optional(),
    type: z.union(
        [z.literal('string'), z.literal('number'), z.literal('boolean')],
        {description: "Positional Arg Datatype"}
    ).optional()
}).describe("Positional Arg")

type RawInput = z.infer<typeof rawSchema>
type Input = z.infer<typeof internalSchema>

export const {schemas, factory} = createType<RawInput, Input>({
    rawSchema,
    internalSchema,
    parseErrMsg: (value: unknown) => `The following positional argument is invalid: ${value}`,
    unknownErrMsg: "Something went wrong parsing the positional argument"
})

export type PositionalArg = z.infer<typeof schemas.schema>
export type t = PositionalArg

export const {create, of, make} = factory