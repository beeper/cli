import { Args } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../../../lib/command.js'
import { appRequest, type AppMutationResponse } from '../../../../lib/app-api.js'
import { printData } from '../../../../lib/output.js'

export default class AppE2EEVerificationAccept extends BeeperCommand {
  static override summary = 'Accept a device verification request'
  static override args = {
    txnID: Args.string({ description: 'Verification transaction ID', required: true }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AppE2EEVerificationAccept)
    ensureWritable(flags)
    const result = await appRequest<AppMutationResponse>('POST', `/v1/app/setup/verifications/${encodeURIComponent(args.txnID)}/accept`, {
      baseURL: flags['base-url'],
      target: flags.target,
    })
    await printData(result, flags.json ? 'json' : 'human')
  }
}
