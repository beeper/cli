import { setTimeout as delay } from 'node:timers/promises'
import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../lib/command.js'
import { createClient } from '../lib/client.js'
import { printDryRun, printSuccess } from '../lib/output.js'
import { resolveChatID } from '../lib/resolve.js'

export default class Presence extends BeeperCommand {
  static override summary = 'Send a typing (or paused) indicator to a chat'
  static override description = 'Requires server-side support. Networks without typing notifications return an error.'
  static override flags = {
    chat: Flags.string({ required: true, description: 'Chat selector (ID, local ID, title, or search text)' }),
    pick: Flags.integer({ description: 'Pick the Nth result when the selector is ambiguous (1-indexed)' }),
    state: Flags.string({ default: 'typing', options: ['typing', 'paused'], description: 'Indicator to send' }),
    duration: Flags.integer({ description: 'When --state is typing, send paused automatically after this many seconds' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Presence)
    if (flags.duration !== undefined && flags.duration <= 0) throw new Error('--duration must be a positive integer (seconds)')
    if (flags.duration !== undefined && flags.state !== 'typing') throw new Error('--duration only applies when --state is typing')
    if (flags['dry-run']) {
      await printDryRun('presence', { chat: flags.chat, pick: flags.pick, state: flags.state, durationSeconds: flags.duration }, flags.json ? 'json' : 'human')
      return
    }
    ensureWritable(flags)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    const post = (state: 'typing' | 'paused') =>
      client.post(`/v1/chats/${encodeURIComponent(chatID)}/typing`, { body: { state } })

    await post(flags.state as 'typing' | 'paused')
    if (flags.duration !== undefined) {
      await delay(flags.duration * 1000)
      await post('paused')
      await printSuccess({ message: `Sent typing then paused after ${flags.duration}s`, data: { chatID, state: 'paused', durationSeconds: flags.duration } }, flags.json ? 'json' : 'human')
      return
    }
    await printSuccess({ message: `Sent ${flags.state} indicator`, data: { chatID, state: flags.state } }, flags.json ? 'json' : 'human')
  }
}
