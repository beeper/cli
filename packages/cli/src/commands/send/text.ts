import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { sendMatrixText, shouldFallbackToMatrix } from '../../lib/matrix-direct.js'
import { printData } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'
import { sendMessage } from '../../lib/send-message.js'

export default class SendText extends BeeperCommand {
  static override summary = 'Send a text message'
  static override description = 'Returns when Desktop accepts the send request. Pass `--wait` to wait until the message leaves the pending state or fails.'
  static override examples = [
    'beeper send text --to 10313 --message "On my way"',
    'beeper send text --to "Team Chat" --message "See @alice" --mention alice@whatsapp',
    'beeper send text --to alice@whatsapp --message "Got it" --reply-to <msgID>',
  ]
  static override flags = {
    to: Flags.string({ required: true, description: 'Chat selector (ID, local ID, title, or search text)' }),
    message: Flags.string({ required: true, description: 'Message text to send' }),
    pick: Flags.integer({ description: 'Pick the Nth result when the selector is ambiguous (1-indexed)' }),
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
