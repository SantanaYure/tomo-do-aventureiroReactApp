// Sonda de renderização para os testes de performance.
//
// Por que assim: um "wrapper que conta renders" colocado ao redor do componente
// no teste não mede o que interessa — o wrapper re-renderiza sempre que a página
// re-renderiza, mesmo quando o componente real, memoizado, aborta. Contando as
// leituras do CSS Module *do próprio componente* medimos a execução real do corpo
// do componente de produção: se o `memo` aborta, o corpo não roda, nenhuma classe
// é lida e o contador não sobe. Nenhum componente é substituído por réplica.
//
// Uso (o `vi.mock` é hoisted, mas a factory é lazy — declarar a sonda antes do
// `await import(...)` da página é suficiente):
//
//   const probe = createStyleRenderProbe('statsGrid')
//   vi.mock('../../components/X/X.module.css', () => ({ default: probe.styles }))
//
// `sentinelKey` precisa ser uma classe lida exatamente uma vez por render, em
// qualquer ramo do JSX. Os testes conferem isso assertando 1 render na montagem.

export interface StyleRenderProbe {
  /** Objeto a devolver no lugar do CSS Module do componente. */
  styles: Record<string, string>
  /** Quantas vezes o corpo do componente rodou desde o último `reset()`. */
  renders: number
  reset(): void
}

export function createStyleRenderProbe(sentinelKey: string): StyleRenderProbe {
  const probe: StyleRenderProbe = {
    styles: null as unknown as Record<string, string>,
    renders: 0,
    reset() {
      probe.renders = 0
    },
  }

  probe.styles = new Proxy(
    {} as Record<string, string>,
    {
      get(_target, property) {
        if (property === sentinelKey) {
          probe.renders += 1
        }

        // Devolve o nome da classe para que o DOM continue inspecionável.
        return typeof property === 'string' ? property : undefined
      },
    },
  )

  return probe
}
