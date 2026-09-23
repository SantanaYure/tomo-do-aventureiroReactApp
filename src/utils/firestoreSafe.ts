/**
 * Deixa um valor vindo de arquivo importado dentro do que o Firestore aceita
 * gravar. O modelo das fichas nunca usa lista dentro de lista, então uma lista
 * aninhada só aparece em campo desconhecido, vindo de outro programa: ela é
 * descartada em vez de derrubar a gravação inteira ("Nested arrays are not
 * supported"). Valores não serializáveis em JSON (undefined, funções) também
 * saem.
 */
export function stripUnsupportedFirestoreValues<T>(value: T): T {
  return clean(value, false) as T
}

function clean(value: unknown, insideArray: boolean): unknown {
  if (Array.isArray(value)) {
    if (insideArray) return undefined
    return value
      .map((item) => clean(item, true))
      .filter((item) => item !== undefined)
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value)) {
      const cleaned = clean(entry, false)
      if (cleaned !== undefined) out[key] = cleaned
    }
    return out
  }
  if (typeof value === 'function' || typeof value === 'symbol' || value === undefined) {
    return undefined
  }
  if (typeof value === 'number' && !Number.isFinite(value)) return null
  return value
}

/**
 * Limite prático de um documento do Firestore. O teto oficial é 1 MiB
 * (1.048.576 bytes) contando nomes de campo e metadados; ficar em 1.000.000
 * de bytes do JSON deixa margem para essa diferença.
 */
export const FIRESTORE_DOC_SAFE_BYTES = 1_000_000

/** Tamanho aproximado, em bytes UTF-8, de um documento antes de gravar. */
export function estimateFirestoreDocBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length
}
