import { z } from "zod";
import type { ToolCall } from "../types.js";

// Schema flexível — aceita tanto "tool"/"arguments" quanto "name"/"arguments" e "function"/"parameters"
const ToolCallSchema = z
	.object({
		tool: z.string().optional(),
		name: z.string().optional(),
		arguments: z.record(z.unknown()).optional(),
		parameters: z.record(z.unknown()).optional(),
	})
	.refine((d) => d.tool !== undefined || d.name !== undefined, {
		message: "tool or name is required",
	});

export interface ParsedFallbackToolCall {
	name: string;
	argsJson: string;
}

/**
 * Extrai todos os blocos ```json do texto da resposta do modelo.
 * Tenta parsear cada bloco como tool call (objeto ou array de objetos).
 * Retorna array vazio se nenhum bloco válido for encontrado.
 */
export function extractToolCallsFromMarkdown(
	text: string,
): ParsedFallbackToolCall[] {
	const results: ParsedFallbackToolCall[] = [];

	// Regex para extrair blocos ```json ... ``` com variações de whitespace
	const blockRegex = /```json\s*\n([\s\S]*?)\n\s*```/g;

	let index = 0;

	for (
		let match = blockRegex.exec(text);
		match !== null;
		match = blockRegex.exec(text)
	) {
		const capture = match[1];
		if (capture === undefined) continue;
		const rawJson = capture.trim();

		let parsed: unknown;
		try {
			parsed = JSON.parse(rawJson);
		} catch {
			// bloco inválido é silenciosamente ignorado
			continue;
		}

		const candidates: unknown[] = Array.isArray(parsed) ? parsed : [parsed];

		for (const candidate of candidates) {
			const validation = ToolCallSchema.safeParse(candidate);
			if (!validation.success) continue;

			const data = validation.data;
			const name = data.tool ?? data.name;
			if (!name) continue;
			const argsObj = data.arguments ?? data.parameters ?? {};
			const argsJson = JSON.stringify(argsObj);

			results.push({
				name,
				argsJson,
			});
		}

		index++;
		void index;
	}

	return results;
}

/**
 * Converte ParsedFallbackToolCall[] para ToolCall[] (formato interno)
 */
export function toInternalToolCalls(
	parsed: ParsedFallbackToolCall[],
): ToolCall[] {
	return parsed.map((p, i) => ({
		id: `fallback_${Date.now()}_${i}`,
		type: "function" as const,
		function: {
			name: p.name,
			arguments: p.argsJson,
		},
	}));
}

/**
 * Remove blocos ```json ... ``` do texto
 */
export function removeJsonBlocks(text: string): string {
	return text.replace(/```json\s*\n[\s\S]*?\n\s*```/g, "");
}
