import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCharacterSheets } from '../../hooks/useCharacterSheets'
import { useMonsterSheets } from '../../hooks/useMonsterSheets'
import { getOpenedAt } from '../../utils/recentlyOpened'
import styles from './Home.module.css'

// ── Sub-componentes ────────────────────────────────────────────

function CounterCard({
  label,
  value,
  icon,
  loading,
  href,
}: {
  label: string
  value: number
  icon: string
  loading: boolean
  href: string
}) {
  return (
    <Link to={href} className={styles.counterCard} aria-label={`${value} ${label}`}>
      <span className={styles.counterIcon} aria-hidden="true">{icon}</span>
      <div className={styles.counterContent}>
        {loading ? (
          <span className={styles.counterSkeleton} aria-hidden="true" />
        ) : (
          <strong className={styles.counterValue}>{value}</strong>
        )}
        <span className={styles.counterLabel}>{label}</span>
      </div>
    </Link>
  )
}

const TYPE_ICON: Record<string, string> = {
  character: '⚔',
  monster: '👹',
  npc: '👤',
}

const TYPE_LABEL: Record<string, string> = {
  character: 'PJ',
  monster: 'Monstro',
  npc: 'NPC',
}

function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return `Há ${diffDays} dias`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `Há ${weeks} semana${weeks > 1 ? 's' : ''}`
  }
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

type RecentItemData = {
  id: string
  name: string
  type: 'character' | 'monster' | 'npc'
  updatedAt: string
  href: string
  meta: string
  avatar: string
}

function RecentItem({ item }: { item: RecentItemData }) {
  return (
    <Link to={item.href} className={styles.recentItem}>
      <div className={styles.recentVisual} aria-hidden="true">
        {item.avatar ? (
          <img
            src={item.avatar}
            alt=""
            className={styles.recentAvatar}
            loading="lazy"
          />
        ) : (
          <span className={styles.recentIcon}>{TYPE_ICON[item.type]}</span>
        )}
      </div>
      <div className={styles.recentInfo}>
        <span className={styles.recentName}>{item.name}</span>
        <span className={styles.recentMeta}>
          {TYPE_LABEL[item.type]}{item.meta ? ` · ${item.meta}` : ''}
        </span>
      </div>
      <span className={styles.recentDate}>{formatRelativeDate(item.updatedAt)}</span>
      <span className={styles.recentArrow} aria-hidden="true">›</span>
    </Link>
  )
}

function RecentSkeleton() {
  return (
    <div className={styles.recentSkeletonList}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={styles.recentSkeletonItem}>
          <span className={styles.skeletonIcon} />
          <div className={styles.skeletonLines}>
            <span className={styles.skeletonLine} />
            <span className={styles.skeletonLine} />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyRecent() {
  return (
    <div className={styles.emptyRecent}>
      <span className={styles.emptyIcon} aria-hidden="true">📜</span>
      <p className={styles.emptyText}>Nenhuma ficha criada ainda.</p>
      <Link to="/fichas" className={styles.emptyLink}>
        Criar primeira ficha
      </Link>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────

export function Home() {
  const { user, uid } = useAuth()
  const { sheets, isLoading: isLoadingSheets } = useCharacterSheets(uid)
  const { monsters, isLoading: isLoadingMonsters } = useMonsterSheets(uid)

  const isLoading = isLoadingSheets || isLoadingMonsters
  const firstName = user?.displayName?.split(' ')[0] ?? 'Aventureiro'

  const totalCharacters = sheets.length
  const totalMonsters = monsters.filter((m) => m.data.details.kind === 'monster').length
  const totalNpcs = monsters.filter((m) => m.data.details.kind === 'npc').length

  const recentItems: RecentItemData[] = [
    ...sheets.map((s) => {
      const openedAt = getOpenedAt(s.id)
      const sortKey = openedAt && openedAt > s.updatedAt ? openedAt : s.updatedAt
      return {
        id: s.id,
        name: s.data.character.name || '(sem nome)',
        type: 'character' as const,
        updatedAt: sortKey,
        href: `/ficha/${s.id}`,
        meta: s.data.character.race || '',
        avatar: s.data.character.avatar || '',
      }
    }),
    ...monsters.map((m) => {
      const openedAt = getOpenedAt(m.id)
      const sortKey = openedAt && openedAt > m.updatedAt ? openedAt : m.updatedAt
      return {
        id: m.id,
        name: m.data.details.name || '(sem nome)',
        type: m.data.details.kind as 'monster' | 'npc',
        updatedAt: sortKey,
        href: `/monstro/${m.id}`,
        meta: m.data.details.species || '',
        avatar: m.data.details.avatar || '',
      }
    }),
  ]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 4)

  return (
    <div className={styles.page}>
      {/* Saudação */}
      <section className={styles.greeting}>
        <h1 className={styles.greetingTitle}>
          Bem-vindo, <span className={styles.greetingName}>{firstName}</span>
        </h1>
        <p className={styles.greetingSubtitle}>
          Suas fichas de PJ, monstros e NPCs
        </p>
        <div className={styles.ornament} aria-hidden="true">✦ ✦ ✦</div>
      </section>

      {/* Contadores */}
      <section className={styles.counters} aria-label="Resumo da coleção">
        <CounterCard
          label="PJs"
          value={totalCharacters}
          icon="⚔"
          loading={isLoading}
          href="/fichas"
        />
        <CounterCard
          label="Monstros"
          value={totalMonsters}
          icon="👹"
          loading={isLoading}
          href="/fichas"
        />
        <CounterCard
          label="NPCs"
          value={totalNpcs}
          icon="👤"
          loading={isLoading}
          href="/fichas"
        />
      </section>

      {/* Fichas recentes */}
      <section className={styles.recentSection} aria-label="Fichas recentes">
        <h2 className={styles.sectionTitle}>Abertas recentemente</h2>

        {isLoading ? (
          <RecentSkeleton />
        ) : recentItems.length === 0 ? (
          <EmptyRecent />
        ) : (
          <ul className={styles.recentList} role="list">
            {recentItems.map((item) => (
              <li key={item.id}>
                <RecentItem item={item} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
