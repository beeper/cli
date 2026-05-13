import { Args, Command, Flags } from '@oclif/core'
import { createClient } from '../../lib/client.js'
import { printData } from '../../lib/output.js'
import { listAccountIDs, resolveAccountIDs } from '../../lib/resolve.js'

export default class ContactsSearch extends Command {
  static override summary = 'Search account contacts'
  static override args = {
    query: Args.string({ description: 'Contact search query', required: true }),
  }
  static override flags = {
    account: Flags.string({ multiple: true, description: 'Account ID, network, bridge, or account user. Omit to search every account.' }),
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    debug: Flags.boolean({ default: false }),
    json: Flags.boolean({ default: false, description: 'Print JSON' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ContactsSearch)
    const client = await createClient(flags)
    const accountIDs = await resolveAccountIDs(client, flags.account, { allowMultiplePerInput: true }) ?? await listAccountIDs(client)
    const results = []
    for (const accountID of accountIDs) {
      try {
        const result = await client.accounts.contacts.search(accountID, { query: args.query })
        results.push(...result.items.map((item: unknown) => ({ ...(item as Record<string, unknown>), accountID })))
      } catch {
        // Some networks reject exact lookups for some identifiers; keep trying the rest.
      }
    }
    printData(flags.json ? { items: results } : results, flags.json ? 'json' : 'human')
  }
}
