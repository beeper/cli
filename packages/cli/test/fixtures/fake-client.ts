/**
 * Lightweight fake of the @beeper/desktop-api client. Shape matches what
 * commands actually call. Pass per-test overrides to swap individual methods.
 */
import { mock } from 'bun:test'

type Mock = ReturnType<typeof mock>

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
      list: mock(async () => []),
      contacts: { list: mock(() => empty()), search: mock(async () => ({ items: [] })) },
      ...overrides.accounts,
    },
    chats: {
      list: mock(() => empty()),
      retrieve: mock(async (id: string) => ({ id })),
      search: mock(() => empty()),
      update: mock(async (id: string, body: any) => ({ id, ...body })),
      archive: mock(async () => ({})),
      markRead: mock(async () => ({})),
      markUnread: mock(async () => ({})),
      notifyAnyway: mock(async () => ({})),
      start: mock(async () => ({ chatID: '!new:beeper.com' })),
      messages: { reactions: { add: mock(async () => ({})), delete: mock(async () => ({})) } },
      reminders: { create: mock(async () => ({})), delete: mock(async () => ({})) },
      ...overrides.chats,
    },
    messages: {
      list: mock(() => empty()),
      search: mock(() => empty()),
      retrieve: mock(async (id: string) => ({ id })),
      send: mock(async () => ({ pendingMessageID: 'pending-1' })),
      update: mock(async (id: string) => ({ id })),
      delete: mock(async () => undefined),
      ...overrides.messages,
    },
    assets: { upload: mock(async () => ({ uploadID: 'upload-1', mimeType: 'application/octet-stream' })), serve: mock(async () => ({ arrayBuffer: async () => new ArrayBuffer(0) })), ...overrides.assets },
    bridges: { list: mock(async () => ({ items: [] })), loginFlows: { list: mock(async () => ({ items: [] })) }, loginSessions: { create: mock(async () => ({})) }, ...overrides.bridges },
    app: overrides.app ?? {},
    post: mock(async () => ({})),
    get: mock(async () => ({})),
    put: mock(async () => ({})),
    delete: mock(async () => ({})),
    focus: mock(async () => ({})),
    ...overrides,
  }
}

export function chatsPage(items: FakeChat[]) {
  return async function* () { for (const it of items) yield it }()
}

export function messagesPage(items: FakeMessage[]) {
  return async function* () { for (const it of items) yield it }()
}
