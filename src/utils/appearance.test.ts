import { afterEach, describe, expect, it } from 'vitest'
import {
  applyAppearance,
  brandTokens,
  isValidColor,
  readStoredBrandColor,
  readStoredFont,
  toHex,
} from './appearance'

afterEach(() => {
  document.documentElement.removeAttribute('style')
  localStorage.clear()
})

describe('isValidColor', () => {
  it('aceita hex, rgb e rgba', () => {
    expect(isValidColor('#8b5cf6')).toBe(true)
    expect(isValidColor('#abc')).toBe(true)
    expect(isValidColor('rgb(139, 92, 246)')).toBe(true)
    expect(isValidColor('rgba(139, 92, 246, 0.5)')).toBe(true)
  })

  it('rejeita lixo e vazio', () => {
    expect(isValidColor('')).toBe(false)
    expect(isValidColor('   ')).toBe(false)
    expect(isValidColor('roxo')).toBe(false)
    expect(isValidColor('#gggggg')).toBe(false)
  })
})

describe('toHex', () => {
  it('normaliza hex curto e longo', () => {
    expect(toHex('#ABC')).toBe('#aabbcc')
    expect(toHex('#8B5CF6')).toBe('#8b5cf6')
    expect(toHex('#8b5cf6ff')).toBe('#8b5cf6')
  })

  it('converte rgb para hex', () => {
    expect(toHex('rgb(139, 92, 246)')).toBe('#8b5cf6')
    expect(toHex('rgba(255 0 0 / 0.5)')).toBe('#ff0000')
  })
})

describe('brandTokens', () => {
  it('deriva os tokens de destaque da cor', () => {
    const t = brandTokens('#3b82f6')
    expect(t['--brand']).toBe('#3b82f6')
    expect(t['--chip-violet-text']).toBe('#3b82f6')
    expect(t['--chip-violet-bg']).toContain('color-mix(in oklab, #3b82f6 16%')
    expect(t['--chip-violet-border']).toContain('42%')
  })
})

describe('applyAppearance', () => {
  it('aplica a cor de marca e remove ao voltar para o padrão', () => {
    const root = document.documentElement
    applyAppearance(root, '#3b82f6', 'literary')
    expect(root.style.getPropertyValue('--chip-violet-text')).toBe('#3b82f6')
    expect(root.style.getPropertyValue('--brand')).toBe('#3b82f6')

    applyAppearance(root, null, 'literary')
    expect(root.style.getPropertyValue('--chip-violet-text')).toBe('')
    expect(root.style.getPropertyValue('--brand')).toBe('')
  })

  it('ignora cor inválida (mantém o padrão do tema)', () => {
    const root = document.documentElement
    applyAppearance(root, 'não-é-cor', 'literary')
    expect(root.style.getPropertyValue('--chip-violet-text')).toBe('')
  })

  it('"modern" troca display + corpo por sans; "literary" remove', () => {
    const root = document.documentElement
    applyAppearance(root, null, 'modern')
    expect(root.style.getPropertyValue('--font-display')).toContain('Inter')
    expect(root.style.getPropertyValue('--font-body')).toContain('Inter')

    applyAppearance(root, null, 'literary')
    expect(root.style.getPropertyValue('--font-display')).toBe('')
    expect(root.style.getPropertyValue('--font-body')).toBe('')
  })
})

describe('leitura do localStorage', () => {
  it('readStoredBrandColor devolve só cor válida', () => {
    localStorage.setItem('tomo:brand-color', '#3b82f6')
    expect(readStoredBrandColor()).toBe('#3b82f6')
    localStorage.setItem('tomo:brand-color', 'lixo')
    expect(readStoredBrandColor()).toBeNull()
  })

  it('readStoredFont default é literary', () => {
    expect(readStoredFont()).toBe('literary')
    localStorage.setItem('tomo:font', 'modern')
    expect(readStoredFont()).toBe('modern')
  })
})
