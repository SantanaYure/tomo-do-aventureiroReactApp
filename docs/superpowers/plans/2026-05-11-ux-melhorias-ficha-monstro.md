# UX — Melhorias Ficha de Monstro/Personagem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o bloco de combate (CA, PV, gerenciador de HP, deslocamento, resistências/imunidades) persistente em todas as abas da ficha de monstro; adicionar rótulos claros aos grupos de chips; exibir o nome da ficha no título do navegador; e corrigir a nomenclatura dos arquivos JSON exportados.

**Architecture:** Novo componente `MonsterCombatSummary` renderizado em `MonsterSheetPage` fora do tabpanel, eliminando a Seção B de `MonsterTableMode`. O título do navegador é controlado por `useEffect` em ambas as páginas de ficha. A nomenclatura de export é ajustada diretamente nos handlers de `CharactersPage`.

**Tech Stack:** React 19, TypeScript 5, CSS Modules, Firebase Firestore (sem framework de testes — verificação via browser manual)

---

## File Structure

| Operação | Arquivo | Responsabilidade |
|---|---|---|
| CREATE | `src/components/monster/MonsterCombatSummary/MonsterCombatSummary.tsx` | Bloco de combate persistente (CA, PV, HP manager, chips com rótulos) |
| CREATE | `src/components/monster/MonsterCombatSummary/MonsterCombatSummary.module.css` | Estilos do bloco de combate |
| MODIFY | `src/pages/MonsterSheetPage/MonsterSheetPage.tsx` | Importar/renderizar MonsterCombatSummary; adicionar `document.title` |
| MODIFY | `src/components/monster/MonsterTableMode/MonsterTableMode.tsx` | Remover Seção B (estado, funções e JSX) |
| MODIFY | `src/components/monster/MonsterTableMode/MonsterTableMode.module.css` | Remover estilos exclusivos da Seção B |
| MODIFY | `src/pages/CharacterSheetPage/CharacterSheetPage.tsx` | Adicionar `document.title` |
| MODIFY | `src/pages/CharactersPage/CharactersPage.tsx` | Corrigir prefixos de nome de arquivo no export |

---

## Task 1: Criar MonsterCombatSummary.tsx

**Files:**
- Create: `src/components/monster/MonsterCombatSummary/MonsterCombatSummary.tsx`

- [ ] **Criar o arquivo com o componente completo**

```tsx
import { useState } from 'react'
import type { MonsterSheet } from '../../../types/system/dnd/monsterSheet'
import type { DeepPartial } from '../shared'
import panelStyles from '../../../styles/panel.module.css'
import styles from './MonsterCombatSummary.module.css'

interface MonsterCombatSummaryProps {
  sheet: MonsterSheet
  onChange: (patch: DeepPartial<MonsterSheet>) => void
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.trunc(value)))
}

export function MonsterCombatSummary({ sheet, onChange }: MonsterCombatSummaryProps) {
  const { stats, traits } = sheet
  const [actionValue, setActionValue] = useState('')
  const effectiveHpMax = Math.max(0, Math.trunc(stats.maxHp))
  const displayedCurrentHp = clamp(stats.hpCurrent, 0, effectiveHpMax)
  const displayedTempHp = Math.max(0, Math.trunc(stats.hpTemp))

  function applyHpAction(type: 'damage' | 'heal' | 'temp') {
    const value = Math.trunc(Number(actionValue))
    if (!Number.isFinite(value) || value <= 0) return
    let nextCurrent = displayedCurrentHp
    let nextTemp = displayedTempHp
    if (type === 'damage') {
      const absorbed = Math.min(nextTemp, value)
      nextTemp -= absorbed
      nextCurrent = Math.max(0, nextCurrent - (value - absorbed))
    } else if (type === 'heal') {
      nextCurrent = Math.min(effectiveHpMax, nextCurrent + value)
    } else {
      nextTemp = value > nextTemp ? value : nextTemp
    }
    onChange({ stats: { hpCurrent: nextCurrent, hpTemp: nextTemp } })
    setActionValue('')
  }

  return (
    <section className={panelStyles.panel}>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>CA</span>
          <strong className={styles.statValue}>{stats.ac}</strong>
        </div>
        <div className={`${styles.statCard} ${styles.statCardHp}`}>
          <span className={styles.statLabel}>PV</span>
          <strong className={styles.statValue}>
            {displayedCurrentHp}<span className={styles.statMax}>/{effectiveHpMax}</span>
          </strong>
          {displayedTempHp > 0 && <span className={styles.statSub}>+{displayedTempHp} temp</span>}
        </div>
      </div>

      <div className={styles.hpControls}>
        <input
          className={styles.hpInput}
          type="number"
          min={1}
          inputMode="numeric"
          placeholder="Valor"
          aria-label="Valor para dano, cura ou PV temporário"
          value={actionValue}
          onChange={(e) => setActionValue(e.target.value.replace(/[^\d]/g, ''))}
        />
        <button type="button" className={styles.btnDamage} onClick={() => applyHpAction('damage')}>Dano</button>
        <button type="button" className={styles.btnHeal} onClick={() => applyHpAction('heal')}>Cura</button>
        <button type="button" className={styles.btnTemp} onClick={() => applyHpAction('temp')}>Temp</button>
      </div>

      {stats.movements.length > 0 && (
        <div className={styles.chipGroup}>
          <span className={styles.chipGroupLabel}>Deslocamento</span>
          <div className={styles.chipList}>
            {stats.movements.map((m, i) => (
              <span key={m.id || i} className={styles.movementChip}>
                {m.source.trim() || 'Terra'} {m.distance}m
              </span>
            ))}
          </div>
        </div>
      )}

      {traits.resistances.length > 0 && (
        <div className={styles.chipGroup}>
          <span className={styles.chipGroupLabel}>Resistências a Dano</span>
          <div className={styles.chipList}>
            {traits.resistances.map((r) => <span key={r} className={styles.chipResist}>{r}</span>)}
          </div>
        </div>
      )}

      {traits.immunities.length > 0 && (
        <div className={styles.chipGroup}>
          <span className={styles.chipGroupLabel}>Imunidades a Dano</span>
          <div className={styles.chipList}>
            {traits.immunities.map((r) => <span key={r} className={styles.chipImmune}>{r}</span>)}
          </div>
        </div>
      )}

      {traits.conditionImmunities.length > 0 && (
        <div className={styles.chipGroup}>
          <span className={styles.chipGroupLabel}>Imunidades a Condições</span>
          <div className={styles.chipList}>
            {traits.conditionImmunities.map((r) => <span key={r} className={styles.chipCondIm}>{r}</span>)}
          </div>
        </div>
      )}
    </section>
  )
}
```

---

## Task 2: Criar MonsterCombatSummary.module.css

**Files:**
- Create: `src/components/monster/MonsterCombatSummary/MonsterCombatSummary.module.css`

- [ ] **Criar o arquivo de estilos**

```css
.statsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(5.5rem, 1fr));
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.statCard {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: var(--space-2) var(--space-1);
  background: rgba(255, 252, 240, 0.7);
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  text-align: center;
  min-width: 0;
}

.statCardHp {
  grid-column: span 2;
}

.statLabel {
  font-family: var(--font-display);
  font-size: 0.65rem;
  color: var(--ink-faint);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.statValue {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  color: var(--ink);
  line-height: 1;
}

.statMax {
  font-size: var(--text-sm);
  color: var(--ink-muted);
  font-weight: 400;
}

.statSub {
  font-size: var(--text-xs);
  color: var(--accent-light);
  font-family: var(--font-body);
}

.hpControls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-bottom: var(--space-2);
}

.hpInput {
  width: 5rem;
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: var(--font-display);
  font-size: var(--text-sm);
  background: var(--parchment-light);
  color: var(--ink);
  text-align: center;
}

.hpInput:focus { outline: 2px solid var(--accent); outline-offset: 1px; }

.hpBtn {
  padding: var(--space-1) var(--space-3);
  font-family: var(--font-display);
  font-size: var(--text-sm);
  letter-spacing: 0.03em;
  border: 1px solid var(--border-dark);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition);
}

.btnDamage { composes: hpBtn; background: rgba(180,40,40,0.08); color: #8b1a1a; }
.btnDamage:hover { background: rgba(180,40,40,0.16); }
.btnHeal   { composes: hpBtn; background: rgba(40,140,60,0.08); color: #1a6b2e; }
.btnHeal:hover { background: rgba(40,140,60,0.16); }
.btnTemp   { composes: hpBtn; background: rgba(60,90,180,0.08); color: #1a3680; }
.btnTemp:hover { background: rgba(60,90,180,0.16); }

.chipGroup {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-top: var(--space-2);
}

.chipGroupLabel {
  font-family: var(--font-display);
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--ink-muted);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.chipList {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.chip {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  color: var(--ink-muted);
  background: var(--parchment-dark);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  padding: 2px var(--space-2);
}

.movementChip {
  font-family: var(--font-display);
  font-size: var(--text-xs);
  color: var(--ink-muted);
  background: var(--parchment-dark);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  padding: 2px var(--space-2);
}

.chipResist  { composes: chip; background: rgba(40,140,60,0.08);  border-color: rgba(40,140,60,0.25);  color: #1a6b2e; }
.chipImmune  { composes: chip; background: rgba(60,90,180,0.08);  border-color: rgba(60,90,180,0.25);  color: #1a3680; }
.chipCondIm  { composes: chip; background: rgba(130,50,180,0.08); border-color: rgba(130,50,180,0.25); color: #5b1a80; }

@media (min-width: 480px) {
  .statCardHp { grid-column: span 1; }
  .statsGrid { grid-template-columns: repeat(auto-fill, minmax(6rem, 1fr)); }
}
```

---

## Task 3: Integrar MonsterCombatSummary no MonsterSheetPage e adicionar document.title

**Files:**
- Modify: `src/pages/MonsterSheetPage/MonsterSheetPage.tsx`

- [ ] **Adicionar o import do MonsterCombatSummary** (após os imports existentes de componentes de monstro, por volta da linha 10)

```tsx
import { MonsterCombatSummary } from '../../components/monster/MonsterCombatSummary/MonsterCombatSummary'
```

- [ ] **Adicionar useEffect de document.title** (após o useEffect de cleanup de timers, por volta da linha 184)

```tsx
useEffect(() => {
  if (!sheet) return
  const name = sheet.details.name.trim()
  document.title = name || 'Tomo do Aventureiro'
  return () => { document.title = 'Tomo do Aventureiro' }
}, [sheet?.details.name])
```

- [ ] **Renderizar MonsterCombatSummary entre o restBar e o tabpanel**

Localizar o bloco `<div className={styles.restBar}>` no return do componente. Inserir `<MonsterCombatSummary>` imediatamente após o fechamento desse div e antes do div com `role="tabpanel"`:

```tsx
      <div className={styles.restBar}>
        <button type="button" className={styles.restButton} onClick={handleShortRest}>
          Descanso curto
        </button>
        <button type="button" className={styles.restButton} onClick={handleLongRest}>
          Descanso longo
        </button>
        <span aria-live="polite" aria-atomic="true" className={styles.restFeedback}>
          {restFeedback}
        </span>
      </div>

      <MonsterCombatSummary sheet={currentSheet} onChange={handleSheetChange} />

      <div
        id={TAB_PANEL_IDS[activeTab]}
        role="tabpanel"
        aria-labelledby={TAB_BUTTON_IDS[activeTab]}
        className={styles.tabContent}
      >
        {renderActiveTab(activeTab)}
      </div>
```

- [ ] **Verificar no browser**

Rodar `npm run dev`. Abrir uma ficha de monstro. Navegar entre todas as abas (Mesa, Detalhes, Combate, Habilidades, Ações, Magias, Lendárias) e confirmar que o bloco CA/PV/HP manager aparece em todas. Aplicar Dano/Cura fora da aba Mesa e confirmar que o HP muda corretamente. Confirmar que o título da aba do browser exibe o nome do monstro.

- [ ] **Commit**

```bash
git add src/components/monster/MonsterCombatSummary/MonsterCombatSummary.tsx
git add src/components/monster/MonsterCombatSummary/MonsterCombatSummary.module.css
git add src/pages/MonsterSheetPage/MonsterSheetPage.tsx
git commit -m "feat: adiciona MonsterCombatSummary persistente e título dinâmico na ficha de monstro"
```

---

## Task 4: Remover Seção B de MonsterTableMode e limpar estilos

**Files:**
- Modify: `src/components/monster/MonsterTableMode/MonsterTableMode.tsx`
- Modify: `src/components/monster/MonsterTableMode/MonsterTableMode.module.css`

- [ ] **Remover estado, variáveis e função de HP em MonsterTableMode.tsx**

Localizar e remover as linhas abaixo (estão no início da função `MonsterTableMode`, por volta das linhas 62 e 110–130):

```tsx
// REMOVER estas linhas:
const [actionValue, setActionValue] = useState('')
// ...
const effectiveHpMax = Math.max(0, Math.trunc(stats.maxHp))
const displayedCurrentHp = clamp(stats.hpCurrent, 0, effectiveHpMax)
const displayedTempHp = Math.max(0, Math.trunc(stats.hpTemp))

function applyHpAction(type: 'damage' | 'heal' | 'temp') {
  const value = Math.trunc(Number(actionValue))
  if (!Number.isFinite(value) || value <= 0) return
  let nextCurrent = displayedCurrentHp
  let nextTemp = displayedTempHp
  if (type === 'damage') {
    const absorbed = Math.min(nextTemp, value)
    nextTemp -= absorbed
    nextCurrent = Math.max(0, nextCurrent - (value - absorbed))
  } else if (type === 'heal') {
    nextCurrent = Math.min(effectiveHpMax, nextCurrent + value)
  } else {
    nextTemp = value > nextTemp ? value : nextTemp
  }
  onChange({ stats: { hpCurrent: nextCurrent, hpTemp: nextTemp } })
  setActionValue('')
}
```

Após remover essas linhas, a função `clamp` no topo do arquivo também não é mais usada — removê-la:

```tsx
// REMOVER:
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.trunc(value)))
}
```

- [ ] **Remover a Seção B inteira do JSX em MonsterTableMode.tsx**

Localizar e remover o bloco `{/* ── Seção B: Defesa e vida ── */}` completo, incluindo o `<section>` que o contém. Esse bloco começa com o comentário da Seção B e termina no `</section>` que fecha os chipLists de conditionImmunities. O resultado após a remoção é que o JSX vai direto da Seção A para a Seção C:

```tsx
    </>
  )
}
```

O retorno do componente passa a ser:

```tsx
  return (
    <>
      {/* ── Seção A: Identidade ── */}
      <section className={panelStyles.panel}>
        ...
      </section>

      {/* ── Seção C: Atributos e Traços ── */}
      <section className={panelStyles.panel}>
        ...
      </section>

      {/* demais seções D, E, F inalteradas */}
    </>
  )
```

- [ ] **Remover estilos da Seção B em MonsterTableMode.module.css**

Apagar os seguintes blocos de CSS (mantendo apenas `.chip` que é usado na Seção C):

```css
/* REMOVER — Seção B: Defesa e vida */
.statsGrid { ... }
.statCard { ... }
.statCardHp { ... }
.statLabel { ... }
.statValue { ... }
.statMax { ... }
.statSub { ... }
.movementList { ... }
.movementChip { ... }
.hpControls { ... }
.hpInput { ... }
.hpInput:focus { ... }
.hpBtn { ... }
.btnDamage { ... }
.btnDamage:hover { ... }
.btnHeal { ... }
.btnHeal:hover { ... }
.btnTemp { ... }
.btnTemp:hover { ... }
.chipList { ... }
/* MANTER .chip — usado na Seção C */
.chipResist { ... }  /* REMOVER */
.chipImmune { ... }  /* REMOVER */
.chipCondIm { ... }  /* REMOVER */
```

No bloco `@media (min-width: 480px)` (no final do arquivo), remover as duas linhas que referenciam `.statCardHp` e `.statsGrid`:

```css
/* REMOVER estas duas linhas de dentro do @media (min-width: 480px): */
.statCardHp { grid-column: span 1; }
.statsGrid { grid-template-columns: repeat(auto-fill, minmax(6rem, 1fr)); }
```

Se o bloco `@media (min-width: 480px)` ficar vazio após a remoção, remover também o próprio bloco.

- [ ] **Verificar no browser**

Abrir a aba Mesa de uma ficha de monstro. Confirmar que a identidade (nome, badge, ND/XP) aparece, seguida diretamente pelos atributos e traços — sem duplicar o bloco de CA/PV (que agora fica acima das abas).

- [ ] **Rodar verificação de tipos**

```bash
npx tsc --noEmit
```

Esperado: sem erros de TypeScript.

- [ ] **Commit**

```bash
git add src/components/monster/MonsterTableMode/MonsterTableMode.tsx
git add src/components/monster/MonsterTableMode/MonsterTableMode.module.css
git commit -m "refactor: remove Seção B de MonsterTableMode (movida para MonsterCombatSummary)"
```

---

## Task 5: Adicionar document.title em CharacterSheetPage

**Files:**
- Modify: `src/pages/CharacterSheetPage/CharacterSheetPage.tsx`

- [ ] **Adicionar useEffect de document.title**

Localizar o último `useEffect` existente no componente `CharacterSheetPage` (por volta da linha 140, o que persiste a aba ativa no sessionStorage). Inserir o novo efeito logo após:

```tsx
useEffect(() => {
  if (!sheet) return
  const name = sheet.character.name.trim()
  document.title = name || 'Tomo do Aventureiro'
  return () => { document.title = 'Tomo do Aventureiro' }
}, [sheet?.character.name])
```

- [ ] **Verificar no browser**

Abrir uma ficha de personagem. Confirmar que a aba do browser exibe apenas o nome do personagem (sem prefixo, sem ícone). Navegar de volta para outra página e confirmar que o título volta para "Tomo do Aventureiro".

- [ ] **Commit**

```bash
git add src/pages/CharacterSheetPage/CharacterSheetPage.tsx
git commit -m "feat: título dinâmico da aba do browser na ficha de personagem"
```

---

## Task 6: Corrigir nomenclatura dos arquivos JSON exportados

**Files:**
- Modify: `src/pages/CharactersPage/CharactersPage.tsx`

- [ ] **Corrigir handleExportSheet (linha ~773)**

Localizar:
```tsx
downloadJsonFile(json, normalizeFileName(sheet.data.character.name.trim() || sheet.id, sheet.id, 'tomo-personagem'))
```

Substituir por:
```tsx
downloadJsonFile(json, normalizeFileName(sheet.data.character.name.trim() || sheet.id, sheet.id, 'personagem'))
```

- [ ] **Corrigir handleExportMonster (linha ~778)**

Localizar:
```tsx
function handleExportMonster(monster: StoredMonsterSheet) {
  const json = exportMonsterSheetAsJSON(monster)
  downloadJsonFile(json, normalizeFileName(monster.data.details.name.trim() || monster.id, monster.id, 'tomo-monstro'))
}
```

Substituir por:
```tsx
function handleExportMonster(monster: StoredMonsterSheet) {
  const json = exportMonsterSheetAsJSON(monster)
  const prefix = monster.data.details.kind === 'npc' ? 'npc' : 'monstro'
  downloadJsonFile(json, normalizeFileName(monster.data.details.name.trim() || monster.id, monster.id, prefix))
}
```

- [ ] **Verificar no browser**

Na página de personagens:
- Exportar um personagem → arquivo deve se chamar `personagem-{nome}.json`
- Exportar um NPC → arquivo deve se chamar `npc-{nome}.json`
- Exportar um monstro → arquivo deve se chamar `monstro-{nome}.json`

- [ ] **Commit**

```bash
git add src/pages/CharactersPage/CharactersPage.tsx
git commit -m "fix: nomenclatura dos arquivos JSON exportados (personagem/npc/monstro)"
```
