import { BeeperCommand } from '../../lib/command.js'
import { listTargets, readConfig } from '../../lib/targets.js'
import { targetLiveStatus } from '../../lib/target-status.js'
import { printData } from '../../lib/output.js'

export default class TargetList extends BeeperCommand {
  static override summary = 'List Beeper targets'

  async run(): Promise<void> {
    const { flags } = await this.parse(TargetList)
    const config = await readConfig()
    const targets = await listTargets()
    const rows = targets.length ? targets : [{ id: 'desktop', type: 'desktop' as const, name: 'Desktop', baseURL: 'http://127.0.0.1:23373' }]
    const output = await Promise.all(rows.map(async target => ({
      default: config.defaultTarget ? config.defaultTarget === target.id : target.id === 'desktop',
      id: target.id,
      type: target.type,
      name: target.name ?? target.id,
      url: target.baseURL,
      profile: target.id === 'desktop' ? undefined : target.profile,
      dataDir: target.dataDir,
      ...(await targetLiveStatus(target)),
    })))
    await printData(output, flags.json ? 'json' : 'human')
  }
}
