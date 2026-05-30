import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printDryRun } from '../../lib/output.js'
import { promptYesNoDefaultYes } from '../../lib/app-api.js'

export default class AuthVerifyResetRecoveryKey extends BeeperCommand {
  static override summary = 'Create a new encrypted-messages recovery key'

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthVerifyResetRecoveryKey)
    ensureWritable(flags)
    const client = await createClient(flags)
    if (flags['dry-run']) {
      await printDryRun('verify.reset-recovery-key', { confirmWithYes: flags.yes }, flags.json ? 'json' : 'human')
      return
    }
    const reset = await client.app.login.verification.recoveryKey.reset.create({})

    if ((flags.json || !process.stdin.isTTY) && !flags.yes) {
      throw new Error('Resetting the recovery key requires --yes in non-interactive mode so the new key can be confirmed.')
    }

    if (!flags.yes) {
      process.stderr.write(`New recovery key:\n${reset.recoveryKey}\n`)
      if (!await promptYesNoDefaultYes('I saved this recovery key. Use it for this account?')) throw new Error('Recovery key reset cancelled.')
    }

    const confirmed = await client.app.login.verification.recoveryKey.reset.confirm({ recoveryKey: reset.recoveryKey })

    await printData({ recoveryKey: reset.recoveryKey, session: confirmed.session }, flags.json ? 'json' : 'human')
  }
}
