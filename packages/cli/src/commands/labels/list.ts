import { Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { listLabels } from '../../lib/labels.js'
import { printList } from '../../lib/output.js'

export default class LabelsList extends BeeperCommand {
  static override summary = 'List chat labels'
  static override description = 'List user-created labels that can be used to filter chat search.'
  static override flags = {
    ids: Flags.boolean({ default: false, description: 'Print only label IDs' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(LabelsList)
    const client = await createClient(flags)
    const labels = await listLabels(client)

    if (flags.ids) {
      for (const label of labels) process.stdout.write(`${label.id}\n`)
      return
    }

    await printList(labels, flags.json ? 'json' : 'human', {
      title: 'No labels found',
      subtitle: 'Create labels in Beeper, then use them with beeper chats search --label <name-or-id>.',
    })
  }
}
