import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { UserAvatar, initialFor } from './UserAvatar'

describe('initialFor', () => {
  it('usa a inicial do primeiro nome', () => {
    expect(initialFor('Yure dos Santos Santana', 'y@x.com')).toBe('Y')
  })

  it('sem nome, usa a primeira letra do e-mail', () => {
    expect(initialFor(null, 'bruno@x.com')).toBe('B')
  })

  it('sem nome nem e-mail, usa "?"', () => {
    expect(initialFor(null, null)).toBe('?')
  })
})

// A imagem é decorativa (alt=""), sem role acessível — consulta via DOM.
describe('UserAvatar', () => {
  it('usa a foto do provedor quando existe', () => {
    const { container } = render(
      <UserAvatar photoURL="https://example.com/p.jpg" email="a@b.com" displayName="Ana" />,
    )
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://example.com/p.jpg',
    )
  })

  it('sem foto do provedor, busca o Gravatar pelo e-mail', async () => {
    const { container } = render(<UserAvatar email="test@example.com" displayName="Ana" />)
    await waitFor(() => {
      expect(container.querySelector('img')?.getAttribute('src')).toContain(
        'gravatar.com/avatar/',
      )
    })
  })

  it('sem foto e sem e-mail, mostra a inicial do primeiro nome', () => {
    const { container } = render(<UserAvatar displayName="Ana Lima" />)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('cai na inicial quando a foto falha ao carregar', () => {
    const { container } = render(
      <UserAvatar photoURL="https://example.com/quebrada.jpg" displayName="Ana" />,
    )
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    fireEvent.error(img!)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('A')).toBeInTheDocument()
  })
})
