import { BeeperCommand } from '../lib/command.js'
export default class Completion extends BeeperCommand {
  static override summary = 'Print shell completion help'
  async run(): Promise<void> {
    process.stdout.write('Run the oclif autocomplete setup for your shell.\n')
  }
}
