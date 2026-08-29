// Deriva a URL do avatar do usuário a partir do e-mail (Gravatar).
//
// O Gravatar aceita hash SHA-256 além do MD5 legado — usamos SHA-256 porque o
// Web Crypto do navegador não implementa MD5 e não há lib de hash no projeto.
// `d=404`: sem avatar cadastrado, o Gravatar responde 404, o <img> dispara
// `onError` e o componente cai na inicial do primeiro nome.

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
    return `${GRAVATAR_BASE}/${hash}?d=404&s=${size}`
  } catch {
    // crypto.subtle indisponível (contexto não seguro / ambiente antigo)
    return null
  }
}
