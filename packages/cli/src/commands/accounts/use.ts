import { Args } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printDryRun, printSuccess } from '../../lib/output.js'
import { resolveAccountID } from '../../lib/resolve.js'
import { updateConfig } from '../../lib/targets.js'

export default class AccountsUse extends BeeperCommand {
  static override summary = 'Select a default account for account-scoped commands'
  static override description = 'Persists the choice in CLI config. Account-scoped commands that take --account fall back to this default when --account is omitted. Use `beeper accounts use ""` (or `beeper config set defaultAccount ""`) to clear.'
  static override args = {
    account: Args.string({ required: true, description: 'Account selector (ID, network, bridge, user identity), or "" to clear.' }),
  }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(AccountsUse)
    ensureWritable(flags)
    if (args.account === '') {
      if (flags['dry-run']) {
        await printDryRun('accounts.use', { defaultAccount: undefined }, flags.json ? 'json' : 'human')
        return
      }
      await updateConfig(config => ({ ...config, defaultAccount: undefined }))
      await printSuccess({ message: 'Cleared default account' }, flags.json ? 'json' : 'human')
      return
    }
    const client = await createClient(flags)
    const accountID = await resolveAccountID(client, args.account)
    if (flags['dry-run']) {
      await printDryRun('accounts.use', { defaultAccount: accountID }, flags.json ? 'json' : 'human')
      return
    }
    await updateConfig(config => ({ ...config, defaultAccount: accountID }))
    await printSuccess({ message: `Default account: ${accountID}`, data: { accountID } }, flags.json ? 'json' : 'human')
  }
}
