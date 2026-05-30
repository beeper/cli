import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printDryRun } from '../../lib/output.js'
export default class AuthVerifyStart extends BeeperCommand {
  static override summary = 'Start a device verification request'
  static override flags = {
    user: Flags.string({ description: 'User ID to verify with (defaults to your own account)' }),
  }
  async run(): Promise<void> {
    const { flags } = await this.parse(AuthVerifyStart)
    ensureWritable(flags)
    const client = await createClient(flags)
    if (flags['dry-run']) {
      await printDryRun('verify.start', { userID: flags.user }, flags.json ? 'json' : 'human')
      return
    }
    await printData(await client.app.verifications.create({ userID: flags.user }), flags.json ? 'json' : 'human')
  }
}
