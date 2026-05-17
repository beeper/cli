import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { sendMatrixText, shouldFallbackToMatrix } from '../../lib/matrix-direct.js'
import { printData } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'
import { sendMessage } from '../../lib/send-message.js'

export default class SendText extends BeeperCommand {
  static override summary = 'Send text'
  static override flags = {
    to: Flags.string({ required: true, description: 'Chat selector (ID, local ID, title, or search text)' }),
    message: Flags.string({ required: true, description: 'Message text to send' }),
    pick: Flags.integer({ description: 'Pick the Nth chat when --to is ambiguous' }),
    'reply-to': Flags.string({ description: 'Send as a reply to this message ID' }),
    mention: Flags.string({ multiple: true, description: 'User ID to @-mention (repeatable)' }),
    'no-preview': Flags.boolean({ default: false, description: 'Disable automatic link preview for URLs in the message' }),
    wait: Flags.boolean({ default: false, description: 'Wait for the message to leave the pending state (or fail) before returning' }),
    'wait-timeout': Flags.integer({ default: 30_000, description: 'Maximum wait time in ms when --wait is set' }),
  }
  async run(): Promise<void> {
    const { flags } = await this.parse(SendText)
    ensureWritable(flags)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.to, { pick: flags.pick })
    try {
      await printData(await sendMessage(client, { chatID, text: flags.message, replyTo: flags['reply-to'], mentions: flags.mention, noPreview: flags['no-preview'], wait: flags.wait, waitTimeoutMs: flags['wait-timeout'] }), flags.json ? 'json' : 'human')
    } catch (error) {
      if (!shouldFallbackToMatrix(chatID, error)) throw error
      await printData(await sendMatrixText(flags, chatID, flags.message), flags.json ? 'json' : 'human')
    }
  }
}
