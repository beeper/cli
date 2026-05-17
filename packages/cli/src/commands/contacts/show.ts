import { Args, Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { collectPage, printData } from '../../lib/output.js'
import { resolveAccountIDs } from '../../lib/resolve.js'
export default class ContactsShow extends BeeperCommand {
  static override summary = 'Show contact details'
  static override args = { contact: Args.string({ required: true }) }
  static override flags = { account: Flags.string({ multiple: true }) }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(ContactsShow)
    const client = await createClient(flags)
    const accountIDs = await resolveAccountIDs(client, flags.account, { allowMultiplePerInput: true })
    for (const accountID of accountIDs ?? []) {
      const matches = await collectPage(client.accounts.contacts.list(accountID, { query: args.contact }), 10)
      const match = matches.find((item: any) => [item.userID, item.id, item.name, item.displayName].includes(args.contact))
      if (match) return printData({ accountID, contact: match }, flags.json ? 'json' : 'human')
    }
    throw new Error(`Contact not found: ${args.contact}`)
  }
}
