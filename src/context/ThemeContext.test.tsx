import type { ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider, useTheme } from './ThemeContext'

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('style')
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: false,
    media: q,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }))
})

afterEach(() => vi.unstubAllGlobals())

describe('ThemeContext', () => {
  it('usa "light" quando não há preferência salva nem do SO', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.mode).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('respeita o valor salvo em localStorage', () => {
    localStorage.setItem('tomo:theme', 'dark')
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.mode).toBe('dark')
  })

  it('toggle cicla claro → escuro → pergaminho → claro e persiste', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.toggle())
    expect(result.current.mode).toBe('dark')
    expect(localStorage.getItem('tomo:theme')).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    act(() => result.current.toggle())
    expect(result.current.mode).toBe('parchment')
    expect(document.documentElement.getAttribute('data-theme')).toBe('parchment')

    act(() => result.current.toggle())
    expect(result.current.mode).toBe('light')
  })

  it('respeita "parchment" salvo em localStorage', () => {
    localStorage.setItem('tomo:theme', 'parchment')
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.mode).toBe('parchment')
  })

  it('setMode define um tema específico', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setMode('parchment'))
    expect(result.current.mode).toBe('parchment')
    act(() => result.current.setMode('light'))
    expect(result.current.mode).toBe('light')
  })

  it('useTheme lança fora do provider', () => {
    expect(() => renderHook(() => useTheme())).toThrow()
  })

  it('brandColor: aplica, persiste e volta ao padrão', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.brandColor).toBeNull()

    act(() => result.current.setBrandColor('#3b82f6'))
    expect(result.current.brandColor).toBe('#3b82f6')
    expect(localStorage.getItem('tomo:brand-color')).toBe('#3b82f6')
    expect(document.documentElement.style.getPropertyValue('--chip-violet-text')).toBe('#3b82f6')

    act(() => result.current.setBrandColor('cor-inválida'))
    expect(result.current.brandColor).toBeNull()

    act(() => result.current.setBrandColor(null))
    expect(localStorage.getItem('tomo:brand-color')).toBeNull()
    expect(document.documentElement.style.getPropertyValue('--brand')).toBe('')
  })

  it('brandColor salvo é lido na montagem', () => {
    localStorage.setItem('tomo:brand-color', '#22a06b')
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.brandColor).toBe('#22a06b')
  })

  it('fontChoice: default literary; modern troca as fontes e persiste', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.fontChoice).toBe('literary')

    act(() => result.current.setFontChoice('modern'))
    expect(localStorage.getItem('tomo:font')).toBe('modern')
    expect(document.documentElement.style.getPropertyValue('--font-body')).toContain('Inter')
  })
})
