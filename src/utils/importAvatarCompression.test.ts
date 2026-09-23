import { beforeEach, describe, expect, it, vi } from 'vitest'

const compressDataUrlToMaxChars = vi.fn(
  async (_dataUrl: string, _maxChars: number) => 'data:image/webp;base64,COMPRIMIDO',
)

vi.mock('./imageCompression', () => ({
  compressDataUrlToMaxChars: (dataUrl: string, maxChars: number) =>
    compressDataUrlToMaxChars(dataUrl, maxChars),
}))

const { compressOversizedAvatarIfNeeded, AVATAR_MAX_STORED_CHARS } = await import(
  './importAvatarCompression'
)

function avatarOfLength(chars: number): string {
  return `data:image/png;base64,${'A'.repeat(chars)}`
}

beforeEach(() => {
  compressDataUrlToMaxChars.mockClear()
})

describe('compressOversizedAvatarIfNeeded', () => {
  it('comprime o avatar do PJ acima do limite guardado', async () => {
    const original = avatarOfLength(3_000_000)
    const sheetData = { character: { name: 'Valeros', avatar: original } }

    await compressOversizedAvatarIfNeeded(sheetData, 'character')

    expect(compressDataUrlToMaxChars).toHaveBeenCalledWith(original, AVATAR_MAX_STORED_CHARS)
    expect(sheetData.character.avatar).toBe('data:image/webp;base64,COMPRIMIDO')
  })

  it('comprime o avatar de monstro/NPC em details.avatar', async () => {
    // Caso real: PNG de 1254 px com ~3 MB em base64, abaixo de 5 MB mas
    // muito acima do que cabe num documento do Firestore.
    const sheetData = { details: { name: 'Cavaleiro da Morte', avatar: avatarOfLength(3_137_000) } }

    await compressOversizedAvatarIfNeeded(sheetData, 'monster')

    expect(compressDataUrlToMaxChars).toHaveBeenCalledTimes(1)
    expect(sheetData.details.avatar).toBe('data:image/webp;base64,COMPRIMIDO')
  })

  it('não mexe em avatar que já cabe', async () => {
    const original = avatarOfLength(300 * 1024)
    const sheetData = { character: { name: 'Valeros', avatar: original } }

    await compressOversizedAvatarIfNeeded(sheetData, 'character')

    expect(compressDataUrlToMaxChars).not.toHaveBeenCalled()
    expect(sheetData.character.avatar).toBe(original)
  })

  it('ignora quando não há avatar ou não é imagem', async () => {
    await compressOversizedAvatarIfNeeded({ character: { name: 'Valeros' } }, 'character')
    await compressOversizedAvatarIfNeeded({ character: { avatar: 'x'.repeat(900_000) } }, 'character')
    expect(compressDataUrlToMaxChars).not.toHaveBeenCalled()
  })

  it('segue sem travar quando a compressão falha', async () => {
    compressDataUrlToMaxChars.mockRejectedValueOnce(new Error('canvas indisponível'))
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const original = avatarOfLength(3_000_000)
    const sheetData = { character: { name: 'Valeros', avatar: original } }

    await compressOversizedAvatarIfNeeded(sheetData, 'character')

    expect(sheetData.character.avatar).toBe(original)
    expect(error).toHaveBeenCalled()
    error.mockRestore()
  })
})
