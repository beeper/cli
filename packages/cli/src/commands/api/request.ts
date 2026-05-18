import { Args, Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { appRequest, type AppRequestMethod } from '../../lib/app-api.js'
import { printData } from '../../lib/output.js'

export default class ApiRequest extends BeeperCommand {
  static override summary = 'Call a raw Desktop API path with any supported HTTP method'
  static override args = {
    method: Args.string({ description: 'HTTP method', options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], required: true }),
    path: Args.string({ description: 'API path, for example /v1/info', required: true }),
  }
  static override flags = {
    body: Flags.string({ description: 'JSON request body' }),
    json: Flags.boolean({ default: true, allowNo: true, description: 'Print JSON' }),
    'no-auth': Flags.boolean({ default: false, description: 'Call a public API path without a bearer token' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ApiRequest)
    const method = args.method as AppRequestMethod
    if (method !== 'GET') ensureWritable(flags)
    const body = flags.body ? JSON.parse(flags.body) as Record<string, unknown> : undefined
    if (flags['no-auth']) {
      await printData(await appRequest(method, args.path, { baseURL: flags['base-url'], body, target: flags.target, token: false }), flags.json ? 'json' : 'human')
      return
    }
    await printData(await appRequest(method, args.path, { baseURL: flags['base-url'], body, target: flags.target }), flags.json ? 'json' : 'human')
  }
}
