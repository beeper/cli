import { Args, Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { notFound } from '../../lib/errors.js'
import { printData } from '../../lib/output.js'
import { builtInDesktopTargetID, listTargets, readConfig, type Target } from '../../lib/targets.js'

export default class ResolveTarget extends BeeperCommand {
  static override summary = 'Resolve a target selector'
  static override args = {
    selector: Args.string({ required: true, description: 'Target name, ID, type, or base URL' }),
  }
  static override flags = {
    pick: Flags.integer({ description: 'Select the Nth candidate (1-indexed)' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ResolveTarget)
    const config = await readConfig()
    const builtIn: Target = {
      id: builtInDesktopTargetID,
      type: 'desktop',
      name: 'Beeper Desktop',
      baseURL: process.env.BEEPER_DESKTOP_BASE_URL || config.baseURL || 'http://127.0.0.1:23373',
      auth: config.auth,
    }
    const targets = [builtIn, ...await listTargets()]
    const normalized = normalize(args.selector)
    const candidates = targets.filter(target =>
      normalize(target.id) === normalized ||
      normalize(target.name) === normalized ||
      normalize(target.type) === normalized ||
      normalize(target.baseURL).includes(normalized)
    )
    if (!candidates.length) throw notFound(`No target matches "${args.selector}"`, { selector: args.selector, kind: 'target' })
    const selected = flags.pick ? candidates[flags.pick - 1] : candidates.length === 1 ? candidates[0] : undefined
    if (flags.pick && !selected) throw notFound(`--pick ${flags.pick} is outside the ${candidates.length} matching targets`, { selector: args.selector, pick: flags.pick, count: candidates.length })
    await printData({
      selector: args.selector,
      kind: 'target',
      selected: selected ? targetCandidate(selected, candidates.indexOf(selected) + 1) : null,
      candidates: candidates.map((target, index) => targetCandidate(target, index + 1)),
    }, flags.json ? 'json' : 'human')
  }
}

function targetCandidate(target: Target, pick: number): Record<string, unknown> {
  return { pick, id: target.id, name: target.name, type: target.type, baseURL: target.baseURL, managed: target.managed, raw: target }
}

function normalize(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/[\s._-]+/g, '')
}
