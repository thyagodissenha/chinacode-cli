export interface ParsedCommand {
  command: string;
  args: string[];
  raw: string;
}

export function parseSlashCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;

  const [rawCmd, ...rest] = trimmed.split(/\s+/);
  const command = rawCmd.slice(1).toLowerCase();
  const args = rest;

  return { command, args, raw: trimmed };
}
