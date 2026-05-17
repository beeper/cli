import { BeeperCommand } from '../../lib/command.js'
import { listTargets, readConfig } from '../../lib/targets.js'
import { targetLiveStatus } from '../../lib/target-status.js'
import { printData } from '../../lib/output.js'

export default class ProfileList extends BeeperCommand {
  static override summary = 'List local Beeper profiles'

  async run(): Promise<void> {
    const { flags } = await this.parse(ProfileList)
    const config = await readConfig()
    const targets = (await listTargets()).filter(target => target.managed)
    const rows = await Promise.all(targets.map(async target => ({
      default: config.defaultTarget === target.id,
      id: target.id,
      type: target.type,
      url: target.baseURL,
      port: target.port,
      dataDir: target.dataDir,
      serverEnv: target.serverEnv,
      ...(await targetLiveStatus(target)),
    })))
    await printData(rows, flags.json ? 'json' : 'human')
  }
}

