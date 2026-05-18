import { Args } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData } from '../../lib/output.js'
import { resolveAccountID } from '../../lib/resolve.js'

export default class AccountsShow extends BeeperCommand {
  static override summary = 'Show account details'
  static override args = {
    account: Args.string({ required: true, description: 'Account selector (ID, network, bridge, or user identity)' }),
  }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(AccountsShow)
    const client = await createClient(flags)
    const accountID = await resolveAccountID(client, args.account)
    const account = client.accounts.retrieve ? await client.accounts.retrieve(accountID) : (await client.accounts.list()).find((item: any) => (item.accountID ?? item.id) === accountID)
    await printData(account, flags.json ? 'json' : 'human')
  }
}
