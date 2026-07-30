// Critério: "nenhuma tela pisca ou pula durante transições".
//
// Estes avisos aparecem e somem enquanto o usuário digita — o de cópia local
// chega a piscar a cada ciclo de salvamento com o localStorage cheio. Enquanto
// eram blocos no fluxo normal, cada entrada e saída empurrava a ficha inteira.
//
// jsdom não faz layout, então não dá para medir deslocamento de verdade. O que
// dá para provar de forma honesta é a invariante que elimina o deslocamento:
// os avisos vivem numa região fora do fluxo (`position: fixed`) e não emitem
// nenhum nó quando não há aviso.

import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SheetNotices } from './SheetNotices'

const NOOP = () => {}

const cssFonte = readFileSync(
  join(process.cwd(), 'src', 'components', 'SheetNotices', 'SheetNotices.module.css'),
  'utf8',
)

describe('SheetNotices', () => {
  it('não renderiza nada quando não há aviso', () => {
    const { container } = render(
      <SheetNotices
        localBackupError={null}
        recoveredDraftAt={null}
        onSaveNow={NOOP}
        onDismissRecovery={NOOP}
      />,
    )

    // Sem isto, um contêiner vazio ainda ocuparia uma linha no fluxo.
    expect(container).toBeEmptyDOMElement()
  })

  it('a região fica fora do fluxo do documento', () => {
    // É esta declaração que impede o conteúdo de pular quando um aviso entra
    // ou sai. jsdom não a avalia, então verifico a fonte.
    expect(cssFonte).toMatch(/\.region\s*\{[^}]*position:\s*fixed/)
  })

  it('a região vazia não intercepta cliques do conteúdo atrás', () => {
    expect(cssFonte).toMatch(/\.region\s*\{[^}]*pointer-events:\s*none/)
    expect(cssFonte).toMatch(/\.notice\s*\{[^}]*pointer-events:\s*auto/)
  })

  it('anuncia a falha de cópia local como alerta, com ação de salvar', () => {
    render(
      <SheetNotices
        localBackupError="quota"
        recoveredDraftAt={null}
        onSaveNow={NOOP}
        onDismissRecovery={NOOP}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(/armazenamento do navegador está cheio/i)
    expect(screen.getByRole('button', { name: 'Salvar agora' })).toBeInTheDocument()
  })

  it('anuncia a recuperação de rascunho como status, sem roubar o foco', () => {
    render(
      <SheetNotices
        localBackupError={null}
        recoveredDraftAt="2026-01-02T10:00:00.000Z"
        onSaveNow={NOOP}
        onDismissRecovery={NOOP}
      />,
    )

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(/Recuperamos alterações que não chegaram a ser salvas/i)
    // `polite` para não interromper quem está digitando.
    expect(status).toHaveAttribute('aria-live', 'polite')
  })

  it('mostra os dois avisos ao mesmo tempo quando ambos ocorrem', () => {
    render(
      <SheetNotices
        localBackupError="unavailable"
        recoveredDraftAt="2026-01-02T10:00:00.000Z"
        onSaveNow={NOOP}
        onDismissRecovery={NOOP}
      />,
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
