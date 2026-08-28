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
})
