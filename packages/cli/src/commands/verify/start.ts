import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { appRequest } from '../../lib/app-api.js'
import { printData } from '../../lib/output.js'
export default class VerifyStart extends BeeperCommand {
  static override summary = 'Start device verification'
  static override flags = { id: Flags.string(), user: Flags.string(), code: Flags.string(), payload: Flags.string() }
  async run(): Promise<void> {
    const { flags } = await this.parse(VerifyStart)
    ensureWritable(flags)
    const id = flags.id
    const path = `/v1/app/setup/verifications`.replace(':id', encodeURIComponent(id ?? 'active'))
    await printData(await appRequest('POST', path, { baseURL: flags['base-url'], target: flags.target, body: { userID: flags.user } }), flags.json ? 'json' : 'human')
  }
}
