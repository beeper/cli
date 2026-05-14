import { Command, Flags } from '@oclif/core'
import type { ResetBeginResponse } from '@beeper/desktop-api/resources/app/e2ee/recovery-code/reset.js'
import { appRequest } from '../../../../../lib/app-api.js'
import { printData } from '../../../../../lib/output.js'

export default class AppE2EERecoveryCodeResetBegin extends Command {
  static override summary = 'Create a new recovery key'
  static override flags = {
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    'recovery-code': Flags.string({ description: 'Existing recovery key, if available' }),
    json: Flags.boolean({ default: false, description: 'Print JSON' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(AppE2EERecoveryCodeResetBegin)
    const result = await appRequest<ResetBeginResponse>('POST', '/v1/app/e2ee/recovery-code/reset/begin', {
      baseURL: flags['base-url'],
      body: flags['recovery-code'] ? { recoveryCode: flags['recovery-code'] } : {},
    })
    printData(result, flags.json ? 'json' : 'human')
  }
}
