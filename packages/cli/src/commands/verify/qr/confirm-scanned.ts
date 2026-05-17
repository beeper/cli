import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../../lib/command.js'
import { createClient } from '../../../lib/client.js'
import { printData } from '../../../lib/output.js'
export default class VerifyQrConfirmScanned extends BeeperCommand {
  static override summary = 'Confirm a QR scan'
  static override flags = { id: Flags.string() }
  async run(): Promise<void> {
    const { flags } = await this.parse(VerifyQrConfirmScanned)
    ensureWritable(flags)
    const client = await createClient(flags)
    await printData(await client.app.verifications.qr.confirmScanned(flags.id ?? 'active'), flags.json ? 'json' : 'human')
  }
}
