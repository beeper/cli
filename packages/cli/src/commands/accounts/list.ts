import { Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printList } from '../../lib/output.js'
import { resolveAccountIDs } from '../../lib/resolve.js'
import { readConfig } from '../../lib/targets.js'

export default class AccountsList extends BeeperCommand {
  static override summary = 'List connected accounts'
  static override flags = {
    account: Flags.string({ multiple: true, description: 'Filter by account selector' }),
    ids: Flags.boolean({ default: false, description: 'Print only account IDs' }),
  }
  async run(): Promise<void> {
    const { flags } = await this.parse(AccountsList)
    const client = await createClient(flags)
    // Account filter is an explicit override here; do not auto-apply defaultAccount.
    const selected = await resolveAccountIDs(client, flags.account, { allowMultiplePerInput: true, applyDefault: false })
    const config = await readConfig()
    const response = await client.accounts.list()
    const rows = Array.isArray(response) ? response : ((response as any).items ?? [])
    const filtered = selected?.length ? rows.filter((row: any) => selected.includes(row.accountID ?? row.id)) : rows
    const items = filtered.map((row: any) => ({
      ...row,
      default: (row.accountID ?? row.id) === config.defaultAccount || undefined,
    }))
    if (flags.ids) for (const item of items) process.stdout.write(`${String((item as any).accountID ?? (item as any).id)}\n`)
    else await printList(items, flags.json ? 'json' : 'human', { title: 'No accounts connected', subtitle: 'Run beeper accounts add to add one.' })
  }
}
