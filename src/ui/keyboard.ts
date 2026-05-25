export class KeyboardHandler {
	private lastCtrlC = 0;
	private handlers: Array<(data: Buffer) => void> = [];

	constructor(
		private onCancel: () => void,
		private onExit: () => void,
	) {}

	attach(): void {
		if (process.stdin.isTTY) {
			process.stdin.setRawMode(true);
			process.stdin.resume();
		}

		const handler = (data: Buffer) => {
			const key = data.toString();

			if (key === "\x03") {
				const now = Date.now();
				if (now - this.lastCtrlC < 800) {
					this.onExit();
				} else {
					this.lastCtrlC = now;
					process.stdout.write("\n^C (pressione novamente para sair)\n");
					this.onCancel();
				}
				return;
			}

			if (key === "\x0C") {
				process.stdout.write("\x1Bc");
			}
		};

		process.stdin.on("data", handler);
		this.handlers.push(handler);
	}

	detach(): void {
		for (const handler of this.handlers) {
			process.stdin.removeListener("data", handler);
		}
		this.handlers = [];
	}
}
