import React, { useEffect, useState } from 'react'
import { Box, render, Text, useApp } from 'ink'
import Spinner from 'ink-spinner'
import { glyphs, theme } from './theme.js'

type State =
  | { kind: 'spinning'; label: string }
  | { kind: 'succeed'; label: string }
  | { kind: 'fail'; label: string }

const externalListeners = new Map<symbol, (state: State) => void>()

type SpinnerLineProps = {
  id: symbol
  initial: State
}

const SpinnerLine: React.FC<SpinnerLineProps> = ({ id, initial }) => {
  const [state, setState] = useState<State>(initial)
  const { exit } = useApp()

  useEffect(() => {
    externalListeners.set(id, value => {
      setState(value)
      if (value.kind !== 'spinning') {
        setTimeout(() => exit(), 0)
      }
    })
    return () => { externalListeners.delete(id) }
  }, [id, exit])

  if (state.kind === 'spinning') {
    return (
      <Box>
        <Text color={theme.primary}><Spinner type="dots" /></Text>
        <Text color={theme.muted}> {state.label}</Text>
      </Box>
    )
  }
  if (state.kind === 'succeed') {
    return (
      <Box>
        <Text color={theme.primary}>{glyphs.check}</Text>
        <Text color={theme.text}> {state.label}</Text>
      </Box>
    )
  }
  return (
    <Box>
      <Text color={theme.danger}>{glyphs.cross}</Text>
      <Text color={theme.text}> {state.label}</Text>
    </Box>
  )
}

export type SpinnerHandle = {
  update(label: string): void
  succeed(label?: string): Promise<void>
  fail(label?: string): Promise<void>
  stop(): Promise<void>
}

export function createInkSpinner(initialLabel: string, stream: NodeJS.WriteStream = process.stderr): SpinnerHandle {
  const id = Symbol('spinner')
  let currentLabel = initialLabel
  let finished = false

  const instance = render(
    <SpinnerLine id={id} initial={{ kind: 'spinning', label: initialLabel }} />,
    { stdout: stream as unknown as NodeJS.WriteStream, exitOnCtrlC: false, patchConsole: false },
  )

  const finish = (state: State): Promise<void> => {
    if (finished) return Promise.resolve()
    finished = true
    const listener = externalListeners.get(id)
    if (listener) listener(state)
    else instance.unmount()
    return instance.waitUntilExit().then(() => undefined).catch(() => undefined)
  }

  return {
    update(label) {
      if (finished) return
      currentLabel = label
      const listener = externalListeners.get(id)
      listener?.({ kind: 'spinning', label })
    },
    succeed(label) {
      return finish({ kind: 'succeed', label: label ?? currentLabel })
    },
    fail(label) {
      return finish({ kind: 'fail', label: label ?? currentLabel })
    },
    stop() {
      if (finished) return Promise.resolve()
      finished = true
      instance.unmount()
      return instance.waitUntilExit().then(() => undefined).catch(() => undefined)
    },
  }
}

export async function withInkSpinner<T>(
  label: string,
  fn: () => Promise<T>,
  options?: { done?: (value: T) => string | undefined; stream?: NodeJS.WriteStream },
): Promise<T> {
  if (process.env.BEEPER_QUIET === '1') return fn()
  const stream = options?.stream ?? process.stderr
  const spinner = createInkSpinner(label, stream)
  try {
    const value = await fn()
    const doneLabel = options?.done?.(value)
    if (doneLabel) await spinner.succeed(doneLabel)
    else await spinner.stop()
    return value
  } catch (error) {
    await spinner.fail(label)
    throw error
  }
}
