import { dataUrlByteLength } from './imageSize'
import { compressDataUrlToMaxBytes } from './imageCompression'

// Um avatar importado acima disso é recomprimido para caber no alvo abaixo,
// em vez de travar a importação inteira por causa do tamanho da imagem.
export const AVATAR_COMPRESSION_TRIGGER_BYTES = 5 * 1024 * 1024
export const AVATAR_COMPRESSION_TARGET_BYTES = 4 * 1024 * 1024

/**
 * Recomprime o avatar de uma ficha importada quando ele passa de
 * `AVATAR_COMPRESSION_TRIGGER_BYTES`. `sheetData` é a mesma referência que
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
  if (dataUrlByteLength(avatar) <= AVATAR_COMPRESSION_TRIGGER_BYTES) return

  try {
    record.avatar = await compressDataUrlToMaxBytes(avatar, AVATAR_COMPRESSION_TARGET_BYTES)
  } catch (error) {
    console.error('Erro ao comprimir avatar importado:', error)
    // Segue com a imagem original; se ainda for grande demais para o
    // Firestore, o import falha com o motivo `save-failed`.
  }
}
