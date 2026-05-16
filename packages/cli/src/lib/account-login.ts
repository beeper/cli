import { createInterface } from 'node:readline/promises'
import { execFileSync } from 'node:child_process'
import { stdin as input, stderr as output } from 'node:process'
import type {
  AuthStartLoginResponse,
  AuthSubmitCookiesResponse,
  AuthSubmitUserInputResponse,
  AuthWaitForStepResponse,
} from '@beeper/desktop-api/resources/matrix/bridges/auth.js'
import type BeeperDesktop from '@beeper/desktop-api'

export type AccountLoginStep =
  | AuthStartLoginResponse
  | AuthSubmitCookiesResponse
  | AuthSubmitUserInputResponse
  | AuthWaitForStepResponse

export type AccountLoginOptions = {
  cookies?: Record<string, string>
  fields?: Record<string, string>
  nonInteractive?: boolean
}

type CommonStep = {
  instructions?: string
  login_id?: string
  step_id?: string
  type: string
}

export function printAccountLoginStep(step: AccountLoginStep): void {
  const common = step as CommonStep
  output.write(`step: ${common.type}\n`)
  if (common.instructions) output.write(`${common.instructions}\n`)
  if (common.login_id) output.write(`login_id: ${common.login_id}\n`)
  if (common.step_id) output.write(`step_id: ${common.step_id}\n`)

  if ('display_and_wait' in step) {
    const display = step.display_and_wait
    output.write(`display: ${display.type}\n`)
    if (display.data) output.write(`${display.data}\n`)
    if (display.image_url) output.write(`image: ${display.image_url}\n`)
  } else if ('user_input' in step) {
    for (const field of step.user_input.fields) {
      const details = [field.type, field.description, field.options?.length ? `options: ${field.options.join(', ')}` : undefined]
        .filter(Boolean)
        .join(' | ')
      output.write(`field ${field.id}: ${field.name}${details ? ` (${details})` : ''}\n`)
    }
  } else if ('cookies' in step) {
    output.write(`url: ${step.cookies.url}\n`)
    if (step.cookies.user_agent) output.write(`user_agent: ${step.cookies.user_agent}\n`)
    if (step.cookies.wait_for_url_pattern) output.write(`wait_for_url_pattern: ${step.cookies.wait_for_url_pattern}\n`)
    for (const field of step.cookies.fields) output.write(`cookie field ${field.name}: ${field.type}\n`)
    if (step.cookies.extract_js) output.write(`extract_js:\n${step.cookies.extract_js}\n`)
  } else if ('complete' in step) {
    output.write(`complete: ${step.complete.user_login_id ?? 'yes'}\n`)
  }
}

export async function runGuidedAccountLogin(client: BeeperDesktop, bridgeID: string, initialStep: AccountLoginStep, options: AccountLoginOptions = {}): Promise<AccountLoginStep> {
  let step = initialStep
  for (;;) {
    printAccountLoginStep(step)
    if ('complete' in step) return step

    const loginProcessID = (step as CommonStep).login_id
    const stepID = (step as CommonStep).step_id
    if (!loginProcessID || !stepID) throw new Error('Account login step did not include login_id and step_id.')

    if ('display_and_wait' in step) {
      await promptText('Press Enter after completing this step.')
      step = await client.matrix.bridges.auth.waitForStep(stepID, { bridgeID, loginProcessID })
      continue
    }

    if ('user_input' in step) {
      const body: Record<string, string> = {}
      for (const field of step.user_input.fields) {
        if (options.fields?.[field.id] !== undefined) {
          body[field.id] = options.fields[field.id]!
          continue
        }

        if (options.nonInteractive) {
          if (field.default_value !== undefined) {
            body[field.id] = field.default_value
            continue
          }

          throw new Error(`Missing required field ${field.id}. Pass --field ${field.id}=... or run without --non-interactive.`)
        }

        const fallback = field.default_value ? ` [${field.default_value}]` : ''
        const value = await promptText(`${field.name}${fallback}: `)
        body[field.id] = value || field.default_value || ''
      }
      step = await client.matrix.bridges.auth.submitUserInput(stepID, { bridgeID, loginProcessID, body })
      continue
    }

    if ('cookies' in step) {
      const body: Record<string, string> = {}
      for (const field of step.cookies.fields) {
        if (options.cookies?.[field.name] !== undefined) {
          body[field.name] = options.cookies[field.name]!
          continue
        }

        if (options.nonInteractive) throw new Error(`Missing required cookie ${field.name}. Pass --cookie ${field.name}=... or run without --non-interactive.`)
        body[field.name] = await promptSecret(`${field.name}: `)
      }
      step = await client.matrix.bridges.auth.submitCookies(stepID, { bridgeID, loginProcessID, body })
      continue
    }

    throw new Error(`Unsupported account login step: ${(step as CommonStep).type}`)
  }
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
