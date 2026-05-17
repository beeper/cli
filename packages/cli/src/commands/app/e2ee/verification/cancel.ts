import { Args, Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../../../lib/command.js'
import { appRequest, type AppMutationResponse } from '../../../../lib/app-api.js'
import { printData } from '../../../../lib/output.js'

export default class AppE2EEVerificationCancel extends BeeperCommand {
  static override summary = 'Cancel device verification'
  static override args = {
    txnID: Args.string({ description: 'Verification transaction ID', required: true }),
  }
  static override flags = {
    code: Flags.string({ description: 'Optional cancellation code' }),
    reason: Flags.string({ description: 'Optional cancellation reason' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AppE2EEVerificationCancel)
    ensureWritable(flags)
    const result = await appRequest<AppMutationResponse>('POST', `/v1/app/setup/verifications/${encodeURIComponent(args.txnID)}/cancel`, {
      baseURL: flags['base-url'],
      target: flags.target,
      body: { code: flags.code, reason: flags.reason },
    })
    await printData(result, flags.json ? 'json' : 'human')
  }
}
