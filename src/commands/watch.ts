import { Command, Flags } from '@oclif/core'
import { requireToken } from '../lib/client.js'
import { getBaseURL } from '../lib/config.js'

export default class Watch extends Command {
  static override summary = 'Stream Desktop API WebSocket events'
  static override flags = {
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    chat: Flags.string({ char: 'c', multiple: true, description: 'Chat ID to subscribe to. Defaults to all chats.' }),
    json: Flags.boolean({ default: false, description: 'Print raw JSON' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Watch)
    const token = await requireToken()
    const baseURL = await getBaseURL(flags['base-url'])
    const info = await fetch(new URL('/v1/info', baseURL))
    if (!info.ok) throw new Error(`Failed to fetch /v1/info: HTTP ${info.status}`)
    const metadata = await info.json() as { endpoints?: { ws_events?: string } }
    const endpoint = metadata.endpoints?.ws_events || '/v1/ws'
    const url = new URL(endpoint, baseURL)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'

    const ws = new WebSocket(url, { headers: { Authorization: `Bearer ${token}` } } as unknown as string[])
    const chatIDs = flags.chat?.length ? flags.chat : ['*']

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ type: 'subscriptions.set', chatIDs }))
    })

    ws.addEventListener('message', event => {
      const data = typeof event.data === 'string' ? event.data : event.data.toString()
      if (flags.json) {
        this.log(data)
        return
      }

      try {
        const parsed = JSON.parse(data) as Record<string, unknown>
        const type = parsed.type ? String(parsed.type) : 'event'
        const chatID = parsed.chatID ? ` ${String(parsed.chatID)}` : ''
        const messageID = parsed.messageID ? ` ${String(parsed.messageID)}` : ''
        this.log(`${type}${chatID}${messageID}`)
      } catch {
        this.log(data)
      }
    })

    ws.addEventListener('error', () => {
      this.error('WebSocket connection failed', { exit: 1 })
    })

    ws.addEventListener('close', event => {
      if (event.code !== 1000) this.error(`WebSocket closed: ${event.code} ${event.reason}`, { exit: 1 })
    })

    await new Promise<void>(resolve => {
      process.once('SIGINT', () => {
        ws.close(1000)
        resolve()
      })
      ws.addEventListener('close', () => resolve())
    })
  }
}
