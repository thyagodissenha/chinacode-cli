import ora, { type Ora } from 'ora';

let activeSpinner: Ora | null = null;

export function showSpinner(text: string): void {
  stopSpinner();
  activeSpinner = ora({ text, spinner: 'dots' }).start();
}

export function updateSpinner(text: string): void {
  if (activeSpinner) {
    activeSpinner.text = text;
  } else {
    showSpinner(text);
  }
}

export function stopSpinner(): void {
  if (activeSpinner) {
    activeSpinner.stop();
    activeSpinner = null;
  }
}
