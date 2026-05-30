import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../lib/command.js'
import { driveVerification } from '../lib/app-state.js'
import { printData, printDryRun } from '../lib/output.js'
export default class AuthVerify extends BeeperCommand {
  static override summary = 'Finish setup verification or verify another device'
  static override flags = {
    user: Flags.string({ description: 'User ID to verify against (defaults to your own account)' }),
  }
  async run(): Promise<void> {
    const { flags } = await this.parse(AuthVerify)
    ensureWritable(flags)
    if (flags['dry-run']) {
      await printDryRun('verify', { baseURL: flags['base-url'], target: flags.target, userID: flags.user, yes: flags.yes }, flags.json ? 'json' : 'human')
      return
    }
    await printData(await driveVerification({ baseURL: flags['base-url'], target: flags.target, userID: flags.user, yes: flags.yes }), flags.json ? 'json' : 'human')
  }
}
