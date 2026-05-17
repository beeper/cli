import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../../lib/command.js'
import { createClient } from '../../../lib/client.js'
import { printData } from '../../../lib/output.js'
export default class VerifyQrScan extends BeeperCommand {
  static override summary = 'Submit a scanned QR payload'
  static override flags = { id: Flags.string(), payload: Flags.string({ required: true }) }
  async run(): Promise<void> {
    const { flags } = await this.parse(VerifyQrScan)
    ensureWritable(flags)
    const client = await createClient(flags)
    await printData(await client.app.verifications.qr.scan({ data: flags.payload }), flags.json ? 'json' : 'human')
  }
}
