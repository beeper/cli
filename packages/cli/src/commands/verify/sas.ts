import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { appRequest } from '../../lib/app-api.js'
import { printData } from '../../lib/output.js'
export default class VerifySas extends BeeperCommand {
  static override summary = 'Start emoji verification'
  static override flags = { id: Flags.string() }
  async run(): Promise<void> {
    const { flags } = await this.parse(VerifySas)
    ensureWritable(flags)
    await printData(await appRequest('POST', `/v1/app/setup/verifications/${encodeURIComponent(flags.id ?? 'active')}/sas/start`, { baseURL: flags['base-url'], target: flags.target }), flags.json ? 'json' : 'human')
  }
}
