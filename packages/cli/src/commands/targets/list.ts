import { BeeperCommand } from '../../lib/command.js'
import { builtInDesktopTargetID, listTargets, readConfig, type Target } from '../../lib/targets.js'
import { targetLiveStatus } from '../../lib/target-status.js'
import { printData } from '../../lib/output.js'

export default class TargetsList extends BeeperCommand {
  static override summary = 'List configured Beeper targets'
  async run(): Promise<void> {
    const { flags } = await this.parse(TargetsList)
    const config = await readConfig()
    const targets = await listTargets()
    const rows = targets.length ? targets : [{ id: builtInDesktopTargetID, type: 'desktop' as const, name: 'Beeper Desktop', baseURL: 'http://127.0.0.1:23373', managed: false }]
    await printData(await Promise.all(rows.map(async target => ({ default: config.defaultTarget ? config.defaultTarget === target.id : target.id === builtInDesktopTargetID, id: target.id, type: target.type, name: target.name ?? target.id, managed: target.managed, baseURL: target.baseURL, runtime: target.runtime, ...(await targetLiveStatus(target as Target)) }))), flags.json ? 'json' : 'human')
  }
}
