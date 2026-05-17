import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData } from '../../lib/output.js'
export default class VerifySas extends BeeperCommand {
  static override summary = 'Start emoji verification'
  static override flags = { id: Flags.string() }
  async run(): Promise<void> {
    const { flags } = await this.parse(VerifySas)
    ensureWritable(flags)
    const client = await createClient(flags)
    await printData(await client.app.verifications.sas.start(flags.id ?? 'active'), flags.json ? 'json' : 'human')
  }
}
