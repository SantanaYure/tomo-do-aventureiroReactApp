/**
 Alfabeto seguro de 32 caracteres (Base32 Crockford-like),
 omitindo caracteres ambíguos: 0 (zero), O (ó), 1 (um), I (i).
 */
const INVITE_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
export const INVITE_CODE_LENGTH = 6

/**
 * Gera um código de convite aleatório de 6 caracteres.
 */
export function generateInviteCode(): string {
  let result = ''
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * INVITE_CODE_ALPHABET.length)
    result += INVITE_CODE_ALPHABET[randomIndex]
  }
  return result
}

/**
 * Normaliza um código inserido pelo usuário:
 * Converte para maiúsculas, remove espaços e hífens.
 */
export function normalizeInviteCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

/**
 * Valida se a string é um código de convite válido de 6 caracteres.
 */
export function isValidInviteCode(code: string): boolean {
  const normalized = normalizeInviteCode(code)
  if (normalized.length !== INVITE_CODE_LENGTH) {
    return false
  }
  for (const char of normalized) {
    if (!INVITE_CODE_ALPHABET.includes(char)) {
      return false
    }
  }
  return true
}

/**
 * Formata para exibição com separador amigável (ex.: ABC-123).
 */
export function formatInviteCode(code: string): string {
  const normalized = normalizeInviteCode(code)
  if (normalized.length <= 3) return normalized
  return `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}`
}
