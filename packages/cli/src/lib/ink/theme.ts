// Beeper Desktop dark-theme palette → Ink hex strings.
// Mirrors src/renderer/scss/tokens/colors{,_dark}.scss in the desktop app.
export const theme = {
  // Brand / accent
  primary: '#2561fb',
  primaryDim: '#1b43aa',
  primaryGlow: '#5a86ff',
  link: '#5cadff',

  // Text
  text: '#ededed',          // --color-text-neutrals (dark)
  muted: '#adadad',         // --color-text-neutrals-weak
  subtle: '#7e7e7e',        // --color-text-neutrals-subtle
  hairline: '#343434',      // --color-border-neutrals

  // Surface (only used when we explicitly fill — Ink defaults to the user's term bg)
  surface: '#000000',
  surfaceAlt: '#1c1c1c',
  surfaceHover: '#232323',

  // Semantic
  mine: '#4cc38a',          // --color-text-success (dark)
  online: '#1ec843',
  warn: '#f6ce46',          // --color-pin
  warnAlt: '#f1a10d',
  danger: '#ff6369',        // --color-text-error (dark)
  magenta: '#912ce1',       // --color-mute (dark)
  cyan: '#00c2d7',

  // Highlights
  mention: '#5a86ff',
  draft: '#f6ce46',
} as const

// Per-bridge "iconBackground" tints from beeper/desktop bundled-platforms/bridges/*/info.ts.
// Used to tint the rail/badge on chat & account rows so a glance reveals the network.
const bridgeTint: Record<string, string> = {
  imessage: '#19BA3B',
  imessagecloud: '#19BA3B',
  imessagego: '#19BA3B',
  androidsms: '#19BA3B',
  whatsapp: '#48C95F',
  telegram: '#2EA4DB',
  signal: '#3542FF',
  discord: '#5865F2',
  linkedin: '#086CE1',
  twitter: '#202124',
  x: '#202124',
  bluesky: '#549B57',
  beeper: '#0D4FFB',
  beeperai: '#0D4FFB',
  ai: '#0D4FFB',
  instagram: '#d833ca',
  facebook: '#0d4ffb',
  messenger: '#0d4ffb',
  googlechat: '#1ab5a2',
  googlevoice: '#0eb3ef',
  googlemessages: '#19ba3b',
  slack: '#9745ea',
  matrix: '#0eb3ef',
}

export function bridgeColor(network: string | undefined | null): string | undefined {
  if (!network) return undefined
  const key = String(network).toLowerCase().replace(/[^a-z0-9]/g, '')
  return bridgeTint[key]
}

// Group-chat sender name palette (8-color rotation) from the desktop dark theme.
const groupSenderPalette = [
  '#63c174', '#f1a10d', '#f76190', '#bf7af0',
  '#00c2d7', '#f65cb6', '#849dff', '#0ac5b3',
] as const

export function senderColor(id: string | undefined | null): string {
  if (!id) return theme.text
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
  return groupSenderPalette[Math.abs(hash) % groupSenderPalette.length]!
}

// Glyphs — every visual cue we use sits in this map so a single audit covers them.
export const glyphs = {
  rail: '▎',            // narrow left-edge bar; replaces avatars
  arrow: '›',
  arrowR: '→',
  arrowL: '←',
  check: '✓',
  cross: '✗',
  dot: '●',
  ring: '○',
  pin: '★',
  mute: '◐',
  archive: '◇',
  reaction: '♥',
  attachment: '📎',
  reply: '↳',
  edited: '✎',
  bullet: '·',
  lowPriority: '◌',
  mention: '@',
  draft: '✎',
  unread: '●',
  spinner: '◇',
  hairline: '─',
} as const
