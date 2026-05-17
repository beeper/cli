import { Args, Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printSuccess, collectPage, printList } from '../../lib/output.js'
import { resolveAccountID, resolveAccountIDs } from '../../lib/resolve.js'

export default class AccountsList extends BeeperCommand {
  static override summary = 'List connected accounts'
  static override flags = { account: Flags.string({ multiple: true, description: 'Filter by account selector' }), ids: Flags.boolean({ default: false }) }
  async run(): Promise<void> {
    const { flags } = await this.parse(AccountsList)
    const client = await createClient(flags)
    const selected = await resolveAccountIDs(client, flags.account, { allowMultiplePerInput: true })
    const response = await client.accounts.list()
    const rows = Array.isArray(response) ? response : ((response as any).items ?? [])
    const items = selected?.length ? rows.filter((row: any) => selected.includes(row.accountID ?? row.id)) : rows
    if (flags.ids) for (const item of items) process.stdout.write(`${String((item as any).accountID ?? (item as any).id)}\n`)
    else await printList(items, flags.json ? 'json' : 'human', { title: 'No accounts connected', subtitle: 'Run beeper accounts add to add one.' })
  }
}
