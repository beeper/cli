import { Command, Flags } from '@oclif/core'
import { BugError, CLIError, ExitCodes } from './errors.js'

export abstract class BeeperCommand extends Command {
  static override baseFlags = {
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL (overrides --target)' }),
    target: Flags.string({ char: 't', description: 'Named Beeper target to use for this command' }),
    debug: Flags.boolean({ default: false, description: 'Print SDK debug logging on stderr' }),
    events: Flags.boolean({ default: false, description: 'Emit NDJSON lifecycle events on stderr (long-running commands)' }),
    full: Flags.boolean({ default: false, description: 'Disable text-output truncation; print full IDs and bodies' }),
    json: Flags.boolean({ default: false, description: 'Print machine-readable JSON envelope on stdout' }),
    quiet: Flags.boolean({ char: 'q', default: false, description: 'Suppress spinners and success lines (errors still print). Honored with or without --json.' }),
    'read-only': Flags.boolean({ default: false, description: 'Reject commands that would modify Beeper or local CLI state (or set BEEPER_READONLY=1)' }),
    timeout: Flags.string({ description: 'Maximum time to wait, such as 30s, 2m, or 1h' }),
    yes: Flags.boolean({ char: 'y', default: false, description: 'Skip interactive confirmation prompts' }),
  }

  public override async init(): Promise<void> {
    await super.init()
    if (this.argv.includes('--quiet') || this.argv.includes('-q')) {
      process.env.BEEPER_QUIET = '1'
    }
  }

  protected override async catch(error: Error & { exitCode?: number }): Promise<void> {
    const code = error instanceof CLIError ? error.exitCode : error.exitCode ?? ExitCodes.Generic
    process.exitCode = process.exitCode ?? code
    const message = error.message || String(error)
    const tryMessage = error instanceof CLIError ? error.tryMessage : undefined
    const isBug = !(error instanceof CLIError) || error instanceof BugError

    if (this.argv.includes('--events')) {
      writeEvent('error', { message, exitCode: code, kind: isBug ? 'bug' : 'abort', tryMessage })
      return
    }

    if (this.argv.includes('--json')) {
      process.stderr.write(`${JSON.stringify({ success: false, data: null, error: message, exitCode: code, kind: isBug ? 'bug' : 'abort', tryMessage })}\n`)
      return
    }

    if (isBug) {
      process.stderr.write(formatBugPanel(error, this.config.version))
      return
    }

    if (tryMessage) process.stderr.write(`${message}\n  hint: ${tryMessage}\n`)
    else return super.catch(error)
  }
}

function formatBugPanel(error: Error, version: string): string {
  const bar = '─'.repeat(60)
  const stack = error.stack?.split('\n').slice(0, 8).join('\n') ?? error.message
  return [
    '',
    `┌─ unexpected error ${bar.slice(20)}`,
    `│ ${error.message}`,
    '│',
    ...stack.split('\n').map(line => `│   ${line}`),
    '│',
    `│ beeper-cli ${version} — please report at`,
    '│   https://github.com/beeper/desktop-api-cli/issues',
    `└${'─'.repeat(60)}`,
    '',
  ].join('\n')
}

export function ensureWritable(flags: { 'read-only'?: boolean }): void {
  const env = process.env.BEEPER_READONLY
  const readOnly = flags['read-only'] || ['1', 'true', 'yes', 'on'].includes(String(env ?? '').toLowerCase())
  if (readOnly) throw new CLIError('read-only mode: command would modify Beeper or local CLI state', ExitCodes.Usage)
}

export function writeEvent(event: string, data: Record<string, unknown> = {}): void {
  process.stderr.write(`${JSON.stringify({ event, data, ts: Date.now() })}\n`)
}

export function isQuiet(): boolean {
  return process.env.BEEPER_QUIET === '1'
}
