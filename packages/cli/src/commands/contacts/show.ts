import { Args, Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { notFound } from '../../lib/errors.js'
import { collectPage, printData } from '../../lib/output.js'
import { resolveAccountIDs } from '../../lib/resolve.js'
export default class ContactsShow extends BeeperCommand {
  static override summary = 'Show contact details'
  static override args = {
    id: Args.string({ required: true, description: 'Contact user ID, display name, or phone/handle' }),
  }
  static override flags = {
    account: Flags.string({ multiple: true, description: 'Limit to account ID, network, bridge, or account user' }),
  }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(ContactsShow)
    const client = await createClient(flags)
    const accountIDs = await resolveAccountIDs(client, flags.account, { allowMultiplePerInput: true })
    for (const accountID of accountIDs ?? []) {
      const matches = await collectPage(client.accounts.contacts.list(accountID, { query: args.id }), 10)
      const match = matches.find((item: any) => [item.userID, item.id, item.name, item.displayName].includes(args.id))
      if (match) return printData({ accountID, contact: match }, flags.json ? 'json' : 'human')
    }
    throw notFound(`Contact not found: ${args.id}`)
  }
}
