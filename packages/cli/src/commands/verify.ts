import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../lib/command.js'
import { driveVerification } from '../lib/app-state.js'
import { printData } from '../lib/output.js'
export default class Verify extends BeeperCommand {
  static override summary = 'Continue device verification'
  static override flags = { user: Flags.string() }
  async run(): Promise<void> {
    const { flags } = await this.parse(Verify)
    ensureWritable(flags)
    await printData(await driveVerification({ baseURL: flags['base-url'], target: flags.target, userID: flags.user, yes: flags.yes }), flags.json ? 'json' : 'human')
  }
}
