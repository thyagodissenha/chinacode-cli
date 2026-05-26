import chalk from 'chalk';

interface DiffLine {
  type: 'added' | 'removed' | 'context';
  content: string;
}

function computeDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  // Simple LCS-based diff
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (oldLines[i] === newLines[j]) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const result: DiffLine[] = [];
  let i = 0, j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && oldLines[i] === newLines[j]) {
      result.push({ type: 'context', content: oldLines[i] });
      i++; j++;
    } else if (j < n && (i >= m || dp[i][j + 1] >= dp[i + 1][j])) {
      result.push({ type: 'added', content: newLines[j] });
      j++;
    } else {
      result.push({ type: 'removed', content: oldLines[i] });
      i++;
    }
  }
  return result;
}

export function renderDiff(oldContent: string, newContent: string, filePath: string): string {
  const oldLines = oldContent ? oldContent.split('\n') : [];
  const newLines = newContent.split('\n');

  if (oldLines.length === 0) {
    // New file — all additions
    const lines = newLines.map(l => chalk.green(`+ ${l}`)).join('\n');
    return `${chalk.bold(`--- /dev/null`)}\n${chalk.bold(`+++ ${filePath}`)}\n${lines}`;
  }

  const diff = computeDiff(oldLines, newLines);
  const CONTEXT = 3;
  const hasChange = diff.some(l => l.type !== 'context');
  if (!hasChange) return '(no changes)';

  // Build hunks with context
  const changeIndices = diff.map((l, i) => l.type !== 'context' ? i : -1).filter(i => i >= 0);
  const inHunk = new Set<number>();
  for (const ci of changeIndices) {
    for (let k = Math.max(0, ci - CONTEXT); k <= Math.min(diff.length - 1, ci + CONTEXT); k++) {
      inHunk.add(k);
    }
  }

  const lines: string[] = [`${chalk.bold(`--- ${filePath}`)}`, `${chalk.bold(`+++ ${filePath}`)}`];
  let prevIncluded = false;
  for (let i = 0; i < diff.length; i++) {
    if (!inHunk.has(i)) { prevIncluded = false; continue; }
    if (!prevIncluded && i > 0) lines.push(chalk.cyan('@@ ... @@'));
    prevIncluded = true;
    const d = diff[i];
    if (d.type === 'added') lines.push(chalk.green(`+ ${d.content}`));
    else if (d.type === 'removed') lines.push(chalk.red(`- ${d.content}`));
    else lines.push(chalk.gray(`  ${d.content}`));
  }

  return lines.join('\n');
}
