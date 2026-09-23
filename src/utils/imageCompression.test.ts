import { describe, expect, it, vi } from 'vitest'
import { compressDataUrlToMaxChars, type ImageEncoder } from './imageCompression'

const KB = 1024

function dataUrlOfLength(chars: number): string {
  const prefix = 'data:image/webp;base64,'
  return prefix + 'A'.repeat(Math.max(0, chars - prefix.length))
}

describe('compressDataUrlToMaxChars', () => {
  it('para no primeiro passo que já cabe no limite', async () => {
    const encode: ImageEncoder = vi.fn(async () => dataUrlOfLength(200 * KB))

    const result = await compressDataUrlToMaxChars(dataUrlOfLength(3000 * KB), 500 * KB, encode)

    expect(encode).toHaveBeenCalledTimes(1)
    expect(encode).toHaveBeenCalledWith(expect.any(String), 1024, 0.85)
    expect(result.length).toBe(200 * KB)
  })

  it('tenta passos cada vez mais agressivos até caber', async () => {
    const sizes: Record<number, number> = { 1024: 900 * KB, 800: 700 * KB, 640: 450 * KB }
    const encode: ImageEncoder = vi.fn(async (_dataUrl, maxDimension) =>
      dataUrlOfLength(sizes[maxDimension] ?? 10 * KB),
    )

    const result = await compressDataUrlToMaxChars(dataUrlOfLength(3000 * KB), 500 * KB, encode)

    expect(encode).toHaveBeenCalledTimes(3)
    expect(result.length).toBe(450 * KB)
  })

  it('é melhor esforço: devolve o menor resultado quando nada cabe', async () => {
    const sizes = [900, 800, 700, 650, 620, 600]
    let call = 0
    const encode: ImageEncoder = vi.fn(async () => dataUrlOfLength(sizes[call++] * KB))

    const result = await compressDataUrlToMaxChars(dataUrlOfLength(3000 * KB), 500 * KB, encode)

    expect(encode).toHaveBeenCalledTimes(6)
    expect(result.length).toBe(600 * KB)
  })

  it('nunca devolve algo maior que a imagem original', async () => {
    const original = dataUrlOfLength(600 * KB)
    const encode: ImageEncoder = vi.fn(async () => dataUrlOfLength(900 * KB))

    const result = await compressDataUrlToMaxChars(original, 500 * KB, encode)

    expect(result).toBe(original)
  })
})
