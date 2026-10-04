import { describe, expect, it } from 'bun:test'
import { listLabels, resolveLabelID } from '../src/lib/labels.js'

const client = {
  labels: {
    list: async () => [
      { id: 'label-work', name: 'Work' },
      { id: 'label-customers', name: 'Customers' },
      { id: 'label-community', name: 'Community' },
    ],
  },
}

describe('labels', () => {
  it('lists labels from the SDK response', async () => {
    await expect(listLabels(client)).resolves.toEqual([
      { id: 'label-work', name: 'Work' },
      { id: 'label-customers', name: 'Customers' },
      { id: 'label-community', name: 'Community' },
    ])
  })

  it('resolves an exact label name case-insensitively', async () => {
    await expect(resolveLabelID(client, 'work')).resolves.toBe('label-work')
  })

  it('resolves an exact label ID', async () => {
    await expect(resolveLabelID(client, 'label-customers')).resolves.toBe('label-customers')
  })

  it('resolves a unique partial label name', async () => {
    await expect(resolveLabelID(client, 'comm')).resolves.toBe('label-community')
  })

  it('fails when no label matches', async () => {
    await expect(resolveLabelID(client, 'does-not-exist')).rejects.toThrow('No label matches')
  })

  it('fails on ambiguous partial matches', async () => {
    const ambiguousClient = {
      labels: {
        list: async () => [
          { id: 'label-work', name: 'Work' },
          { id: 'label-workshops', name: 'Workshops' },
        ],
      },
    }
    await expect(resolveLabelID(ambiguousClient, 'wor')).rejects.toThrow('Multiple labels match')
  })
})
