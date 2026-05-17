import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData } from '../../lib/output.js'
export default class VerifyStart extends BeeperCommand {
  static override summary = 'Start device verification'
  static override flags = { id: Flags.string(), user: Flags.string(), code: Flags.string(), payload: Flags.string() }
  async run(): Promise<void> {
    const { flags } = await this.parse(VerifyStart)
    ensureWritable(flags)
    const client = await createClient(flags)
    await printData(await client.app.verifications.create({ userID: flags.user }), flags.json ? 'json' : 'human')
  }
}
