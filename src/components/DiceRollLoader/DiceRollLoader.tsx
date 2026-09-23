import { useEffect, useState } from 'react'
import styles from './DiceRollLoader.module.css'

interface DiceRollLoaderProps {
  /** Texto anunciado e exibido abaixo do dado, por exemplo "Importando 2 de 5". */
  label: string
  /** Linha secundária opcional, como o nome do arquivo em andamento. */
  detail?: string
}

const ROLL_INTERVAL_MS = 110

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
}

function randomFace(previous: number): number {
  // Nunca repete a face anterior, para o número sempre parecer em movimento.
  const next = 1 + Math.floor(Math.random() * 19)
  return next >= previous ? next + 1 : next
}

/**
 * Um d20 girando enquanto algo carrega, com a face sorteada trocando sem parar.
 * Com "reduzir movimento" ligado no sistema, o dado fica parado na face 20:
 * a regra global de `theme.css` já desliga a animação de CSS, e aqui o sorteio
 * de números também não roda.
 */
export function DiceRollLoader({ label, detail }: DiceRollLoaderProps) {
  const [face, setFace] = useState(20)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const timer = window.setInterval(() => setFace((current) => randomFace(current)), ROLL_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className={styles.loader} role="status" aria-live="polite">
      <svg
        className={styles.die}
        viewBox="0 0 100 100"
        width="72"
        height="72"
        aria-hidden="true"
        focusable="false"
      >
        {/* Silhueta do icosaedro visto de frente: hexágono com o triângulo central. */}
        <polygon className={styles.outline} points="50,4 90,27 90,73 50,96 10,73 10,27" />
        <polygon className={styles.face} points="50,24 76,68 24,68" />
        <polyline className={styles.edge} points="50,4 50,24" />
        <polyline className={styles.edge} points="90,27 76,68 90,73" />
        <polyline className={styles.edge} points="10,27 24,68 10,73" />
        <polyline className={styles.edge} points="50,96 76,68" />
        <polyline className={styles.edge} points="50,96 24,68" />
        <polyline className={styles.edge} points="10,27 50,24 90,27" />
        <text className={styles.number} x="50" y="57" textAnchor="middle" dominantBaseline="middle">
          {face}
        </text>
      </svg>
      <span className={styles.label}>{label}</span>
      {detail && <span className={styles.detail}>{detail}</span>}
    </div>
  )
}
