import chalk from 'chalk';

const FENCE_RE = /```(\w*)\n([\s\S]*?)```/g;

// Simple keyword-based syntax coloring without external deps
function colorizeCode(code: string, lang: string): string {
  if (!lang || lang === 'text' || lang === 'plain') {
    return chalk.gray(code);
  }

  // TypeScript / JavaScript coloring
  if (['ts', 'typescript', 'js', 'javascript', 'tsx', 'jsx'].includes(lang)) {
    return code
      .split('\n')
      .map(line => {
        // Comments
        if (/^\s*\/\//.test(line)) return chalk.gray(line);
        // Keywords
        line = line.replace(
          /\b(import|export|from|const|let|var|function|class|interface|type|return|if|else|for|while|async|await|new|typeof|instanceof|extends|implements|void|null|undefined|true|false)\b/g,
          m => chalk.blue(m),
        );
        // Strings
        line = line.replace(/(["'`])(.*?)\1/g, m => chalk.green(m));
        return line;
      })
      .join('\n');
  }

  // Shell / bash
  if (['sh', 'bash', 'shell', 'zsh'].includes(lang)) {
    return code
      .split('\n')
      .map(line => {
        if (line.startsWith('#')) return chalk.gray(line);
        return chalk.cyan(line);
      })
      .join('\n');
  }

  // JSON
  if (lang === 'json') {
    return code
      .split('\n')
      .map(line => {
        line = line.replace(/"([^"]+)":/g, m => chalk.blue(m));
        line = line.replace(/:\s*"([^"]*)"/, m => chalk.green(m));
        line = line.replace(/:\s*(true|false|null)/g, m => chalk.yellow(m));
        return line;
      })
      .join('\n');
  }

  return chalk.gray(code);
}

export function highlightCodeBlocks(text: string): string {
  return text.replace(FENCE_RE, (_, lang: string, code: string) => {
    const colored = colorizeCode(code, lang.toLowerCase());
    return `\`\`\`${lang}\n${colored}\n\`\`\``;
  });
}
