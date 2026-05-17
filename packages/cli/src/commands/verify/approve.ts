import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData } from '../../lib/output.js'
export default class VerifyApprove extends BeeperCommand {
  static override summary = 'Approve a verification request'
  static override flags = { id: Flags.string(), user: Flags.string(), code: Flags.string(), payload: Flags.string() }
  async run(): Promise<void> {
    const { flags } = await this.parse(VerifyApprove)
    ensureWritable(flags)
    const client = await createClient(flags)
    await printData(await client.app.verifications.accept(flags.id ?? 'active'), flags.json ? 'json' : 'human')
  }
}
