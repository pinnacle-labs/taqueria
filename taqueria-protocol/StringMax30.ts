// @ts-ignore see above
import {z} from 'https://deno.land/x/zod@v3.14.4/mod.ts'

const schema = z
    .string()
    .max(30)
    .transform(val => val as t)

const stringMax30Type: unique symbol = Symbol("StringMax30")

export type t = string & {
    readonly [stringMax30Type]: void
}

export type StringMax30 = t

export const make = (value: string) => schema.parse(value)