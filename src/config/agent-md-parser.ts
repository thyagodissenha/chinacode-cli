import { readFile } from 'fs/promises';

export interface SubagentConfig {
  name: string;
  description: string;
  endpoint?: string;
}

export interface AgentMdConfig {
  identity?: string;
  rules?: string;
  skills: string[];
  subagents: SubagentConfig[];
}

const MAX_SIZE = 50 * 1024; // 50KB

export async function parseAgentMd(filePath: string): Promise<AgentMdConfig> {
  let raw: string;
  try {
    const buf = await readFile(filePath);
    if (buf.length > MAX_SIZE) {
      console.warn('agent.md is very large — consider splitting into skill files');
    }
    raw = buf.toString('utf8').slice(0, MAX_SIZE);
  } catch {
    return { skills: [], subagents: [] };
  }

  const sections = extractSections(raw);
  if (Object.keys(sections).length === 0) {
    console.warn('agent.md has no ## sections — returning empty config');
    return { skills: [], subagents: [] };
  }

  const skillsRaw = sections['skills'] ?? '';
  const skills = skillsRaw
    .split('\n')
    .map(l => l.trim().replace(/^[-*]\s*/, '').replace(/\.md$/, ''))
    .filter(Boolean);

  const subagentsRaw = sections['subagents'] ?? '';
  const subagents = parseSubagents(subagentsRaw);

  return {
    identity: sections['identity'],
    rules: sections['rules'],
    skills,
    subagents,
  };
}

function extractSections(content: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = content.split('\n');
  let current: string | null = null;
  const buffer: string[] = [];

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)/);
    if (heading) {
      if (current !== null) sections[current] = buffer.join('\n').trim();
      current = heading[1].trim().toLowerCase();
      buffer.length = 0;
    } else if (current !== null) {
      buffer.push(line);
    }
  }
  if (current !== null) sections[current] = buffer.join('\n').trim();
  return sections;
}

function parseSubagents(raw: string): SubagentConfig[] {
  const agents: SubagentConfig[] = [];
  const lines = raw.split('\n').filter(Boolean);
  for (const line of lines) {
    const m = line.match(/^[-*]\s*\*?\*?([^:*]+)\*?\*?(?::(.*))?$/);
    if (m) {
      agents.push({ name: m[1].trim(), description: (m[2] ?? '').trim() });
    }
  }
  return agents;
}
