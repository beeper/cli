import { Command } from '@oclif/core'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { splitCommandLine } from '../lib/argv.js'
import { runCli } from '../lib/runner.js'

export default class Shell extends Command {
  static override summary = 'Run an interactive Beeper CLI shell'

  async run(): Promise<void> {
    const rl = createInterface({ input, output, prompt: 'beeper> ' })
    let closed = false
    rl.on('close', () => {
      closed = true
    })
    const interactive = Boolean(input.isTTY && output.isTTY)
    if (interactive) rl.prompt()

    for await (const line of rl) {
      const trimmed = line.trim()
      if (!trimmed) {
        if (interactive && !closed) rl.prompt()
        continue
      }
      if (trimmed === 'exit' || trimmed === 'quit') break

      try {
        const args = splitCommandLine(trimmed)
        if (args[0] === 'shell') throw new Error('Nested shell is not supported')
        await runCli(args, { inherit: true })
      } catch (error) {
        this.error(error instanceof Error ? error.message : String(error), { exit: false })
      }

      if (interactive && !closed) rl.prompt()
    }

    if (!closed) rl.close()
  }
}
