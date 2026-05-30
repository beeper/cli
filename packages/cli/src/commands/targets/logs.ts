import { Args, Flags } from '@oclif/core'
import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { BeeperCommand } from '../../lib/command.js'
import { customTargetID, resolveTarget } from '../../lib/targets.js'
import { desktopLogDir, profileErrorLogPath, profileLogPath } from '../../lib/profiles.js'

export default class TargetsLogs extends BeeperCommand {
  static override summary = 'Print logs for a local Beeper Desktop or Server install'
  static override args = { name: Args.string({ required: false, description: 'Target name. Defaults to the selected target.' }) }
  static override flags = {
    lines: Flags.integer({ default: 200, description: 'Lines to print from each log file' }),
    files: Flags.integer({ default: 5, description: 'Desktop log files to print, newest first' }),
    all: Flags.boolean({ default: false, description: 'Print all matching log files instead of only recent files' }),
  }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(TargetsLogs)
    const target = await resolveTarget({ target: args.name ?? flags.target, baseURL: flags['base-url'] })
    if (!target) throw new Error(`Unknown Beeper target "${args.name}".`)
    if (target.type === 'remote' || target.id === customTargetID) throw new Error(`Target "${target.id}" is remote and has no local logs.`)
    if (target.type === 'server') {
      if (!target.managed) throw new Error(`Target "${target.id}" is not a local Beeper Server install.`)
      await printLogFile(profileLogPath(target.id), flags.lines)
      await printLogFile(profileErrorLogPath(target.id), flags.lines)
      return
    }
    const files = await listLogFiles(desktopLogDir(target.managed ? target : undefined))
    const selected = flags.all ? files : files.slice(0, flags.files)
    for (const file of selected) {
      await printLogFile(file, flags.lines)
    }
  }
}

async function listLogFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  const files = await Promise.all(entries.map(async entry => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return listLogFiles(path)
    if (entry.isFile() && entry.name.endsWith('.log')) return [path]
    return []
  }))
  const paths = files.flat()
  const stats = await Promise.all(paths.map(async path => ({ path, mtimeMs: (await stat(path)).mtimeMs })))
  return stats.sort((a, b) => b.mtimeMs - a.mtimeMs).map(item => item.path)
}

async function printLogFile(path: string, lines: number): Promise<void> {
  const content = await readFile(path, 'utf8').catch(() => '')
  if (!content) return
  process.stdout.write(`\n==> ${path} <==\n`)
  process.stdout.write(tailLines(content, lines))
}

function tailLines(content: string, lines: number): string {
  if (lines <= 0) return content
  const parts = content.split('\n')
  const tail = parts.slice(Math.max(0, parts.length - lines - 1)).join('\n')
  return tail.endsWith('\n') ? tail : `${tail}\n`
}
