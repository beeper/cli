import { Args, Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { notFound } from '../../lib/errors.js'
import { printData } from '../../lib/output.js'

export default class ResolveBridge extends BeeperCommand {
  static override summary = 'Resolve a bridge selector'
  static override args = {
    selector: Args.string({ required: true, description: 'Bridge ID, type, provider, or display name' }),
  }
  static override flags = {
    pick: Flags.integer({ description: 'Select the Nth candidate (1-indexed)' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ResolveBridge)
    const client = await createClient(flags)
    const response = await client.bridges.list()
    const rows = ((response as unknown as { items?: Array<Record<string, any>> }).items ?? [])
    const normalized = normalize(args.selector)
    const candidates = rows.filter(bridge =>
      normalize(bridge.id) === normalized ||
      normalize(bridge.type) === normalized ||
      normalize(bridge.provider) === normalized ||
      normalize(bridge.name) === normalized ||
      normalize(bridge.displayName) === normalized ||
      normalize(bridge.id).includes(normalized) ||
      normalize(bridge.displayName).includes(normalized)
    )
    if (!candidates.length) throw notFound(`No bridge matches "${args.selector}"`, { selector: args.selector, kind: 'bridge' })
    const selected = flags.pick ? candidates[flags.pick - 1] : candidates.length === 1 ? candidates[0] : undefined
    if (flags.pick && !selected) throw notFound(`--pick ${flags.pick} is outside the ${candidates.length} matching bridges`, { selector: args.selector, pick: flags.pick, count: candidates.length })
    await printData({
      selector: args.selector,
      kind: 'bridge',
      selected: selected ? bridgeCandidate(selected, candidates.indexOf(selected) + 1) : null,
      candidates: candidates.map((bridge, index) => bridgeCandidate(bridge, index + 1)),
    }, flags.json ? 'json' : 'human')
  }
}

function bridgeCandidate(bridge: Record<string, unknown>, pick: number): Record<string, unknown> {
  return { pick, id: bridge.id, type: bridge.type, provider: bridge.provider, displayName: bridge.displayName ?? bridge.name, status: bridge.status, raw: bridge }
}

function normalize(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/[\s._-]+/g, '')
}
