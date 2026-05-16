import type BeeperDesktop from '@beeper/desktop-api'

export { Args, Command, Flags, ux } from '@oclif/core'
export { BeeperCommand, ensureWritable, writeEvent } from './lib/command.js'
export {
  configPath,
  getAccessToken,
  getBaseURL,
  readConfig,
  resetConfig,
  updateConfig,
  writeConfig,
  type Config,
  type StoredAuth,
} from './lib/config.js'
export { createClient as createBeeperClient, requireToken } from './lib/client.js'
export {
  collectPage,
  emptyState,
  printConfig,
  printData,
  printFailure,
  printIDs,
  printList,
  printSuccess,
  startStream,
  type OutputFormat,
  type Suggestion,
} from './lib/output.js'

export type BeeperClient = InstanceType<typeof BeeperDesktop>

export type BeeperPluginContext = {
  baseURL?: string
  debug?: boolean
  json?: boolean
  readOnly?: boolean
}
