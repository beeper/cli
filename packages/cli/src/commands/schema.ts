import { Args } from '@oclif/core'
import { BeeperCommand } from '../lib/command.js'
import { metadataForCommand } from '../lib/command-metadata.js'
import { commandManifest } from '../lib/manifest.js'
import { printData } from '../lib/output.js'

type RawCommand = {
  id: string
  aliases?: string[]
  args?: Record<string, unknown>
  description?: string
  flags?: Record<string, unknown>
  hidden?: boolean
  pluginName?: string
  summary?: string
}

export default class Schema extends BeeperCommand {
  static override strict = false
  static override summary = 'Print machine-readable command/flag schema'
  static override description = 'Agent-first schema for commands, flags, args, examples, mutation metadata, selectors, output shapes, and related commands.'
  static override args = {
    command: Args.string({ required: false, description: 'Optional command path, such as "messages search"' }),
  }

  async run(): Promise<void> {
    const { argv } = await this.parse(Schema)
    const pathArgs = argv as string[]
    const requested = pathArgs.length > 0 ? pathArgs.join(' ') : undefined
    const manifestByCommand = new Map(commandManifest.map(item => [item.command, item]))
    const commands = (this.config.commands as RawCommand[])
      .filter(command => !command.hidden)
      .map(command => {
        const path = command.id.replaceAll(':', ' ')
        const manifest = manifestByCommand.get(path)
        const metadata = metadataForCommand(path)
        return {
          path,
          id: command.id,
          aliases: (command.aliases ?? []).map(alias => alias.replaceAll(':', ' ')),
          summary: command.summary ?? manifest?.description ?? command.description ?? '',
          description: command.description ?? manifest?.description ?? command.summary ?? '',
          examples: manifest?.examples ?? [],
          args: normalizeFields(command.args),
          flags: normalizeFields(command.flags),
          ...metadata,
          supports: {
            dryRun: metadata.mutates,
            force: metadata.mutates,
            format: true,
            noInput: true,
            readOnly: true,
            select: true,
          },
          outputShape: outputShape(metadata.output),
        }
      })
      .sort((a, b) => a.path.localeCompare(b.path))

    const filtered = requested
      ? commands.filter(command => command.path === requested || command.path.startsWith(`${requested} `))
      : commands

    await printData({
      schemaVersion: 1,
      bin: this.config.bin,
      version: this.config.version,
      defaults: {
        stdout: 'primary command output only',
        stderr: 'diagnostics, progress, events, and structured errors',
        nonTTYFormat: 'json',
        ttyFormat: 'table',
      },
      formats: ['json', 'jsonl', 'table', 'text', 'ids'],
      exitCodes: {
        0: 'success',
        1: 'generic runtime error',
        2: 'usage error',
        3: 'auth required',
        4: 'target/account not ready',
        5: 'selector matched nothing',
        6: 'ambiguous selector',
        127: 'declined did-you-mean suggestion',
      },
      commands: filtered,
    }, 'json')
  }
}

function normalizeFields(fields: Record<string, unknown> | undefined): Array<Record<string, unknown>> {
  if (!fields) return []
  return Object.entries(fields).map(([name, raw]) => normalizeField(name, raw))
}

function normalizeField(name: string, raw: unknown): Record<string, unknown> {
  const record = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
  return {
    name,
    description: record.description ?? record.summary ?? '',
    required: Boolean(record.required),
    multiple: Boolean(record.multiple),
    default: record.default,
    options: record.options,
    char: record.char,
    type: typeName(record),
  }
}

function typeName(record: Record<string, unknown>): string {
  if (Array.isArray(record.options)) return 'enum'
  if (record.type === 'boolean' || record.type === 'option') return String(record.type)
  if (typeof record.parse === 'function') return 'string'
  if (typeof record.default === 'boolean') return 'boolean'
  if (typeof record.default === 'number') return 'integer'
  return 'string'
}

function outputShape(kind: string): Record<string, unknown> {
  const envelope = { ok: true, data: '<payload>', error: null, meta: '<metadata>' }
  switch (kind) {
    case 'list': {
      return { kind, envelope, data: 'array' }
    }

    case 'send-result': {
      return { kind, envelope, data: { chatID: 'string', pendingMessageID: 'string?', state: 'string?' } }
    }

    case 'stream': {
      return { kind, data: 'jsonl events or RPC lines' }
    }

    case 'success': {
      return { kind, envelope, data: { message: 'string', detail: 'string?', data: 'object?' } }
    }

    default: {
      return { kind, envelope, data: 'object' }
    }
  }
}
