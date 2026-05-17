import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable, writeEvent } from '../lib/command.js'
import { evaluateReadiness } from '../lib/app-state.js'
import { findLocalDesktop } from '../lib/desktop-auth.js'
import { readTarget, updateConfig, writeTarget, type Target } from '../lib/targets.js'
import { printData, printSuccess } from '../lib/output.js'

export default class Setup extends BeeperCommand {
  static override summary = 'Make the selected target ready'
  static override flags = { install: Flags.boolean({ default: false, description: 'Allow installing missing managed runtime' }) }
  async run(): Promise<void> {
    const { flags } = await this.parse(Setup)
    ensureWritable(flags)
    let target: Target | undefined
    if (flags.target) target = flags.target === 'personal' ? undefined : await readTarget(flags.target)
    if (!target) {
      const desktop = await findLocalDesktop({ scan: true, timeoutMs: 300 }).catch(() => undefined)
      target = { id: 'personal', type: 'desktop', name: 'Desktop', baseURL: desktop?.baseURL ?? 'http://127.0.0.1:23373', managed: true, runtime: { install: 'desktop', port: 23373 } }
      await writeTarget(target)
      await updateConfig(config => ({ ...config, defaultTarget: target!.id }))
    }
    if (flags.events) writeEvent('setup_step', { step: 'readiness', target: target.id })
    const readiness = await evaluateReadiness({ baseURL: target.baseURL, target: target.id })
    if (flags.json || !process.stdin.isTTY) {
      await printData({ target, readiness }, flags.json ? 'json' : 'human')
      return
    }
    await printSuccess({ message: readiness.state === 'ready' ? 'Target ready' : `Setup paused: ${readiness.state}`, detail: readiness.message, data: { target, readiness } }, flags.json ? 'json' : 'human')
  }
}
