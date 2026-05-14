import { Args, Command, Flags } from '@oclif/core'
import type { RecoveryCodeVerifyResponse } from '@beeper/desktop-api/resources/app/e2ee/recovery-code/recovery-code.js'
import { appRequest } from '../../../../lib/app-api.js'
import { printData } from '../../../../lib/output.js'

export default class AppE2EERecoveryCodeVerify extends Command {
  static override summary = 'Unlock encrypted messages with a recovery key'
  static override args = {
    recoveryCode: Args.string({ description: 'Beeper recovery key', required: true }),
  }
  static override flags = {
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    json: Flags.boolean({ default: false, description: 'Print JSON' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AppE2EERecoveryCodeVerify)
    const result = await appRequest<RecoveryCodeVerifyResponse>('POST', '/v1/app/e2ee/recovery-code/verify', {
      baseURL: flags['base-url'],
      body: { recoveryCode: args.recoveryCode },
    })
    printData(result, flags.json ? 'json' : 'human')
  }
}
