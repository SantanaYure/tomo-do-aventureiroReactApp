import { useEffect, useState } from 'react'
import { gravatarUrlFromEmail } from '../../utils/gravatar'
import styles from './UserAvatar.module.css'

type AvatarSize = 'md' | 'lg'

interface UserAvatarProps {
  photoURL?: string | null
  email?: string | null
  displayName?: string | null
  size?: AvatarSize
}

/** Inicial do primeiro nome; sem nome, cai na primeira letra do e-mail. */
export function initialFor(displayName?: string | null, email?: string | null): string {
  const first = displayName?.trim().split(/\s+/)[0]
  if (first) return first[0]!.toUpperCase()
  const local = email?.trim()[0]
  return local ? local.toUpperCase() : '?'
}

export function UserAvatar({ photoURL, email, displayName, size = 'md' }: UserAvatarProps) {
  const [gravatar, setGravatar] = useState<string | null>(null)
  const [broken, setBroken] = useState<Record<string, true>>({})

  useEffect(() => {
    let active = true
    if (!email) {
      setGravatar(null)
      return
    }
    // Confere o Gravatar via fetch antes de renderizar o <img>: com d=404, uma
    // conta sem avatar responde 404 e cairíamos na inicial de qualquer forma —
    // mas checar aqui evita o erro "Failed to load resource" no console.
    gravatarUrlFromEmail(email)
      .then(async (url) => {
        if (!url) return null
        try {
          const response = await fetch(url, { mode: 'cors' })
          return response.ok ? url : null
        } catch {
          return null
        }
      })
      .then((url) => {
        if (active) setGravatar(url)
      })
    return () => {
      active = false
    }
  }, [email])

  // Prioridade: foto do provedor → foto do e-mail (Gravatar) → inicial.
  const src =
    [photoURL, gravatar].find((url): url is string => !!url && !broken[url]) ?? null
  const classes = `${styles.avatar} ${styles[size]}`

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={classes}
        referrerPolicy="no-referrer"
        onError={() => setBroken((current) => ({ ...current, [src]: true }))}
      />
    )
  }

  return (
    <span className={`${classes} ${styles.fallback}`} aria-hidden="true">
      {initialFor(displayName, email)}
    </span>
  )
}
