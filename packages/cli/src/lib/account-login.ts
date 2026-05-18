import { createInterface } from 'node:readline/promises'
import { execFileSync } from 'node:child_process'
import { stdin as input, stderr as output } from 'node:process'
import type { LoginSession } from '@beeper/desktop-api/resources/bridges.js'
import type { BeeperDesktop } from '@beeper/desktop-api'

export type AccountLoginStep = LoginSession

export type AccountLoginOptions = {
  cookies?: Record<string, string>
  fields?: Record<string, string>
  nonInteractive?: boolean
  webview?: boolean
  webviewBackend?: 'auto' | 'chrome' | 'webkit'
  webviewTimeoutMs?: number
}

export function printAccountLoginStep(session: AccountLoginStep): void {
  const step = session.currentStep
  output.write(`status: ${session.status}\n`)
  if (session.loginID) output.write(`login_id: ${session.loginID}\n`)
  if (!step) return

  output.write(`step: ${step.type}\n`)
  if ('instructions' in step && step.instructions) output.write(`${step.instructions}\n`)
  if ('stepID' in step) output.write(`step_id: ${step.stepID}\n`)

  if (step.type === 'display_and_wait') {
    output.write(`display: ${step.display.type}\n`)
    if (step.display.type === 'qr') output.write(`${step.display.data}\n`)
    if (step.display.type === 'emoji') output.write(`image: ${step.display.imageURL}\n`)
  } else if (step.type === 'user_input') {
    for (const field of step.fields) {
      const details = [field.type, field.placeholder].filter(Boolean).join(' | ')
      output.write(`field ${field.id}: ${field.label ?? field.id}${details ? ` (${details})` : ''}\n`)
    }
  } else if (step.type === 'cookies') {
    output.write(`url: ${step.url}\n`)
    if (step.userAgent) output.write(`user_agent: ${step.userAgent}\n`)
    if (step.expectedFinalURLRegex) output.write(`expected_final_url_regex: ${step.expectedFinalURLRegex}\n`)
    for (const field of step.fields) output.write(`cookie field ${field.id}: ${field.type ?? 'cookie'}\n`)
    if (step.extractJS) output.write(`extract_js:\n${step.extractJS}\n`)
  } else if (step.type === 'complete') {
    output.write(`complete: ${step.login?.loginID ?? session.loginID ?? 'yes'}\n`)
  }
}

export async function runGuidedAccountLogin(client: BeeperDesktop, bridgeID: string, initialStep: AccountLoginStep, options: AccountLoginOptions = {}): Promise<AccountLoginStep> {
  let session = initialStep
  for (;;) {
    printAccountLoginStep(session)
    if (session.status === 'complete' || session.status === 'cancelled' || session.status === 'failed') return session

    const step = session.currentStep
    if (!step || !('stepID' in step)) throw new Error('Account login session did not include a current step.')

    if (step.type === 'display_and_wait') {
      await promptText('Press Enter after completing this step.')
      session = await client.bridges.loginSessions.retrieve(session.loginSessionID, { bridgeID })
      continue
    }

    if (step.type === 'user_input') {
      const fields: Record<string, string> = {}
      for (const field of step.fields) {
        if (options.fields?.[field.id] !== undefined) {
          fields[field.id] = options.fields[field.id]!
          continue
        }

        if (options.nonInteractive) {
          if (field.initialValue !== undefined) {
            fields[field.id] = field.initialValue
            continue
          }

          throw new Error(`Missing required field ${field.id}. Pass --field ${field.id}=... or run without --non-interactive.`)
        }

        const fallback = field.initialValue ? ` [${field.initialValue}]` : ''
        const value = await promptText(`${field.label ?? field.id}${fallback}: `)
        fields[field.id] = value || field.initialValue || ''
      }
      session = await client.bridges.loginSessions.steps.submit(step.stepID, { bridgeID, loginSessionID: session.loginSessionID, type: 'user_input', fields })
      continue
    }

    if (step.type === 'cookies') {
      const fields: Record<string, string> = {}
      if (options.webview) {
        try {
          Object.assign(fields, await collectCookieFieldsWithWebView(step, options))
        } catch (error) {
          if (options.nonInteractive) throw error
          output.write(`webview: ${error instanceof Error ? error.message : String(error)}\n`)
        }
      }

      for (const field of step.fields) {
        const id = field.id
        if (fields[id] !== undefined) continue
        if (options.cookies?.[id] !== undefined) {
          fields[id] = options.cookies[id]!
          continue
        }

        if (options.nonInteractive) throw new Error(`Missing required cookie ${id}. Pass --cookie ${id}=... or run without --non-interactive.`)
        fields[id] = await promptSecret(`${id}: `)
      }
      session = await client.bridges.loginSessions.steps.submit(step.stepID, { bridgeID, loginSessionID: session.loginSessionID, type: 'cookies', fields })
      continue
    }

    throw new Error(`Unsupported account login step: ${step.type}`)
  }
}

type CookieLoginStep = NonNullable<AccountLoginStep['currentStep']> & {
  type: 'cookies'
}

type CookieField = CookieLoginStep['fields'][number]

type WebViewConstructor = new (options?: Record<string, unknown>) => {
  url: string
  close(): void
  navigate(url: string): Promise<void>
  evaluate(script: string): Promise<unknown>
  cdp?(method: string, params?: Record<string, unknown>): Promise<unknown>
  onNavigated?: ((url: string, title: string) => void) | null
}

async function collectCookieFieldsWithWebView(step: CookieLoginStep, options: AccountLoginOptions): Promise<Record<string, string>> {
  const BunRuntime = (globalThis as { Bun?: { WebView?: WebViewConstructor } }).Bun
  const WebView = BunRuntime?.WebView
  if (!WebView) throw new Error('Bun.WebView is not available in this Bun runtime.')

  const backend = options.webviewBackend && options.webviewBackend !== 'auto' ? options.webviewBackend : undefined
  const view = new WebView(backend ? { backend } : undefined)
  const found: Record<string, string> = {}
  let lastURL = ''
  view.onNavigated = url => {
    lastURL = url
  }

  try {
    if (step.userAgent && backend === 'chrome' && view.cdp) {
      await view.navigate('about:blank')
      await view.cdp('Emulation.setUserAgentOverride', { userAgent: step.userAgent })
    } else if (step.userAgent) {
      output.write('webview: this cookie step suggests a user agent; pass --webview-backend chrome to apply it.\n')
    }

    output.write(`webview: opening ${step.url}\n`)
    if (backend === 'chrome') {
      output.write('webview: complete sign-in in the opened Chrome tab. If no tab appears, enable Chrome remote debugging and retry.\n')
    } else {
      output.write('webview: running in headless mode; cookie fields will be collected if the page can complete without manual input.\n')
    }

    await view.navigate(step.url)
    lastURL = view.url || lastURL

    const deadline = Date.now() + (options.webviewTimeoutMs ?? 120_000)
    const finalURLRegex = step.expectedFinalURLRegex ? new RegExp(step.expectedFinalURLRegex) : undefined
    while (Date.now() < deadline) {
      Object.assign(found, await collectBrowserStorageFields(view, step.fields))
      if (step.extractJS) Object.assign(found, await runExtractJS(view, step.extractJS, step.fields))

      const hasFields = step.fields.every(field => found[field.id] !== undefined || field.type === 'header')
      const hasFinalURL = !finalURLRegex || finalURLRegex.test(lastURL || view.url)
      if (hasFields && hasFinalURL) return found
      await sleep(500)
    }

    const missing = step.fields.map(field => field.id).filter(id => found[id] === undefined)
    throw new Error(`Timed out waiting for cookie fields${missing.length ? `: ${missing.join(', ')}` : ''}.`)
  } finally {
    view.close()
  }
}

async function collectBrowserStorageFields(view: InstanceType<WebViewConstructor>, fields: CookieField[]): Promise<Record<string, string>> {
  const serializableFields = fields.map(field => ({
    id: field.id,
    name: field.name ?? field.id,
    type: field.type ?? 'cookie',
  }))
  const result = await view.evaluate(`(() => {
    const fields = ${JSON.stringify(serializableFields)};
    const cookies = Object.fromEntries(document.cookie.split(';').map(part => {
      const index = part.indexOf('=');
      if (index < 0) return undefined;
      return [decodeURIComponent(part.slice(0, index).trim()), decodeURIComponent(part.slice(index + 1))];
    }).filter(Boolean));
    const found = {};
    for (const field of fields) {
      if (field.type === 'local_storage') {
        const value = localStorage.getItem(field.name);
        if (value !== null) found[field.id] = value;
      } else if (field.type === 'cookie' && cookies[field.name] !== undefined) {
        found[field.id] = cookies[field.name];
      }
    }
    return found;
  })()`)
  return stringRecord(result)
}

async function runExtractJS(view: InstanceType<WebViewConstructor>, extractJS: string, fields: CookieField[]): Promise<Record<string, string>> {
  const script = extractJS.replace(/\\n/g, '\n').replace(/\\t/g, '\t').trim()
  if (!script) return {}
  const result = await view.evaluate(`(async () => {
    const value = await (${script});
    return value && typeof value === 'object' ? value : {};
  })()`)
  const record = stringRecord(result)
  const fieldIDs = new Set(fields.map(field => field.id))
  return Object.fromEntries(Object.entries(record).filter(([key]) => fieldIDs.has(key)))
}

function stringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const out: Record<string, string> = {}
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw === 'string') out[key] = raw
  }
  return out
}

async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms))
}

async function promptText(label: string): Promise<string> {
  const rl = createInterface({ input, output })
  try {
    return (await rl.question(label)).trim()
  } finally {
    rl.close()
  }
}

async function promptSecret(label: string): Promise<string> {
  if (!input.isTTY) return promptText(label)
  try {
    execFileSync('stty', ['-echo'], { stdio: ['inherit', 'ignore', 'ignore'] })
    return await promptText(label)
  } finally {
    execFileSync('stty', ['echo'], { stdio: ['inherit', 'ignore', 'ignore'] })
    output.write('\n')
  }
}
