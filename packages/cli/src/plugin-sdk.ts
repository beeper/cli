import type { BeeperDesktop } from '@beeper/desktop-api'

export { Args, Command, Flags, ux } from '@oclif/core'
export { BeeperCommand, ensureWritable, writeEvent, isQuiet } from './lib/command.js'
export {
  AbortError,
  BugError,
  CLIError,
  ExitCodes,
  ambiguous,
  authRequired,
  notFound,
  notReady,
  usageError,
  type ExitCode,
} from './lib/errors.js'
export {
  configPath,
  getAccessToken,
  getBaseURL,
  readConfig,
  resolveTarget,
  resetConfig,
  updateConfig,
  writeConfig,
  type Config,
  type StoredAuth,
  type Target,
} from './lib/targets.js'
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
export {
  resolveAccountID,
  resolveAccountIDs,
  resolveChatID,
  listAccountIDs,
  userQueryFromInput,
  type AccountResolutionOptions,
  type ChatResolutionOptions,
} from './lib/resolve.js'
export { appRequest } from './lib/app-api.js'
export {
  confirmSuggestion,
  declineWithExit127,
  levenshtein,
  rankSuggestions,
  type Suggestion as DidYouMeanSuggestion,
} from './lib/did-you-mean.js'
export {
  formatUpdateFooter,
  readUpdateAvailability,
  type UpdateAvailability,
} from './lib/update-banner.js'

export type BeeperClient = BeeperDesktop

export type BeeperPluginContext = {
  baseURL?: string
  debug?: boolean
  json?: boolean
  readOnly?: boolean
  quiet?: boolean
}
