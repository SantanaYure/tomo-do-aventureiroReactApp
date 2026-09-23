/**
 * Redesenha uma imagem (data URL) num canvas de até `maxDimension` px no lado
 * maior e a recodifica na qualidade dada. Tenta WebP (menor e mantém
 * transparência) e cai para JPEG quando o navegador não sabe gerar WebP.
 * Só roda no navegador (usa `Image` e `<canvas>`), como o `AvatarCropper`.
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

  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, width, height)

  // Navegador sem encoder WebP devolve PNG em silêncio; aí vale o JPEG.
  const webp = canvas.toDataURL('image/webp', quality)
  if (webp.startsWith('data:image/webp')) return webp
  return canvas.toDataURL('image/jpeg', quality)
}

export type ImageEncoder = (
  dataUrl: string,
  maxDimension: number,
  quality: number,
) => Promise<string>

/**
 * Passos tentados em ordem, do mais fiel ao mais agressivo, até o resultado
 * caber no limite. O avatar aparece no máximo em ~400 px na interface, então
 * mesmo o primeiro passo já sobra em nitidez.
 */
const COMPRESSION_STEPS: Array<{ maxDimension: number; quality: number }> = [
  { maxDimension: 1024, quality: 0.85 },
  { maxDimension: 800, quality: 0.8 },
  { maxDimension: 640, quality: 0.75 },
  { maxDimension: 512, quality: 0.7 },
  { maxDimension: 400, quality: 0.6 },
  { maxDimension: 320, quality: 0.5 },
]

/**
 * Comprime uma imagem (data URL) até o texto dela caber em `maxChars`. O
 * Firestore mede o tamanho da string guardada (o base64 com prefixo), não a
 * imagem decodificada, então é isso que conta aqui.
 *
 * É melhor esforço: se nem o passo mais agressivo couber, devolve o menor
 * resultado obtido, em vez de travar a importação por causa da imagem.
 */
export async function compressDataUrlToMaxChars(
  dataUrl: string,
  maxChars: number,
  encode: ImageEncoder = encodeWithCanvas,
): Promise<string> {
  let best = dataUrl

  for (const step of COMPRESSION_STEPS) {
    const candidate = await encode(dataUrl, step.maxDimension, step.quality)
    if (candidate.length < best.length) best = candidate
    if (candidate.length <= maxChars) return candidate
  }

  return best
}
