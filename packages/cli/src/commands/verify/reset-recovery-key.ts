import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData } from '../../lib/output.js'
import { promptYesNo } from '../../lib/app-api.js'

const resetWarning = 'Resetting the recovery key signs out every chat account connected through Beeper Cloud (WhatsApp, Telegram, Signal, …) on all your devices. You will need to reconnect them.'

export default class AuthVerifyResetRecoveryKey extends BeeperCommand {
  static override summary = 'Create a new encrypted-messages recovery key'
  static override description = `${resetWarning} Use only when you have lost your recovery key and have no other verified device.`

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthVerifyResetRecoveryKey)
    ensureWritable(flags)
    if ((flags.json || !process.stdin.isTTY) && !flags.yes) {
      throw new Error(`${resetWarning} Pass --yes to confirm in non-interactive mode.`)
    }

    const client = await createClient(flags)
    const reset = await client.app.login.verification.recoveryKey.reset.create({})

    process.stderr.write(`Warning: ${resetWarning}\n`)
    if (!flags.yes) {
      process.stderr.write(`New recovery key:\n${reset.recoveryKey}\n`)
      if (!await promptYesNo('I saved this recovery key. Reset now and disconnect my chat accounts?')) throw new Error('Recovery key reset cancelled.')
    }

    const confirmed = await client.app.login.verification.recoveryKey.reset.confirm({ recoveryKey: reset.recoveryKey })

    await printData({ recoveryKey: reset.recoveryKey, session: confirmed.session }, flags.json ? 'json' : 'human')
  }
}
