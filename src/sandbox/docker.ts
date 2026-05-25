import { spawn } from "node:child_process";
import type { SandboxResult } from "../types.js";

export class DockerSandbox {
	private static _available: boolean | null = null;

	constructor(
		private workspaceDir: string,
		private defaultTimeout = 60_000,
	) {}

	static async isAvailable(): Promise<boolean> {
		if (DockerSandbox._available !== null) {
			return DockerSandbox._available;
		}

		return new Promise((resolve) => {
			let settled = false;

			const child = spawn("docker", ["info"], { stdio: "ignore" });

			const timer = setTimeout(() => {
				if (!settled) {
					settled = true;
					child.kill("SIGTERM");
					DockerSandbox._available = false;
					resolve(false);
				}
			}, 3000);

			child.on("close", (code) => {
				if (!settled) {
					settled = true;
					clearTimeout(timer);
					DockerSandbox._available = code === 0;
					resolve(DockerSandbox._available);
				}
			});

			child.on("error", () => {
				if (!settled) {
					settled = true;
					clearTimeout(timer);
					DockerSandbox._available = false;
					resolve(false);
				}
			});
		});
	}

	async execute(
		command: string,
		customTimeout?: number,
	): Promise<SandboxResult> {
		const timeout = customTimeout ?? this.defaultTimeout;
		const available = await DockerSandbox.isAvailable();

		return new Promise((resolve) => {
			let stdout = "";
			let stderr = "";
			let timedOut = false;
			let settled = false;

			const child = available
				? spawn("docker", [
						"run",
						"--rm",
						"--network",
						"none",
						"--memory",
						"512m",
						"--cpus",
						"1",
						"-v",
						`${this.workspaceDir}:/workspace:rw`,
						"-w",
						"/workspace",
						"alpine:latest",
						"sh",
						"-c",
						command,
					])
				: spawn("bash", ["-c", command]);

			if (!available) {
				process.stderr.write("⚠ Executando sem sandbox Docker\n");
			}

			child.stdout.on("data", (chunk: Buffer) => {
				stdout += chunk.toString();
			});

			child.stderr.on("data", (chunk: Buffer) => {
				stderr += chunk.toString();
			});

			const killTimer = setTimeout(() => {
				timedOut = true;
				child.kill("SIGTERM");
				setTimeout(() => {
					child.kill("SIGKILL");
				}, 2000);
			}, timeout);

			child.on("close", (code: number | null) => {
				if (settled) return;
				settled = true;
				clearTimeout(killTimer);
				resolve({
					stdout,
					stderr,
					exitCode: code ?? 1,
					timedOut,
					usedFallback: !available,
				});
			});

			child.on("error", (err: Error) => {
				if (settled) return;
				settled = true;
				clearTimeout(killTimer);
				resolve({
					stdout,
					stderr: stderr + err.message,
					exitCode: 1,
					timedOut,
					usedFallback: !available,
				});
			});
		});
	}
}
