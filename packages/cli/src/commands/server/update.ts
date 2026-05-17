import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { checkInstallationUpdate, readInstallations, updateServerInstallation } from '../../lib/installations.js'
import { pathSetupHint } from '../../lib/env.js'
import { printData } from '../../lib/output.js'

export default class ServerUpdate extends BeeperCommand {
  static override summary = 'Update the local Beeper Server install'
  static override flags = {
    check: Flags.boolean({ default: false, description: 'Only check for updates; do not install' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(ServerUpdate)
    if (!flags.check) ensureWritable(flags)
    const installation = (await readInstallations()).server
    if (!installation) {
      await printData({ kind: 'server', installed: false, action: 'Run: beeper install server' }, flags.json ? 'json' : 'human')
      return
    }

    const check = await checkInstallationUpdate(installation)
    if (check.available && !flags.check) {
      const updated = await updateServerInstallation(installation)
      await printData({ kind: 'server', updated: true, previousVersion: installation.version, currentVersion: updated.version, path: updated.path, hint: pathSetupHint() }, flags.json ? 'json' : 'human')
      return
    }

    await printData({ kind: 'server', ...check }, flags.json ? 'json' : 'human')
  }
}
