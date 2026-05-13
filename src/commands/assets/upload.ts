import { Args, Command, Flags } from '@oclif/core'
import { createReadStream } from 'node:fs'
import { createClient } from '../../lib/client.js'
import { apiCopy, cliCopy, sdkParamCopy } from '../../lib/copy.js'
import { printData } from '../../lib/output.js'

export default class AssetsUpload extends Command {
  static override summary = apiCopy.assets.upload
  static override args = {
    file: Args.string({ description: sdkParamCopy.attachmentFile, required: true }),
  }
  static override flags = {
    'base-url': Flags.string({ description: cliCopy.flags.baseURL }),
    debug: Flags.boolean({ default: false }),
    'file-name': Flags.string({ description: sdkParamCopy.fileName }),
    json: Flags.boolean({ default: false, description: cliCopy.flags.json }),
    'mime-type': Flags.string({ description: sdkParamCopy.mimeType }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AssetsUpload)
    const client = await createClient(flags)
    const result = await client.assets.upload({
      file: createReadStream(args.file),
      fileName: flags['file-name'],
      mimeType: flags['mime-type'],
    })
    printData(result, flags.json ? 'json' : 'human')
  }
}
