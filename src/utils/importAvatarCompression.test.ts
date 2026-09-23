import { describe, expect, it, vi, beforeEach } from 'vitest'

const compressDataUrlToMaxBytes = vi.fn(async (_dataUrl: string, _maxBytes: number) => 'data:image/jpeg;base64,COMPRIMIDO')

vi.mock('./imageCompression', () => ({
  compressDataUrlToMaxBytes: (dataUrl: string, maxBytes: number) =>
    compressDataUrlToMaxBytes(dataUrl, maxBytes),
}))

const { compressOversizedAvatarIfNeeded, AVATAR_COMPRESSION_TARGET_BYTES } = await import(
  './importAvatarCompression'
)

function bigAvatar(bytes: number): string {
  return `data:image/png;base64,${'A'.repeat(Math.ceil((bytes * 4) / 3))}`
}

beforeEach(() => {
  compressDataUrlToMaxBytes.mockClear()
})

describe('compressOversizedAvatarIfNeeded', () => {
  it('comprime o avatar do PJ quando passa de 5 MB', async () => {
    const sheetData = { character: { name: 'Valeros', avatar: bigAvatar(6 * 1024 * 1024) } }

    const originalAvatar = sheetData.character.avatar
    await compressOversizedAvatarIfNeeded(sheetData, 'character')

    expect(compressDataUrlToMaxBytes).toHaveBeenCalledWith(originalAvatar, AVATAR_COMPRESSION_TARGET_BYTES)
    expect(sheetData.character.avatar).toBe('data:image/jpeg;base64,COMPRIMIDO')
  })

  it('comprime o avatar do monstro/NPC em details.avatar', async () => {
    const sheetData = { details: { name: 'Lobo', avatar: bigAvatar(7 * 1024 * 1024) } }

    await compressOversizedAvatarIfNeeded(sheetData, 'monster')

    expect(compressDataUrlToMaxBytes).toHaveBeenCalledTimes(1)
    expect(sheetData.details.avatar).toBe('data:image/jpeg;base64,COMPRIMIDO')
  })

  it('não mexe em avatar dentro do limite', async () => {
    const original = bigAvatar(1 * 1024 * 1024)
    const sheetData = { character: { name: 'Valeros', avatar: original } }

    await compressOversizedAvatarIfNeeded(sheetData, 'character')

    expect(compressDataUrlToMaxBytes).not.toHaveBeenCalled()
    expect(sheetData.character.avatar).toBe(original)
  })

  it('ignora quando não há avatar ou não é imagem', async () => {
    const semAvatar = { character: { name: 'Valeros' } }
    await compressOversizedAvatarIfNeeded(semAvatar, 'character')
    expect(compressDataUrlToMaxBytes).not.toHaveBeenCalled()

    const avatarTexto = { character: { name: 'Valeros', avatar: 'não é imagem' } }
    await compressOversizedAvatarIfNeeded(avatarTexto, 'character')
    expect(compressDataUrlToMaxBytes).not.toHaveBeenCalled()
  })

  it('segue sem travar quando a compressão falha', async () => {
    compressDataUrlToMaxBytes.mockRejectedValueOnce(new Error('canvas indisponível'))
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const original = bigAvatar(6 * 1024 * 1024)
    const sheetData = { character: { name: 'Valeros', avatar: original } }

    await compressOversizedAvatarIfNeeded(sheetData, 'character')

    expect(sheetData.character.avatar).toBe(original)
    expect(error).toHaveBeenCalled()
    error.mockRestore()
  })
})
