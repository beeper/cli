import { Args, Command, Flags } from '@oclif/core'
import type { ResetConfirmResponse } from '@beeper/desktop-api/resources/app/e2ee/recovery-code/reset.js'
import { appRequest } from '../../../../../lib/app-api.js'
import { printData } from '../../../../../lib/output.js'

export default class AppE2EERecoveryCodeResetConfirm extends Command {
  static override summary = 'Confirm a newly created recovery key'
  static override args = {
    recoveryCode: Args.string({ description: 'New recovery key returned by reset begin', required: true }),
  }
  static override flags = {
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    json: Flags.boolean({ default: false, description: 'Print JSON' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AppE2EERecoveryCodeResetConfirm)
    const result = await appRequest<ResetConfirmResponse>('POST', '/v1/app/e2ee/recovery-code/reset/confirm', {
      baseURL: flags['base-url'],
      body: { recoveryCode: args.recoveryCode },
    })
    printData(result, flags.json ? 'json' : 'human')
  }
}
