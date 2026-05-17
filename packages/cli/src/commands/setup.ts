import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../lib/command.js'
import { findLocalDesktop } from '../lib/desktop-auth.js'
import {
  readTarget,
  updateConfig,
  type Target,
} from '../lib/targets.js'
import { printSuccess } from '../lib/output.js'

export default class Setup extends BeeperCommand {
  static override summary = 'Set up a Beeper target'
  static override flags = {
    target: Flags.string({ char: 't', description: 'Target to use by default' }),
    login: Flags.boolean({ default: false, description: 'Print the login command after setup' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Setup)
    ensureWritable(flags)

    if (flags.target) {
      const target = flags.target === 'desktop'
        ? { id: 'desktop', type: 'desktop' as const, name: 'Desktop', baseURL: 'http://127.0.0.1:23373' }
        : await readTarget(flags.target)
      if (!target) throw new Error(`Unknown Beeper target "${flags.target}". Run \`beeper target list\`.`)
      await updateConfig(config => ({ ...config, defaultTarget: target.id === 'desktop' ? undefined : target.id, baseURL: target.id === 'desktop' ? target.baseURL : config.baseURL }))
      await printSuccess({
        message: `Ready target: ${target.name ?? target.id}`,
        detail: flags.login ? `Next: beeper login -t ${target.id}` : target.baseURL,
        data: target,
      }, flags.json ? 'json' : 'human')
      return
    }

    let target = await this.pickSetup(flags)
    await updateConfig(config => ({ ...config, defaultTarget: target.id === 'desktop' ? undefined : target.id, baseURL: target.id === 'desktop' ? target.baseURL : config.baseURL }))

    await printSuccess({
      message: `Ready target: ${target.name ?? target.id}`,
      detail: flags.login ? `Next: beeper login -t ${target.id}` : target.baseURL,
      data: target,
    }, flags.json ? 'json' : 'human')
  }

  private async pickSetup(flags: {
    json?: boolean
  }): Promise<Target> {
    const desktop = await findLocalDesktop({ scan: true, timeoutMs: 300 }).catch(() => undefined)
    if (desktop) return { id: 'desktop', type: 'desktop', name: 'Desktop', baseURL: desktop.baseURL }
    throw new Error('No Beeper Desktop found. Run `beeper profile new desktop <name>` or `beeper target add <name> <url>`.')
  }
}
