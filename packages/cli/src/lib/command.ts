import { Command, Flags } from '@oclif/core'
import { BugError, CLIError, ExitCodes } from './errors.js'

export abstract class BeeperCommand extends Command {
  static override baseFlags = {
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL (overrides --target)' }),
    target: Flags.string({ char: 't', description: 'Named Beeper target to use for this command' }),
    debug: Flags.boolean({ default: false, description: 'Print SDK debug logging on stderr' }),
    'dry-run': Flags.boolean({ default: false, description: 'Do not make changes; print intended actions when supported' }),
    events: Flags.boolean({ default: false, description: 'Emit NDJSON lifecycle events on stderr (long-running commands)' }),
    force: Flags.boolean({ char: 'f', default: false, description: 'Skip confirmations for destructive commands' }),
    format: Flags.string({ options: ['json', 'jsonl', 'table', 'text', 'ids'], description: 'Output format. Defaults to json for agents/non-TTY, table for TTY.' }),
    full: Flags.boolean({ default: false, description: 'Disable text-output truncation; print full IDs and bodies' }),
    json: Flags.boolean({ default: false, description: 'Alias for --format json' }),
    'no-input': Flags.boolean({ default: false, description: 'Never prompt; fail instead (useful for agents and CI)' }),
    quiet: Flags.boolean({ char: 'q', default: false, description: 'Suppress spinners and success lines (errors still print). Honored with or without --json.' }),
    'read-only': Flags.boolean({ default: false, description: 'Reject commands that would modify Beeper or local CLI state (or set BEEPER_READONLY=1)' }),
    'results-only': Flags.boolean({ default: false, description: 'In JSON mode, emit only the primary result instead of the envelope' }),
    select: Flags.string({ description: 'In JSON/JSONL mode, project comma-separated fields; dot paths supported' }),
    timeout: Flags.string({ description: 'Maximum time to wait, such as 30s, 2m, or 1h' }),
    yes: Flags.boolean({ char: 'y', default: false, description: 'Alias for --force' }),
  }

  public override async init(): Promise<void> {
    await super.init()
    if (this.argv.includes('--quiet') || this.argv.includes('-q')) {
      process.env.BEEPER_QUIET = '1'
    }
    const format = outputFormatFromArgv(this.argv)
    if (format) {
      process.env.BEEPER_OUTPUT_FORMAT = format
    } else if (this.argv.includes('--json')) {
      process.env.BEEPER_OUTPUT_FORMAT = 'json'
    } else if (process.env.BEEPER_AGENT === '1' || !process.stdout.isTTY) {
      process.env.BEEPER_OUTPUT_FORMAT = 'json'
    }
    const select = stringFlagFromArgv(this.argv, '--select')
    if (select) process.env.BEEPER_OUTPUT_SELECT = select
    if (this.argv.includes('--results-only')) process.env.BEEPER_OUTPUT_RESULTS_ONLY = '1'
    if (this.argv.includes('--no-input') || process.env.BEEPER_AGENT === '1') process.env.BEEPER_NO_INPUT = '1'
    if (this.argv.includes('--force') || this.argv.includes('-f') || this.argv.includes('--yes') || this.argv.includes('-y')) process.env.BEEPER_FORCE = '1'
  }

  protected override async catch(error: Error & { exitCode?: number }): Promise<void> {
    const message = error.message || String(error)
    const inferredCode = error instanceof CLIError ? error.exitCode : inferExitCode(message)
    const code = inferredCode ?? error.exitCode ?? ExitCodes.Generic
    process.exitCode = process.exitCode ?? code
    const tryMessage = error instanceof CLIError ? error.tryMessage : undefined
    const isBug = error instanceof BugError || (!(error instanceof CLIError) && inferredCode === undefined)

    if (this.argv.includes('--events')) {
      writeEvent('error', { message, exitCode: code, kind: isBug ? 'bug' : 'abort', tryMessage })
      return
    }

    if (isMachineOutput(this.argv)) {
      const errorCodeValue = error instanceof CLIError && error.code ? error.code : errorCode(code, isBug)
      const data = error instanceof CLIError ? error.data : undefined
      process.stderr.write(`${JSON.stringify({ ok: false, data: data ?? null, error: { code: errorCodeValue, message, exitCode: code, kind: isBug ? 'bug' : 'abort', hint: tryMessage } })}\n`)
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

function inferExitCode(message: string): number | undefined {
  if (/\b401\b|unauthorized|invalid token|auth(?:entication)? required/i.test(message)) return ExitCodes.AuthRequired
  if (/\b404\b|not\s+found|unknown .*target|no .*matches/i.test(message)) return ExitCodes.NotFound
  if (/ECONNREFUSED|ENOTFOUND|ETIMEDOUT|fetch failed|not reachable|not ready/i.test(message)) return ExitCodes.NotReady
  if (/usage|invalid|must provide|required|unknown flag|parse/i.test(message)) return ExitCodes.Usage
  return undefined
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

export function ensureNotDryRun(flags: { 'dry-run'?: boolean }, action: string): void {
  if (flags['dry-run']) throw new CLIError(`dry-run: ${action}`, ExitCodes.Success)
}

export function writeEvent(event: string, data: Record<string, unknown> = {}): void {
  process.stderr.write(`${JSON.stringify({ event, data, ts: Date.now() })}\n`)
}

export function isQuiet(): boolean {
  return process.env.BEEPER_QUIET === '1'
}

export function isNoInput(): boolean {
  return process.env.BEEPER_NO_INPUT === '1'
}

export function isForce(flags?: { force?: boolean; yes?: boolean }): boolean {
  return Boolean(flags?.force || flags?.yes || process.env.BEEPER_FORCE === '1')
}

function outputFormatFromArgv(argv: string[]): string | undefined {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--format') return argv[i + 1]
    if (arg?.startsWith('--format=')) return arg.slice('--format='.length)
  }
  return undefined
}

function stringFlagFromArgv(argv: string[], name: string): string | undefined {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === name) return argv[i + 1]
    if (arg?.startsWith(`${name}=`)) return arg.slice(name.length + 1)
  }
  return undefined
}

function isMachineOutput(argv: string[]): boolean {
  const format = outputFormatFromArgv(argv) ?? process.env.BEEPER_OUTPUT_FORMAT
  return argv.includes('--json') || format === 'json' || format === 'jsonl'
}

function errorCode(code: number, isBug: boolean): string {
  if (isBug) return 'internal_error'
  switch (code) {
    case ExitCodes.Usage: return 'usage_error'
    case ExitCodes.AuthRequired: return 'auth_required'
    case ExitCodes.NotReady: return 'not_ready'
    case ExitCodes.NotFound: return 'not_found'
    case ExitCodes.Ambiguous: return 'ambiguous_selector'
    case ExitCodes.CommandNotFound: return 'command_not_found'
    default: return 'runtime_error'
  }
}
