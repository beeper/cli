import { Args, Command, Flags } from '@oclif/core'
import { createClient } from '../../lib/client.js'
import { printData } from '../../lib/output.js'

export default class ApiGet extends Command {
  static override summary = 'Call a raw Desktop API GET path'
  static override args = {
    path: Args.string({ description: 'API path, for example /v1/info', required: true }),
  }
  static override flags = {
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    debug: Flags.boolean({ default: false }),
    json: Flags.boolean({ default: true, allowNo: true, description: 'Print JSON' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ApiGet)
    const client = await createClient(flags)
    printData(await client.get(args.path), flags.json ? 'json' : 'human')
  }
}
