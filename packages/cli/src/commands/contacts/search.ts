import { Args, Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { apiCopy, cliCopy } from '../../lib/copy.js'
import { printList } from '../../lib/output.js'
import { listAccountIDs, resolveAccountIDs } from '../../lib/resolve.js'
import { withInkSpinner as withSpinner } from '../../lib/ink/spinner.js'

export default class ContactsSearch extends BeeperCommand {
  static override summary = 'Search contacts'
  static override description = apiCopy.contacts.search
  static override args = {
    query: Args.string({ description: 'Contact search query', required: true }),
  }
  static override flags = {
    account: Flags.string({ multiple: true, description: `${cliCopy.args.accountSelector}. Omit to search every account.` }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ContactsSearch)
    const client = await createClient(flags)
    const accountIDs = await resolveAccountIDs(client, flags.account, { allowMultiplePerInput: true }) ?? await listAccountIDs(client)
    const load = async (): Promise<Array<Record<string, unknown>>> => {
      const collected: Array<Record<string, unknown>> = []
      for (const accountID of accountIDs) {
        try {
          const result = await client.accounts.contacts.search(accountID, { query: args.query })
          collected.push(...result.items.map((item: unknown) => ({ ...(item as Record<string, unknown>), accountID })))
        } catch {
          // Some networks reject exact lookups for some identifiers; keep trying the rest.
        }
      }
      return collected
    }
    const useSpinner = !flags.json
    const results = useSpinner
      ? await withSpinner(`Searching contacts for "${args.query}"…`, load, {
        done: value => `${value.length} match${value.length === 1 ? '' : 'es'} across ${accountIDs.length} account${accountIDs.length === 1 ? '' : 's'}`,
      })
      : await load()
    await printList(results, flags.json ? 'json' : 'human', {
      title: 'No contacts matched',
      subtitle: `Nothing across your ${accountIDs.length} account${accountIDs.length === 1 ? '' : 's'} matched "${args.query}".`,
      suggestions: [
        { command: 'beeper accounts', hint: 'verify which accounts are connected' },
        { command: `beeper contact <accountID> ${args.query}`, hint: 'exact lookup on one account' },
      ],
    })
  }
}
