// Generated by ts-to-zod
import { z } from 'zod';

const todoConvertTypeSchema = z.object({
	notDoneYet: z.literal(true),
});

export const nonEmptyStringSchema = z.string().min(1);

export const singleCharSchema = z.string().regex(/^[A-Za-z]$/);

export const verbSchema = z.string().regex(/^[A-Za-z\-\ ]+/);

export const aliasSchema = z.union([verbSchema, singleCharSchema]);

export const humanReadableIdentifierSchema = z
	.string()
	.regex(/^[A-Za-z]+[A-Za-z0-9-_ ]*$/);

export const sanitizedAbsPathSchema = z.string();

export const sanitizedPathSchema = z.string().regex(/^(\.\.|\.\/|\/)/);

export const settingsSchema = z.object({
	consent: z.union([z.literal('opt_in'), z.literal('opt_out')]),
});

export const timestampSchema = z.number();

export const tzSchema = z
	.string()
	.min(1)
	.regex(/^\d([\d_]+\d)?$/);

export const versionNumberSchema = z
	.string()
	.min(1)
	.regex(/^\d+\.\d+(\.\d+)*$/);

export const urlSchema = z.string().url();

export const commandSchema = z.string();

export const optionSchema = z.object({
	shortFlag: singleCharSchema.optional(),
	flag: verbSchema,
	description: nonEmptyStringSchema,
	defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
	type: z.union([z.string(), z.number(), z.boolean()]).optional(),
	required: z.boolean().optional(),
	boolean: z.boolean().optional(),
	choices: z.array(z.string()).optional(),
});

export const positionalArgSchema = z.object({
	placeholder: humanReadableIdentifierSchema,
	description: nonEmptyStringSchema,
	defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
	type: z.union([z.string(), z.number(), z.boolean()]).optional(),
	required: z.boolean().optional(),
});

export const installedPluginSchema = z.object({
	type: z.union([z.literal('npm'), z.literal('binary'), z.literal('deno')]),
	name: z.string(),
});

export const runtimeDependencySchema = z.object({
	name: z.string(),
	path: z.string(),
	version: z.string(),
	kind: z.union([z.literal('required'), z.literal('optional')]),
});

export const runtimeDependencyReportSchema = runtimeDependencySchema.and(
	z.object({
		met: z.boolean(),
	}),
);

export const pluginDependenciesResponseSchema = z.object({
	report: z.array(runtimeDependencyReportSchema),
});

export const pluginJsonResponseSchema = z.object({
	data: z.unknown().optional(),
	render: z
		.union([z.literal('none'), z.literal('table'), z.literal('string')])
		.optional(),
});

export const pluginProxyResponseSchema = z.union([
	z.void(),
	pluginJsonResponseSchema,
]);

export const pluginResponseEncodingSchema = z.union([
	z.undefined(),
	z.literal('none'),
	z.literal('json'),
	z.literal('application/json'),
]);

export const pluginActionNameSchema = z.union([
	z.literal('proxy'),
	z.literal('pluginInfo'),
	z.literal('checkRuntimeDependencies'),
	z.literal('installRuntimeDependencies'),
	z.literal('proxyTemplate'),
]);

export const economicalPrototypeHashSchema = z
	.string()
	.regex(/^P[A-Za-z0-9]{50}$/);

export const publicKeyHashSchema = z.string().regex(/^tz1[A-Za-z0-9]{33}$/);

export const sha256Schema = z.string().regex(/^[A-Fa-f0-9]{64}$/);

export const contractSchema = z.object({
	sourceFile: z.string(),
	hash: sha256Schema,
});

export const faucetSchema = z.object({
	pkh: publicKeyHashSchema,
	mnemonic: z.array(z.string()),
	email: z.string().email(),
	password: z.string(),
	amount: z.string().regex(/^\d+$/),
	activation_code: z.string(),
});

export const configSchema = todoConvertTypeSchema;

export const loadedConfigSchema = todoConvertTypeSchema;

export const metadataConfigSchema = todoConvertTypeSchema;

export const networkConfigSchema = todoConvertTypeSchema;

export const sandboxAccountConfigSchema = todoConvertTypeSchema;

export const sandboxConfigSchema = todoConvertTypeSchema;

export const scaffoldConfigSchema = todoConvertTypeSchema;

export const environmentSchema = todoConvertTypeSchema;

export const ephemeralStateSchema = todoConvertTypeSchema;

export const persistentStateSchema = todoConvertTypeSchema;

export const provisionerSchema = todoConvertTypeSchema;

export const provisionerIDSchema = todoConvertTypeSchema;

export const provisionsSchema = todoConvertTypeSchema;

export const parsedConfigSchema = todoConvertTypeSchema;

export const taqErrorSchema = todoConvertTypeSchema;

export const taskSchema = todoConvertTypeSchema;

export const tzKtConfigSchema = z.object({
	disableAutostartWithSandbox: z.boolean().optional(),
	postgresqlPort: z.number().optional().default(5432),
	apiPort: z.number().optional().default(5000),
});

export const sanitizedArgsSchema = z.object({
	configAbsPath: nonEmptyStringSchema,
	sandbox: nonEmptyStringSchema,
	configure: z.boolean().optional(),
	importAccounts: z.boolean().optional(),
	config: parsedConfigSchema,
});

export const requestArgsSchema = sanitizedArgsSchema.omit({ config: true }).and(
	z.object({
		taqRun: pluginActionNameSchema,
		config: loadedConfigSchema,
	}),
);

export const operationSchema = z.object({
	operation: verbSchema,
	command: commandSchema,
	description: z.string().optional(),
	positionals: z.array(positionalArgSchema).optional(),
	options: z.array(optionSchema).optional(),
	handler: z
		.function()
		.args(persistentStateSchema)
		.returns(z.function().args(requestArgsSchema).returns(z.void()))
		.optional(),
});

export const parsedOperationSchema = operationSchema.omit({ handler: true });

const templateHandlerSchema = z.union([
	nonEmptyStringSchema,
	z
		.function()
		.args(requestArgsSchema)
		.returns(
			z.union([
				z.void(),
				pluginJsonResponseSchema,
				z.promise(z.void()),
				z.promise(z.promise(z.void())),
				z.promise(pluginJsonResponseSchema),
			]),
		),
]);

export const templateSchema = z.object({
	template: verbSchema,
	command: commandSchema,
	description: z.string().min(4),
	hidden: z.boolean().optional(),
	options: optionSchema.optional(),
	positionals: positionalArgSchema.optional(),
	handler: templateHandlerSchema,
	encoding: pluginResponseEncodingSchema.optional(),
});

export const parsedTemplateSchema = templateSchema.and(
	z.object({
		handler: z.string(),
		encoding: pluginResponseEncodingSchema.optional(),
	}),
);

export const pluginInfoSchema = z.object({
	name: nonEmptyStringSchema,
	version: versionNumberSchema,
	schema: versionNumberSchema,
	alias: aliasSchema,
	tasks: z.array(taskSchema).optional(),
	operations: z.array(parsedOperationSchema).optional(),
	templates: z.array(parsedTemplateSchema).optional(),
});

export const pluginSchemaSchema = z.object({
	name: aliasSchema.optional(),
	version: versionNumberSchema,
	schema: versionNumberSchema,
	alias: aliasSchema,
	tasks: z.array(taskSchema).optional(),
	operations: z.array(operationSchema).optional(),
	templates: z.array(templateSchema).optional(),
	proxy: z
		.function()
		.args(requestArgsSchema)
		.returns(z.promise(pluginProxyResponseSchema))
		.optional(),
	checkRuntimeDependencies: z
		.function()
		.args(requestArgsSchema)
		.returns(z.promise(pluginDependenciesResponseSchema))
		.optional(),
	installRuntimeDependencies: z
		.function()
		.args(requestArgsSchema)
		.returns(z.promise(pluginDependenciesResponseSchema))
		.optional(),
});
