import { describe, expect, it } from 'vitest'
import { matchesSender } from '../src/commands/messages/list.js'

describe('messages list matchesSender', () => {
  it('matches "me" for outgoing messages', () => {
    expect(matchesSender({ isSender: true }, 'me')).toBe(true)
    expect(matchesSender({ isSender: false }, 'me')).toBe(false)
    expect(matchesSender({}, 'me')).toBe(false)
  })

  it('matches "others" for incoming messages', () => {
    expect(matchesSender({ isSender: false }, 'others')).toBe(true)
    expect(matchesSender({}, 'others')).toBe(true)
    expect(matchesSender({ isSender: true }, 'others')).toBe(false)
  })

  it('matches by specific senderID', () => {
    expect(matchesSender({ senderID: '@alice:beeper.com' }, '@alice:beeper.com')).toBe(true)
    expect(matchesSender({ senderID: '@bob:beeper.com' }, '@alice:beeper.com')).toBe(false)
  })

  it('rejects non-objects', () => {
    expect(matchesSender(null, 'me')).toBe(false)
    expect(matchesSender('hello', 'me')).toBe(false)
  })
})
