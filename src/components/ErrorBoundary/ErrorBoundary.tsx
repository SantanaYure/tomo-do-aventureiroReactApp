import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import styles from './ErrorBoundary.module.css'

export interface ErrorBoundaryProps {
  children: ReactNode
  /** Injetável para teste; por padrão recarrega a página. */
  onReload?: () => void
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Captura erros de renderização e mostra uma tela contornável.
 *
 * Sem isto, qualquer erro numa árvore de componente desmonta o app inteiro e o
 * usuário fica com uma página em branco, sem informação e sem saída. Aconteceu
 * de verdade neste projeto: um rascunho local em formato antigo derrubava a
 * ficha, e como o rascunho só era limpo após um salvamento — que nunca ocorria,
 * porque a página não renderizava — a ficha ficava permanentemente inacessível.
 *
 * Precisa ser classe: `componentDidCatch` e `getDerivedStateFromError` não têm
 * equivalente em hooks.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Sem serviço de telemetria no projeto; o console é o que há.
    console.error('Erro não tratado na interface:', error, info.componentStack)
  }

  handleReload = () => {
    if (this.props.onReload) {
      this.props.onReload()
      return
    }
    window.location.reload()
  }

  handleBackToStart = () => {
    // Navegação dura de propósito: o roteador pode estar no estado quebrado.
    window.location.href = '/'
  }

  render() {
    const { error } = this.state

    if (!error) {
      return this.props.children
    }

    return (
      <div className={styles.container} role="alert">
        <h1 className={styles.title}>Algo deu errado ao exibir esta tela</h1>
        <p className={styles.message}>
          O erro foi apenas na exibição — suas fichas continuam salvas. Tente recarregar;
          se voltar a acontecer, volte ao início e abra a ficha de novo.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.button} onClick={this.handleReload}>
            Recarregar
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={this.handleBackToStart}
          >
            Ir para o início
          </button>
        </div>
        <details className={styles.details}>
          <summary className={styles.summary}>Detalhe técnico</summary>
          <pre className={styles.stack}>{error.message}</pre>
        </details>
      </div>
    )
  }
}
