import { describe, expect, it, vi } from 'vitest'
import { compressDataUrlToMaxBytes, type ImageEncoder } from './imageCompression'

function dataUrlOfSize(bytes: number): string {
  return `data:image/jpeg;base64,${'A'.repeat(Math.ceil((bytes * 4) / 3))}`
}

describe('compressDataUrlToMaxBytes', () => {
  it('para no primeiro passo que já cabe no limite', async () => {
    const encode: ImageEncoder = vi.fn(async (_dataUrl, maxDimension) =>
      // Passo de 1600px já cabe; os passos seguintes nem deveriam ser tentados.
      dataUrlOfSize(maxDimension === 1600 ? 3 * 1024 * 1024 : 10 * 1024 * 1024),
    )

    const result = await compressDataUrlToMaxBytes(dataUrlOfSize(6 * 1024 * 1024), 4 * 1024 * 1024, encode)

    expect(encode).toHaveBeenCalledTimes(1)
    expect(encode).toHaveBeenCalledWith(expect.any(String), 1600, 0.8)
    expect(result).toBe(dataUrlOfSize(3 * 1024 * 1024))
  })

  it('tenta passos cada vez mais agressivos até caber', async () => {
    const sizesByDimension: Record<number, number> = {
      1600: 8 * 1024 * 1024,
      1280: 6 * 1024 * 1024,
      1024: 3 * 1024 * 1024,
    }
    const encode: ImageEncoder = vi.fn(async (_dataUrl, maxDimension) =>
      dataUrlOfSize(sizesByDimension[maxDimension] ?? 1024),
    )

    const result = await compressDataUrlToMaxBytes(dataUrlOfSize(9 * 1024 * 1024), 4 * 1024 * 1024, encode)

    expect(encode).toHaveBeenCalledTimes(3)
    expect(result).toBe(dataUrlOfSize(3 * 1024 * 1024))
  })

  it('é melhor esforço: devolve o último passo mesmo sem caber no limite', async () => {
    const encode: ImageEncoder = vi.fn(async () => dataUrlOfSize(9 * 1024 * 1024))

    const result = await compressDataUrlToMaxBytes(dataUrlOfSize(20 * 1024 * 1024), 4 * 1024 * 1024, encode)

    expect(encode).toHaveBeenCalledTimes(6)
    expect(result).toBe(dataUrlOfSize(9 * 1024 * 1024))
  })
})
