import { describe, expect, it } from 'vitest'
import { CLIError, ExitCodes, ambiguous, authRequired, notFound, notReady, usageError } from '../src/lib/errors.js'

describe('CLIError factories', () => {
  it('attaches exit code 2 for usage', () => {
    const err = usageError('bad flag')
    expect(err).toBeInstanceOf(CLIError)
    expect(err.exitCode).toBe(ExitCodes.Usage)
    expect(err.message).toBe('bad flag')
  })

  it('attaches exit code 3 for authRequired', () => {
    expect(authRequired('sign in').exitCode).toBe(ExitCodes.AuthRequired)
  })

  it('attaches exit code 4 for notReady', () => {
    expect(notReady('not ready').exitCode).toBe(ExitCodes.NotReady)
  })

  it('attaches exit code 5 for notFound', () => {
    expect(notFound('missing').exitCode).toBe(ExitCodes.NotFound)
  })

  it('attaches exit code 6 for ambiguous', () => {
    expect(ambiguous('pick one').exitCode).toBe(ExitCodes.Ambiguous)
  })

  it('CLIError instances are Error subclasses', () => {
    const err = new CLIError('boom', ExitCodes.Generic)
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('CLIError')
  })
})
