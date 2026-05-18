import { Command } from '@oclif/core'

export default class Plugins extends Command {
  static override summary = 'Manage Beeper CLI plugins'
  static override description = 'List recommended Beeper CLI plugins, or use oclif plugin commands to install, link, update, and remove plugins.'

  async run(): Promise<void> {
    this.log('Recommended plugins:')
    this.log('  beeper plugins available')
    this.log('')
    this.log('Plugin management:')
    this.log('  beeper plugins install <name>')
    this.log('  beeper plugins link <path>')
    this.log('  beeper plugins uninstall <name>')
  }
}
