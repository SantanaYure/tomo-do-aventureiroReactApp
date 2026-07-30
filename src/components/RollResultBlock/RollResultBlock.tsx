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
  const trimmedName = itemName?.trim()
  const clearLabel = trimmedName
    ? `Limpar resultado da rolagem de ${trimmedName}`
    : 'Limpar resultado da rolagem'

  return (
    <div className={styles.rollResult}>
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
        onClick={onClear}
        aria-label={clearLabel}
        title="Limpar resultado"
      >
        ✕
      </button>
    </div>
  )
}
