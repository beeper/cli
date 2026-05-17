import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData } from '../../lib/output.js'
export default class VerifyResetRecoveryKey extends BeeperCommand {
  static override summary = 'Create a new recovery key'
  static override flags = { id: Flags.string(), user: Flags.string(), code: Flags.string(), payload: Flags.string() }
  async run(): Promise<void> {
    const { flags } = await this.parse(VerifyResetRecoveryKey)
    ensureWritable(flags)
    const client = await createClient(flags)
    await printData(await client.app.login.verification.recoveryKey.reset.create({}), flags.json ? 'json' : 'human')
  }
}
