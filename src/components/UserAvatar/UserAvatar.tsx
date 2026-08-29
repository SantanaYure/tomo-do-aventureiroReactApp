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
  const [providerBroken, setProviderBroken] = useState(false)

  useEffect(() => {
    let active = true
    setProviderBroken(false)
    if (!email) {
      setGravatar(null)
      return
    }
    gravatarUrlFromEmail(email).then((url) => {
      if (active) setGravatar(url)
    })
    return () => {
      active = false
    }
  }, [email, photoURL])

  const classes = `${styles.avatar} ${styles[size]}`

  // Foto do provedor (Google): opaca, tem prioridade.
  if (photoURL && !providerBroken) {
    return (
      <img
        src={photoURL}
        alt=""
        className={classes}
        referrerPolicy="no-referrer"
        onError={() => setProviderBroken(true)}
      />
    )
  }

  // Base = inicial do nome. Se houver e-mail, o Gravatar (d=blank) fica por cima:
  // opaco quando existe avatar, transparente (deixa ver a inicial) quando não.
  return (
    <span className={`${classes} ${styles.fallback}`} aria-hidden="true">
      {initialFor(displayName, email)}
      {gravatar && (
        <img
          src={gravatar}
          alt=""
          className={styles.gravatarOverlay}
          referrerPolicy="no-referrer"
        />
      )}
    </span>
  )
}
