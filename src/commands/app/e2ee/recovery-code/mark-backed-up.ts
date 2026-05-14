import { Command, Flags } from '@oclif/core'
import type { RecoveryCodeMarkBackedUpResponse } from '@beeper/desktop-api/resources/app/e2ee/recovery-code/recovery-code.js'
import { appRequest } from '../../../../lib/app-api.js'
import { printData } from '../../../../lib/output.js'

export default class AppE2EERecoveryCodeMarkBackedUp extends Command {
  static override summary = 'Mark the recovery key as saved'
  static override flags = {
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    json: Flags.boolean({ default: false, description: 'Print JSON' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(AppE2EERecoveryCodeMarkBackedUp)
    const result = await appRequest<RecoveryCodeMarkBackedUpResponse>('POST', '/v1/app/e2ee/recovery-code/mark-backed-up', {
      baseURL: flags['base-url'],
    })
    printData(result, flags.json ? 'json' : 'human')
  }
}
