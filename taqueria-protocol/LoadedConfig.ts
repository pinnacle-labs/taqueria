import {z, ZodError} from 'zod'
import {reject, resolve} from "fluture"
import {toParseErr, toParseUnknownErr} from "@taqueria/protocol/TaqError"
import * as Config from '@taqueria/protocol/Config'
import * as InstalledPlugin from '@taqueria/protocol/InstalledPlugin'
import * as SanitizedAbsPath from '@taqueria/protocol/SanitizedAbsPath'
import * as SHA256 from '@taqueria/protocol/SHA256'

export const rawSchema = Config.internalSchema.extend({
    projectDir: SanitizedAbsPath.rawSchema.describe("loadedConfig.projectDir"),
    configFile: SanitizedAbsPath.rawSchema.describe("loadedConfig.configFile"),
    hash: SHA256.schema.describe("loadedConfig.hash")
}).describe("LoadedConfig")

export const internalSchema = Config.internalSchema.extend({
    projectDir: SanitizedAbsPath.schema.describe("loadedConfig.projectDir"),
    configFile: SanitizedAbsPath.schema.describe("loadedConfig.configFile"),
    hash: SHA256.schema.describe("loadedConfig.hash")
}).describe("LoadedConfig")

export const schema = internalSchema.transform((val: unknown) => val as LoadedConfig)

const loadedConfigType: unique symbol = Symbol("LoadedConfig")

type Input = z.infer<typeof internalSchema>

type RawInput = z.infer<typeof rawSchema>

export interface LoadedConfig extends Input, Config.t {
    readonly [loadedConfigType]: void
    readonly contractsDir: string
    readonly artifactsDir: string
    readonly testsDir: string
    readonly plugins: InstalledPlugin.t[]
}

export type t = LoadedConfig

export const make = (data: Input) => {
    try {
        const retval = schema.parse(data)
        return resolve(retval)
    }
    catch (err) {
        if (err instanceof ZodError) {
            return toParseErr<LoadedConfig>(err, "The provided Taqueria configuration is invalid", data)
        }
        return toParseUnknownErr<LoadedConfig>(err, "There was a problem trying to parse the Taqueria configuration", data)
    }
}

export const create = (data: RawInput) => schema.parse(data)

export const toConfig = (loadedConfig: LoadedConfig) => Config.make(loadedConfig)