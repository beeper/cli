import { Args } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printSuccess } from '../../lib/output.js'
import { resolveAccountID } from '../../lib/resolve.js'

export default class AccountsRemove extends BeeperCommand {
  static override summary = 'Remove an account'
  static override args = {
    account: Args.string({ required: true, description: 'Account selector (ID, network, bridge, or user identity)' }),
  }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(AccountsRemove)
    ensureWritable(flags)
    const client = await createClient(flags)
    const accountID = await resolveAccountID(client, args.account)
    const accounts = client.accounts as any
    if (accounts.delete) await accounts.delete(accountID)
    else if (accounts.remove) await accounts.remove(accountID)
    else throw new Error('This Desktop API does not expose account removal.')
    await printSuccess({ message: `Removed account: ${accountID}`, data: { accountID } }, flags.json ? 'json' : 'human')
  }
}
