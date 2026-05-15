import React from 'react'
import { Box, Text } from 'ink'
import { bridgeColor, glyphs, senderColor, theme } from './theme.js'

// OSC 8 hyperlink — modern terminals (iTerm, Ghostty, WezTerm, VS Code, etc.)
// render this as clickable; everything else ignores the escapes and shows the
// label text once.
const supportsHyperlinks = process.stdout.isTTY && process.env.TERM !== 'dumb'
const OSC8_START = ']8;;'
const OSC8_END = ']8;;'
const BEL = ''
const Hyperlink: React.FC<{ url: string; children?: React.ReactNode }> = ({ url, children }) => {
  if (!supportsHyperlinks) return <>{children ?? url}</>
  return <Text>{OSC8_START}{url}{BEL}{children ?? url}{OSC8_END}</Text>
}

import {
  attachmentLabel,
  chatPreview,
  compact,
  formatBytes,
  formatDuration,
  formatTime,
  isArchived,
  isLowPriority,
  isMuted,
  isPinned,
  messageText,
  participantsSummary,
  type RecordValue,
  shortID,
  stringValue,
} from './format.js'

// ─── primitives ────────────────────────────────────────────────────────────────

export const Rail: React.FC<{ color: string }> = ({ color }) => (
  <Text color={color}>{glyphs.rail}</Text>
)

export const Hairline: React.FC<{ width?: number }> = ({ width = 60 }) => (
  <Text color={theme.hairline}>{glyphs.hairline.repeat(width)}</Text>
)

export const Meta: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text color={theme.muted}>{children}</Text>
)

export const Dim: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text color={theme.subtle}>{children}</Text>
)

export const KV: React.FC<{ label: string; value: React.ReactNode; tone?: 'normal' | 'muted' | 'dim'; width?: number }> =
  ({ label, value, tone = 'normal', width = 12 }) => {
    const valueColor = tone === 'dim' ? theme.subtle : tone === 'muted' ? theme.muted : theme.text
    return (
      <Box marginLeft={2}>
        <Text color={theme.subtle}>{label.padEnd(width)}</Text>
        <Text color={valueColor}>{value}</Text>
      </Box>
    )
  }

export const Pill: React.FC<{ color: string; children: React.ReactNode; muted?: boolean }> = ({ color, children, muted }) => (
  <Text color={muted ? theme.subtle : color} bold={!muted}>
    {children}
  </Text>
)

export type Suggestion = { command: string; hint?: string }

export const Suggestions: React.FC<{ suggestions?: Suggestion[]; label?: string }> = ({ suggestions, label = 'Try' }) => {
  if (!suggestions?.length) return null
  return (
    <Box flexDirection="column" marginTop={1}>
      <Text color={theme.subtle}>{label}</Text>
      {suggestions.map(s => (
        <Box key={s.command}>
          <Text color={theme.primary}>  {glyphs.arrow} </Text>
          <Text color={theme.primaryGlow}>{s.command}</Text>
          {s.hint && <Text color={theme.muted}>  — {s.hint}</Text>}
        </Box>
      ))}
    </Box>
  )
}

// ─── empty / success / failure ────────────────────────────────────────────────

export const EmptyState: React.FC<{ title: string; subtitle?: string; suggestions?: Suggestion[] }> = ({ title, subtitle, suggestions }) => (
  <Box flexDirection="column">
    <Box>
      <Rail color={theme.subtle} />
      <Text> </Text>
      <Text bold color={theme.text}>{title}</Text>
    </Box>
    {subtitle && (
      <Box marginLeft={2}>
        <Text color={theme.muted}>{subtitle}</Text>
      </Box>
    )}
    <Suggestions suggestions={suggestions} />
  </Box>
)

export const SuccessLine: React.FC<{ message: string; detail?: string; entity?: React.ReactNode }> = ({ message, detail, entity }) => (
  <Box flexDirection="column">
    <Box>
      <Text color={theme.mine}>{glyphs.check}</Text>
      <Text> </Text>
      <Text bold color={theme.text}>{message}</Text>
      {detail && <Text color={theme.muted}>  {detail}</Text>}
    </Box>
    {entity && (
      <Box marginLeft={2} marginTop={1}>
        {entity}
      </Box>
    )}
  </Box>
)

export const FailureLine: React.FC<{ message: string; detail?: string }> = ({ message, detail }) => (
  <Box>
    <Text color={theme.danger}>{glyphs.cross}</Text>
    <Text> </Text>
    <Text bold color={theme.text}>{message}</Text>
    {detail && <Text color={theme.muted}>  {detail}</Text>}
  </Box>
)

export const SectionHeader: React.FC<{ label: string; count?: number }> = ({ label, count }) => (
  <Box marginTop={1}>
    <Text color={theme.subtle}>{label.toUpperCase()}</Text>
    {count != null && <Text color={theme.subtle}>  {count}</Text>}
  </Box>
)

// ─── domain rows ───────────────────────────────────────────────────────────────

type RowProps<T> = { item: T }

function chatRailColor(chat: RecordValue, unread: number, mentions: number): string {
  if (mentions > 0) return theme.mention
  if (unread > 0) return theme.primary
  if (isPinned(chat)) return theme.warn
  const tint = bridgeColor(stringValue(chat.network))
  return tint ?? theme.subtle
}

export const ChatRow: React.FC<RowProps<RecordValue>> = ({ item: chat }) => {
  const unread = Number(chat.unreadCount ?? 0)
  const mentions = Number(chat.unreadMentionsCount ?? 0)
  const muted = isMuted(chat)
  const pinned = isPinned(chat)
  const archived = isArchived(chat)
  const lowPriority = isLowPriority(chat)
  const preview = chatPreview(chat)
  const lastActivity = formatTime(chat.lastActivity)
  const network = stringValue(chat.network)
  const tint = bridgeColor(network)
  const railColor = chatRailColor(chat, unread, mentions)

  const titleNode = (
    <Text bold={unread > 0} color={muted ? theme.muted : theme.text}>{String(chat.title)}</Text>
  )

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Rail color={railColor} />
        <Text> </Text>
        {titleNode}
        {network && <Text color={tint ?? theme.subtle}>  {network.toLowerCase()}</Text>}
        {pinned && <Text color={theme.warn}>  {glyphs.pin}</Text>}
        {muted && <Text color={theme.magenta}>  {glyphs.mute}</Text>}
        {archived && <Text color={theme.subtle}>  {glyphs.archive}</Text>}
        {lowPriority && <Text color={theme.subtle}>  {glyphs.lowPriority}</Text>}
        <Box flexGrow={1} />
        {mentions > 0 && (
          <Text color={theme.mention} bold>  {glyphs.mention}{mentions}</Text>
        )}
        {unread > 0 && (
          <Text color={muted ? theme.subtle : theme.primary} bold={!muted}>
            {' '}{unread}{mentions > 0 ? '' : ` unread`}
          </Text>
        )}
        {lastActivity && (
          <Text color={theme.subtle}>  {lastActivity}</Text>
        )}
      </Box>
      {preview && (
        <Box marginLeft={2}>
          {preview.kind === 'draft' ? (
            <Text>
              <Text italic color={theme.draft}>draft</Text>
              <Text color={theme.muted}>{preview.text ? `  ${preview.text}` : ''}</Text>
            </Text>
          ) : (
            <Text color={theme.muted}>
              {preview.sender ? <Text color={theme.subtle}>{preview.sender}  </Text> : null}
              {preview.text}
            </Text>
          )}
        </Box>
      )}
      <Box marginLeft={2}>
        <Text color={theme.subtle}>{String(chat.id)}</Text>
      </Box>
    </Box>
  )
}

export const ChatDetail: React.FC<RowProps<RecordValue>> = ({ item: chat }) => {
  const unread = Number(chat.unreadCount ?? 0)
  const mentions = Number(chat.unreadMentionsCount ?? 0)
  const participants = chat.participants && typeof chat.participants === 'object' ? chat.participants as RecordValue : undefined
  const items = Array.isArray(participants?.items) ? participants!.items as RecordValue[] : []
  const network = stringValue(chat.network)
  const tint = bridgeColor(network)

  return (
    <Box flexDirection="column">
      <Box>
        <Rail color={chatRailColor(chat, unread, mentions)} />
        <Text> </Text>
        <Text bold color={theme.text}>{String(chat.title)}</Text>
        {network && <Text color={tint ?? theme.subtle}>  {network.toLowerCase()}</Text>}
        {isPinned(chat) && <Text color={theme.warn}>  {glyphs.pin} pinned</Text>}
        {isMuted(chat) && <Text color={theme.magenta}>  {glyphs.mute} muted</Text>}
        {isArchived(chat) && <Text color={theme.subtle}>  {glyphs.archive} archived</Text>}
        {isLowPriority(chat) && <Text color={theme.subtle}>  {glyphs.lowPriority} low-priority</Text>}
      </Box>
      {chat.type ? <KV label="type" value={String(chat.type)} tone="muted" /> : null}
      {chat.lastActivity ? <KV label="last" value={formatTime(chat.lastActivity) ?? String(chat.lastActivity)} tone="muted" /> : null}
      {unread > 0 && <KV label="unread" value={`${unread}${mentions > 0 ? ` (${mentions} @)` : ''}`} />}
      {participants && (
        <KV label="people" value={participantsSummary(participants) ?? `${items.length}`} tone="muted" />
      )}
      {items.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Box marginLeft={2}><Text color={theme.subtle}>PARTICIPANTS</Text></Box>
          {items.slice(0, 20).map((p, i) => (
            <Box key={i} marginLeft={2}>
              <Text color={senderColor(stringValue(p.id))}>{glyphs.bullet}</Text>
              <Text>  </Text>
              <Text color={theme.text}>{stringValue(p.fullName) ?? stringValue(p.username) ?? shortID(String(p.id))}</Text>
              {p.isSelf ? <Text color={theme.mine}>  you</Text> : null}
            </Box>
          ))}
          {items.length > 20 && <Box marginLeft={2}><Text color={theme.subtle}>… {items.length - 20} more</Text></Box>}
        </Box>
      )}
      <Box marginLeft={2} marginTop={1}>
        <Text color={theme.subtle}>id    </Text>
        <Text color={theme.text}>{String(chat.id)}</Text>
      </Box>
      {chat.accountID ? (
        <Box marginLeft={2}>
          <Text color={theme.subtle}>acct  </Text>
          <Text color={theme.muted}>{String(chat.accountID)}</Text>
        </Box>
      ) : null}
    </Box>
  )
}

export const MessageRow: React.FC<RowProps<RecordValue>> = ({ item: message }) => {
  const mine = Boolean(message.isSender)
  const senderID = stringValue(message.senderID)
  const sender = stringValue(message.senderName) ?? (senderID ? shortID(senderID) : 'unknown')
  const text = messageText(message)
  const timestamp = formatTime(message.timestamp)
  const status = typeof message.sendStatus === 'object' && message.sendStatus ? message.sendStatus as RecordValue : undefined
  const showFailure = status?.status && status.status !== 'SUCCESS'
  const attachments = Array.isArray(message.attachments) ? message.attachments : []
  const reactions = Array.isArray(message.reactions) ? message.reactions : []
  const railColor = mine ? theme.mine : senderColor(senderID)

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Rail color={railColor} />
        <Text> </Text>
        <Text bold color={mine ? theme.mine : railColor}>{mine ? 'you' : sender}</Text>
        {message.type != null && message.type !== 'TEXT' ? (
          <Text color={theme.magenta}>  {String(message.type).toLowerCase()}</Text>
        ) : null}
        {message.isUnread ? (
          <Text color={theme.primary}>  {glyphs.unread} unread</Text>
        ) : null}
        {message.isDeleted ? (
          <Text color={theme.danger}>  deleted</Text>
        ) : null}
        {message.editedTimestamp ? (
          <Text color={theme.subtle}>  {glyphs.edited} edited</Text>
        ) : null}
        {attachments.length > 0 && (
          <Text color={theme.warn}>  {glyphs.attachment} {attachmentLabel(attachments)}</Text>
        )}
        {reactions.length > 0 && (
          <Text color={theme.magenta}>  {glyphs.reaction}{reactions.length}</Text>
        )}
        <Box flexGrow={1} />
        {timestamp && <Text color={theme.subtle}>{timestamp}</Text>}
      </Box>
      {text && (
        <Box marginLeft={2}>
          <Text color={theme.text}>{text}</Text>
        </Box>
      )}
      {showFailure ? (
        <Box marginLeft={2}>
          <Text color={theme.danger}>{glyphs.cross} {String(status?.status)}</Text>
          {status?.message ? <Text color={theme.muted}>  {String(status.message)}</Text> : null}
        </Box>
      ) : null}
      <Box marginLeft={2}>
        <Text color={theme.subtle}>{String(message.id)}</Text>
        {message.chatID ? <Text color={theme.subtle}>  in {String(message.chatID)}</Text> : null}
      </Box>
    </Box>
  )
}

export const UserRow: React.FC<RowProps<RecordValue>> = ({ item: user }) => {
  const title = stringValue(user.fullName)
    ?? stringValue(user.username)
    ?? stringValue(user.email)
    ?? stringValue(user.phoneNumber)
    ?? String(user.id)
  const handles = compact([
    user.username ? `@${user.username}` : undefined,
    user.email ? String(user.email) : undefined,
    user.phoneNumber ? String(user.phoneNumber) : undefined,
  ])
  const rail = user.isSelf ? theme.mine : senderColor(stringValue(user.id))

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Rail color={rail} />
        <Text> </Text>
        <Text bold color={theme.text}>{title}</Text>
        {user.isSelf ? <Text color={theme.mine}>  you</Text> : null}
        {user.cannotMessage ? <Text color={theme.danger}>  cannot message</Text> : null}
      </Box>
      {handles.length > 0 ? (
        <Box marginLeft={2}>
          <Text color={theme.muted}>{handles.join('  ')}</Text>
        </Box>
      ) : null}
      <Box marginLeft={2}>
        <Text color={theme.subtle}>{String(user.id)}</Text>
        {user.accountID ? <Text color={theme.subtle}>  on {String(user.accountID)}</Text> : null}
      </Box>
    </Box>
  )
}

export const AccountRow: React.FC<RowProps<RecordValue>> = ({ item: account }) => {
  const id = account.accountID ?? account.id
  const title = stringValue(account.displayName)
    ?? stringValue(account.name)
    ?? stringValue(account.network)
    ?? String(id)
  const network = stringValue(account.network)
  const tint = bridgeColor(network)
  const state = stringValue(account.state)
  const stateLow = state?.toLowerCase() ?? ''
  const connected = stateLow.includes('online') || stateLow.includes('connect')
  const errored = stateLow.includes('error') || stateLow.includes('fail')
  const stateTone = connected ? theme.mine : errored ? theme.danger : theme.warnAlt
  const handles = compact([
    account.username ? `@${account.username}` : undefined,
    stringValue(account.userID),
  ])

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Rail color={tint ?? theme.primary} />
        <Text> </Text>
        <Text bold color={theme.text}>{title}</Text>
        {network && <Text color={tint ?? theme.muted}>  {network.toLowerCase()}</Text>}
        {state && <Text color={stateTone}>  {connected ? glyphs.dot : errored ? glyphs.cross : glyphs.ring} {stateLow}</Text>}
      </Box>
      {handles.length > 0 && (
        <Box marginLeft={2}>
          <Text color={theme.muted}>{handles.join('  ')}</Text>
        </Box>
      )}
      <Box marginLeft={2}>
        <Text color={theme.subtle}>{String(id)}</Text>
        {account.bridge ? <Text color={theme.subtle}>  bridge {String(account.bridge)}</Text> : null}
      </Box>
    </Box>
  )
}

export const AssetRow: React.FC<RowProps<RecordValue>> = ({ item: asset }) => {
  const title = stringValue(asset.fileName)
    ?? stringValue(asset.uploadID)
    ?? stringValue(asset.srcURL)
    ?? 'asset'
  const mime = stringValue(asset.mimeType)
  const meta = compact([
    typeof asset.fileSize === 'number' ? formatBytes(asset.fileSize) : undefined,
    asset.width && asset.height ? `${String(asset.width)}×${String(asset.height)}` : undefined,
    typeof asset.duration === 'number' ? formatDuration(asset.duration) : undefined,
  ])

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Rail color={asset.error ? theme.danger : theme.cyan} />
        <Text> </Text>
        <Text bold color={theme.text}>{title}</Text>
        {mime && <Text color={theme.subtle}>  {mime}</Text>}
        {meta.length > 0 && <Text color={theme.muted}>  {meta.join('  ')}</Text>}
      </Box>
      {asset.srcURL ? (
        <Box marginLeft={2}>
          <Hyperlink url={String(asset.srcURL)}><Text color={theme.subtle}>{String(asset.srcURL)}</Text></Hyperlink>
        </Box>
      ) : null}
      {asset.uploadID ? (
        <Box marginLeft={2}>
          <Text color={theme.subtle}>upload {String(asset.uploadID)}</Text>
        </Box>
      ) : null}
      {asset.error ? (
        <Box marginLeft={2}>
          <Text color={theme.danger}>{glyphs.cross} {String(asset.error)}</Text>
        </Box>
      ) : null}
    </Box>
  )
}

// ─── system / cards ────────────────────────────────────────────────────────────

export const InfoCard: React.FC<{ info: RecordValue }> = ({ info }) => {
  const version = stringValue(info.version)
  const platform = stringValue(info.platform)
  const user = info.user && typeof info.user === 'object' ? info.user as RecordValue : undefined
  const userName = user ? (stringValue(user.fullName) ?? stringValue(user.username) ?? stringValue(user.id)) : undefined
  const endpoints = info.endpoints && typeof info.endpoints === 'object' ? info.endpoints as RecordValue : undefined

  return (
    <Box flexDirection="column">
      <Box>
        <Rail color={theme.primary} />
        <Text> </Text>
        <Text bold color={theme.text}>Beeper Desktop</Text>
        {version && <Text color={theme.muted}>  v{version}</Text>}
        {platform && <Text color={theme.subtle}>  {platform}</Text>}
      </Box>
      {userName && <KV label="user" value={userName} />}
      {endpoints && Object.entries(endpoints).map(([key, value]) =>
        typeof value === 'string' ? (
          <Box marginLeft={2} key={key}>
            <Text color={theme.subtle}>{key.padEnd(12)}</Text>
            <Hyperlink url={value.startsWith('ws') ? value.replace(/^ws/, 'http') : value}>
              <Text color={theme.link}>{value}</Text>
            </Hyperlink>
          </Box>
        ) : null,
      )}
    </Box>
  )
}

export const DoctorCard: React.FC<{ checks: Array<{ ok: boolean; name: string; detail?: string }>; ok: boolean }> = ({ checks, ok }) => {
  const longest = Math.max(0, ...checks.map(c => c.name.length))
  return (
    <Box flexDirection="column">
      <Box>
        <Rail color={ok ? theme.mine : theme.danger} />
        <Text> </Text>
        <Text bold color={theme.text}>Doctor</Text>
        <Text>  </Text>
        {ok ? (
          <Text color={theme.mine}>{glyphs.check} healthy</Text>
        ) : (
          <Text color={theme.danger}>{glyphs.cross} attention needed</Text>
        )}
      </Box>
      <Box flexDirection="column" marginTop={1}>
        {checks.map(check => (
          <Box key={check.name} marginLeft={2}>
            <Text color={check.ok ? theme.mine : theme.danger}>{check.ok ? glyphs.check : glyphs.cross}</Text>
            <Text>  </Text>
            <Text color={theme.text}>{check.name.padEnd(longest + 2)}</Text>
            {check.detail && <Text color={theme.muted}>{check.detail}</Text>}
          </Box>
        ))}
      </Box>
      {!ok && (
        <Suggestions suggestions={[
          { command: 'beeper auth login', hint: 'sign in to Beeper Desktop' },
          { command: 'beeper status', hint: 'verify the API endpoint' },
        ]} />
      )}
    </Box>
  )
}

export const AuthStatusCard: React.FC<{ auth: RecordValue }> = ({ auth }) => {
  const ok = Boolean(auth.authenticated)
  const expires = auth.expiresAt ? formatTime(auth.expiresAt) ?? String(auth.expiresAt) : undefined
  return (
    <Box flexDirection="column">
      <Box>
        <Rail color={ok ? theme.mine : theme.warn} />
        <Text> </Text>
        <Text bold color={theme.text}>Authentication</Text>
        <Text>  </Text>
        {ok ? (
          <Text color={theme.mine}>{glyphs.check} signed in</Text>
        ) : (
          <Text color={theme.warn}>{glyphs.ring} signed out</Text>
        )}
      </Box>
      <KV label="endpoint" value={
        <Hyperlink url={String(auth.baseURL)}><Text color={theme.link}>{String(auth.baseURL)}</Text></Hyperlink>
      } />
      <KV label="source" value={String(auth.source ?? 'none')} tone="muted" />
      {auth.clientID ? <KV label="client" value={String(auth.clientID)} tone="dim" /> : null}
      {auth.scope ? <KV label="scope" value={String(auth.scope)} tone="muted" /> : null}
      {expires ? <KV label="expires" value={expires} tone="muted" /> : null}
      {!ok && (
        <Suggestions suggestions={[
          { command: 'beeper auth login', hint: 'sign in to Beeper Desktop' },
        ]} />
      )}
    </Box>
  )
}

export const UserInfoCard: React.FC<{ user: RecordValue }> = ({ user }) => {
  const name = stringValue(user.name)
    ?? stringValue(user.preferred_username)
    ?? stringValue(user.email)
    ?? String(user.sub)
  return (
    <Box flexDirection="column">
      <Box>
        <Rail color={theme.primary} />
        <Text> </Text>
        <Text bold color={theme.text}>{name}</Text>
        <Text color={theme.subtle}>  you</Text>
      </Box>
      {user.email ? <KV label="email" value={String(user.email)} /> : null}
      {user.preferred_username ? <KV label="username" value={`@${String(user.preferred_username)}`} tone="muted" /> : null}
      {user.sub ? <KV label="sub" value={String(user.sub)} tone="dim" /> : null}
    </Box>
  )
}

// ─── auth flow / login wizard ──────────────────────────────────────────────────

export const AuthCodeCard: React.FC<{ url: string; code?: string; hint?: string }> = ({ url, code, hint }) => (
  <Box flexDirection="column">
    <Box>
      <Rail color={theme.primary} />
      <Text> </Text>
      <Text bold color={theme.text}>Sign in to Beeper</Text>
    </Box>
    {hint && (
      <Box marginLeft={2}>
        <Text color={theme.muted}>{hint}</Text>
      </Box>
    )}
    <Box marginLeft={2} marginTop={1}>
      <Hyperlink url={url}><Text color={theme.link} underline>{url}</Text></Hyperlink>
    </Box>
    {code && (
      <Box marginLeft={2} marginTop={1}>
        <Text color={theme.subtle}>code  </Text>
        <Text bold color={theme.warn}>{code}</Text>
      </Box>
    )}
  </Box>
)

export const AuthSignedIn: React.FC<{ as: string; detail?: string; saved?: boolean }> = ({ as, detail, saved }) => (
  <Box flexDirection="column">
    <Box>
      <Text color={theme.mine}>{glyphs.check}</Text>
      <Text> </Text>
      <Text bold color={theme.text}>Signed in</Text>
      <Text color={theme.muted}>  as </Text>
      <Text color={theme.text}>{as}</Text>
    </Box>
    {detail && <Box marginLeft={2}><Text color={theme.muted}>{detail}</Text></Box>}
    {saved === false && <Box marginLeft={2}><Text color={theme.warn}>token not saved (--no-save)</Text></Box>}
  </Box>
)

// ─── config / commands manifest ────────────────────────────────────────────────

function maskToken(value: string): string {
  if (value.length <= 12) return '••••'
  return `${value.slice(0, 6)}…${value.slice(-4)}`
}

function renderConfigValue(key: string, value: unknown): React.ReactNode {
  if (value == null) return <Text color={theme.subtle}>—</Text>
  if (typeof value !== 'object') {
    if (/token|secret|key/i.test(key) && typeof value === 'string') {
      return <Text color={theme.subtle}>{maskToken(value)}</Text>
    }
    return <Text color={theme.text}>{String(value)}</Text>
  }
  const record = value as RecordValue
  const inner = Object.entries(record).filter(([, v]) => v != null)
  if (!inner.length) return <Text color={theme.subtle}>{'{}'}</Text>
  const width = Math.max(...inner.map(([k]) => k.length)) + 2
  return (
    <Box flexDirection="column">
      {inner.map(([k, v]) => (
        <Box key={k}>
          <Text color={theme.subtle}>{k.padEnd(width)}</Text>
          {/^(accesstoken|token|secret|key)$/i.test(k) && typeof v === 'string'
            ? <Text color={theme.subtle}>{maskToken(v)}</Text>
            : <Text color={theme.text}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</Text>}
        </Box>
      ))}
    </Box>
  )
}

export const ConfigView: React.FC<{ data: RecordValue }> = ({ data }) => {
  const entries = Object.entries(data).filter(([, v]) => v != null)
  if (!entries.length) {
    return <EmptyState title="No config set" subtitle="The CLI is using defaults." suggestions={[
      { command: 'beeper config set baseURL <url>', hint: 'override the API endpoint' },
    ]} />
  }
  const width = Math.max(...entries.map(([k]) => k.length)) + 2
  return (
    <Box flexDirection="column">
      <Box>
        <Rail color={theme.primary} />
        <Text> </Text>
        <Text bold color={theme.text}>Config</Text>
      </Box>
      {entries.map(([key, value]) => (
        <Box key={key} marginLeft={2} flexDirection={typeof value === 'object' && value != null ? 'column' : 'row'}>
          <Box>
            <Text color={theme.subtle}>{key.padEnd(width)}</Text>
            {typeof value !== 'object' || value == null ? renderConfigValue(key, value) : null}
          </Box>
          {typeof value === 'object' && value != null && (
            <Box marginLeft={width + 2}>
              {renderConfigValue(key, value)}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  )
}

type ManifestItem = { command: string; description: string; group?: string }

export const CommandsView: React.FC<{ items: ManifestItem[]; title?: string; intro?: string[] }> = ({ items, title = 'Commands', intro }) => {
  const groups = new Map<string, ManifestItem[]>()
  for (const item of items) {
    const g = item.group ?? 'Common'
    if (!groups.has(g)) groups.set(g, [])
    groups.get(g)!.push(item)
  }
  // Hard cap so descriptions stay aligned. Anything longer drops its description onto the next indented line.
  const NAME_WIDTH = 32
  return (
    <Box flexDirection="column">
      <Box>
        <Rail color={theme.primary} />
        <Text> </Text>
        <Text bold color={theme.text}>{title}</Text>
      </Box>
      {intro?.map((line, i) => (
        <Box key={i} marginLeft={2}>
          <Text color={theme.muted}>{line}</Text>
        </Box>
      ))}
      {[...groups.entries()].map(([group, list]) => (
        <Box flexDirection="column" key={group} marginTop={1}>
          <Box marginLeft={2}><Text color={theme.subtle}>{group.toUpperCase()}</Text></Box>
          {list.map(item => {
            const fits = item.command.length <= NAME_WIDTH
            return fits ? (
              <Box key={item.command} marginLeft={2}>
                <Text color={theme.primaryGlow}>{item.command.padEnd(NAME_WIDTH + 2)}</Text>
                <Text color={theme.muted}>{item.description}</Text>
              </Box>
            ) : (
              <Box key={item.command} marginLeft={2} flexDirection="column">
                <Text color={theme.primaryGlow}>{item.command}</Text>
                <Box marginLeft={2}><Text color={theme.muted}>{item.description}</Text></Box>
              </Box>
            )
          })}
        </Box>
      ))}
    </Box>
  )
}

// ─── stream feed (used by `watch`) ─────────────────────────────────────────────

export type StreamEvent = { type: string; chatID?: string; messageID?: string; ts?: string }

const eventTone: Record<string, string> = {
  'message.new': theme.primary,
  'message.send': theme.mine,
  'message.edit': theme.warn,
  'message.delete': theme.danger,
  'chat.update': theme.cyan,
  'chat.read': theme.subtle,
  'chat.typing': theme.magenta,
  'reaction.add': theme.magenta,
  'reaction.remove': theme.subtle,
}

export const StreamEventLine: React.FC<{ event: StreamEvent; index: number }> = ({ event, index }) => {
  const color = eventTone[event.type] ?? theme.primary
  const time = event.ts ? formatTime(event.ts) : undefined
  return (
    <Box>
      <Text color={theme.subtle}>{String(index).padStart(4)}  </Text>
      <Text color={color}>{glyphs.dot}</Text>
      <Text>  </Text>
      <Text bold color={theme.text}>{event.type}</Text>
      {event.chatID && <Text color={theme.subtle}>  in {event.chatID}</Text>}
      {event.messageID && <Text color={theme.subtle}>  msg {event.messageID}</Text>}
      {time && <Text color={theme.subtle}>  {time}</Text>}
    </Box>
  )
}

export const StreamHeader: React.FC<{ subscribed: string[]; baseURL: string; connected: boolean }> = ({ subscribed, baseURL, connected }) => {
  const label = subscribed.length === 1 && subscribed[0] === '*' ? 'all chats' : `${subscribed.length} chat${subscribed.length === 1 ? '' : 's'}`
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Rail color={connected ? theme.mine : theme.warn} />
        <Text> </Text>
        <Text bold color={theme.text}>Watching events</Text>
        <Text color={theme.muted}>  {label}</Text>
        {!connected && <Text color={theme.warn}>  connecting…</Text>}
      </Box>
      <Box marginLeft={2}>
        <Text color={theme.subtle}>{baseURL}  ·  press ⌃C to stop</Text>
      </Box>
    </Box>
  )
}

// ─── generic fallback ─────────────────────────────────────────────────────────

export const GenericRow: React.FC<RowProps<RecordValue>> = ({ item }) => {
  const title = item.title ?? item.displayName ?? item.name ?? item.id ?? item.messageID
  const scalarEntries = Object.entries(item).filter(([key, value]) => {
    if (value == null) return false
    if (key === 'title' || key === 'displayName' || key === 'name') return false
    if (typeof value === 'object') return false
    return true
  })
  const width = scalarEntries.length ? Math.max(...scalarEntries.map(([k]) => k.length)) + 2 : 0
  return (
    <Box flexDirection="column" marginBottom={1}>
      {title != null && (
        <Box>
          <Rail color={theme.primary} />
          <Text> </Text>
          <Text bold color={theme.text}>{String(title)}</Text>
        </Box>
      )}
      {scalarEntries.map(([key, value]) => (
        <Box marginLeft={2} key={key}>
          <Text color={theme.subtle}>{key.padEnd(width)}</Text>
          <Text color={theme.text}>{String(value)}</Text>
        </Box>
      ))}
    </Box>
  )
}
