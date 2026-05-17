import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../../../lib/command.js'
import { appRequest, type AppMutationResponse } from '../../../../lib/app-api.js'
import { printData } from '../../../../lib/output.js'

export default class AppE2EEVerificationStart extends BeeperCommand {
  static override summary = 'Start device verification'
  static override flags = {
    'user-id': Flags.string({ description: 'User ID to verify. Defaults to the signed-in user.' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(AppE2EEVerificationStart)
    ensureWritable(flags)
    const result = await appRequest<AppMutationResponse>('POST', '/v1/app/setup/verifications', {
      baseURL: flags['base-url'],
      target: flags.target,
      body: flags['user-id'] ? { userID: flags['user-id'] } : {},
    })
    await printData(result, flags.json ? 'json' : 'human')
  }
}
