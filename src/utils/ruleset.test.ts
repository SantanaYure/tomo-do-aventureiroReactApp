import { beforeEach, describe, expect, it } from 'vitest'
import { RULESET_KEY, matchesRuleset, readStoredRuleset } from './ruleset'

beforeEach(() => {
  localStorage.clear()
})

describe('readStoredRuleset', () => {
  it('retorna "all" quando não há nada salvo', () => {
    expect(readStoredRuleset()).toBe('all')
  })

  it('lê um valor válido salvo', () => {
    localStorage.setItem(RULESET_KEY, '2024')
    expect(readStoredRuleset()).toBe('2024')
  })

  it('ignora lixo salvo e cai no padrão', () => {
    localStorage.setItem(RULESET_KEY, 'lixo')
    expect(readStoredRuleset()).toBe('all')
  })
})

describe('matchesRuleset', () => {
  it('"all" combina com qualquer ruleset de item', () => {
    expect(matchesRuleset('all', '2014')).toBe(true)
    expect(matchesRuleset('all', '2024')).toBe(true)
  })

  it('uma preferência específica só combina com o mesmo ruleset', () => {
    expect(matchesRuleset('2014', '2014')).toBe(true)
    expect(matchesRuleset('2014', '2024')).toBe(false)
    expect(matchesRuleset('2024', '2024')).toBe(true)
    expect(matchesRuleset('2024', '2014')).toBe(false)
  })
})
