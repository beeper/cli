import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printDryRun } from '../../lib/output.js'
export default class AuthVerifyRecoveryKey extends BeeperCommand {
  static override summary = 'Unlock encrypted messages with a recovery key'
  static override flags = {
    key: Flags.string({ description: 'Recovery key string', required: true }),
  }
  async run(): Promise<void> {
    const { flags } = await this.parse(AuthVerifyRecoveryKey)
    ensureWritable(flags)
    const client = await createClient(flags)
    if (flags['dry-run']) {
      await printDryRun('verify.recovery-key', { keyProvided: true }, flags.json ? 'json' : 'human')
      return
    }
    await printData(await client.app.login.verification.recoveryKey.verify({ recoveryKey: flags.key }), flags.json ? 'json' : 'human')
  }
}
