import { Args, Flags } from '@oclif/core'
import { readFile } from 'node:fs/promises'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createProfileTarget, listTargets, readConfig, readTarget, removeTarget, resolveTarget, updateConfig, writeTarget, type Target } from '../../lib/targets.js'
import { disableProfile, enableProfile, profileErrorLogPath, profileLogPath, profileStatus, startProfile, stopProfile } from '../../lib/profiles.js'
import { targetLiveStatus } from '../../lib/target-status.js'
import { printData, printSuccess } from '../../lib/output.js'

export default class TargetsList extends BeeperCommand {
  static override summary = 'List Beeper targets'
  async run(): Promise<void> {
    const { flags } = await this.parse(TargetsList)
    const config = await readConfig()
    const targets = await listTargets()
    const rows = targets.length ? targets : [{ id: 'personal', type: 'desktop' as const, name: 'Desktop', baseURL: 'http://127.0.0.1:23373', managed: true }]
    await printData(await Promise.all(rows.map(async target => ({ default: config.defaultTarget ? config.defaultTarget === target.id : target.id === 'personal', id: target.id, type: target.type, name: target.name ?? target.id, managed: target.managed, baseURL: target.baseURL, runtime: target.runtime, ...(await targetLiveStatus(target as Target)) }))), flags.json ? 'json' : 'human')
  }
}
