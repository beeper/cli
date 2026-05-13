import { Args, Command, Flags } from '@oclif/core'
import { createClient } from '../lib/client.js'
import { apiCopy, cliCopy, sdkParamCopy } from '../lib/copy.js'
import { printData } from '../lib/output.js'
import { resolveChatID } from '../lib/resolve.js'

export default class Edit extends Command {
  static override summary = apiCopy.messages.update
  static override args = {
    chat: Args.string({ description: cliCopy.args.chatSelector, required: true }),
    message: Args.string({ description: sdkParamCopy.messageID, required: true }),
    text: Args.string({ description: sdkParamCopy.text, required: true }),
  }
  static override flags = {
    'base-url': Flags.string({ description: cliCopy.flags.baseURL }),
    debug: Flags.boolean({ default: false }),
    json: Flags.boolean({ default: false, description: cliCopy.flags.json }),
    pick: Flags.integer({ description: cliCopy.flags.pick }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Edit)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, args.chat, { pick: flags.pick })
    const result = await client.messages.update(args.message, {
      chatID,
      text: args.text,
    })
    printData(result, flags.json ? 'json' : 'human')
  }
}
