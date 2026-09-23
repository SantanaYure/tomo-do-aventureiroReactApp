import { dataUrlByteLength } from './imageSize'

/**
 * Redesenha uma imagem (data URL) num canvas de até `maxDimension` px no lado
 * maior e a recodifica em JPEG na qualidade dada. Só roda no navegador (usa
 * `Image` e `<canvas>`), como o resto do fluxo de avatar (`AvatarCropper`).
 */
export async function encodeWithCanvas(
  dataUrl: string,
  maxDimension: number,
  quality: number,
): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Não foi possível carregar a imagem para compressão.'))
    img.src = dataUrl
  })

  const largestSide = Math.max(image.naturalWidth, image.naturalHeight) || maxDimension
  const scale = Math.min(1, maxDimension / largestSide)
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas indisponível para compressão de imagem.')

  context.drawImage(image, 0, 0, width, height)

  // JPEG (sem transparência) reduz bem mais que PNG para fotos grandes; o
  // avatar já é exibido num recorte opaco em todo o app.
  return canvas.toDataURL('image/jpeg', quality)
}

export type ImageEncoder = (
  dataUrl: string,
  maxDimension: number,
  quality: number,
) => Promise<string>

/**
 * Passos tentados em ordem, do mais fiel ao mais agressivo, até o resultado
 * caber no limite. Cada avatar já passa pelo `AvatarCropper` num recorte
 * quadrado pequeno quando enviado pela UI; isso só entra para imagens vindas
 * de importação, que podem ser a foto original, sem recorte.
 */
const COMPRESSION_STEPS: Array<{ maxDimension: number; quality: number }> = [
  { maxDimension: 1600, quality: 0.8 },
  { maxDimension: 1280, quality: 0.7 },
  { maxDimension: 1024, quality: 0.6 },
  { maxDimension: 800, quality: 0.5 },
  { maxDimension: 640, quality: 0.4 },
  { maxDimension: 480, quality: 0.35 },
]

/**
 * Comprime uma imagem (data URL) até caber em `maxBytes`, tentando os passos
 * de `COMPRESSION_STEPS` em ordem. É melhor esforço: se nem o passo mais
 * agressivo couber, devolve o resultado desse último passo mesmo assim, em
 * vez de travar a importação por causa do tamanho de uma imagem.
 */
export async function compressDataUrlToMaxBytes(
  dataUrl: string,
  maxBytes: number,
  encode: ImageEncoder = encodeWithCanvas,
): Promise<string> {
  let best = dataUrl

  for (const step of COMPRESSION_STEPS) {
    best = await encode(dataUrl, step.maxDimension, step.quality)
    if (dataUrlByteLength(best) <= maxBytes) return best
  }

  return best
}
