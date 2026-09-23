import { describe, expect, it } from 'vitest'
import { dataUrlByteLength } from './imageSize'

function fakeDataUrl(byteLength: number): { dataUrl: string; expected: number } {
  const bytes = Buffer.alloc(byteLength, 1)
  const base64 = bytes.toString('base64')
  return { dataUrl: `data:image/png;base64,${base64}`, expected: byteLength }
}

describe('dataUrlByteLength', () => {
  it('calcula o tamanho decodificado para tamanhos exatos e com padding', () => {
    for (const size of [0, 1, 2, 3, 10, 999, 5 * 1024 * 1024]) {
      const { dataUrl, expected } = fakeDataUrl(size)
      expect(dataUrlByteLength(dataUrl)).toBe(expected)
    }
  })

  it('funciona sem o prefixo data:...;base64,', () => {
    const { dataUrl, expected } = fakeDataUrl(1234)
    const base64Only = dataUrl.split(',')[1]
    expect(dataUrlByteLength(base64Only)).toBe(expected)
  })

  it('devolve 0 para string vazia', () => {
    expect(dataUrlByteLength('data:image/png;base64,')).toBe(0)
  })
})
