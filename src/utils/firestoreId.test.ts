import { describe, expect, it } from 'vitest'
import { isValidFirestoreDocId, readImportedDocId } from './firestoreId'

describe('isValidFirestoreDocId', () => {
  it('aceita ids comuns, inclusive os automáticos do Firestore', () => {
    expect(isValidFirestoreDocId('Xk3pQ9aLm2Vb7Ty1Rz0c')).toBe(true)
    expect(isValidFirestoreDocId('ficha-do-valeros')).toBe(true)
    expect(isValidFirestoreDocId('ação')).toBe(true)
  })

  it('recusa o que o Firestore recusaria', () => {
    expect(isValidFirestoreDocId('')).toBe(false)
    expect(isValidFirestoreDocId('a/b')).toBe(false)
    expect(isValidFirestoreDocId('.')).toBe(false)
    expect(isValidFirestoreDocId('..')).toBe(false)
    expect(isValidFirestoreDocId('__reservado__')).toBe(false)
    expect(isValidFirestoreDocId('x'.repeat(1501))).toBe(false)
    expect(isValidFirestoreDocId(42)).toBe(false)
    expect(isValidFirestoreDocId(null)).toBe(false)
  })

  it('conta bytes em UTF-8, não caracteres', () => {
    // "ç" ocupa 2 bytes: 751 deles passam do limite de 1500.
    expect(isValidFirestoreDocId('ç'.repeat(750))).toBe(true)
    expect(isValidFirestoreDocId('ç'.repeat(751))).toBe(false)
  })
})

describe('readImportedDocId', () => {
  it('apara espaços e devolve null para ausente ou inválido', () => {
    expect(readImportedDocId('  ficha-1  ')).toBe('ficha-1')
    expect(readImportedDocId(undefined)).toBeNull()
    expect(readImportedDocId('   ')).toBeNull()
    expect(readImportedDocId('pasta/ficha')).toBeNull()
    expect(readImportedDocId(123)).toBeNull()
  })
})
