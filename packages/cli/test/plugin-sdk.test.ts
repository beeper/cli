import { describe, expect, it } from 'vitest'
import * as sdk from '../src/plugin-sdk.js'

describe('plugin-sdk public surface', () => {
  it('exports BeeperCommand as a constructor', () => {
    expect(typeof sdk.BeeperCommand).toBe('function')
  })

  it('exports the error class and factories', () => {
    expect(typeof sdk.CLIError).toBe('function')
    expect(sdk.ExitCodes.AuthRequired).toBe(3)
    expect(sdk.notFound('x').exitCode).toBe(sdk.ExitCodes.NotFound)
    expect(sdk.ambiguous('x').exitCode).toBe(sdk.ExitCodes.Ambiguous)
    expect(sdk.notReady('x').exitCode).toBe(sdk.ExitCodes.NotReady)
    expect(sdk.authRequired('x').exitCode).toBe(sdk.ExitCodes.AuthRequired)
    expect(sdk.usageError('x').exitCode).toBe(sdk.ExitCodes.Usage)
  })

  it('exports printers and resolvers', () => {
    for (const name of ['printData', 'printList', 'printSuccess', 'printFailure', 'collectPage', 'startStream', 'printIDs'] as const) {
      expect(typeof sdk[name]).toBe('function')
    }
    for (const name of ['resolveAccountID', 'resolveAccountIDs', 'resolveChatID', 'listAccountIDs', 'userQueryFromInput'] as const) {
      expect(typeof sdk[name]).toBe('function')
    }
  })

  it('exports target + config helpers', () => {
    for (const name of ['createBeeperClient', 'requireToken', 'resolveTarget', 'readConfig', 'updateConfig', 'writeConfig', 'resetConfig', 'getAccessToken', 'getBaseURL', 'configPath'] as const) {
      expect(typeof sdk[name]).toBe('function')
    }
  })

  it('exports the raw appRequest escape hatch', () => {
    expect(typeof sdk.appRequest).toBe('function')
  })

  it('re-exports the oclif primitives plugins need', () => {
    expect(typeof sdk.Args).toBe('object')
    expect(typeof sdk.Flags).toBe('object')
    expect(typeof sdk.Command).toBe('function')
    expect(typeof sdk.ux).toBe('object')
  })
})
