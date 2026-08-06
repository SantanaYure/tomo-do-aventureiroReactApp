// Sem ErrorBoundary, qualquer erro de renderização desmonta o app e deixa a
// página em branco — sem informação e sem saída. Aconteceu de verdade neste
// projeto: um rascunho local em formato antigo derrubava a ficha, e como o
// rascunho só era limpo após um salvamento (que nunca acontecia, porque a
// página não renderizava), a ficha ficava permanentemente inacessível.

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

function Explode(): never {
  throw new Error('falha proposital de renderização')
}

// React registra o erro no console mesmo quando ele é capturado; silenciar
// mantém a saída do teste legível sem esconder falha real.
let consoleError: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  consoleError.mockRestore()
})

describe('ErrorBoundary', () => {
  it('deixa a árvore passar quando não há erro', () => {
    render(
      <ErrorBoundary>
        <p>conteúdo normal</p>
      </ErrorBoundary>,
    )

    expect(screen.getByText('conteúdo normal')).toBeInTheDocument()
  })

  it('mostra uma tela contornável em vez de página em branco', () => {
    const { container } = render(
      <ErrorBoundary>
        <Explode />
      </ErrorBoundary>,
    )

    // O ponto principal: sobrou algo na tela.
    expect(container).not.toBeEmptyDOMElement()
    expect(screen.getByRole('alert')).toHaveTextContent(/Algo deu errado ao exibir esta tela/i)
  })

  it('tranquiliza quanto aos dados salvos', () => {
    render(
      <ErrorBoundary>
        <Explode />
      </ErrorBoundary>,
    )

    // O erro é de exibição; dizer isso evita que a pessoa ache que perdeu a ficha.
    expect(screen.getByRole('alert')).toHaveTextContent(/suas fichas continuam salvas/i)
  })

  it('oferece as duas saídas, alcançáveis por teclado', async () => {
    const onReload = vi.fn()
    const user = userEvent.setup()

    render(
      <ErrorBoundary onReload={onReload}>
        <Explode />
      </ErrorBoundary>,
    )

    const recarregar = screen.getByRole('button', { name: 'Recarregar' })
    expect(screen.getByRole('button', { name: 'Ir para o início' })).toBeInTheDocument()

    recarregar.focus()
    await user.keyboard('{Enter}')
    expect(onReload).toHaveBeenCalledTimes(1)
  })

  it('expõe o detalhe técnico sem poluir a tela', () => {
    render(
      <ErrorBoundary>
        <Explode />
      </ErrorBoundary>,
    )

    // Recolhido por padrão: útil para relatar, ruído para quem só quer voltar.
    const detalhe = screen.getByText('Detalhe técnico').closest('details')
    expect(detalhe).not.toHaveAttribute('open')
    expect(detalhe).toHaveTextContent('falha proposital de renderização')
  })

  it('registra o erro no console para diagnóstico', () => {
    render(
      <ErrorBoundary>
        <Explode />
      </ErrorBoundary>,
    )

    expect(consoleError).toHaveBeenCalled()
  })
})
