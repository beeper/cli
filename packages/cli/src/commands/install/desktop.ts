import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { installDesktop, type InstallChannel } from '../../lib/installations.js'
import { printDryRun, printSuccess } from '../../lib/output.js'

export default class SetupInstallDesktop extends BeeperCommand {
  static override summary = 'Install Beeper Desktop locally'
  static override flags = {
    channel: Flags.string({ options: ['stable', 'nightly'], default: 'stable', description: 'Desktop release channel' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(SetupInstallDesktop)
    ensureWritable(flags)
    if (flags['dry-run']) {
      await printDryRun('install.desktop', { channel: flags.channel }, flags.json ? 'json' : 'human')
      return
    }
    const installation = await installDesktop({ channel: flags.channel as InstallChannel })
    await printSuccess({
      message: `Installed Beeper Desktop ${installation.version ?? ''}`.trim(),
      detail: installation.path,
      data: installation,
    }, flags.json ? 'json' : 'human')
  }
}
