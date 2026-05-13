import { Args, Command, Flags } from '@oclif/core'
import { createClient } from '../lib/client.js'
import { printData } from '../lib/output.js'
import { resolveChatID } from '../lib/resolve.js'

export default class Focus extends Command {
  static override summary = 'Focus Beeper Desktop, optionally opening a chat or message'
  static override args = {
    chat: Args.string({ description: 'Chat ID, local chat ID, title, or search text', required: false }),
    message: Args.string({ description: 'Message ID', required: false }),
  }
  static override flags = {
    attachment: Flags.string({ description: 'Draft attachment path' }),
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    debug: Flags.boolean({ default: false }),
    draft: Flags.string({ description: 'Draft text' }),
    json: Flags.boolean({ default: false, description: 'Print JSON' }),
    pick: Flags.integer({ description: 'Pick the Nth chat when the input is ambiguous' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Focus)
    const client = await createClient(flags)
    const chatID = args.chat ? await resolveChatID(client, args.chat, { pick: flags.pick }) : undefined
    const result = await client.focus({
      chatID,
      draftAttachmentPath: flags.attachment,
      draftText: flags.draft,
      messageID: args.message,
    })
    printData(result, flags.json ? 'json' : 'human')
  }
}
