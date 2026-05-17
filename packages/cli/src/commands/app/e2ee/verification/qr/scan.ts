import { Args } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../../../../lib/command.js'
import { appRequest, type AppMutationResponse } from '../../../../../lib/app-api.js'
import { printData } from '../../../../../lib/output.js'

export default class AppE2EEVerificationQRScan extends BeeperCommand {
  static override summary = 'Submit a scanned verification QR payload'
  static override args = {
    data: Args.string({ description: 'QR code payload', required: true }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AppE2EEVerificationQRScan)
    ensureWritable(flags)
    const result = await appRequest<AppMutationResponse>('POST', '/v1/app/setup/verifications/qr/scan', {
      baseURL: flags['base-url'],
      target: flags.target,
      body: { data: args.data },
    })
    await printData(result, flags.json ? 'json' : 'human')
  }
}
