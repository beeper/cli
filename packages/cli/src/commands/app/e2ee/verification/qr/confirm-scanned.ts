import { Args } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../../../../lib/command.js'
import { appRequest, type AppMutationResponse } from '../../../../../lib/app-api.js'
import { printData } from '../../../../../lib/output.js'

export default class AppE2EEVerificationQRConfirmScanned extends BeeperCommand {
  static override summary = 'Confirm another device scanned this QR code'
  static override args = {
    txnID: Args.string({ description: 'Verification transaction ID', required: true }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AppE2EEVerificationQRConfirmScanned)
    ensureWritable(flags)
    const result = await appRequest<AppMutationResponse>('POST', `/v1/app/setup/verifications/${encodeURIComponent(args.txnID)}/qr/confirm-scanned`, {
      baseURL: flags['base-url'],
      target: flags.target,
    })
    await printData(result, flags.json ? 'json' : 'human')
  }
}
