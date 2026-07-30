import styles from './RouteFallback.module.css'

/**
 * Exibido enquanto o pedaço de código de uma rota sob demanda é buscado.
 *
 * `role="status"` com `aria-live="polite"` para que leitores de tela anunciem
 * a espera sem interromper o que o usuário estiver fazendo.
 */
export function RouteFallback() {
  return (
    <div className={styles.fallback} role="status" aria-live="polite">
      Abrindo o tomo...
    </div>
  )
}
