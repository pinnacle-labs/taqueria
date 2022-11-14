// Generated by ts-to-zod
import { z } from 'zod';

export const nonEmptyStringSchema = z.string().min(1);

export const singleCharSchema = nonEmptyStringSchema.regex(/^[A-Za-z]$/);

export const verbSchema = nonEmptyStringSchema.regex(/^[A-Za-z\-\ ]+/);

export const aliasSchema = z.union([verbSchema, singleCharSchema]);

export const humanReadableIdentifierSchema = nonEmptyStringSchema.regex(
	/^[A-Za-z]+[A-Za-z0-9-_ ]*$/,
);

export const sanitizedAbsPathSchema = nonEmptyStringSchema;

export const sanitizedPathSchema = nonEmptyStringSchema;

export const settingsSchema = z.object({
	consent: z.union([z.literal('opt_in'), z.literal('opt_out')]),
});

export const timestampSchema = z.number().min(1651846877);

export const tzSchema = nonEmptyStringSchema.min(1).regex(/^\d([\d_]+\d)?$/);

export const versionNumberSchema = nonEmptyStringSchema
	.min(1)
	.regex(/^\d+\.\d+(\.\d+)*$/);

export const urlSchema = nonEmptyStringSchema.url();

export const commandSchema = nonEmptyStringSchema;

export const optionSchema = z.object({
	shortFlag: singleCharSchema.optional(),
	flag: verbSchema,
	description: nonEmptyStringSchema,
	defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
	type: z
		.union([z.literal('string'), z.literal('number'), z.literal('boolean')])
		.optional(),
	required: z.boolean().optional(),
	boolean: z.boolean().optional(),
	choices: z.array(nonEmptyStringSchema).optional(),
});

export const positionalArgSchema = z.object({
	placeholder: humanReadableIdentifierSchema,
	description: nonEmptyStringSchema,
	defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
	type: z
		.union([z.literal('string'), z.literal('number'), z.literal('boolean')])
		.optional(),
	required: z.boolean().optional(),
});

export const installedPluginSchema = z.object({
	type: z.union([z.literal('npm'), z.literal('binary'), z.literal('deno')]),
	name: nonEmptyStringSchema,
});

export const runtimeDependencySchema = z.object({
	name: humanReadableIdentifierSchema,
	path: z.string(),
	version: z.string(),
	kind: z.union([z.literal('required'), z.literal('optional')]),
});

export const runtimeDependencyReportSchema = runtimeDependencySchema.extend(
	{
		met: z.boolean(),
	},
);

export const pluginDependenciesResponseSchema = z.object({
	report: z.array(runtimeDependencyReportSchema),
});

export const pluginJsonResponseSchema = z.union([
	z.object({
		data: z.unknown().optional(),
		render: z
			.union([z.literal('none'), z.literal('table'), z.literal('string')])
			.default('none'),
	}),
	z.void(),
]);

export const pluginProxyResponseSchema = z.union([
	z.void(),
	pluginJsonResponseSchema,
]);

export const pluginResponseEncodingSchema = z
	.union([z.literal('none'), z.literal('json'), z.literal('application/json')])
	.default('none');

export const buildNumberSchema = z.number();

export const sanitizedArgsSchema = z.object({
	_: z.array(nonEmptyStringSchema),
	projectDir: sanitizedPathSchema,
	maxConcurrency: z.number(),
	debug: z.boolean(),
	disableState: z.boolean(),
	logPluginRequests: z.boolean(),
	fromVsCode: z.boolean(),
	version: z.boolean(),
	build: z.boolean(),
	help: z.boolean(),
	yes: z.boolean(),
	plugin: nonEmptyStringSchema.optional(),
	env: nonEmptyStringSchema,
	quickstart: nonEmptyStringSchema,
	setBuild: z.union([nonEmptyStringSchema, buildNumberSchema]),
	setVersion: nonEmptyStringSchema,
}).passthrough();

export const pluginActionNameSchema = z.union([
	z.literal('proxy'),
	z.literal('pluginInfo'),
	z.literal('checkRuntimeDependencies'),
	z.literal('installRuntimeDependencies'),
	z.literal('proxyTemplate'),
]);

export const economicalProtocolHashSchema = z.string();

export const publicKeyHashSchema = z.string().regex(/^tz1[A-Za-z0-9]{33}$/);

export const sha256Schema = z.string().regex(/^[A-Fa-f0-9]{64}$/);

export const contractSchema = z.object({
	sourceFile: nonEmptyStringSchema,
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

const tzKtConfigPostgresqlPortSchema = z.number().default(5432);

const tzKtConfigApiPortSchema = z.number().default(5000);

export const tzKtConfigSchema = z.object({
	disableAutostartWithSandbox: z.boolean().optional(),
	postgresqlPort: tzKtConfigPostgresqlPortSchema.optional(),
	apiPort: tzKtConfigApiPortSchema.optional(),
});

export const environmentSchema = z.object({
	networks: z.array(nonEmptyStringSchema),
	sandboxes: z.array(nonEmptyStringSchema),
	storage: z.record(nonEmptyStringSchema).optional(),
	aliases: z.record(z.record(nonEmptyStringSchema)).optional(),
});

export const persistedTaskSchema = z.object({
	task: verbSchema,
	plugin: nonEmptyStringSchema,
	time: timestampSchema,
	output: z.unknown().optional(),
});

export const persistedOperationSchema = z.object({
	hash: sha256Schema,
	time: timestampSchema,
	output: z.unknown().optional(),
});

export const provisionerIDSchema = z
	.string()
	.min(1)
	.regex(
		/^[A-Za-z0-9]+[A-Za-z0-9-_]+\.[A-Za-z0-9]+[A-Za-z0-9-_]+\.[A-Za-z0-9]+[A-Za-z0-9-_]+$/,
	);

export const provisionerSchema = z.object({
	id: provisionerIDSchema,
	plugin: nonEmptyStringSchema,
	operation: z.union([nonEmptyStringSchema, z.literal('custom')]),
	command: z.string().optional(),
	label: z.string().optional(),
	depends_on: z.array(provisionerIDSchema).optional(),
});

export const provisionsSchema = z.array(provisionerSchema);

const environmentNameSchema = nonEmptyStringSchema.min(
	1,
	'Default environment must reference the name of an existing environment.',
);

const humanLanguageSchema = z
	.union([z.literal('en'), z.literal('fr')])
	.default('en');

export const configContractsDirSchema = z.string().min(1).default('contracts');

export const configArtifactsDirSchema = z.string().min(1).default('artifacts');

export const metadataConfigSchema = z.object({
	name: z.string().optional(),
	projectDescription: z.string().optional(),
	authors: z.array(z.string()).optional(),
	license: z.string().optional(),
	homepage: z.string().optional(),
});

export const networkConfigSchema = z.object({
	label: humanReadableIdentifierSchema,
	rpcUrl: urlSchema,
	protocol: economicalProtocolHashSchema,
	accounts: z.record(z.record(z.unknown())).optional(),
	faucet: faucetSchema.optional(),
});

export const sandboxAccountConfigSchema = z.object({
	encryptedKey: nonEmptyStringSchema,
	publicKeyHash: publicKeyHashSchema,
	secretKey: nonEmptyStringSchema,
});

export const sandboxConfigSchema = z.object({
	label: nonEmptyStringSchema,
	rpcUrl: urlSchema,
	protocol: economicalProtocolHashSchema,
	attributes: z.union([z.string(), z.number(), z.boolean()]).optional(),
	plugin: verbSchema.optional(),
	accounts: z
		.record(z.union([sandboxAccountConfigSchema, nonEmptyStringSchema]))
		.optional(),
	tzkt: tzKtConfigSchema.optional(),
});

export const scaffoldConfigSchema = z.object({
	postInit: z.string().optional(),
});

export const taskSchema = z.object({
	task: verbSchema,
	command: commandSchema,
	aliases: z.array(aliasSchema).optional(),
	description: nonEmptyStringSchema.min(3).optional(),
	example: nonEmptyStringSchema.optional(),
	hidden: z.boolean().optional(),
	encoding: pluginResponseEncodingSchema.optional(),
	handler: z.union([z.literal('proxy'), nonEmptyStringSchema]),
	options: z.array(optionSchema).optional(),
	positionals: z.array(positionalArgSchema).optional(),
});

export const persistentStateSchema = z.object({
	operations: z.record(persistedOperationSchema),
	tasks: z.record(persistedTaskSchema),
});

export const configSchema = z.object({
	language: humanLanguageSchema.optional(),
	plugins: z.array(installedPluginSchema).optional(),
	contractsDir: configContractsDirSchema.optional(),
	artifactsDir: configArtifactsDirSchema.optional(),
	network: z.record(networkConfigSchema).optional(),
	sandbox: z.record(sandboxConfigSchema).optional(),
	environment: z
		.record(z.union([environmentSchema, environmentNameSchema]))
		.optional(),
	accounts: z.record(tzSchema).optional(),
	contracts: z.record(contractSchema).optional(),
	metadata: metadataConfigSchema.optional(),
});

export const loadedConfigSchema = configSchema.extend(
	{
		projectDir: sanitizedAbsPathSchema,
		configFile: sanitizedAbsPathSchema,
		hash: sha256Schema,
	},
);

export const parsedConfigSchema = configSchema.omit({ sandbox: true }).extend(
	{
		sandbox: z.record(z.union([sandboxConfigSchema, nonEmptyStringSchema])),
	},
);

const pluginSchemaBaseSchema = z.object({
	name: nonEmptyStringSchema,
	version: versionNumberSchema,
	schema: versionNumberSchema,
	alias: aliasSchema,
	tasks: z.array(taskSchema).optional(),
});

export const requestArgsSchema = sanitizedArgsSchema
	.omit({ quickstart: true })
	.extend(
		{
			taqRun: pluginActionNameSchema,
			config: loadedConfigSchema,
		},
	).passthrough();

export const proxyTaskArgsSchema = requestArgsSchema.extend(
	{
		task: nonEmptyStringSchema,
	},
).passthrough();

export const proxyTemplateArgsSchema = requestArgsSchema.extend(
	{
		template: nonEmptyStringSchema,
	},
).passthrough();

export const operationSchema = z.object({
	operation: verbSchema,
	command: commandSchema,
	description: nonEmptyStringSchema.optional(),
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
			z.union([pluginJsonResponseSchema, z.promise(pluginJsonResponseSchema)]),
		),
]);

export const templateSchema = z.object({
	template: verbSchema,
	command: commandSchema,
	description: nonEmptyStringSchema.min(4),
	hidden: z.boolean().optional(),
	options: z.array(optionSchema).optional(),
	positionals: z.array(positionalArgSchema).optional(),
	handler: templateHandlerSchema,
	encoding: pluginResponseEncodingSchema.optional(),
});

export const parsedTemplateSchema = templateSchema.omit({ handler: true }).extend(
	{
		handler: z.string(),
	},
);

export const pluginInfoSchema = pluginSchemaBaseSchema.extend(
	{
		operations: z.array(parsedOperationSchema).optional(),
		templates: z.array(parsedTemplateSchema).optional(),
	},
);

export const pluginSchemaSchema = pluginSchemaBaseSchema.extend(
	{
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
	},
);

export const ephemeralStateSchema = z.object({
	build: z.string(),
	configHash: z.string(),
	tasks: z.record(installedPluginSchema.and(taskSchema)),
	operations: z.record(installedPluginSchema.and(parsedOperationSchema)),
	templates: z.record(installedPluginSchema.and(parsedTemplateSchema)),
	plugins: z.array(pluginInfoSchema),
});
