import { Args, Command, Flags } from '@oclif/core'
import { createClient } from '../../lib/client.js'
import { apiCopy, cliCopy } from '../../lib/copy.js'
import { printData } from '../../lib/output.js'

export default class AssetsDownload extends Command {
  static override summary = apiCopy.assets.download
  static override args = {
    url: Args.string({ description: 'Asset URL', required: true }),
  }
  static override flags = {
    'base-url': Flags.string({ description: cliCopy.flags.baseURL }),
    debug: Flags.boolean({ default: false }),
    json: Flags.boolean({ default: false, description: cliCopy.flags.json }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AssetsDownload)
    const client = await createClient(flags)
    const result = await client.assets.download({ url: args.url })
    printData(result, flags.json ? 'json' : 'human')
  }
}
