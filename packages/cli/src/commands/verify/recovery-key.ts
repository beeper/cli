import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData } from '../../lib/output.js'
export default class VerifyRecoveryKey extends BeeperCommand {
  static override summary = 'Unlock encrypted messages with a recovery key'
  static override flags = { id: Flags.string(), user: Flags.string(), code: Flags.string(), payload: Flags.string() }
  async run(): Promise<void> {
    const { flags } = await this.parse(VerifyRecoveryKey)
    ensureWritable(flags)
    const client = await createClient(flags)
    await printData(await client.app.login.verification.recoveryKey.verify({ recoveryKey: flags.code ?? '' }), flags.json ? 'json' : 'human')
  }
}
