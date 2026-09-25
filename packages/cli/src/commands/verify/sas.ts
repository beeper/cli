import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { resolveVerificationID } from '../../lib/app-state.js'
import { printData } from '../../lib/output.js'
export default class AuthVerifySas extends BeeperCommand {
  static override summary = 'Start emoji verification'
  static override flags = {
    id: Flags.string({ description: 'Verification request ID. Defaults to the active request.' }),
  }
  async run(): Promise<void> {
    const { flags } = await this.parse(AuthVerifySas)
    ensureWritable(flags)
    const client = await createClient(flags)
    await printData(await client.app.verifications.sas.start(await resolveVerificationID(client, flags.id)), flags.json ? 'json' : 'human')
  }
}
