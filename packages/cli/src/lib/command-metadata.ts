export type CommandMetadata = {
  mutates: boolean
  requiresAuth: boolean
  selectors: string[]
  output: 'data' | 'list' | 'stream' | 'success' | 'send-result' | 'manual' | 'schema'
  related: string[]
}

export function metadataForCommand(command: string): CommandMetadata {
  const parts = command.split(' ')
  const root = parts[0] ?? ''
  const mutatingRoots = new Set(['setup', 'install', 'send', 'update', 'export', 'presence'])
  const mutatingVerbs = new Set([
    'add', 'archive', 'unarchive', 'pin', 'unpin', 'mute', 'unmute', 'mark-read', 'mark-unread',
    'priority', 'notify-anyway', 'rename', 'description', 'avatar', 'draft', 'disappear', 'remind',
    'unremind', 'focus', 'edit', 'delete', 'remove', 'use', 'set', 'reset', 'logout', 'start', 'stop',
    'restart', 'enable', 'disable', 'download', 'export', 'post', 'response', 'approve', 'recovery-key', 'reset-recovery-key', 'cancel', 'sas',
    'sas-confirm', 'qr-scan', 'qr-confirm',
  ])
  const mutates = command === 'verify' || command === 'api request' || mutatingRoots.has(root) || parts.some(part => mutatingVerbs.has(part ?? ''))
  const localOnly = new Set(['config', 'completion', 'docs', 'version', 'man', 'schema'])
  const requiresAuth = !localOnly.has(root) && command !== 'targets list' && !command.startsWith('targets add') && !command.startsWith('install ')
  const selectors = [
    command.includes('chats ') || command.includes('messages ') || command.startsWith('send ') || command === 'presence' || command.startsWith('resolve chat') ? 'chat' : undefined,
    command.includes('accounts ') || command.includes('contacts ') || command === 'chats start' || command.startsWith('resolve account') || command.startsWith('resolve contact') ? 'account' : undefined,
    command.includes('targets ') || command === 'status' || command === 'doctor' || command.startsWith('auth ') || command.startsWith('verify') || command.startsWith('resolve target') ? 'target' : undefined,
    command.startsWith('bridges ') || command === 'accounts add' || command.startsWith('resolve bridge') ? 'bridge' : undefined,
    command.includes('messages ') || command.startsWith('send react') || command.startsWith('send unreact') ? 'message' : undefined,
  ].filter((value): value is string => Boolean(value))
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
