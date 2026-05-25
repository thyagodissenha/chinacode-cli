import { type Interface, createInterface } from "node:readline";
import chalk from "chalk";
import ora, { type Ora } from "ora";
import type { AgentConfig } from "../types.js";

export class TUI {
	private spinner: Ora | null = null;
	private rl: Interface | null = null;
	private noColor: boolean;

	constructor(private config: AgentConfig) {
		this.noColor = !!process.env.NO_COLOR;
		if (this.noColor) {
			chalk.level = 0;
		}
	}

	showHeader(): void {
		const line = "─".repeat(60);
		const sandbox = this.config.sandboxEnabled ? "on" : "off";
		const model = this.config.models?.default?.model ?? "unknown";
		console.log(chalk.dim(line));
		console.log(
			`  ChinaCode CLI v0.1.0 | modelo: ${model} | sandbox: ${sandbox}`,
		);
		console.log(chalk.dim(line));
	}

	showUser(text: string): void {
		console.log(chalk.cyan("❯ ") + text);
	}

	writeToken(token: string): void {
		process.stdout.write(token);
	}

	endStream(): void {
		process.stdout.write("\n");
	}

	showToolCall(name: string, args: string): void {
		console.log(
			`${chalk.yellow("⚙ ") + chalk.bold(name)} ${chalk.dim(args.slice(0, 80))}`,
		);
	}

	showToolResult(name: string, result: string, success: boolean): void {
		if (success) {
			console.log(chalk.green("✓ ") + result.slice(0, 200));
		} else {
			console.log(chalk.red("✗ ") + result.slice(0, 200));
		}
	}

	showError(message: string): void {
		console.log(chalk.red.bold("✗ ") + message);
	}

	showWarning(message: string): void {
		console.log(chalk.yellow("⚠ ") + message);
	}

	startSpinner(text: string): void {
		this.spinner = ora(text).start();
	}

	stopSpinner(success?: boolean): void {
		if (!this.spinner) return;
		if (success === true) {
			this.spinner.succeed();
		} else {
			this.spinner.stop();
		}
		this.spinner = null;
	}

	updateStatus(model: string, cost: number, tokens: number): void {
		process.stdout.write(
			`\r${chalk.dim(`[${model}] ${tokens} tokens | $${cost.toFixed(4)}`)}`,
		);
	}

	prompt(prefix?: string): Promise<string> {
		return new Promise((resolve) => {
			const rl = createInterface({
				input: process.stdin,
				output: process.stdout,
			});
			this.rl = rl;
			rl.question(prefix ?? "❯ ", (answer) => {
				rl.close();
				this.rl = null;
				resolve(answer);
			});
		});
	}

	clear(): void {
		process.stdout.write("\x1Bc");
	}

	showSessionSummary(
		totalCost: number,
		durationMs: number,
		messages: number,
	): void {
		const line = "─".repeat(60);
		const durationSec = (durationMs / 1000).toFixed(1);
		console.log(chalk.dim(line));
		console.log(chalk.bold("  Resumo da sessão"));
		console.log(chalk.dim(line));
		console.log(
			`  ${"Custo total".padEnd(20)} ${chalk.green(`$${totalCost.toFixed(4)}`)}`,
		);
		console.log(`  ${"Duração".padEnd(20)} ${chalk.cyan(`${durationSec}s`)}`);
		console.log(`  ${"Mensagens".padEnd(20)} ${chalk.cyan(String(messages))}`);
		console.log(chalk.dim(line));
	}
}
