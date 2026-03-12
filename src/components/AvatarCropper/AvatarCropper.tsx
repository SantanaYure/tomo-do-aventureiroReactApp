import { useCallback, useRef, useState, type ChangeEvent } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import styles from './AvatarCropper.module.css'

interface AvatarCropperProps {
  currentImage?: string
  onSave: (base64: string) => void
  onCancel: () => void
}

async function getCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  quality: number,
): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  const size = 400
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas context unavailable')
  }

  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size,
  )

  return canvas.toDataURL('image/jpeg', quality)
}

export function AvatarCropper({
  currentImage,
  onSave,
  onCancel,
}: AvatarCropperProps) {
  const [rawImage, setRawImage] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [quality, setQuality] = useState(0.82)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setQuality(0.7)
      window.alert(
        'A imagem selecionada é grande. O avatar será salvo com compressão maior.',
      )
    } else {
      setQuality(0.82)
    }

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      setRawImage(loadEvent.target?.result as string)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handleCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleConfirm() {
    if (!rawImage || !croppedAreaPixels || isSaving) return

    setIsSaving(true)

    try {
      const base64 = await getCroppedImage(rawImage, croppedAreaPixels, quality)
      onSave(base64)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={styles.overlay} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-cropper-title"
      >
        <h2 id="avatar-cropper-title" className={styles.title}>
          Avatar do personagem
        </h2>

        {!rawImage ? (
          <div className={styles.uploadArea}>
            {currentImage && (
              <img src={currentImage} alt="Avatar atual" className={styles.currentAvatar} />
            )}
            <p className={styles.hint}>
              {currentImage
                ? 'Troque ou recorte uma nova imagem.'
                : 'Escolha uma imagem para usar como avatar.'}
            </p>
            <button
              type="button"
              className={styles.selectButton}
              onClick={() => inputRef.current?.click()}
            >
              Selecionar arquivo
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <>
            <div className={styles.cropContainer}>
              <Cropper
                image={rawImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
                cropShape="rect"
                showGrid={false}
                style={{
                  containerStyle: { background: 'rgba(30, 20, 10, 0.9)' },
                  cropAreaStyle: {
                    border: '2px solid var(--accent)',
                    boxShadow: '0 0 0 9999px rgba(20, 12, 4, 0.72)',
                  },
                }}
              />
            </div>

            <div className={styles.zoomRow}>
              <span className={styles.zoomLabel}>Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className={styles.zoomSlider}
              />
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setRawImage(null)}
              >
                Trocar foto
              </button>
              <button
                type="button"
                className={styles.confirmButton}
                onClick={handleConfirm}
                disabled={isSaving}
              >
                {isSaving ? 'Salvando...' : 'Salvar avatar'}
              </button>
            </div>
          </>
        )}

        {!rawImage && (
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onCancel}
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}