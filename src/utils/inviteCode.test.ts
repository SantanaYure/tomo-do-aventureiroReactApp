import { describe, it, expect } from 'vitest'
import {
  generateInviteCode,
  normalizeInviteCode,
  isValidInviteCode,
  formatInviteCode,
  INVITE_CODE_LENGTH,
} from './inviteCode'

describe('inviteCode utils', () => {
  it('gera código com exatamente 6 caracteres válidos', () => {
    const code = generateInviteCode()
    expect(code).toHaveLength(INVITE_CODE_LENGTH)
    expect(isValidInviteCode(code)).toBe(true)
  })

  it('evita caracteres ambíguos na geração', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateInviteCode()
      expect(code).not.toMatch(/[0O1I]/)
    }
  })

  it('normaliza códigos removendo hífens, espaços e convertendo para maiúsculas', () => {
    expect(normalizeInviteCode('abc-def')).toBe('ABCDEF')
    expect(normalizeInviteCode(' tm 7k9p ')).toBe('TM7K9P')
    expect(normalizeInviteCode('a-b-c-d-e-f')).toBe('ABCDEF')
  })

  it('valida corretamente códigos válidos e inválidos', () => {
    expect(isValidInviteCode('TM7K9P')).toBe(true)
    expect(isValidInviteCode('tm-7k9p')).toBe(true)
    expect(isValidInviteCode('SHORT')).toBe(false) // 5 chars
    expect(isValidInviteCode('TOOLONG1')).toBe(false) // 8 chars
    expect(isValidInviteCode('ABC0EF')).toBe(false) // contém '0'
    expect(isValidInviteCode('ABC1EF')).toBe(false) // contém '1'
    expect(isValidInviteCode('ABCOEF')).toBe(false) // contém 'O'
    expect(isValidInviteCode('ABCIEF')).toBe(false) // contém 'I'
  })

  it('formata códigos para exibição', () => {
    expect(formatInviteCode('TM7K9P')).toBe('TM7-K9P')
    expect(formatInviteCode('tm7k9p')).toBe('TM7-K9P')
    expect(formatInviteCode('AB')).toBe('AB')
  })
})
