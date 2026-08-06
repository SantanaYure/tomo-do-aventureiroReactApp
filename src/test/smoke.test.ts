// Teste de fumaça: confirma que o ambiente de testes (jsdom + vitest) está ativo.
import { describe, expect, it } from 'vitest'

describe('ambiente de testes', () => {
  it('roda em jsdom com document disponível', () => {
    const el = document.createElement('div')
    el.textContent = 'tomo'
    expect(el).toHaveTextContent('tomo')
  })

  it('tem timers controláveis pelo vitest', () => {
    expect(typeof setTimeout).toBe('function')
  })
})
