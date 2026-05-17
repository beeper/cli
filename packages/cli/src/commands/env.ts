import { Flags } from '@oclif/core'
import { BeeperCommand } from '../lib/command.js'
import { binDir } from '../lib/installations.js'
import { isBeeperBinOnPath, pathSetup, type ShellName } from '../lib/env.js'

export default class Env extends BeeperCommand {
  static override summary = 'Print shell setup for Beeper CLI-managed tools'
  static override flags = {
    shell: Flags.string({ options: ['sh', 'fish', 'powershell'], default: 'sh', description: 'Shell syntax to print' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Env)
    const shell = flags.shell as ShellName
    const command = pathSetup(shell)
    if (flags.json) {
      process.stdout.write(`${JSON.stringify({
        binDir: binDir(),
        onPath: isBeeperBinOnPath(),
        shell,
        command,
      }, null, 2)}\n`)
      return
    }
    process.stdout.write(`${command}\n`)
  }
}

