import { useCallback, useRef } from 'react'
import type { KeyboardEvent } from 'react'

export interface SheetTabsProps<T extends string> {
  tabs: readonly T[]
  activeTab: T
  onTabChange: (tab: T) => void
  tabButtonIds: Record<T, string>
  tabPanelIds: Record<T, string>
  ariaLabel: string
  /** Classe do contêiner (vem do módulo CSS de cada página). */
  className?: string
  /** Classe de cada aba. */
  tabClassName: string
  /** Classe adicional da aba ativa. */
  activeTabClassName: string
}

/**
 * Barra de abas das fichas, no padrão WAI-ARIA de tablist com ativação
 * automática.
 *
 * Duas coisas que a versão anterior, escrita direto nas páginas, não fazia:
 *
 * - **Roving tabindex**: só a aba ativa entra na ordem de tabulação. Antes as
 *   sete abas entravam, então alcançar o conteúdo da ficha exigia sete Tabs.
 * - **Setas, Home e End**: o padrão exige navegar entre abas com as setas.
 *   Antes elas não faziam nada.
 */
export function SheetTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  tabButtonIds,
  tabPanelIds,
  ariaLabel,
  className,
  tabClassName,
  activeTabClassName,
}: SheetTabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null)

  const selectTab = useCallback(
    (tab: T) => {
      onTabChange(tab)
      // O foco acompanha a seleção, como o padrão exige. Em `requestAnimation-
      // Frame` porque o `tabIndex` do alvo só vira 0 depois do re-render.
      requestAnimationFrame(() => {
        listRef.current?.querySelector<HTMLButtonElement>(`#${CSS.escape(tabButtonIds[tab])}`)?.focus()
      })
    },
    [onTabChange, tabButtonIds],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const moveBy = (offset: number) => {
        const currentIndex = tabs.indexOf(activeTab)
        // Circula nas pontas: da última para a primeira e vice-versa.
        const nextIndex = (currentIndex + offset + tabs.length) % tabs.length
        selectTab(tabs[nextIndex])
      }

      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault()
          moveBy(1)
          break
        case 'ArrowLeft':
          event.preventDefault()
          moveBy(-1)
          break
        case 'Home':
          event.preventDefault()
          selectTab(tabs[0])
          break
        case 'End':
          event.preventDefault()
          selectTab(tabs[tabs.length - 1])
          break
        default:
          break
      }
    },
    [activeTab, selectTab, tabs],
  )

  return (
    <div
      ref={listRef}
      className={className}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
    >
      {tabs.map((tab) => {
        const isActive = tab === activeTab
        return (
          <button
            key={tab}
            id={tabButtonIds[tab]}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={tabPanelIds[tab]}
            tabIndex={isActive ? 0 : -1}
            className={isActive ? `${tabClassName} ${activeTabClassName}` : tabClassName}
            onClick={() => onTabChange(tab)}
          >
            {tab}
          </button>
        )
      })}
    </div>
  )
}
