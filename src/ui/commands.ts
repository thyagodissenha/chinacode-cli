import { join } from "node:path";
import { compactMessages } from "../agent/compactor.js";
import type { AgentLoop } from "../agent/loop.js";
import { type BenchmarkModel, runBenchmark } from "../benchmark/index.js";
import { getPricing } from "../config.js";
import { ModelClient } from "../models/client.js";
import { loadSkills } from "../skills/loader.js";
import type { SessionStorage } from "../storage/sessions.js";
import type { AgentConfig, Message } from "../types.js";
import type { TUI } from "./tui.js";

const HELP_TEXT = `
Comandos disponíveis:
  /help, /h, /?          Lista todos os comandos
  /model <nome>          Troca o modelo padrão
  /sandbox <on|off>      Liga/desliga sandbox Docker
  /cost, /c              Mostra custo da sessão atual
  /bench <tarefa>        Compara a tarefa entre os modelos configurados
  /clear, /cls           Limpa o histórico da conversa
  /compact               Sumariza o contexto longo da conversa
  /sessions              Lista sessões anteriores
  /resume <id>           Retoma sessão salva
  /export                Exporta sessão para JSON/CSV
  /exit, /q, /quit       Encerra o CLI
`.trim();

export class CommandParser {
	constructor(
		private config: AgentConfig,
		private tui: TUI,
		private loop: AgentLoop,
		private storage: SessionStorage,
	) {}

	isCommand(input: string): boolean {
		return input.trimStart().startsWith("/");
	}

	async execute(input: string): Promise<boolean> {
		const trimmed = input.trim();
		const [cmd, ...rest] = trimmed.split(/\s+/);
		const arg = rest.join(" ");

		switch (cmd?.toLowerCase()) {
			case "/help":
			case "/h":
			case "/?": {
				this.tui.showError(HELP_TEXT.replace("✗ ", ""));
				process.stdout.write(`${HELP_TEXT}\n`);
				const skills = loadSkills(join(this.config.workspaceDir, "skills"));
				if (skills.length > 0) {
					process.stdout.write("\nSkills disponíveis:\n");
					for (const skill of skills) {
						process.stdout.write(
							`  ${skill.name.padEnd(20)} ${skill.description}\n`,
						);
					}
					process.stdout.write("\n");
				}
				return true;
			}

			case "/cost":
			case "/c": {
				const tracker = this.loop.costTracker;
				const tokens = tracker.totalTokens;
				process.stdout.write(
					`Custo da sessão: ${tracker.totalCost.toFixed(6)} USD\n` +
						`Tokens: ${tokens.inputTokens} input + ${tokens.outputTokens} output\n`,
				);
				return true;
			}

			case "/bench": {
				if (!arg) {
					this.tui.showWarning("Uso: /bench <tarefa>");
					return true;
				}

				const { inputPer1M, outputPer1M } = getPricing();
				const models = this.benchmarkModels(inputPer1M, outputPer1M);
				if (models.length < 2) {
					this.tui.showWarning(
						"Configure pelo menos 2 modelos para usar /bench.",
					);
					return true;
				}

				this.tui.showWarning(
					`Executando benchmark em ${models.length} modelos...`,
				);
				const results = await runBenchmark({
					task: { id: `bench-${Date.now()}`, prompt: arg },
					models,
					runner: async ({ model, task }) => {
						const config = Object.values(this.config.models).find(
							(configured) => configured?.model === model.name,
						);
						if (!config) {
							throw new Error(`Modelo não configurado: ${model.name}`);
						}
						const response = await new ModelClient(config).chat([
							{ role: "user", content: task.prompt },
						]);
						return {
							content: response.content,
							usage: response.usage,
						};
					},
				});

				process.stdout.write(`${formatBenchmarkResults(results)}\n`);
				return true;
			}

			case "/clear":
			case "/cls":
				this.loop.setMessages([]);
				this.tui.clear();
				this.tui.showHeader();
				return true;

			case "/model":
			case "/m":
				if (!arg) {
					this.tui.showWarning("Uso: /model <nome>");
					return true;
				}
				this.config.models.default.model = arg;
				this.tui.showHeader();
				process.stdout.write(`Modelo alterado para: ${arg}\n`);
				return true;

			case "/sandbox":
			case "/sb":
				if (arg === "on") {
					this.config.sandboxEnabled = true;
					process.stdout.write("Sandbox Docker: habilitado\n");
				} else if (arg === "off") {
					this.config.sandboxEnabled = false;
					process.stdout.write("Sandbox Docker: desabilitado\n");
				} else {
					this.tui.showWarning("Uso: /sandbox <on|off>");
				}
				return true;

			case "/sessions":
				process.stdout.write(
					`${this.storage.formatSessionList(this.storage.listSessions())}\n`,
				);
				return true;

			case "/resume": {
				if (!arg) {
					this.tui.showWarning("Uso: /resume <id>");
					return true;
				}
				const session = this.storage.getSession(arg);
				if (!session) {
					this.tui.showError(`Sessão não encontrada: ${arg}`);
					return true;
				}
				const msgs = JSON.parse(session.messages) as Message[];
				this.loop.setMessages(msgs);
				process.stdout.write(
					`Sessão restaurada: ${session.messageCount} mensagens, custo ${session.totalCost.toFixed(4)} USD\n`,
				);
				return true;
			}

			case "/export": {
				const tracker = this.loop.costTracker;
				const json = tracker.toJSON();
				const csv = tracker.toCSV();
				process.stdout.write(`=== JSON ===\n${json}\n=== CSV ===\n${csv}\n`);
				return true;
			}

			case "/compact": {
				const state = this.loop.state;
				if (state.messages.length === 0) {
					this.tui.showWarning("Nenhum contexto para compactar.");
					return true;
				}
				this.tui.showWarning("Compactando contexto...");
				const modelConfig =
					this.config.models.fast ?? this.config.models.default;
				const { ModelClient } = await import("../models/client.js");
				const fastClient = new ModelClient(modelConfig);
				const compacted = await compactMessages(
					state.messages,
					modelConfig.model,
					fastClient,
				);
				this.loop.setMessages(compacted);
				process.stdout.write(
					`Contexto compactado: ${state.messages.length} → ${compacted.length} mensagens\n`,
				);
				return true;
			}

			case "/exit":
			case "/q":
			case "/quit":
				return false;

			default:
				this.tui.showWarning(
					`Comando desconhecido: ${cmd}. Use /help para ver os comandos.`,
				);
				return true;
		}
	}

	private benchmarkModels(
		inputPer1M: number,
		outputPer1M: number,
	): BenchmarkModel[] {
		const seen = new Set<string>();
		return Object.values(this.config.models)
			.filter(
				(model): model is NonNullable<typeof model> => model !== undefined,
			)
			.filter((model) => {
				if (seen.has(model.model)) return false;
				seen.add(model.model);
				return true;
			})
			.map((model) => ({
				name: model.model,
				inputCostPer1M: inputPer1M,
				outputCostPer1M: outputPer1M,
				metadata: { provider: model.provider },
			}));
	}
}

function formatBenchmarkResults(
	results: Awaited<ReturnType<typeof runBenchmark>>,
): string {
	const rows = results.map((result) => ({
		model: result.model,
		time: `${result.durationMs}ms`,
		tokens: String(result.totalTokens),
		cost: `$${result.costUsd.toFixed(6)}`,
		score: result.qualityScore.toFixed(2),
		preview: result.content.replace(/\s+/g, " ").trim().slice(0, 80),
	}));

	const headers = [
		"Modelo",
		"Tempo",
		"Tokens",
		"Custo",
		"Score",
		"Preview",
	] as const;
	const widths = [
		Math.max("Modelo".length, ...rows.map((row) => row.model.length)),
		Math.max("Tempo".length, ...rows.map((row) => row.time.length)),
		Math.max("Tokens".length, ...rows.map((row) => row.tokens.length)),
		Math.max("Custo".length, ...rows.map((row) => row.cost.length)),
		Math.max("Score".length, ...rows.map((row) => row.score.length)),
		Math.max("Preview".length, ...rows.map((row) => row.preview.length)),
	];

	const line = (values: readonly string[]) =>
		values.map((value, index) => value.padEnd(widths[index] ?? 0)).join(" | ");
	return [
		"Benchmark:",
		line(headers),
		widths.map((width) => "─".repeat(width)).join(" | "),
		...rows.map((row) =>
			line([row.model, row.time, row.tokens, row.cost, row.score, row.preview]),
		),
	].join("\n");
}
