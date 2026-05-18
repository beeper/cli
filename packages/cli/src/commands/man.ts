import { BeeperCommand } from '../lib/command.js'
import { commandManifest } from '../lib/manifest.js'
import { printCommands } from '../lib/output.js'
export default class Man extends BeeperCommand {
  static override summary = 'Print the command manual'
  async run(): Promise<void> {
    const { flags } = await this.parse(Man)
    const commandsByID = new Map(this.config.commands.map(command => [command.id.replaceAll(':', ' '), command]))
    const commands = commandManifest.map(item => {
      const command = commandsByID.get(item.command)
      return {
        ...item,
        description: command?.summary || command?.description || item.description,
        ...metadataForCommand(item.command),
      }
    })
    await printCommands(commands, flags.json ? 'json' : 'human', { title: 'Beeper CLI' })
  }
}

function metadataForCommand(command: string): {
  mutates: boolean
  requiresAuth: boolean
  selectors: string[]
  output: 'data' | 'list' | 'stream' | 'success' | 'send-result' | 'manual'
  related: string[]
} {
  const parts = command.split(' ')
  const root = parts[0] ?? ''
  const mutatingRoots = new Set(['setup', 'install', 'send', 'update'])
  const mutatingVerbs = new Set([
    'add', 'archive', 'unarchive', 'pin', 'unpin', 'mute', 'unmute', 'mark-read', 'mark-unread',
    'priority', 'notify-anyway', 'rename', 'description', 'avatar', 'draft', 'disappear', 'remind',
    'unremind', 'focus', 'edit', 'delete', 'remove', 'use', 'set', 'reset', 'logout', 'start', 'stop',
    'restart', 'enable', 'disable', 'approve', 'recovery-key', 'reset-recovery-key', 'cancel', 'sas',
    'sas-confirm', 'qr-scan', 'qr-confirm',
  ])
  const mutates = mutatingRoots.has(root) || parts.some(part => mutatingVerbs.has(part ?? ''))
  const localOnly = root === 'config' || root === 'completion' || root === 'docs' || root === 'version' || root === 'man'
  const requiresAuth = !localOnly && command !== 'targets list' && !command.startsWith('targets add') && !command.startsWith('install ')
  const selectors = [
    command.includes('chats ') || command.includes('messages ') || command.startsWith('send ') || command === 'presence' ? 'chat' : undefined,
    command.includes('accounts ') || command.includes('contacts ') || command === 'chats start' ? 'account' : undefined,
    command.includes('targets ') || command === 'status' || command === 'doctor' || command.startsWith('auth ') || command.startsWith('verify') ? 'target' : undefined,
    command.startsWith('bridges ') || command === 'accounts add' ? 'bridge' : undefined,
    command.includes('messages ') || command.startsWith('send react') || command.startsWith('send unreact') ? 'message' : undefined,
  ].filter((value): value is string => Boolean(value))
  const output = command.startsWith('send ') ? 'send-result'
    : command === 'watch' || command === 'rpc' ? 'stream'
    : command === 'man' ? 'manual'
      : command.endsWith('list') || command.includes('search') || command === 'bridges list' ? 'list'
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
  if (command === 'status') return ['doctor', 'setup']
  if (command === 'doctor') return ['status', 'setup']
  if (command.startsWith('verify')) return ['setup', 'status']
  return []
}
