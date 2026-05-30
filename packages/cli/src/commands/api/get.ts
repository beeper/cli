import { Args, Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { appRequest } from '../../lib/app-api.js'
import { createClient } from '../../lib/client.js'
import { printData } from '../../lib/output.js'

export default class ApiGet extends BeeperCommand {
  static override summary = 'Call a raw Desktop API GET path'
  static override args = {
    path: Args.string({ description: 'API path, for example /v1/info', required: true }),
  }
  static override flags = {
    json: Flags.boolean({ default: true, allowNo: true, description: 'Print JSON' }),
    'no-auth': Flags.boolean({ default: false, description: 'Call a public API path without a bearer token' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ApiGet)
    const format = flags.json ? 'json' : 'human'
    if (flags['no-auth']) {
      await printData(await appRequest('GET', args.path, { baseURL: flags['base-url'], target: flags.target, token: false }), format)
      return
    }
    const client = await createClient(flags)
    await printData(await client.get(args.path), format)
  }
}
