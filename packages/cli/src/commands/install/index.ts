import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { installDesktop, type InstallChannel } from '../../lib/installations.js'
import { printSuccess } from '../../lib/output.js'

export default class Install extends BeeperCommand {
  static override summary = 'Install Beeper Desktop'
  static override flags = {
    channel: Flags.string({ options: ['stable', 'nightly'], default: 'stable', description: 'Desktop release channel' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Install)
    ensureWritable(flags)
    const installation = await installDesktop({ channel: flags.channel as InstallChannel })
    await printSuccess({
      message: `Installed Beeper Desktop ${installation.version ?? ''}`.trim(),
      detail: installation.path,
      data: installation,
    }, flags.json ? 'json' : 'human')
  }
}

