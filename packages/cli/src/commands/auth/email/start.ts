import { Flags } from '@oclif/core'
import { BeeperCommand } from '../../../lib/command.js'
import { resolveTarget } from '../../../lib/targets.js'
import { startEmailSetup } from '../../../lib/setup-login.js'
import { printData } from '../../../lib/output.js'

export default class AuthEmailStart extends BeeperCommand {
  static override summary = 'Start email sign-in for a target'
  static override flags = {
    email: Flags.string({ required: true, description: 'Email address to sign in with' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthEmailStart)
    const target = await resolveTarget({ target: flags.target, baseURL: flags['base-url'] })
    const data = await startEmailSetup(target, flags.email)
    await printData(data, flags.json ? 'json' : 'human')
  }
}
