/**
 * Lightweight fake of the @beeper/desktop-api client. Shape matches what
 * commands actually call. Pass per-test overrides to swap individual methods.
 */
import { vi, type Mock } from 'vitest'

export type FakeChat = {
  id: string
  accountID?: string
  title?: string
  localChatID?: string
  network?: string
  isArchived?: boolean
  isPinned?: boolean
  isMuted?: boolean
  isLowPriority?: boolean
  isMarkedUnread?: boolean
  unreadCount?: number
  type?: 'single' | 'group'
}

export type FakeMessage = {
  id: string
  chatID: string
  text?: string
  isSender?: boolean
  senderID?: string
  timestamp?: string
  type?: string
}

export type FakeClient = {
  accounts: {
    list: Mock
    contacts: { list: Mock; search: Mock }
    retrieve?: Mock
  }
  chats: {
    list: Mock
    retrieve: Mock
    search: Mock
    update: Mock
    archive: Mock
    markRead: Mock
    markUnread: Mock
    notifyAnyway: Mock
    start: Mock
    messages: { reactions: { add: Mock; delete: Mock } }
    reminders: { create: Mock; delete: Mock }
  }
  messages: {
    list: Mock
    search: Mock
    retrieve: Mock
    send: Mock
    update: Mock
    delete: Mock
  }
  assets: { upload: Mock; serve: Mock }
  bridges: { list: Mock; loginFlows: { list: Mock }; loginSessions: { create: Mock } }
  app: any
  post: Mock
  get: Mock
  put: Mock
  delete: Mock
  focus: Mock
}

export function makeFakeClient(overrides: Partial<FakeClient> = {}): FakeClient {
  const empty = <T>() => async function* () {}() as AsyncIterable<T>
  const okPage = <T>(items: T[]) => async function* () { for (const it of items) yield it }() as AsyncIterable<T>

  return {
    accounts: {
      list: vi.fn(async () => []),
      contacts: { list: vi.fn(() => empty()), search: vi.fn(async () => ({ items: [] })) },
      ...overrides.accounts,
    },
    chats: {
      list: vi.fn(() => empty()),
      retrieve: vi.fn(async (id: string) => ({ id })),
      search: vi.fn(() => empty()),
      update: vi.fn(async (id: string, body: any) => ({ id, ...body })),
      archive: vi.fn(async () => ({})),
      markRead: vi.fn(async () => ({})),
      markUnread: vi.fn(async () => ({})),
      notifyAnyway: vi.fn(async () => ({})),
      start: vi.fn(async () => ({ chatID: '!new:beeper.com' })),
      messages: { reactions: { add: vi.fn(async () => ({})), delete: vi.fn(async () => ({})) } },
      reminders: { create: vi.fn(async () => ({})), delete: vi.fn(async () => ({})) },
      ...overrides.chats,
    },
    messages: {
      list: vi.fn(() => empty()),
      search: vi.fn(() => empty()),
      retrieve: vi.fn(async (id: string) => ({ id })),
      send: vi.fn(async () => ({ pendingMessageID: 'pending-1' })),
      update: vi.fn(async (id: string) => ({ id })),
      delete: vi.fn(async () => undefined),
      ...overrides.messages,
    },
    assets: { upload: vi.fn(async () => ({ uploadID: 'upload-1', mimeType: 'application/octet-stream' })), serve: vi.fn(async () => ({ arrayBuffer: async () => new ArrayBuffer(0) })), ...overrides.assets },
    bridges: { list: vi.fn(async () => ({ items: [] })), loginFlows: { list: vi.fn(async () => ({ items: [] })) }, loginSessions: { create: vi.fn(async () => ({})) }, ...overrides.bridges },
    app: overrides.app ?? {},
    post: vi.fn(async () => ({})),
    get: vi.fn(async () => ({})),
    put: vi.fn(async () => ({})),
    delete: vi.fn(async () => ({})),
    focus: vi.fn(async () => ({})),
    ...overrides,
  }
}

export function chatsPage(items: FakeChat[]) {
  return async function* () { for (const it of items) yield it }()
}

export function messagesPage(items: FakeMessage[]) {
  return async function* () { for (const it of items) yield it }()
}
