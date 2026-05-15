import { Command, Flags } from '@oclif/core'
import { requireToken } from '../lib/client.js'
import { getBaseURL } from '../lib/config.js'
import { startStream } from '../lib/output.js'

export default class Watch extends Command {
  static override summary = 'Stream Desktop API WebSocket events'
  static override flags = {
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    chat: Flags.string({ char: 'c', multiple: true, description: 'Chat ID to subscribe to. Defaults to all chats.' }),
    json: Flags.boolean({ default: false, description: 'Print raw JSON, one event per line' }),
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

    const subscribed = flags.chat?.length ? flags.chat : ['*']
    const ws = new WebSocket(url, { headers: { Authorization: `Bearer ${token}` } } as unknown as string[])

    if (flags.json) {
      await this.runJSON(ws, subscribed)
      return
    }
    await this.runHuman(ws, subscribed, baseURL)
  }

  private async runJSON(ws: WebSocket, subscribed: string[]): Promise<void> {
    ws.addEventListener('open', () => ws.send(JSON.stringify({ type: 'subscriptions.set', chatIDs: subscribed })))
    ws.addEventListener('message', event => {
      const data = typeof event.data === 'string' ? event.data : event.data.toString()
      process.stdout.write(`${data}\n`)
    })
    ws.addEventListener('error', () => this.error('WebSocket connection failed', { exit: 1 }))
    ws.addEventListener('close', event => {
      if (event.code !== 1000) this.error(`WebSocket closed: ${event.code} ${event.reason}`, { exit: 1 })
    })
    await new Promise<void>(resolve => {
      process.once('SIGINT', () => { ws.close(1000); resolve() })
      ws.addEventListener('close', () => resolve())
    })
  }

  private async runHuman(ws: WebSocket, subscribed: string[], baseURL: string): Promise<void> {
    const stream = await startStream({ baseURL, subscribed })
    let closed = false

    const finish = async (): Promise<void> => {
      if (closed) return
      closed = true
      try { ws.close(1000) } catch { /* ignore */ }
      await stream.close()
    }

    ws.addEventListener('open', () => {
      stream.setConnected(true)
      ws.send(JSON.stringify({ type: 'subscriptions.set', chatIDs: subscribed }))
    })
    ws.addEventListener('message', event => {
      const data = typeof event.data === 'string' ? event.data : event.data.toString()
      try {
        const parsed = JSON.parse(data) as Record<string, unknown>
        stream.push({
          type: typeof parsed.type === 'string' ? parsed.type : 'event',
          chatID: typeof parsed.chatID === 'string' ? parsed.chatID : undefined,
          messageID: typeof parsed.messageID === 'string' ? parsed.messageID : undefined,
          ts: typeof parsed.timestamp === 'string' ? parsed.timestamp : new Date().toISOString(),
        })
      } catch {
        stream.push({ type: 'raw', ts: new Date().toISOString() })
      }
    })
    ws.addEventListener('error', () => {
      stream.setConnected(false)
      stream.setStatus('connection error')
    })
    ws.addEventListener('close', event => {
      stream.setConnected(false)
      if (event.code !== 1000) stream.setStatus(`closed ${event.code}${event.reason ? ` ${event.reason}` : ''}`)
      void finish()
    })
    process.once('SIGINT', () => { void finish() })

    await stream.done
  }
}
