import { join } from "node:path";
import { z } from "zod";
import { runSubagent } from "../agent/subagent.js";
import { getSkillByName, loadSkills } from "../skills/loader.js";
import type { ModelSet, Tool, ToolResult } from "../types.js";

const delegateSchema = z.object({
	task: z.string().describe("Descrição clara da tarefa a delegar"),
	skill: z
		.string()
		.optional()
		.describe("Nome da skill a aplicar (ex: code-review, test-generation)"),
	model: z
		.string()
		.optional()
		.describe("Modelo a usar no subagente (usa o padrão se omitido)"),
});

export function createDelegateTool(
	models: ModelSet,
	tools: Tool[],
	workspaceDir: string,
): Tool {
	return {
		name: "delegate_task",
		description:
			"Delega uma tarefa a um subagente especializado isolado. O subagente executa a tarefa de forma autônoma e retorna o resultado.",
		parameters: {
			type: "object",
			properties: {
				task: {
					type: "string",
					description: "Descrição clara da tarefa a delegar",
				},
				skill: {
					type: "string",
					description:
						"Nome da skill a aplicar (ex: code-review, test-generation)",
				},
				model: {
					type: "string",
					description: "Modelo a usar no subagente (usa o padrão se omitido)",
				},
			},
			required: ["task"],
			additionalProperties: false,
		},
		async execute(args: unknown): Promise<ToolResult> {
			let parsed: z.infer<typeof delegateSchema>;
			try {
				parsed = delegateSchema.parse(args);
			} catch (err) {
				return {
					success: false,
					output: "",
					error: `Argumentos inválidos: ${err instanceof Error ? err.message : String(err)}`,
				};
			}

			const { task, skill: skillName, model: modelName } = parsed;

			const skillsDir = join(workspaceDir, "skills");
			const skills = loadSkills(skillsDir);
			const skill = skillName
				? (getSkillByName(skills, skillName) ?? undefined)
				: undefined;

			let modelConfig = models.default;
			if (modelName) {
				const candidates = [
					models.default,
					models.reasoning,
					models.fast,
					models.local,
				].filter((m): m is NonNullable<typeof m> => m !== undefined);
				const matched = candidates.find((m) => m.model === modelName);
				if (matched) modelConfig = matched;
			}

			const result = await runSubagent({
				task,
				skill,
				modelConfig,
				tools,
				maxIterations: 5,
			});

			if (!result.success) {
				return {
					success: false,
					output: "",
					error: result.error ?? "Subagente falhou sem mensagem de erro",
				};
			}

			return {
				success: true,
				output: `[Subagente concluído em ${result.iterations} iteração(ões)]\n${result.output}`,
			};
		},
	};
}
