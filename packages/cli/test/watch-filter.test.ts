import { describe, expect, it } from 'bun:test'
import { passesFilter } from '../src/commands/watch.js'

describe('watch passesFilter', () => {
  const body = (type: string) => JSON.stringify({ type, chatID: '!x:beeper.com' })

  it('passes through when no filter is set', () => {
    expect(passesFilter(body('message.upserted'))).toBe(true)
  })

  it('respects include set', () => {
    const filter = { include: new Set(['message.upserted']) }
    expect(passesFilter(body('message.upserted'), filter)).toBe(true)
    expect(passesFilter(body('message.deleted'), filter)).toBe(false)
    expect(passesFilter(body('chat.upserted'), filter)).toBe(false)
  })

  it('respects exclude set', () => {
    const filter = { exclude: new Set(['chat.upserted', 'chat.deleted']) }
    expect(passesFilter(body('message.upserted'), filter)).toBe(true)
    expect(passesFilter(body('chat.upserted'), filter)).toBe(false)
  })

  it('passes-through events without a type field', () => {
    expect(passesFilter(JSON.stringify({ chatID: 'x' }), { include: new Set(['message.upserted']) })).toBe(true)
  })

  it('passes-through unparseable bodies', () => {
    expect(passesFilter('not json', { include: new Set(['message.upserted']) })).toBe(true)
  })
})
