import { Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { apiCopy, cliCopy } from '../../lib/copy.js'
import { collectPage, printIDs, printList } from '../../lib/output.js'
import { resolveAccountIDs } from '../../lib/resolve.js'
import { withInkSpinner as withSpinner } from '../../lib/ink/spinner.js'

export default class ContactsList extends BeeperCommand {
  static override summary = 'List contacts'
  static override description = apiCopy.contacts.list
  static override args = {}

  static override flags = {
    ids: Flags.boolean({ default: false, description: 'Print only contact user IDs' }),
    limit: Flags.integer({ default: 50, description: 'Maximum contacts to print' }),
    account: Flags.string({ multiple: true, description: `Limit to ${cliCopy.args.accountSelector}` }),
    query: Flags.string({ description: 'Optional blended contact lookup query' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(ContactsList)
    const client = await createClient(flags)
    const accountIDs = (await resolveAccountIDs(client, flags.account, { allowMultiplePerInput: true }))!
    const useSpinner = !flags.json && !flags.ids
    const load = async (): Promise<Array<Record<string, unknown>>> => {
      const collected: Array<Record<string, unknown>> = []
      for (const accountID of accountIDs) {
        const remaining = flags.limit - collected.length
        if (remaining <= 0) break
        const contacts = await collectPage(client.accounts.contacts.list(accountID, { query: flags.query }), remaining)
        collected.push(...contacts.map(item => ({ ...(item as unknown as Record<string, unknown>), accountID })))
        if (collected.length >= flags.limit) break
      }
      return collected
    }
    const items = useSpinner
      ? await withSpinner(`Loading contacts${flags.query ? ` matching "${flags.query}"` : ''}…`, load, {
        done: value => `${value.length} contact${value.length === 1 ? '' : 's'}`,
      })
      : await load()
    if (flags.ids) {
      printIDs(items.map(item => ({ id: item.userID ?? item.id })))
      return
    }
    await printList(items, flags.json ? 'json' : 'human', {
      title: 'No contacts found',
      subtitle: flags.query ? `Nothing matched "${flags.query}".` : 'This account has no contacts to list.',
      suggestions: [
        { command: 'beeper contacts search <query>', hint: 'narrow with a search' },
        { command: 'beeper accounts', hint: 'check the account is online' },
      ],
    })
  }
}
