import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { installServer, type InstallChannel } from '../../lib/installations.js'
import { pathSetupHint } from '../../lib/env.js'
import { printDryRun, printSuccess } from '../../lib/output.js'
import { SERVER_ENVIRONMENTS, normalizeServerEnv } from '../../lib/server-env.js'

export default class SetupInstallServer extends BeeperCommand {
  static override summary = 'Install Beeper Server locally'
  static override flags = {
    channel: Flags.string({ options: ['stable', 'nightly'], default: 'stable', description: 'Server release channel' }),
    'server-env': Flags.string({ default: 'prod', description: 'Server environment: local, dev, staging, or prod', options: [...SERVER_ENVIRONMENTS], parse: async value => normalizeServerEnv(value) }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(SetupInstallServer)
    ensureWritable(flags)
    if (flags['dry-run']) {
      await printDryRun('install.server', { channel: flags.channel, serverEnv: flags['server-env'] }, flags.json ? 'json' : 'human')
      return
    }
    const installation = await installServer({ channel: flags.channel as InstallChannel, serverEnv: flags['server-env'] })
    await printSuccess({
      message: `Installed Beeper Server ${installation.version ?? ''}`.trim(),
      detail: pathSetupHint() ?? installation.path,
      data: installation,
    }, flags.json ? 'json' : 'human')
  }
}
