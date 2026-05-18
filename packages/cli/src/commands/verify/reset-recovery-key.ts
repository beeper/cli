import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData } from '../../lib/output.js'
export default class AuthVerifyResetRecoveryKey extends BeeperCommand {
  static override summary = 'Create a new encrypted-messages recovery key'
  async run(): Promise<void> {
    const { flags } = await this.parse(AuthVerifyResetRecoveryKey)
    ensureWritable(flags)
    const client = await createClient(flags)
    await printData(await client.app.login.verification.recoveryKey.reset.create({}), flags.json ? 'json' : 'human')
  }
}
