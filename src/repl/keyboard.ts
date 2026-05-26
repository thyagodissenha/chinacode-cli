import readline from 'readline';

export interface KeyboardOptions {
  onAbort(): void;
  onClear(): void;
  onExit(): void;
  getHistory(): string[];
}

export function setupKeyboardHandlers(rl: readline.Interface, options: KeyboardOptions): void {
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true);

  let lastCtrlC = 0;
  let isGenerating = false;

  // Allow external code to set generation state
  (rl as any).__setGenerating = (v: boolean) => { isGenerating = v; };

  process.stdin.on('keypress', (_str: string, key: { sequence: string; ctrl: boolean; name: string }) => {
    if (!key) return;

    if (key.ctrl && key.name === 'c') {
      if (isGenerating) {
        options.onAbort();
        return;
      }
      const now = Date.now();
      if (now - lastCtrlC < 800) {
        options.onExit();
        return;
      }
      lastCtrlC = now;
      process.stdout.write('\nPress Ctrl+C again to exit\n');
      return;
    }

    if (key.ctrl && key.name === 'l') {
      options.onClear();
    }
  });
}
