import { useRef } from 'react'
import { formatRollLine, type DamageRollSummary } from '../../utils/diceRoller'
import styles from './RollResultBlock.module.css'

interface RollResultBlockProps {
  /** Resultado produzido por `rollDamages`. */
  summary: DamageRollSummary
  /** Remove apenas este resultado. */
  onClear: () => void
  /** Nome do item rolado, usado para diferenciar os rótulos na leitura de tela. */
  itemName?: string
}

/**
 * Bloco de resultado de rolagem de dano, com o controle manual de limpar.
 *
 * Existe um único componente porque os seis pontos que rolam dano (ataques,
 * habilidades, modo mesa do PJ, ações/reações/habilidades de monstro e modo
 * mesa do monstro) exibiam exatamente a mesma marcação e o mesmo CSS —
 * duplicá-lo seria abrir espaço para seis comportamentos divergentes.
 */
export function RollResultBlock({ summary, onClear, itemName }: RollResultBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Espelha o texto do card, que mostra "(sem nome)" quando o item não tem
  // nome — o rótulo lido em voz alta não pode divergir do que está na tela.
  const trimmedName = itemName?.trim() || '(sem nome)'
  const clearLabel = `Limpar resultado da rolagem de ${trimmedName}`

  function handleClear() {
    // O botão desmonta a si mesmo ao limpar. Sem reposicionar, o foco cai no
    // <body> e quem navega por teclado volta ao topo do documento. O destino
    // natural é o botão que originou este resultado: o primeiro <button> da
    // área de rolagem que envolve este bloco ("Rolar dano"). O teste de cada
    // um dos seis pontos confere esse destino, então uma mudança de estrutura
    // que quebre a busca não passa silenciosa.
    const rollTrigger = containerRef.current?.parentElement?.querySelector('button')
    if (rollTrigger instanceof HTMLElement) rollTrigger.focus()

    onClear()
  }

  return (
    <div className={styles.rollResult} ref={containerRef}>
      <div className={styles.rollLines}>
        {summary.results.map((result, index) => (
          <span key={index} className={styles.rollLine}>
            {formatRollLine(result)}
          </span>
        ))}
        <span className={styles.rollTotal}>Total: {summary.total}</span>
      </div>

      <button
        type="button"
        className={styles.clearButton}
        onClick={handleClear}
        aria-label={clearLabel}
        title="Limpar resultado"
      >
        ✕
      </button>
    </div>
  )
}
