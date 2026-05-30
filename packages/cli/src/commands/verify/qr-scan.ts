import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printDryRun } from '../../lib/output.js'
export default class AuthVerifyQrScan extends BeeperCommand {
  static override summary = 'Submit a scanned QR-code verification payload'
  static override flags = {
    id: Flags.string({ description: 'Verification request ID. Defaults to the active request.' }),
    payload: Flags.string({ required: true, description: 'Raw QR-code data scanned from the other device' }),
  }
  async run(): Promise<void> {
    const { flags } = await this.parse(AuthVerifyQrScan)
    ensureWritable(flags)
    const client = await createClient(flags)
    if (flags['dry-run']) {
      await printDryRun('verify.qr-scan', { id: flags.id ?? 'active', payload: flags.payload }, flags.json ? 'json' : 'human')
      return
    }
    await printData(await client.app.verifications.qr.scan({ data: flags.payload }), flags.json ? 'json' : 'human')
  }
}
