import { Args, Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { notFound } from '../../lib/errors.js'
import { printData } from '../../lib/output.js'
import { listAccountIDs, resolveAccountIDs } from '../../lib/resolve.js'

export default class ResolveContact extends BeeperCommand {
  static override summary = 'Resolve a contact selector'
  static override args = {
    selector: Args.string({ required: true, description: 'Contact name, username, phone, email, or ID' }),
  }
  static override flags = {
    account: Flags.string({ multiple: true, description: 'Limit to account selector. Repeat for multiple.' }),
    pick: Flags.integer({ description: 'Select the Nth candidate (1-indexed)' }),
    limit: Flags.integer({ default: 10, description: 'Maximum candidates to return per account' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ResolveContact)
    const client = await createClient(flags)
    const accountIDs = await resolveAccountIDs(client, flags.account, { allowMultiplePerInput: true }) ?? await listAccountIDs(client)
    const candidates: Array<Record<string, unknown>> = []
    for (const accountID of accountIDs) {
      try {
        const result = await client.accounts.contacts.search(accountID, { query: args.selector })
        candidates.push(...result.items.slice(0, flags.limit).map((item: unknown) => ({ ...(item as Record<string, unknown>), accountID })))
      } catch {
        // Keep searching accounts that support lookup for this selector shape.
      }
    }
    if (!candidates.length) throw notFound(`No contact matches "${args.selector}"`, { selector: args.selector, kind: 'contact' })
    const selected = flags.pick ? candidates[flags.pick - 1] : candidates.length === 1 ? candidates[0] : undefined
    if (flags.pick && !selected) throw notFound(`--pick ${flags.pick} is outside the ${candidates.length} matching contacts`, { selector: args.selector, pick: flags.pick, count: candidates.length })
    await printData({
      selector: args.selector,
      kind: 'contact',
      selected: selected ? contactCandidate(selected, candidates.indexOf(selected) + 1) : null,
      candidates: candidates.map((contact, index) => contactCandidate(contact, index + 1)),
    }, flags.json ? 'json' : 'human')
  }
}

function contactCandidate(contact: Record<string, unknown>, pick: number): Record<string, unknown> {
  return {
    pick,
    id: contact.id,
    accountID: contact.accountID,
    displayName: contact.displayName ?? contact.fullName ?? contact.name,
    username: contact.username,
    phoneNumber: contact.phoneNumber,
    email: contact.email,
    raw: contact,
  }
}
