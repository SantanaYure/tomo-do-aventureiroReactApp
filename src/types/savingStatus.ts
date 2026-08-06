/**
 * Estado real do ciclo de persistência de uma ficha.
 *
 * - `idle`    → nada foi editado desde que a ficha abriu
 * - `pending` → há alterações locais ainda NÃO enviadas ao Firestore
 * - `saving`  → há uma escrita em voo (inclui tentativas de retry)
 * - `saved`   → a última escrita foi confirmada pelo Firestore
 * - `error`   → a escrita falhou após todas as tentativas (rascunho local preservado)
 */
export type SavingStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

/** Rótulos em pt-BR exibidos no indicador de salvamento das fichas. */
export const SAVING_STATUS_LABELS: Record<SavingStatus, string> = {
  idle: '',
  pending: 'Alterações não salvas',
  saving: 'Salvando...',
  saved: 'Salvo',
  error: 'Erro ao salvar',
}
