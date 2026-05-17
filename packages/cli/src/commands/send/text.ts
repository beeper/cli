import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { sendMatrixText, shouldFallbackToMatrix } from '../../lib/matrix-direct.js'
import { printData } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'
import { sendMessage } from '../../lib/send-message.js'

export default class SendText extends BeeperCommand {
  static override summary = 'Send text'
  static override flags = { to: Flags.string({ required: true }), message: Flags.string({ required: true }), pick: Flags.integer(), 'reply-to': Flags.string(), wait: Flags.boolean({ default: false }), 'wait-interval': Flags.integer({ default: 750 }), 'wait-timeout': Flags.integer({ default: 30000 }) }
  async run(): Promise<void> {
    const { flags } = await this.parse(SendText)
    ensureWritable(flags)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.to, { pick: flags.pick })
    try {
      await printData(await sendMessage(client, { chatID, text: flags.message, replyTo: flags['reply-to'], wait: flags.wait, waitIntervalMs: flags['wait-interval'], waitTimeoutMs: flags['wait-timeout'] }), flags.json ? 'json' : 'human')
    } catch (error) {
      if (!shouldFallbackToMatrix(chatID, error)) throw error
      await printData(await sendMatrixText(flags, chatID, flags.message), flags.json ? 'json' : 'human')
    }
  }
}
