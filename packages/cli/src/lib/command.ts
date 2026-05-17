import { Command, Flags } from '@oclif/core'

export abstract class BeeperCommand extends Command {
  static override baseFlags = {
    'base-url': Flags.string({ description: 'Beeper API base URL (overrides target)' }),
    target: Flags.string({ char: 't', description: 'Beeper target' }),
    debug: Flags.boolean({ default: false, description: 'Print SDK debug logging' }),
    events: Flags.boolean({ default: false, description: 'Emit NDJSON lifecycle events on stderr' }),
    full: Flags.boolean({ default: false, description: 'Disable output truncation' }),
    json: Flags.boolean({ default: false, description: 'Print JSON' }),
    'read-only': Flags.boolean({ default: false, description: 'Reject commands that modify Beeper or local CLI state' }),
    timeout: Flags.string({ description: 'Maximum time to wait, such as 30s, 2m, or 1h' }),
    yes: Flags.boolean({ char: 'y', default: false, description: 'Skip confirmation prompts' }),
  }

  protected override async catch(error: Error & { exitCode?: number }): Promise<void> {
    process.exitCode = process.exitCode ?? error.exitCode ?? 1
    const message = error.message || String(error)

    if (this.argv.includes('--events')) {
      writeEvent('error', { message })
      return
    }

    if (this.argv.includes('--json')) {
      process.stderr.write(`${JSON.stringify({ success: false, data: null, error: message })}\n`)
      return
    }

    return super.catch(error)
  }
}

export function ensureWritable(flags: { 'read-only'?: boolean }): void {
  const env = process.env.BEEPER_CLI_READONLY ?? process.env.BEEPER_READONLY
  const readOnly = flags['read-only'] || ['1', 'true', 'yes', 'on'].includes(String(env ?? '').toLowerCase())
  if (readOnly) throw new Error('read-only mode: command would modify Beeper or local CLI state')
}

export function writeEvent(event: string, data: Record<string, unknown> = {}): void {
  process.stderr.write(`${JSON.stringify({ event, data, ts: Date.now() })}\n`)
}
