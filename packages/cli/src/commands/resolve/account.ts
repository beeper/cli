import { Args, Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { notFound } from '../../lib/errors.js'
import { printData } from '../../lib/output.js'
import { resolveAccountIDs } from '../../lib/resolve.js'

export default class ResolveAccount extends BeeperCommand {
  static override summary = 'Resolve an account selector'
  static override args = {
    selector: Args.string({ required: true, description: 'Account ID, network, bridge, or account user selector' }),
  }
  static override flags = {
    pick: Flags.integer({ description: 'Select the Nth candidate (1-indexed)' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ResolveAccount)
    const client = await createClient(flags)
    const response = await client.accounts.list()
    const rows = Array.isArray(response) ? response : ((response as any).items ?? [])
    const ids = await resolveAccountIDs(client, [args.selector], { allowMultiplePerInput: true, applyDefault: false })
    const candidates = rows.filter((row: any) => ids?.includes(String(row.accountID ?? row.id)))
    if (!candidates.length) throw notFound(`No account matches "${args.selector}"`, { selector: args.selector, kind: 'account' })
    const pick = flags.pick
    const selected = pick !== undefined ? candidates[pick - 1] : candidates.length === 1 ? candidates[0] : undefined
    if (pick !== undefined && !selected) throw notFound(`--pick ${pick} is outside the ${candidates.length} matching accounts`, { selector: args.selector, pick, count: candidates.length })
    await printData({
      selector: args.selector,
      kind: 'account',
      selected: selected ? accountCandidate(selected, candidates.indexOf(selected) + 1) : null,
      candidates: candidates.map((account: any, index: number) => accountCandidate(account, index + 1)),
    }, flags.json ? 'json' : 'human')
  }
}

function accountCandidate(account: any, pick: number): Record<string, unknown> {
  return {
    pick,
    id: account.accountID ?? account.id,
    accountID: account.accountID,
    network: account.network,
    bridge: account.bridge,
    user: account.user,
    raw: account,
  }
}
