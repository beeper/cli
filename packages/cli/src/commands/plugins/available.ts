import { BeeperCommand } from '../../lib/command.js'
import { printData } from '../../lib/output.js'
import { recommendedPlugins } from '../../lib/recommended-plugins.js'

export default class PluginsAvailable extends BeeperCommand {
  static override summary = 'List recommended optional Beeper CLI plugins'

  async run(): Promise<void> {
    const { flags } = await this.parse(PluginsAvailable)
    const installed = new Set(this.config.plugins.keys())
    const corePlugins = new Set((this.config.pjson.oclif.plugins ?? []) as string[])
    const plugins = recommendedPlugins.map(plugin => ({
      ...plugin,
      installed: installed.has(plugin.name),
      status: installed.has(plugin.name) ? 'installed' : 'not installed',
      core: corePlugins.has(plugin.name),
    }))

    await printData(plugins, flags.json ? 'json' : 'human')
  }
}
