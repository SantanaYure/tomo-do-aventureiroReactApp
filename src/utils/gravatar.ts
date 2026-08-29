// Deriva a URL do avatar do usuário a partir do e-mail (Gravatar).
//
// O Gravatar aceita hash SHA-256 além do MD5 legado — usamos SHA-256 porque o
// Web Crypto do navegador não implementa MD5 e não há lib de hash no projeto.
// `d=blank`: sem avatar cadastrado, o Gravatar devolve um PNG 100% transparente
// (HTTP 200). O `UserAvatar` sobrepõe essa imagem à inicial do nome — quando há
// avatar, ele cobre a inicial; quando não há, a inicial aparece através do PNG
// transparente. Assim não há 404 sujando o console.

const GRAVATAR_BASE = 'https://www.gravatar.com/avatar'

export async function gravatarUrlFromEmail(
  email: string,
  size = 200,
): Promise<string | null> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return null

  try {
    const bytes = new TextEncoder().encode(normalized)
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    const hash = Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
    return `${GRAVATAR_BASE}/${hash}?d=blank&s=${size}`
  } catch {
    // crypto.subtle indisponível (contexto não seguro / ambiente antigo)
    return null
  }
}
