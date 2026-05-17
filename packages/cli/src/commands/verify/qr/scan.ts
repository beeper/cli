import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../../lib/command.js'
import { appRequest } from '../../../lib/app-api.js'
import { printData } from '../../../lib/output.js'
export default class VerifyQrScan extends BeeperCommand {
  static override summary = 'Submit a scanned QR payload'
  static override flags = { id: Flags.string(), payload: Flags.string({ required: true }) }
  async run(): Promise<void> {
    const { flags } = await this.parse(VerifyQrScan)
    ensureWritable(flags)
    await printData(await appRequest('POST', `/v1/app/setup/verifications/${encodeURIComponent(flags.id ?? 'active')}/qr/scan`, { baseURL: flags['base-url'], target: flags.target, body: { payload: flags.payload } }), flags.json ? 'json' : 'human')
  }
}
