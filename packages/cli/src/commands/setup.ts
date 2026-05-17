import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../lib/command.js'
import { findLocalDesktop } from '../lib/desktop-auth.js'
import { promptText } from '../lib/app-api.js'
import {
  createDesktopProfile,
  createServerTarget,
  launchDesktopProfile,
  launchServerTarget,
  readTarget,
  updateConfig,
  writeTarget,
  type Target,
} from '../lib/targets.js'
import { printSuccess } from '../lib/output.js'

export default class Setup extends BeeperCommand {
  static override summary = 'Set up a Beeper target'
  static override flags = {
    connect: Flags.string({ description: 'Connect to an existing Beeper client URL' }),
    type: Flags.string({ options: ['desktop', 'server'], default: 'desktop', description: 'Type for --connect' }),
    'desktop-profile': Flags.string({ description: 'Create a local Beeper Desktop profile' }),
    server: Flags.string({ description: 'Create a local Beeper Server target' }),
    name: Flags.string({ description: 'Target name for --connect' }),
    'server-env': Flags.string({ default: 'production' }),
    port: Flags.integer(),
    launch: Flags.boolean({ default: true, allowNo: true, description: 'Launch local profiles/servers' }),
    login: Flags.boolean({ default: false, description: 'Print the login command after setup' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Setup)
    ensureWritable(flags)

    if (flags.target) {
      const target = flags.target === 'desktop'
        ? { id: 'desktop', type: 'desktop' as const, name: 'Desktop', baseURL: 'http://127.0.0.1:23373' }
        : await readTarget(flags.target)
      if (!target) throw new Error(`Unknown Beeper target "${flags.target}". Run \`beeper target list\`.`)
      await updateConfig(config => ({ ...config, defaultTarget: target.id === 'desktop' ? undefined : target.id, baseURL: target.id === 'desktop' ? target.baseURL : config.baseURL }))
      await printSuccess({
        message: `Ready target: ${target.name ?? target.id}`,
        detail: flags.login ? `Next: beeper login -t ${target.id}` : target.baseURL,
        data: target,
      }, flags.json ? 'json' : 'human')
      return
    }

    let target = await this.pickSetup(flags)
    await updateConfig(config => ({ ...config, defaultTarget: target.id === 'desktop' ? undefined : target.id, baseURL: target.id === 'desktop' ? target.baseURL : config.baseURL }))

    if (flags.launch && target.dataDir) {
      if (target.type === 'desktop') await launchDesktopProfile(target)
      else await launchServerTarget(target)
    }

    await printSuccess({
      message: `Ready target: ${target.name ?? target.id}`,
      detail: flags.login ? `Next: beeper login -t ${target.id}` : target.baseURL,
      data: target,
    }, flags.json ? 'json' : 'human')
  }

  private async pickSetup(flags: {
    connect?: string
    type: string
    'desktop-profile'?: string
    server?: string
    name?: string
    'server-env': string
    port?: number
    json?: boolean
  }): Promise<Target> {
    if (flags.connect) return this.connect(flags.name ?? 'remote', flags.connect, flags.type as Target['type'])
    if (flags['desktop-profile']) return this.newDesktopProfile(flags['desktop-profile'], flags)
    if (flags.server) return this.newServer(flags.server, flags)

    const desktop = await findLocalDesktop({ scan: true, timeoutMs: 300 }).catch(() => undefined)
    if (desktop) return { id: 'desktop', type: 'desktop', name: 'Desktop', baseURL: desktop.baseURL }
    if (flags.json) throw new Error('No Beeper Desktop found. Pass --connect, --desktop-profile, or --server.')

    process.stdout.write('No Beeper target found.\n\nWhat do you want to do?\n  1. Create a Beeper Desktop profile\n  2. Connect to an existing Beeper client\n  3. Set up a new Beeper Server\n\n')
    const choice = await promptText('Choice: ')
    if (choice === '1') return this.newDesktopProfile(await promptText('Profile name: '), flags)
    if (choice === '2') return this.connect(await promptText('Target name: '), await promptText('Client URL: '), (await promptText('Type (desktop/server) [desktop]: ') || 'desktop') as Target['type'])
    if (choice === '3') return this.newServer(await promptText('Target name [local-server]: ') || 'local-server', flags)
    throw new Error('Setup cancelled.')
  }

  private async connect(id: string, baseURL: string, type: Target['type']): Promise<Target> {
    if (await readTarget(id)) throw new Error(`Target "${id}" already exists.`)
    const target = { id, name: id, type, baseURL }
    await writeTarget(target)
    return target
  }

  private async newDesktopProfile(id: string, flags: { 'server-env': string; port?: number }): Promise<Target> {
    if (await readTarget(id)) throw new Error(`Target "${id}" already exists.`)
    return createDesktopProfile(id, { serverEnv: flags['server-env'], port: flags.port })
  }

  private async newServer(id: string, flags: { 'server-env': string; port?: number }): Promise<Target> {
    if (await readTarget(id)) throw new Error(`Target "${id}" already exists.`)
    return createServerTarget(id, { serverEnv: flags['server-env'], port: flags.port })
  }
}
