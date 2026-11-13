import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData } from '../../lib/output.js'
import { resolveSendChatID, sendMessage } from '../../lib/send-message.js'

export default class SendText extends BeeperCommand {
  static override summary = 'Send a text message'
  static override description = 'Returns when Desktop accepts the send request. Pass `--wait` to wait until the message leaves the pending state or fails.'
  static override examples = [
    'beeper send text --to 10313 --message "On my way"',
    'beeper send text --account iMessage --to +15551234567 --message "Checking in"',
    'beeper send text --to 8951 --message "See @alice" --mention alice@whatsapp',
    'beeper send text --to alice@whatsapp --message "Got it" --reply-to <msgID>',
  ]
  static override flags = {
    to: Flags.string({ required: true, description: 'Chat selector, or recipient phone/email/name when --account is used' }),
    account: Flags.string({ description: 'Account selector; when set, resolve or start a direct chat for --to on this account' }),
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
    const chatID = await resolveSendChatID(client, { to: flags.to, pick: flags.pick, account: flags.account })
    await printData(await sendMessage(client, { chatID, text: flags.message, replyTo: flags['reply-to'], mentions: flags.mention, noPreview: flags['no-preview'], wait: flags.wait, waitTimeoutMs: flags['wait-timeout'] }), flags.json ? 'json' : 'human')
  }
}
