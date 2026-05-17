import { Args } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../../../../lib/command.js'
import { appRequest, type AppMutationResponse } from '../../../../../lib/app-api.js'
import { printData } from '../../../../../lib/output.js'

export default class AppE2EERecoveryCodeResetConfirm extends BeeperCommand {
  static override summary = 'Confirm a newly created recovery key'
  static override args = {
    recoveryCode: Args.string({ description: 'New recovery key returned by reset begin', required: true }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AppE2EERecoveryCodeResetConfirm)
    ensureWritable(flags)
    const result = await appRequest<AppMutationResponse>('POST', '/v1/app/setup/verification/recovery-key/reset/confirm', {
      baseURL: flags['base-url'],
      target: flags.target,
      body: { recoveryCode: args.recoveryCode },
    })
    await printData(result, flags.json ? 'json' : 'human')
  }
}
