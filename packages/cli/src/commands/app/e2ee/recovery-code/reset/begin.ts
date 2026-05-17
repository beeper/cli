import { createInterface } from 'node:readline/promises'
import { execFileSync } from 'node:child_process'
import { stdin as input, stderr as output } from 'node:process'
import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../../../../lib/command.js'
import { appRequest, type AppRecoveryCodeResetBeginResponse } from '../../../../../lib/app-api.js'
import { printData } from '../../../../../lib/output.js'

export default class AppE2EERecoveryCodeResetBegin extends BeeperCommand {
  static override summary = 'Create a new recovery key'
  static override flags = {
    'recovery-code': Flags.string({ description: 'Existing recovery key, if available' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(AppE2EERecoveryCodeResetBegin)
    ensureWritable(flags)
    const recoveryCode = flags['recovery-code'] ?? (!flags.json && input.isTTY ? await promptSecret('Existing recovery key (optional): ') : undefined)
    const result = await appRequest<AppRecoveryCodeResetBeginResponse>('POST', '/v1/app/setup/verification/recovery-key/reset', {
      baseURL: flags['base-url'],
      target: flags.target,
      body: recoveryCode ? { recoveryCode } : {},
    })
    await printData(result, flags.json ? 'json' : 'human')
  }
}

async function promptSecret(label: string): Promise<string> {
  const rl = createInterface({ input, output })
  try {
    execFileSync('stty', ['-echo'], { stdio: ['inherit', 'ignore', 'ignore'] })
    return (await rl.question(label)).trim()
  } finally {
    rl.close()
    execFileSync('stty', ['echo'], { stdio: ['inherit', 'ignore', 'ignore'] })
    output.write('\n')
  }
}
