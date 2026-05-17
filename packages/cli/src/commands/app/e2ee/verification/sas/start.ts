import { Args } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../../../../lib/command.js'
import type { SASStartResponse } from '@beeper/desktop-api/resources/app/setup/verifications/sas.js'
import { appRequest } from '../../../../../lib/app-api.js'
import { printData } from '../../../../../lib/output.js'

export default class AppE2EEVerificationSASStart extends BeeperCommand {
  static override summary = 'Start emoji verification'
  static override args = {
    txnID: Args.string({ description: 'Verification transaction ID', required: true }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AppE2EEVerificationSASStart)
    ensureWritable(flags)
    const result = await appRequest<SASStartResponse>('POST', `/v1/app/setup/verifications/${encodeURIComponent(args.txnID)}/sas/start`, {
      baseURL: flags['base-url'],
      target: flags.target,
    })
    await printData(result, flags.json ? 'json' : 'human')
  }
}
