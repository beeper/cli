import { Args, Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printSuccess, collectPage, printList } from '../../lib/output.js'
import { resolveAccountID, resolveAccountIDs } from '../../lib/resolve.js'

export default class AccountsUse extends BeeperCommand {
  static override summary = 'Select an account'
  static override args = { account: Args.string({ required: true }) }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(AccountsUse)
    const client = await createClient(flags)
    const accountID = await resolveAccountID(client, args.account)
    await printSuccess({ message: `Selected account: ${accountID}`, data: { accountID } }, flags.json ? 'json' : 'human')
  }
}
