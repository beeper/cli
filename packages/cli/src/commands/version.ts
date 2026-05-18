import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { BeeperCommand } from '../lib/command.js'
import { printData } from '../lib/output.js'
export default class Version extends BeeperCommand {
  static override summary = 'Print CLI version'
  async run(): Promise<void> {
    const { flags } = await this.parse(Version)
    const root = dirname(dirname(fileURLToPath(import.meta.url)))
    const pkg = JSON.parse(await readFile(join(root, '../package.json'), 'utf8'))
    await printData({ name: pkg.name, version: pkg.version }, flags.json ? 'json' : 'human')
  }
}
