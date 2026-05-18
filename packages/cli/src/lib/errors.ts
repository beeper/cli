/**
 * Beeper CLI exit codes:
 *   0   success
 *   1   generic runtime error
 *   2   usage error (parsing, missing required flag/arg, invalid combination)
 *   3   auth required (no stored token; user must authenticate)
 *   4   target/account not ready (target reachable but not signed-in or not verified)
 *   5   not found (selector matched nothing)
 *   6   ambiguous selector (multiple matches; use exact ID or --pick)
 *   127 user declined a did-you-mean suggestion (POSIX "command not found" semantics)
 */
export const ExitCodes = {
  Success: 0,
  Generic: 1,
  Usage: 2,
  AuthRequired: 3,
  NotReady: 4,
  NotFound: 5,
  Ambiguous: 6,
  CommandNotFound: 127,
} as const

export type ExitCode = typeof ExitCodes[keyof typeof ExitCodes]

export class CLIError extends Error {
  readonly exitCode: ExitCode
  readonly tryMessage?: string
  constructor(message: string, exitCode: ExitCode, tryMessage?: string) {
    super(message)
    this.exitCode = exitCode
    this.tryMessage = tryMessage
    this.name = 'CLIError'
  }
}

/**
 * Expected failure surfaced to the user (bad input, missing auth, network unreachable, etc).
 * Renders as a single-line red message. Do not include a stack trace.
 */
export class AbortError extends CLIError {
  constructor(message: string, exitCode: ExitCode = ExitCodes.Generic, tryMessage?: string) {
    super(message, exitCode, tryMessage)
    this.name = 'AbortError'
  }
}

/**
 * Unexpected internal failure that should be reported. Renders as a boxed panel with
 * the stack and a "report this" hint. Always exits with ExitCodes.Generic.
 */
export class BugError extends CLIError {
  constructor(message: string, tryMessage?: string) {
    super(message, ExitCodes.Generic, tryMessage)
    this.name = 'BugError'
  }
}

export const usageError = (message: string) => new AbortError(message, ExitCodes.Usage)
export const authRequired = (message: string) => new AbortError(message, ExitCodes.AuthRequired)
export const notReady = (message: string) => new AbortError(message, ExitCodes.NotReady)
export const notFound = (message: string) => new AbortError(message, ExitCodes.NotFound)
export const ambiguous = (message: string) => new AbortError(message, ExitCodes.Ambiguous)
