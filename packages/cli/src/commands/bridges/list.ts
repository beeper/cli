import { Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printList } from '../../lib/output.js'

export default class BridgesList extends BeeperCommand {
  static override summary = 'List bridges that can connect chat accounts'
  static override flags = {
    provider: Flags.string({ options: ['local', 'cloud', 'self-hosted'], description: 'Limit to bridge provider' }),
    available: Flags.boolean({ allowNo: true, description: 'Only bridges available to add (--no-available to exclude)' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(BridgesList)
    const client = await createClient(flags)
    const response = await client.bridges.list()
    const items = ((response as unknown as { items?: Array<Record<string, unknown>> }).items ?? [])
      .filter(item => !flags.provider || item.provider === flags.provider)
      .filter(item => flags.available === undefined || (item.status === 'available') === flags.available)

    await printList(items, flags.json ? 'json' : 'human', {
      title: 'No bridges matched',
      subtitle: 'Try removing provider or availability filters.',
      suggestions: [{ command: 'beeper accounts add', hint: 'choose a bridge to connect an account' }],
    })
  }
}
