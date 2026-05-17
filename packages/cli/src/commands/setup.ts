import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable, writeEvent } from '../lib/command.js'
import { evaluateReadiness } from '../lib/app-state.js'
import { ensureDesktopToken, findLocalDesktop } from '../lib/desktop-auth.js'
import { promptYesNo, promptYesNoDefaultYes } from '../lib/app-api.js'
import { installDesktop, installServer, type InstallChannel } from '../lib/installations.js'
import { connectedAccountSummary, findLocalDesktopSession, type LocalDesktopSession } from '../lib/local-desktop.js'
import { loginWithPKCE } from '../lib/oauth.js'
import { launchDesktopApp, startProfile } from '../lib/profiles.js'
import {
  builtInDesktopTargetID,
  createProfileTarget,
  customTargetID,
  readConfig,
  readTarget,
  saveTargetAuth,
  updateConfig,
  writeTarget,
  type AuthSource,
  type Target,
} from '../lib/targets.js'
import { printData, printSuccess } from '../lib/output.js'

export default class Setup extends BeeperCommand {
  static override summary = 'Make the selected target ready'
  static override flags = {
    local: Flags.boolean({ default: false, description: 'Use the local Beeper Desktop session on this device' }),
    oauth: Flags.boolean({ default: false, description: 'Authorize the target with browser OAuth/PKCE' }),
    remote: Flags.string({ description: 'Connect to a remote Beeper Desktop or Server URL' }),
    server: Flags.boolean({ default: false, description: 'Set up a local Beeper Server target' }),
    desktop: Flags.boolean({ default: false, description: 'Set up a local Beeper Desktop target' }),
    install: Flags.boolean({ default: false, description: 'Allow installing missing managed runtime' }),
    channel: Flags.string({ options: ['stable', 'nightly'], default: 'stable', description: 'Install release channel' }),
    'server-env': Flags.string({ options: ['production', 'staging'], default: 'production', description: 'Server environment. Staging forces nightly.' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Setup)
    ensureWritable(flags)
    if (flags.events) writeEvent('setup_step', { step: 'start', target: flags.target })

    if (flags.remote) {
      await this.setupRemote(flags)
      return
    }
    if (flags.server) {
      await this.setupManaged('server', flags)
      return
    }
    if (flags.desktop) {
      await this.setupManaged('desktop', flags)
      return
    }

    const target = await setupTarget(flags)
    if (flags.local) {
      await this.setupLocal(target, flags)
      return
    }
    if (flags.oauth) {
      await this.setupOAuth(target, flags)
      return
    }

    await this.setupDefault(target, flags)
  }

  private async setupDefault(target: Target, flags: SetupFlags): Promise<void> {
    const setupCmd = setupCommand(target)
    if (target.type === 'desktop') {
      const local = await prepareLocalDesktopSetup(target, flags).catch(() => undefined)
      if (local) {
        if (flags.yes) {
          await this.printSetupResult(await commitLocalDesktopSetup(local), flags)
          return
        }
        if (flags.json || !process.stdin.isTTY) {
          await printData({
            target: publicTarget(local.target),
            readiness: local.readiness,
            localDesktop: localDesktopPreview(local),
            availableActions: [`${setupCmd} --local`, `${setupCmd} --oauth`],
          }, flags.json ? 'json' : 'human')
          return
        }
        printLocalDesktopPreview(local)
        if (await promptYesNoDefaultYes('Use this Desktop session for CLI access?')) {
          await this.printSetupResult(await commitLocalDesktopSetup(local), flags)
          return
        }
      }
    }

    const readiness = await evaluateReadiness({ baseURL: target.baseURL, target: target.id })
    if (readiness.state === 'target-unreachable' && target.type === 'desktop' && !flags.json && process.stdin.isTTY) {
      const shouldLaunch = flags.yes || await promptYesNo('Beeper Desktop is not reachable. Launch it now?')
      if (shouldLaunch) {
        if (flags.events) writeEvent('setup_step', { step: 'launch', target: target.id })
        await launchDesktopApp(target)
        await printSuccess({
          message: 'Launched Beeper Desktop',
          detail: `Run \`${setupCmd}\` again after it finishes starting.`,
          data: { target: publicTarget(target), readiness },
        }, flags.json ? 'json' : 'human')
        return
      }
    }

    if (flags.json || !process.stdin.isTTY) {
      await printData({ target: publicTarget(target), readiness }, flags.json ? 'json' : 'human')
      return
    }

    await printSuccess({
      message: readiness.state === 'ready' ? 'Target ready' : `Setup paused: ${readiness.state}`,
      detail: readiness.message,
      data: { target: publicTarget(target), readiness },
    }, 'human')
  }

  private async setupLocal(target: Target, flags: SetupFlags): Promise<void> {
    const result = await setupLocalDesktop(target, flags)
    await this.printSetupResult(result, flags)
  }

  private async setupOAuth(target: Target, flags: SetupFlags): Promise<void> {
    const result = await setupOAuthTarget(target, flags)
    await this.printSetupResult(result, flags)
  }

  private async setupRemote(flags: SetupFlags): Promise<void> {
    const name = flags.target ?? remoteName(flags.remote!)
    const target: Target = {
      id: name,
      name,
      type: 'remote',
      baseURL: flags.remote!,
      managed: false,
    }
    await writeTarget(target)
    if (!flags.target) await updateConfig(config => ({ ...config, defaultTarget: config.defaultTarget ?? target.id }))
    const result = await setupOAuthTarget(target, flags, 'remote-oauth')
    await this.printSetupResult(result, flags)
  }

  private async setupManaged(type: 'desktop' | 'server', flags: SetupFlags): Promise<void> {
    if (flags.install) {
      if ((flags.json || !process.stdin.isTTY) && !flags.yes) throw new Error('Install requires --install --yes in non-interactive mode.')
      if (type === 'desktop') await installDesktop({ channel: flags.channel as InstallChannel, serverEnv: flags['server-env'] })
      else await installServer({ channel: flags.channel as InstallChannel, serverEnv: flags['server-env'] })
    }
    const id = flags.target ?? type
    const target = await readTarget(id) ?? await createProfileTarget(type, id, { serverEnv: flags['server-env'], port: undefined })
    if (!flags.target) await updateConfig(config => ({ ...config, defaultTarget: config.defaultTarget ?? target.id }))
    await startProfile(target).catch(error => {
      if (type === 'desktop') return undefined
      throw error
    })
    const readiness = await evaluateReadiness({ baseURL: target.baseURL, target: target.id })
    await printData({ target: publicTarget(target), readiness }, flags.json ? 'json' : 'human')
  }

  private async printSetupResult(result: SetupResult, flags: SetupFlags): Promise<void> {
    if (flags.json || !process.stdin.isTTY) {
      await printData(result, flags.json ? 'json' : 'human')
      return
    }
    await printSuccess({
      message: result.readiness.state === 'ready'
        ? `Connected to ${result.target.name ?? result.target.id}`
        : `Connected; setup paused: ${result.readiness.state}`,
      detail: result.accounts.length ? `Connected accounts: ${result.accounts.join(', ')}` : result.readiness.message,
      data: result,
    }, 'human')
  }
}

type SetupFlags = {
  'base-url'?: string
  channel?: string
  desktop?: boolean
  events?: boolean
  install?: boolean
  json?: boolean
  local?: boolean
  oauth?: boolean
  remote?: string
  server?: boolean
  'server-env'?: string
  target?: string
  yes?: boolean
}

type SetupResult = {
  accounts: string[]
  authSource?: AuthSource
  readiness: Awaited<ReturnType<typeof evaluateReadiness>>
  target: ReturnType<typeof publicTarget>
}

type PreparedLocalDesktopSetup = {
  accounts: string[]
  readiness: Awaited<ReturnType<typeof evaluateReadiness>>
  session: LocalDesktopSession
  target: Target
}

async function setupTarget(flags: SetupFlags): Promise<Target> {
  if (flags['base-url']) return { id: customTargetID, type: 'desktop', baseURL: flags['base-url'] }
  if (flags.target) {
    const target = await readTarget(flags.target)
    if (!target) throw new Error(`Unknown Beeper target "${flags.target}". Run \`beeper targets list\`.`)
    return target
  }
  const config = await readConfig()
  if (config.defaultTarget) {
    const target = await readTarget(config.defaultTarget)
    if (target) return target
  }
  const desktop = await readTarget(builtInDesktopTargetID)
  if (desktop) return desktop
  const detected = await findLocalDesktop({ scan: true, timeoutMs: 300 }).catch(() => undefined)
  const target: Target = {
    id: builtInDesktopTargetID,
    type: 'desktop',
    name: 'Beeper Desktop',
    baseURL: detected?.baseURL ?? 'http://127.0.0.1:23373',
    managed: false,
    runtime: { install: 'desktop', port: 23373 },
  }
  await writeTarget(target)
  await updateConfig(next => ({ ...next, defaultTarget: next.defaultTarget ?? target.id }))
  return target
}

async function setupLocalDesktop(target: Target, flags: SetupFlags): Promise<SetupResult> {
  return commitLocalDesktopSetup(await prepareLocalDesktopSetup(target, flags))
}

async function prepareLocalDesktopSetup(target: Target, flags: SetupFlags): Promise<PreparedLocalDesktopSetup> {
  if (flags.events) writeEvent('setup_step', { step: 'local-desktop', target: target.id })
  const desktop = await findLocalDesktop({ baseURL: target.baseURL, scan: target.id === builtInDesktopTargetID, timeoutMs: 500 }).catch(() => undefined)
  const resolvedTarget: Target = {
    ...target,
    id: target.id === customTargetID ? builtInDesktopTargetID : target.id,
    type: 'desktop',
    name: target.name ?? 'Beeper Desktop',
    baseURL: desktop?.baseURL ?? target.baseURL,
    managed: target.managed ?? false,
  }
  const session = await findLocalDesktopSession(resolvedTarget)
  const [readiness, accounts] = await Promise.all([
    evaluateReadiness({ baseURL: resolvedTarget.baseURL, target: resolvedTarget.id, token: session.auth.accessToken }),
    connectedAccountSummary(resolvedTarget, session.auth).catch(() => []),
  ])
  return { accounts, readiness, session, target: resolvedTarget }
}

async function commitLocalDesktopSetup(prepared: PreparedLocalDesktopSetup): Promise<SetupResult> {
  await writeTarget(prepared.target)
  await saveTargetAuth(prepared.target, prepared.session.auth)
  await updateConfig(config => ({ ...config, defaultTarget: config.defaultTarget ?? prepared.target.id }))
  return {
    accounts: prepared.accounts,
    authSource: prepared.session.auth.source,
    readiness: prepared.readiness,
    target: publicTarget({ ...prepared.target, auth: prepared.session.auth }),
  }
}

async function setupOAuthTarget(target: Target, flags: SetupFlags, source?: AuthSource): Promise<SetupResult> {
  if (flags.events) writeEvent('setup_step', { step: 'oauth', target: target.id })
  if ((flags.json || !process.stdin.isTTY) && !flags.yes) throw new Error('OAuth setup requires an interactive terminal or --yes to open the browser.')
  const authSource = source ?? (target.type === 'remote' ? 'remote-oauth' : 'desktop-oauth')
  const token = target.type === 'desktop' && target.id === builtInDesktopTargetID
    ? await ensureDesktopToken({ baseURL: target.baseURL, save: false, scan: true })
    : await loginWithPKCE({
      baseURL: target.baseURL,
      clientName: 'Beeper CLI',
      openBrowser: true,
      save: false,
      scope: 'read write',
      source: authSource,
    })
  const auth = typeof token === 'string'
    ? { accessToken: token, source: authSource, tokenType: 'Bearer' as const }
    : {
      accessToken: token.access_token,
      clientID: token.clientID,
      expiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : undefined,
      scope: token.scope,
      source: authSource,
      tokenType: token.token_type,
    }
  await writeTarget(target)
  await saveTargetAuth(target, auth)
  const [readiness, accounts] = await Promise.all([
    evaluateReadiness({ baseURL: target.baseURL, target: target.id, token: auth.accessToken }),
    connectedAccountSummary(target, auth).catch(() => []),
  ])
  return { accounts, authSource, readiness, target: publicTarget({ ...target, auth }) }
}

function publicTarget(target: Target): Omit<Target, 'auth'> & { auth?: { source?: AuthSource; tokenType?: 'Bearer' } } {
  const { auth, ...rest } = target
  return { ...rest, auth: auth ? { source: auth.source, tokenType: auth.tokenType } : undefined }
}

function localDesktopPreview(prepared: PreparedLocalDesktopSetup): Record<string, unknown> {
  return {
    authSource: prepared.session.auth.source,
    baseURL: prepared.target.baseURL,
    dataDir: prepared.session.dataDir,
    signedInAs: prepared.session.userID,
    connectedAccounts: prepared.accounts,
  }
}

function printLocalDesktopPreview(prepared: PreparedLocalDesktopSetup): void {
  process.stdout.write('Found Beeper Desktop on this device.\n\n')
  if (prepared.session.userID) process.stdout.write(`Signed in as: ${prepared.session.userID}\n`)
  if (prepared.accounts.length) process.stdout.write(`Connected accounts: ${prepared.accounts.join(', ')}\n`)
  process.stdout.write('\n')
}

function setupCommand(target: Target): string {
  return target.id === builtInDesktopTargetID ? 'beeper setup' : `beeper setup -t ${target.id}`
}

function remoteName(url: string): string {
  try {
    return new URL(url).hostname.replace(/[^a-zA-Z0-9._-]/g, '-') || 'remote'
  } catch {
    return 'remote'
  }
}
