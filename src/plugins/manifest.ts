import { z } from "zod";

const nameSchema = z
	.string()
	.min(1)
	.max(80)
	.regex(
		/^[a-z0-9][a-z0-9._-]*$/,
		"Use lowercase letters, numbers, dots, underscores, or hyphens",
	);

const commandNameSchema = z
	.string()
	.min(1)
	.max(80)
	.regex(
		/^[a-z][a-z0-9:_-]*$/,
		"Use lowercase letters, numbers, colons, underscores, or hyphens",
	);

const toolNameSchema = z
	.string()
	.min(1)
	.max(64)
	.regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Use a valid function-style tool name");

const jsonSchemaObject = z
	.record(z.string(), z.unknown())
	.refine(
		(value) => value.type === "object",
		'Tool parameters must be a JSON Schema object with type: "object"',
	);

export const PluginCommandManifestSchema = z.object({
	name: commandNameSchema,
	description: z.string().min(1),
	usage: z.string().min(1).optional(),
});

export const PluginToolManifestSchema = z.object({
	name: toolNameSchema,
	description: z.string().min(1),
	parameters: jsonSchemaObject,
});

export const PluginManifestSchema = z
	.object({
		name: nameSchema,
		version: z.string().min(1),
		description: z.string().min(1),
		entrypoint: z.string().min(1).optional(),
		commands: z.array(PluginCommandManifestSchema).default([]),
		tools: z.array(PluginToolManifestSchema).default([]),
	})
	.strict()
	.superRefine((manifest, ctx) => {
		const commandNames = new Set<string>();
		for (const command of manifest.commands) {
			if (commandNames.has(command.name)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["commands"],
					message: `Duplicate command name: ${command.name}`,
				});
			}
			commandNames.add(command.name);
		}

		const toolNames = new Set<string>();
		for (const tool of manifest.tools) {
			if (toolNames.has(tool.name)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["tools"],
					message: `Duplicate tool name: ${tool.name}`,
				});
			}
			toolNames.add(tool.name);
		}
	});

export type PluginCommandManifest = z.infer<typeof PluginCommandManifestSchema>;
export type PluginToolManifest = z.infer<typeof PluginToolManifestSchema>;
export type PluginManifest = z.infer<typeof PluginManifestSchema>;
