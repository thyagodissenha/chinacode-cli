import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'

export interface Skill {
  name: string
  description: string
  content: string
}

/**
 * Load all skill markdown files from the given directory.
 * Returns an empty array if the directory does not exist or cannot be read.
 */
export function loadSkills(skillsDir: string): Skill[] {
  if (!existsSync(skillsDir)) return []

  let files: string[]
  try {
    files = readdirSync(skillsDir).filter(f => f.endsWith('.md'))
  } catch {
    return []
  }

  const skills: Skill[] = []
  for (const file of files) {
    const filePath = join(skillsDir, file)
    try {
      const content = readFileSync(filePath, 'utf-8')
      const name = basename(file, '.md')
      const description = extractDescription(content)
      skills.push({ name, description, content })
    } catch {
      // skip unreadable files
    }
  }

  return skills
}

/**
 * Find a skill by its name (filename without extension).
 * Returns null if not found.
 */
export function getSkillByName(skills: Skill[], name: string): Skill | null {
  return skills.find(s => s.name === name) ?? null
}

/**
 * Format the list of skills into a section suitable for injection into the system prompt.
 */
export function formatSkillsForPrompt(skills: Skill[]): string {
  if (skills.length === 0) return ''

  const lines: string[] = ['## Skills carregadas']
  for (const skill of skills) {
    lines.push(`- **${skill.name}**: ${skill.description}`)
  }
  return lines.join('\n')
}

/**
 * Extract a short description from a skill markdown file.
 * Uses the first non-empty paragraph after the first H2 heading that looks like
 * "Quando usar", or falls back to the first non-heading line.
 */
function extractDescription(content: string): string {
  const lines = content.split('\n')

  // Look for the "Quando usar" section body
  let inWhenToUse = false
  for (const line of lines) {
    if (/^#{1,3}\s+Quando usar/i.test(line)) {
      inWhenToUse = true
      continue
    }
    if (inWhenToUse) {
      if (/^#{1,3}/.test(line)) break // next section
      const trimmed = line.trim()
      if (trimmed) return trimmed
    }
  }

  // Fallback: first non-heading, non-empty line
  for (const line of lines) {
    if (/^#{1,3}/.test(line)) continue
    const trimmed = line.trim()
    if (trimmed) return trimmed
  }

  return ''
}
