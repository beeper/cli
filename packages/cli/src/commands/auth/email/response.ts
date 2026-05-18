import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../../lib/command.js'
import { resolveTarget } from '../../../lib/targets.js'
import { finishEmailSetup } from '../../../lib/setup-login.js'
import { printData } from '../../../lib/output.js'

export default class AuthEmailResponse extends BeeperCommand {
  static override summary = 'Finish email sign-in with a verification code'
  static override flags = {
    code: Flags.string({ required: true, description: 'Email verification code' }),
    'setup-request-id': Flags.string({ required: true, description: 'Setup request ID from auth email start' }),
    username: Flags.string({ description: 'Username to use if setup creates a new account' }),
    yes: Flags.boolean({ default: false, description: 'Accept required registration prompts non-interactively' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthEmailResponse)
    ensureWritable(flags)
    const target = await resolveTarget({ target: flags.target, baseURL: flags['base-url'] })
    const data = await finishEmailSetup(target, {
      code: flags.code,
      json: flags.json,
      setupRequestID: flags['setup-request-id'],
      username: flags.username,
      yes: flags.yes,
    })
    await printData(data, flags.json ? 'json' : 'human')
  }
}
