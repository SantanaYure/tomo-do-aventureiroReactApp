import { describe, expect, it } from 'vitest'
import { stripUnsupportedFirestoreValues } from './firestoreSafe'

describe('stripUnsupportedFirestoreValues', () => {
  it('remove listas aninhadas em qualquer nível e mantém o resto', () => {
    const input = { a: [1, [2], { b: [[3], 4] }], c: 'ok', d: null }
    expect(stripUnsupportedFirestoreValues(input)).toEqual({ a: [1, { b: [4] }], c: 'ok', d: null })
  })

  it('troca números não finitos por null', () => {
    expect(stripUnsupportedFirestoreValues({ n: Infinity, m: NaN, o: 2 })).toEqual({ n: null, m: null, o: 2 })
  })
})
