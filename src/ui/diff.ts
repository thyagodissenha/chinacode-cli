import { createInterface } from 'node:readline'
import { diffLines } from 'diff'
import chalk from 'chalk'
import type { ApprovalResult } from '../types.js'

export class DiffApproval {
  private _autoApprove: boolean

  constructor(autoApprove: boolean) {
    this._autoApprove = autoApprove
  }

  get isAutoApprove(): boolean {
    return this._autoApprove
  }

  async requestApproval(
    filePath: string,
    oldContent: string | null,
    newContent: string
  ): Promise<ApprovalResult> {
    if (this._autoApprove) {
      return { approved: true, always: true }
    }

    if (oldContent === null) {
      console.log(chalk.green.bold('\n✨ Novo arquivo'))
    }

    console.log(chalk.bold.blue('\n📝 ' + filePath))

    const chunks = diffLines(oldContent ?? '', newContent)
    let addedLines = 0
    let removedLines = 0

    for (const chunk of chunks) {
      const lines = chunk.value.split('\n')
      if (lines[lines.length - 1] === '') {
        lines.pop()
      }

      if (chunk.added) {
        addedLines += lines.length
        for (const line of lines) {
          console.log(chalk.green('+ ' + line))
        }
      } else if (chunk.removed) {
        removedLines += lines.length
        for (const line of lines) {
          console.log(chalk.red('- ' + line))
        }
      } else {
        const contextLines: string[] = []
        const head = lines.slice(0, 3)
        const tail = lines.length > 6 ? lines.slice(-3) : []
        const middle = lines.length > 6

        for (const line of head) {
          contextLines.push(line)
        }
        if (middle) {
          contextLines.push('...')
          for (const line of tail) {
            contextLines.push(line)
          }
        } else {
          for (const line of lines.slice(3)) {
            contextLines.push(line)
          }
        }

        for (const line of contextLines) {
          console.log(chalk.dim('  ' + line))
        }
      }
    }

    console.log(chalk.dim(`(${addedLines} adições, ${removedLines} remoções)`))

    return new Promise((resolve) => {
      const ask = () => {
        const rl = createInterface({
          input: process.stdin,
          output: process.stdout,
        })

        rl.question('Aprovar? [Y]es / [N]o / [A]lways: ', (answer) => {
          rl.close()
          const normalized = answer.trim().toLowerCase()

          if (normalized === 'y' || normalized === '') {
            resolve({ approved: true, always: false })
          } else if (normalized === 'n') {
            resolve({ approved: false, always: false })
          } else if (normalized === 'a') {
            this._autoApprove = true
            resolve({ approved: true, always: true })
          } else {
            ask()
          }
        })
      }

      ask()
    })
  }
}
