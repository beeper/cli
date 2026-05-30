export type CommandMetadata = {
  mutates: boolean
  requiresAuth: boolean
  selectors: string[]
  output: 'data' | 'list' | 'stream' | 'success' | 'send-result' | 'manual' | 'schema'
  related: string[]
}

const mutatingRoots = new Set(['export', 'install', 'presence', 'send', 'setup', 'update'])
const mutatingVerbs = new Set([
  'add', 'approve', 'archive', 'avatar', 'cancel', 'delete', 'description', 'disable', 'disappear', 'download',
  'draft', 'edit', 'enable', 'export', 'focus', 'logout', 'mark-read', 'mark-unread', 'mute', 'notify-anyway',
  'pin', 'post', 'priority', 'qr-confirm', 'qr-scan', 'recovery-key', 'remind', 'remove', 'rename', 'reset',
  'reset-recovery-key', 'response', 'restart', 'sas', 'sas-confirm', 'set', 'start', 'stop', 'unarchive',
  'unmute', 'unpin', 'unremind', 'use',
])
const localOnly = new Set(['completion', 'config', 'docs', 'man', 'schema', 'version'])

export function metadataForCommand(command: string): CommandMetadata {
  const parts = command.split(' ')
  const root = parts[0] ?? ''
  const mutates = command === 'verify' || command === 'api request' || mutatingRoots.has(root) || parts.some(part => mutatingVerbs.has(part ?? ''))
  const requiresAuth = !localOnly.has(root) && command !== 'targets list' && !command.startsWith('targets add') && !command.startsWith('install ')
  const selectors = [
    command.includes('chats ') || command.includes('messages ') || command.startsWith('send ') || command === 'presence' || command.startsWith('resolve chat') ? 'chat' : undefined,
    command.includes('accounts ') || command.includes('contacts ') || command === 'chats start' || command.startsWith('resolve account') || command.startsWith('resolve contact') ? 'account' : undefined,
    command.includes('targets ') || command === 'status' || command === 'doctor' || command.startsWith('auth ') || command.startsWith('verify') || command.startsWith('resolve target') ? 'target' : undefined,
    command.startsWith('bridges ') || command === 'accounts add' || command.startsWith('resolve bridge') ? 'bridge' : undefined,
    command.includes('messages ') || command.startsWith('send react') || command.startsWith('send unreact') ? 'message' : undefined,
  ].filter(Boolean) as string[]
  const output = command === 'schema' ? 'schema'
    : command.startsWith('send ') ? 'send-result'
      : command === 'watch' || command === 'rpc' ? 'stream'
        : command === 'man' ? 'manual'
          : command.endsWith('list') || command.includes('search') || command === 'bridges list' || command.startsWith('resolve ') ? 'list'
            : mutates ? 'success'
              : 'data'
  const related = relatedForCommand(command)
  return { mutates, requiresAuth, selectors, output, related }
}

function relatedForCommand(command: string): string[] {
  if (command.startsWith('send ')) return ['messages list', 'watch']
  if (command.startsWith('messages ')) return ['chats list', 'send text']
  if (command.startsWith('chats ')) return ['messages list', 'send text']
  if (command.startsWith('bridges ')) return ['accounts add', 'accounts list']
  if (command.startsWith('accounts ')) return ['bridges list', 'chats list']
  if (command.startsWith('targets ')) return ['status', 'doctor']
  if (command.startsWith('resolve ')) return ['chats search', 'accounts list', 'targets list', 'bridges list']
  if (command === 'status') return ['doctor', 'setup']
  if (command === 'doctor') return ['status', 'setup']
  if (command === 'schema') return ['man']
  if (command.startsWith('verify')) return ['setup', 'status']
  return []
}
