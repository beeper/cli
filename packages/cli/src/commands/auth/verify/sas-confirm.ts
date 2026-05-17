import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../../lib/command.js'
import { createClient } from '../../../lib/client.js'
import { printData } from '../../../lib/output.js'
export default class AuthVerifySasConfirm extends BeeperCommand {
  static override summary = 'Confirm short-authentication-string (emoji) verification'
  static override flags = {
    id: Flags.string({ description: 'Verification request ID. Defaults to the active request.' }),
  }
  async run(): Promise<void> {
    const { flags } = await this.parse(AuthVerifySasConfirm)
    ensureWritable(flags)
    const client = await createClient(flags)
    await printData(await client.app.verifications.sas.confirm(flags.id ?? 'active'), flags.json ? 'json' : 'human')
  }
}
