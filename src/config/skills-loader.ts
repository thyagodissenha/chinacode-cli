import { readFile } from 'fs/promises';
import { join } from 'path';
import type { AgentMessage } from '../types/agent.js';

export interface Skill {
  name: string;
  content: string;
}

export async function loadSkills(skillNames: string[], skillsDir: string): Promise<Skill[]> {
  const skills: Skill[] = [];

  for (const name of skillNames) {
    const filePath = join(skillsDir, `${name}.md`);
    try {
      const content = await readFile(filePath, 'utf8');
      skills.push({ name, content });
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        console.warn(`⚠ Skill file not found: skills/${name}.md`);
      } else {
        console.warn(`⚠ Could not load skill ${name}: ${err.message}`);
      }
    }
  }

  return skills;
}

export function injectSkill(skill: Skill, messages: AgentMessage[]): AgentMessage[] {
  const skillMessage: AgentMessage = {
    role: 'system',
    content: `## Skill: ${skill.name}\n\n${skill.content}`,
  };
  return [skillMessage, ...messages];
}
