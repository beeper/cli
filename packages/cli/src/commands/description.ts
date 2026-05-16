import { Args, Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../lib/command.js'
import { createClient } from '../lib/client.js'
import { cliCopy } from '../lib/copy.js'
import { printData } from '../lib/output.js'
import { resolveChatID } from '../lib/resolve.js'

export default class Description extends BeeperCommand {
  static override summary = 'Set or clear a group chat description'
  static override args = {
    chat: Args.string({ description: cliCopy.args.chatSelector, required: true }),
    description: Args.string({ description: 'New description. Omit with --clear to remove it.', required: false }),
  }

  static override flags = {
    clear: Flags.boolean({ default: false, description: 'Clear the current description' }),
    pick: Flags.integer({ description: cliCopy.flags.pick }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Description)
    ensureWritable(flags)
    if (flags.clear && args.description) throw new Error('Use either DESCRIPTION or --clear, not both')
    if (!flags.clear && !args.description) throw new Error('Provide DESCRIPTION or pass --clear')
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, args.chat, { pick: flags.pick })
    await printData(await client.chats.update(chatID, { description: flags.clear ? null : args.description }), flags.json ? 'json' : 'human')
  }
}
