import { Command, Flags } from '@oclif/core'
import { createClient } from '../lib/client.js'
import { apiCopy, cliCopy } from '../lib/copy.js'
import { printData, printList } from '../lib/output.js'
import { withSpinner } from '../lib/ui.js'

function accountItems(accounts: unknown): unknown[] {
  if (Array.isArray(accounts)) return accounts
  return (accounts as { items?: unknown[] }).items ?? []
}

export default class Accounts extends Command {
  static override summary = apiCopy.accounts.list
  static override flags = {
    'base-url': Flags.string({ description: cliCopy.flags.baseURL }),
    debug: Flags.boolean({ default: false }),
    json: Flags.boolean({ default: false, description: cliCopy.flags.json }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Accounts)
    const client = await createClient(flags)
    const useSpinner = !flags.json
    const accounts = useSpinner
      ? await withSpinner('Loading accounts…', () => client.accounts.list(), {
        done: value => {
          const count = accountItems(value).length
          return `${count} account${count === 1 ? '' : 's'}`
        },
      })
      : await client.accounts.list()
    if (flags.json) {
      await printData(accounts, 'json')
      return
    }
    const items = accountItems(accounts)
    await printList(items, 'human', {
      title: 'No accounts connected',
      subtitle: 'Add an account to start chatting from the CLI.',
      suggestions: [
        { command: 'beeper accounts add', hint: 'browse and connect a network' },
        { command: 'beeper accounts add WhatsApp', hint: 'connect a specific network' },
        { command: 'beeper auth login', hint: 'sign in to Beeper Desktop first' },
      ],
    })
  }
}
