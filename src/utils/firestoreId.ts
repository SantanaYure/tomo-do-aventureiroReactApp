/**
 * Regras de id de documento do Firestore, para dados vindos de fora (arquivo
 * importado). Um id que falha aqui não é descartado com erro: quem chama gera
 * um id automático no lugar.
 *
 * Regras: texto não vazio, até 1500 bytes em UTF-8, sem `/`, diferente de `.`
 * e `..`, e sem o formato reservado `__qualquer__`.
 * https://firebase.google.com/docs/firestore/quotas#collections_documents_and_fields
 */
const MAX_DOC_ID_BYTES = 1500

export function isValidFirestoreDocId(value: unknown): value is string {
  if (typeof value !== 'string') return false
  if (value.length === 0 || value.trim() !== value) return false
  if (value.includes('/')) return false
  if (value === '.' || value === '..') return false
  if (/^__.*__$/.test(value)) return false
  return new TextEncoder().encode(value).length <= MAX_DOC_ID_BYTES
}

/** Devolve o id aparado quando ele é válido; `null` quando falta ou é inválido. */
export function readImportedDocId(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return isValidFirestoreDocId(trimmed) ? trimmed : null
}
