import { compressDataUrlToMaxChars } from './imageCompression'

/**
 * Tamanho máximo do avatar guardado na ficha, em caracteres do data URL. O
 * Firestore recusa documentos acima de 1 MiB, e o avatar vive dentro do
 * documento da ficha; 500 KB deixa folga para o resto dos dados. Um avatar
 * importado acima disso é recomprimido até caber.
 */
export const AVATAR_MAX_STORED_CHARS = 500 * 1024

/**
 * Recomprime o avatar de uma ficha importada quando ele passa de
 * `AVATAR_MAX_STORED_CHARS`. `sheetData` é a mesma referência que
 * `getImportedSheetData` devolve de dentro do JSON completo; alterá-la aqui
 * já reflete no objeto que será reserializado antes de salvar.
 */
export async function compressOversizedAvatarIfNeeded(
  sheetData: Record<string, unknown>,
  scope: 'character' | 'monster' | 'npc',
): Promise<void> {
  const containerKey = scope === 'character' ? 'character' : 'details'
  const container = sheetData[containerKey]
  if (!container || typeof container !== 'object' || Array.isArray(container)) return

  const record = container as Record<string, unknown>
  const avatar = record.avatar
  if (typeof avatar !== 'string' || !avatar.startsWith('data:image')) return
  if (avatar.length <= AVATAR_MAX_STORED_CHARS) return

  try {
    record.avatar = await compressDataUrlToMaxChars(avatar, AVATAR_MAX_STORED_CHARS)
  } catch (error) {
    console.error('Erro ao comprimir avatar importado:', error)
    // Segue com a imagem original; se o documento passar do limite do
    // Firestore, o import recusa com o motivo `document-too-large`.
  }
}
