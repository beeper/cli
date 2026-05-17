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
      for (const field of step.fields) {
        const id = field.id
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
