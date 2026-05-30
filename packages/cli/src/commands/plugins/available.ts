import { BeeperCommand } from '../../lib/command.js'
import { printData } from '../../lib/output.js'
import { recommendedPlugins } from '../../lib/recommended-plugins.js'

export default class PluginsAvailable extends BeeperCommand {
  static override summary = 'List recommended optional Beeper CLI plugins'

  async run(): Promise<void> {
    const { flags } = await this.parse(PluginsAvailable)
    const installed = new Set(this.config.plugins.keys())
    const corePlugins = new Set((this.config.pjson.oclif.plugins ?? []) as string[])
    const plugins = recommendedPlugins.map(plugin => {
      const isInstalled = installed.has(plugin.name)
      return {
        ...plugin,
        installed: isInstalled,
        status: isInstalled ? 'installed' : 'not installed',
        core: corePlugins.has(plugin.name),
      }
    })

    await printData(plugins, flags.json ? 'json' : 'human')
  }
}
