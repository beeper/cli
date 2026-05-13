import { Args, Command, Flags } from '@oclif/core'
import { createClient } from '../../lib/client.js'
import { printData } from '../../lib/output.js'

export default class ApiPost extends Command {
  static override summary = 'Call a raw Desktop API POST path with a JSON body'
  static override args = {
    path: Args.string({ description: 'API path, for example /v1/messages/{chatID}/send', required: true }),
  }
  static override flags = {
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    body: Flags.string({ default: '{}', description: 'JSON request body' }),
    debug: Flags.boolean({ default: false }),
    json: Flags.boolean({ default: true, allowNo: true, description: 'Print JSON' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ApiPost)
    const client = await createClient(flags)
    const body = JSON.parse(flags.body) as Record<string, unknown>
    printData(await client.post(args.path, { body }), flags.json ? 'json' : 'human')
  }
}
