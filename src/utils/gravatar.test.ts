import { describe, expect, it } from 'vitest'
import { gravatarUrlFromEmail } from './gravatar'

describe('gravatarUrlFromEmail', () => {
  it('usa o hash SHA-256 do e-mail normalizado (minúsculas, sem espaços)', async () => {
    // Hash SHA-256 documentado pelo Gravatar para "test@example.com".
    const expected =
      '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b'
    const url = await gravatarUrlFromEmail('  Test@Example.com  ')
    expect(url).toBe(`https://www.gravatar.com/avatar/${expected}?d=blank&s=200`)
  })

  it('inclui d=blank para devolver PNG transparente (200) quando não há avatar', async () => {
    const url = await gravatarUrlFromEmail('a@b.com')
    expect(url).toContain('d=blank')
  })

  it('aceita um tamanho customizado', async () => {
    const url = await gravatarUrlFromEmail('a@b.com', 64)
    expect(url).toMatch(/s=64$/)
  })

  it('retorna null para e-mail vazio', async () => {
    expect(await gravatarUrlFromEmail('   ')).toBeNull()
  })
})
