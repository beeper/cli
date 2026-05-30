import React, { useEffect, useRef, useState } from 'react'
import { Box, render as inkRender, Static, Text, useApp, useInput } from 'ink'
import Spinner from 'ink-spinner'
import {
  AccountRow,
  AssetRow,
  AuthStatusCard,
  BridgeRow,
  ChatDetail,
  ChatRow,
  CommandsView,
  ConfigView,
  DoctorCard,
  EmptyState,
  FailureLine,
  GenericRow,
  InfoCard,
  MessageRow,
  ReadinessCard,
  SectionHeader,
  SendResultCard,
  type StreamEvent,
  StreamEventLine,
  StreamHeader,
  type Suggestion,
  SuccessLine,
  UserInfoCard,
  UserRow,
} from './components.js'
import type { RecordValue } from './format.js'
import { theme } from './theme.js'

const App: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { exit } = useApp()
  useEffect(() => {
    setTimeout(() => exit(), 0)
  }, [exit])
  return <>{children}</>
}

async function renderOnce(node: React.ReactNode): Promise<void> {
  const instance = inkRender(<App>{node}</App>, { exitOnCtrlC: false, patchConsole: false })
  await instance.waitUntilExit().catch(() => undefined)
}

type Kind =
  | 'chat' | 'chatDetail' | 'message' | 'user' | 'account' | 'bridge' | 'asset'
  | 'info' | 'doctor' | 'auth' | 'oauth' | 'search'
  | 'commandManifest' | 'config' | 'readiness' | 'sendResult'
  | 'generic'

function detectKind(record: RecordValue): Kind {
  if (typeof record.id === 'string' && typeof record.accountID === 'string' && typeof record.title === 'string' && typeof record.unreadCount === 'number') {
    if (record.participants && typeof record.participants === 'object') return 'chatDetail'
    return 'chat'
  }
  if (typeof record.id === 'string' && typeof record.chatID === 'string' && typeof record.senderID === 'string' && typeof record.timestamp === 'string') return 'message'
  if (typeof record.chatID === 'string' && typeof record.pendingMessageID === 'string' && (record.accepted === true || typeof record.state === 'string')) return 'sendResult'
  if (typeof record.id === 'string' && (typeof record.fullName === 'string' || typeof record.username === 'string' || typeof record.email === 'string' || typeof record.phoneNumber === 'string')) return 'user'
  if (typeof record.id === 'string' && typeof record.provider === 'string' && typeof record.status === 'string' && (typeof record.displayName === 'string' || Array.isArray(record.accounts))) return 'bridge'
  if (typeof (record.accountID ?? record.id) === 'string' && (typeof record.network === 'string' || typeof record.bridge === 'string' || typeof record.displayName === 'string')) return 'account'
  if (typeof record.uploadID === 'string' || typeof record.srcURL === 'string') return 'asset'
  if (typeof record.version === 'string' && typeof record.endpoints === 'object') return 'info'
  if (typeof record.ok === 'boolean' && Array.isArray(record.checks)) return 'doctor'
  if (typeof record.ok === 'boolean' && record.checks && typeof record.checks === 'object') return 'doctor'
  if (record.readiness && typeof record.readiness === 'object') return 'readiness'
  if (typeof record.state === 'string' && Array.isArray(record.actions)) return 'readiness'
  if (typeof record.authenticated === 'boolean' && typeof record.baseURL === 'string') return 'auth'
  if (typeof record.sub === 'string' && (typeof record.email === 'string' || typeof record.name === 'string' || typeof record.preferred_username === 'string')) return 'oauth'
  if (Array.isArray(record.chats) && Array.isArray(record.messages)) return 'search'
  return 'generic'
}

function isManifestList(items: unknown[]): items is Array<{ command: string; description: string; group?: string }> {
  return items.every(item =>
    item != null
    && typeof item === 'object'
    && typeof (item as Record<string, unknown>).command === 'string'
    && typeof (item as Record<string, unknown>).description === 'string',
  )
}

function rowFor(kind: Kind, item: RecordValue, key: number): React.ReactNode {
  switch (kind) {
    case 'chat': return <ChatRow item={item} key={key} />
    case 'chatDetail': return <ChatDetail item={item} key={key} />
    case 'message': return <MessageRow item={item} key={key} />
    case 'user': return <UserRow item={item} key={key} />
    case 'account': return <AccountRow item={item} key={key} />
    case 'bridge': return <BridgeRow item={item} key={key} />
    case 'asset': return <AssetRow item={item} key={key} />
    default: return <GenericRow item={item} key={key} />
  }
}

export async function renderList(items: RecordValue[], empty?: { title: string; subtitle?: string; suggestions?: Suggestion[] }): Promise<void> {
  if (!items.length) {
    if (empty) await renderOnce(<EmptyState title={empty.title} subtitle={empty.subtitle} suggestions={empty.suggestions} />)
    return
  }
  if (isManifestList(items)) {
    await renderOnce(<CommandsView items={items} />)
    return
  }
  const kind = detectKind(items[0]!)
  await renderOnce(
    <Box flexDirection="column">
      {items.map((item, index) => rowFor(kind === 'chatDetail' ? 'chat' : kind, item, index))}
    </Box>,
  )
}

export async function renderValue(value: unknown): Promise<void> {
  if (Array.isArray(value)) {
    await renderList(value as RecordValue[])
    return
  }
  if (!value || typeof value !== 'object') {
    if (value === undefined) return
    process.stdout.write(`${String(value)}\n`)
    return
  }
  const record = value as RecordValue
  const kind = detectKind(record)
  switch (kind) {
    case 'info':
      await renderOnce(<InfoCard info={record} />)
      return
    case 'doctor': {
      const checks = Array.isArray(record.checks)
        ? record.checks as Array<{ ok: boolean; name: string; detail?: string }>
        : record.checks && typeof record.checks === 'object'
          ? Object.entries(record.checks as Record<string, unknown>).map(([name, value]) => {
            const detail = typeof value === 'object' && value ? JSON.stringify(value) : String(value)
            const ok = name === 'readiness'
              ? (value as RecordValue)?.state === 'ready'
              : typeof (value as RecordValue)?.reachable === 'boolean'
                ? Boolean((value as RecordValue).reachable)
                : Boolean(value)
            return { ok, name, detail }
          })
          : []
      await renderOnce(<DoctorCard checks={checks} ok={Boolean(record.ok)} />)
      return
    }
    case 'auth':
      await renderOnce(<AuthStatusCard auth={record} />)
      return
    case 'oauth':
      await renderOnce(<UserInfoCard user={record} />)
      return
    case 'search': {
      const chats = Array.isArray(record.chats) ? record.chats as RecordValue[] : []
      const messages = Array.isArray(record.messages) ? record.messages as RecordValue[] : []
      if (!chats.length && !messages.length) {
        await renderOnce(
          <EmptyState
            title="Nothing matched your search"
            subtitle="Try a different query, account, or check spelling."
            suggestions={[
              { command: 'beeper chats', hint: 'browse everything' },
              { command: 'beeper chats search "<term>"', hint: 'narrow with filters' },
            ]}
          />,
        )
        return
      }
      await renderOnce(
        <Box flexDirection="column">
          {chats.length > 0 && <SectionHeader label="Chats" count={chats.length} />}
          {chats.map((item, index) => <ChatRow item={item} key={`c-${index}`} />)}
          {messages.length > 0 && <SectionHeader label="Messages" count={messages.length} />}
          {messages.map((item, index) => <MessageRow item={item} key={`m-${index}`} />)}
        </Box>,
      )
      return
    }
    case 'readiness':
      await renderOnce(<ReadinessCard data={record} />)
      return
    case 'sendResult':
      await renderOnce(<SendResultCard result={record} />)
      return
    case 'chat':
    case 'chatDetail':
      await renderOnce(<ChatDetail item={record} />)
      return
    case 'message':
      await renderOnce(<MessageRow item={record} />)
      return
    case 'user':
      await renderOnce(<UserRow item={record} />)
      return
    case 'account':
      await renderOnce(<AccountRow item={record} />)
      return
    case 'bridge':
      await renderOnce(<BridgeRow item={record} />)
      return
    case 'asset':
      await renderOnce(<AssetRow item={record} />)
      return
    default:
      await renderOnce(<GenericRow item={record} />)
  }
}

export async function renderEmptyState(opts: { title: string; subtitle?: string; suggestions?: Suggestion[] }): Promise<void> {
  await renderOnce(<EmptyState title={opts.title} subtitle={opts.subtitle} suggestions={opts.suggestions} />)
}

export async function renderSuccess(opts: { message: string; detail?: string; entity?: unknown }): Promise<void> {
  let entityNode: React.ReactNode = null
  if (opts.entity && typeof opts.entity === 'object') {
    const record = opts.entity as RecordValue
    const kind = detectKind(record)
    entityNode = rowFor(kind === 'chatDetail' ? 'chat' : kind, record, 0)
  }
  await renderOnce(<SuccessLine message={opts.message} detail={opts.detail} entity={entityNode} />)
}

export async function renderFailure(opts: { message: string; detail?: string }): Promise<void> {
  await renderOnce(<FailureLine message={opts.message} detail={opts.detail} />)
}

export async function renderConfig(data: RecordValue): Promise<void> {
  await renderOnce(<ConfigView data={data} />)
}

export async function renderCommands(items: Array<{ command: string; description: string; group?: string }>, opts?: { title?: string; intro?: string[] }): Promise<void> {
  await renderOnce(<CommandsView items={items} title={opts?.title} intro={opts?.intro} />)
}

// ─── streaming render (used by `watch`) ───────────────────────────────────────

export type StreamController = {
  push(event: StreamEvent): void
  setConnected(connected: boolean): void
  setStatus(status: string | undefined): void
  close(): Promise<void>
  done: Promise<void>
}

type StreamState = {
  events: StreamEvent[]
  connected: boolean
  status: string | undefined
}

type StreamProps = {
  initialState: StreamState
  baseURL: string
  subscribed: string[]
  bind: (api: { update: (next: StreamState) => void; exit: () => void; onInterrupt: (fn: () => void) => void }) => void
}

const StreamView: React.FC<StreamProps> = ({ initialState, baseURL, subscribed, bind }) => {
  const [state, setState] = useState<StreamState>(initialState)
  const { exit } = useApp()
  const interruptRef = useRef<(() => void) | undefined>(undefined)

  useEffect(() => {
    bind({
      update: setState,
      exit: () => exit(),
      onInterrupt: fn => { interruptRef.current = fn },
    })
  }, [bind, exit])

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      interruptRef.current?.()
    }
  })

  return (
    <Box flexDirection="column">
      <StreamHeader subscribed={subscribed} baseURL={baseURL} connected={state.connected} />
      <Static items={state.events.map((event, index) => ({ event, index: index + 1 }))}>
        {({ event, index }) => <StreamEventLine event={event} index={index} key={index} />}
      </Static>
      {!state.connected && state.status && (
        <Box>
          <Text color={theme.warn}><Spinner type="dots" /></Text>
          <Text color={theme.muted}>  {state.status}</Text>
        </Box>
      )}
    </Box>
  )
}

export function renderStream(opts: { baseURL: string; subscribed: string[] }): StreamController {
  const initial: StreamState = { events: [], connected: false, status: 'connecting' }
  let current = initial
  let api: { update: (next: StreamState) => void; exit: () => void; onInterrupt: (fn: () => void) => void } | undefined
  const interruptHandlers: Array<() => void> = []

  const setState = (next: StreamState): void => {
    current = next
    api?.update(next)
  }

  const instance = inkRender(
    <StreamView
      initialState={initial}
      baseURL={opts.baseURL}
      subscribed={opts.subscribed}
      bind={hooks => {
        api = hooks
        hooks.onInterrupt(() => {
          for (const fn of interruptHandlers) fn()
        })
      }}
    />,
    { exitOnCtrlC: false, patchConsole: false },
  )

  return {
    push(event) {
      setState({ ...current, events: [...current.events, event] })
    },
    setConnected(connected) {
      setState({ ...current, connected, status: connected ? undefined : current.status })
    },
    setStatus(status) {
      setState({ ...current, status })
    },
    async close() {
      api?.exit()
      await instance.waitUntilExit().catch(() => undefined)
    },
    get done() {
      return instance.waitUntilExit().then(() => undefined)
    },
  }
}

export type { Suggestion, StreamEvent }
