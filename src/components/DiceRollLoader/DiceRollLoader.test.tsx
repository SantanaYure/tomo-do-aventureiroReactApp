import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DiceRollLoader } from './DiceRollLoader'

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }))
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('DiceRollLoader', () => {
  it('anuncia o progresso como status para leitores de tela', () => {
    stubReducedMotion(false)
    render(<DiceRollLoader label="Importando 2 de 5" detail="lobo.json" />)

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Importando 2 de 5')
    expect(status).toHaveTextContent('lobo.json')
  })

  it('troca a face do dado enquanto rola', () => {
    stubReducedMotion(false)
    const { container } = render(<DiceRollLoader label="Importando" />)
    const faceText = () => container.querySelector('text')?.textContent

    const faces = new Set<string | null | undefined>([faceText()])
    for (let i = 0; i < 10; i += 1) {
      act(() => {
        vi.advanceTimersByTime(110)
      })
      faces.add(faceText())
    }

    expect(faces.size).toBeGreaterThan(1)
    for (const face of faces) {
      const n = Number(face)
      expect(n).toBeGreaterThanOrEqual(1)
      expect(n).toBeLessThanOrEqual(20)
    }
  })

  it('fica parado no 20 com "reduzir movimento" ligado', () => {
    stubReducedMotion(true)
    const { container } = render(<DiceRollLoader label="Importando" />)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(container.querySelector('text')?.textContent).toBe('20')
  })
})
