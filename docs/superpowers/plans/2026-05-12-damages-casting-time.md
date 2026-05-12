# Damages and Casting Time Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `castingTime` field and structured `DamagePart[]` with inline dice rolling to Habilidades and Ações in both monster/NPC and PJ sheets.

**Architecture:** New shared `DamagePart` type and `DamagesEditor` component are used by all four panels (`MonsterFeaturesPanel`, `MonsterActionsPanel`, `ResourcesPanel`, `AttacksPanel`). Rolling is client-side state only — never touches HP. Normalization in both stores guarantees backward-compat defaults for documents that predate this change.

**Tech Stack:** TypeScript 5 strict, React 19, CSS Modules, Firebase Firestore. No test framework — verification is `npx tsc --noEmit` + manual browser check.

---

## File Map

**New files:**
- `src/types/system/dnd/DamagePart.ts`
- `src/utils/diceRoller.ts`
- `src/components/DamagesEditor/DamagesEditor.tsx`
- `src/components/DamagesEditor/DamagesEditor.module.css`

**Modified files:**
- `src/types/system/dnd/monsterSheet.ts`
- `src/types/system/dnd/Resource.ts`
- `src/types/system/dnd/Attack.ts`
- `src/types/system/dnd/index.ts`
- `src/store/monsterSheetStore.ts`
- `src/store/characterSheetStore.ts`
- `src/components/monster/MonsterFeaturesPanel/MonsterFeaturesPanel.tsx`
- `src/components/monster/MonsterFeaturesPanel/MonsterFeaturesPanel.module.css`
- `src/components/monster/MonsterActionsPanel/MonsterActionsPanel.tsx`
- `src/components/monster/MonsterActionsPanel/MonsterActionsPanel.module.css`
- `src/components/ResourcesPanel/ResourcesPanel.tsx`
- `src/components/ResourcesPanel/ResourcesPanel.module.css`
- `src/components/AttacksPanel/AttacksPanel.tsx`
- `src/components/AttacksPanel/AttacksPanel.module.css`

---

## Task 1: DamagePart type + type file updates + index export

**Files:**
- Create: `src/types/system/dnd/DamagePart.ts`
- Modify: `src/types/system/dnd/monsterSheet.ts`
- Modify: `src/types/system/dnd/Resource.ts`
- Modify: `src/types/system/dnd/Attack.ts`
- Modify: `src/types/system/dnd/index.ts`

- [ ] **Create `src/types/system/dnd/DamagePart.ts`**

```ts
export interface DamagePart {
  dice: string   // "2d6", "1d8", "3d10" — notação XdY
  type: string   // "Cortante", "Fogo", "Radiante", etc.
  bonus: string  // "+4", "-1", "" — vazio tratado como 0
}
```

- [ ] **Update `src/types/system/dnd/monsterSheet.ts`**

Add import at the top (after the existing imports):
```ts
import type { DamagePart } from './DamagePart'
export type { DamagePart }
```

Add to `MonsterFeature` interface (after `requirements: string`):
```ts
castingTime: string
damages: DamagePart[]
```

Add to `MonsterAction` interface (after `reach: string`):
```ts
castingTime: string
damages: DamagePart[]
```

- [ ] **Update `src/types/system/dnd/Resource.ts`**

Add import at top:
```ts
import type { DamagePart } from './DamagePart'
```

Add to `Resource` interface (after `allowCustomOrigin?: boolean`):
```ts
castingTime?: string
damages?: DamagePart[]
```

- [ ] **Update `src/types/system/dnd/Attack.ts`**

Add import at top:
```ts
import type { DamagePart } from './DamagePart'
```

Add to `Attack` interface (after `notes?: string`):
```ts
castingTime?: string
damages?: DamagePart[]
```

- [ ] **Update `src/types/system/dnd/index.ts`**

Add export:
```ts
export type { DamagePart } from './DamagePart'
```

- [ ] **Run type check**

```bash
npx tsc --noEmit
```

Expected: errors in stores (new required fields missing from defaults/normalizers). That's OK — stores are fixed in Tasks 4 and 5.

- [ ] **Commit**

```bash
git add src/types/system/dnd/DamagePart.ts src/types/system/dnd/monsterSheet.ts src/types/system/dnd/Resource.ts src/types/system/dnd/Attack.ts src/types/system/dnd/index.ts
git commit -m "feat: add DamagePart type and castingTime/damages fields to MonsterFeature, MonsterAction, Resource, Attack"
```

---

## Task 2: diceRoller utility

**Files:**
- Create: `src/utils/diceRoller.ts`

- [ ] **Create `src/utils/diceRoller.ts`**

```ts
import type { DamagePart } from '../types/system/dnd/DamagePart'

export interface DamageRollResult {
  dice: string
  type: string
  bonus: number
  rawRoll: number
  subtotal: number
}

export interface DamageRollSummary {
  results: DamageRollResult[]
  total: number
}

function parseDice(notation: string): { count: number; sides: number } | null {
  const match = /^(\d+)d(\d+)$/i.exec(notation.trim())
  if (!match) return null
  const count = parseInt(match[1], 10)
  const sides = parseInt(match[2], 10)
  if (!Number.isFinite(count) || !Number.isFinite(sides) || count < 1 || sides < 1) return null
  return { count, sides }
}

function parseBonus(raw: string): number {
  const trimmed = raw.trim()
  if (!trimmed) return 0
  const parsed = parseInt(trimmed, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1
}

export function rollDamages(damages: DamagePart[]): DamageRollSummary {
  const results: DamageRollResult[] = []
  let total = 0
  for (const part of damages) {
    const parsed = parseDice(part.dice)
    const bonus = parseBonus(part.bonus)
    let rawRoll = 0
    if (parsed !== null) {
      for (let i = 0; i < parsed.count; i++) {
        rawRoll += rollDie(parsed.sides)
      }
    }
    const subtotal = Math.max(0, rawRoll + bonus)
    results.push({ dice: part.dice, type: part.type, bonus, rawRoll, subtotal })
    total += subtotal
  }
  return { results, total }
}

export function formatRollLine(result: DamageRollResult): string {
  const label = [result.dice, result.type].filter(Boolean).join(' ')
  if (result.bonus === 0) return `${label}: ${result.rawRoll}`
  const sign = result.bonus > 0 ? `+ ${result.bonus}` : `− ${Math.abs(result.bonus)}`
  return `${label}: ${result.rawRoll} ${sign} = ${result.subtotal}`
}
```

- [ ] **Run type check**

```bash
npx tsc --noEmit
```

Expected: same errors as before (stores still pending). The new utility itself must not produce errors.

- [ ] **Commit**

```bash
git add src/utils/diceRoller.ts
git commit -m "feat: add diceRoller utility for parsing and rolling DamagePart[]"
```

---

## Task 3: DamagesEditor component

**Files:**
- Create: `src/components/DamagesEditor/DamagesEditor.tsx`
- Create: `src/components/DamagesEditor/DamagesEditor.module.css`

- [ ] **Create `src/components/DamagesEditor/DamagesEditor.tsx`**

```tsx
import type { DamagePart } from '../../types/system/dnd/DamagePart'
import panelStyles from '../../styles/panel.module.css'
import styles from './DamagesEditor.module.css'

function createDamagePart(): DamagePart {
  return { dice: '', type: '', bonus: '' }
}

interface DamagesEditorProps {
  damages: DamagePart[]
  onChange: (updated: DamagePart[]) => void
}

export function DamagesEditor({ damages, onChange }: DamagesEditorProps) {
  function setPart(index: number, patch: Partial<DamagePart>) {
    onChange(damages.map((p, i) => i === index ? { ...p, ...patch } : p))
  }

  function addPart() {
    onChange([...damages, createDamagePart()])
  }

  function removePart(index: number) {
    onChange(damages.filter((_, i) => i !== index))
  }

  return (
    <div className={styles.editor}>
      {damages.length > 0 && (
        <div className={styles.partList}>
          {damages.map((part, i) => (
            <div key={i} className={styles.partRow}>
              <input
                type="text"
                className={styles.diceInput}
                value={part.dice}
                placeholder="2d6"
                aria-label={`Dado do dano ${i + 1}`}
                onChange={(e) => setPart(i, { dice: e.target.value })}
              />
              <input
                type="text"
                className={styles.typeInput}
                value={part.type}
                placeholder="Cortante"
                aria-label={`Tipo do dano ${i + 1}`}
                onChange={(e) => setPart(i, { type: e.target.value })}
              />
              <input
                type="text"
                className={styles.bonusInput}
                value={part.bonus}
                placeholder="+4"
                aria-label={`Bônus do dano ${i + 1}`}
                onChange={(e) => setPart(i, { bonus: e.target.value })}
              />
              <button
                type="button"
                className={panelStyles.removeButton}
                onClick={() => removePart(i)}
                aria-label={`Remover dano ${i + 1}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <button type="button" className={panelStyles.addButton} onClick={addPart}>
        + Dano
      </button>
    </div>
  )
}
```

- [ ] **Create `src/components/DamagesEditor/DamagesEditor.module.css`**

```css
.editor {
  display: grid;
  gap: var(--space-2);
}

.partList {
  display: grid;
  gap: var(--space-2);
}

.partRow {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.diceInput {
  width: 4.5rem;
  min-width: 0;
  flex-shrink: 0;
}

.typeInput {
  flex: 1;
  min-width: 5rem;
}

.bonusInput {
  width: 3.5rem;
  min-width: 0;
  flex-shrink: 0;
}

@media (max-width: 480px) {
  .partRow {
    display: grid;
    grid-template-columns: 4.5rem 1fr 3.5rem 2rem;
    align-items: center;
  }

  .diceInput,
  .typeInput,
  .bonusInput {
    width: 100%;
  }
}
```

- [ ] **Run type check**

```bash
npx tsc --noEmit
```

Expected: still the same store errors, no new errors.

- [ ] **Commit**

```bash
git add src/components/DamagesEditor/DamagesEditor.tsx src/components/DamagesEditor/DamagesEditor.module.css
git commit -m "feat: add DamagesEditor shared component for editing DamagePart[]"
```

---

## Task 4: monsterSheetStore.ts — defaults + normalization

**Files:**
- Modify: `src/store/monsterSheetStore.ts`

- [ ] **Add `normalizeDamageParts` helper** — add before `normalizeMonsterFeature` (around line 216):

```ts
function normalizeDamageParts(value: unknown): DamagePart[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      dice: typeof item.dice === 'string' ? item.dice : '',
      type: typeof item.type === 'string' ? item.type : '',
      bonus: typeof item.bonus === 'string' ? item.bonus : '',
    }))
}
```

- [ ] **Update `createDefaultMonsterFeature`** — add the two new fields:

Replace:
```ts
function createDefaultMonsterFeature(id = ''): MonsterFeature {
    return {
        id,
        name: '',
        description: '',
        hasLimitedUses: false,
        maxUses: 1,
        currentUses: 1,
        recharge: 'none',
        duration: '',
        range: '',
        requirements: '',
    }
}
```
With:
```ts
function createDefaultMonsterFeature(id = ''): MonsterFeature {
    return {
        id,
        name: '',
        description: '',
        hasLimitedUses: false,
        maxUses: 1,
        currentUses: 1,
        recharge: 'none',
        duration: '',
        range: '',
        requirements: '',
        castingTime: '',
        damages: [],
    }
}
```

- [ ] **Update `createDefaultMonsterAction`** — add the two new fields:

Replace the return object in `createDefaultMonsterAction` with:
```ts
function createDefaultMonsterAction(id = ''): MonsterAction {
    return {
        id,
        name: '',
        description: '',
        hasLimitedUses: false,
        maxUses: 1,
        currentUses: 1,
        recharge: 'none',
        isAttack: false,
        isMultiattack: false,
        attackCount: 1,
        attackType: '',
        attackBonus: '',
        damage: '',
        damageType: '',
        reach: '',
        castingTime: '',
        damages: [],
    }
}
```

- [ ] **Update `normalizeMonsterFeature`** — add two fields to the return object (after `requirements`):

```ts
castingTime: normalizeString(nextValue.castingTime),
damages: normalizeDamageParts(nextValue.damages),
```

- [ ] **Update `normalizeMonsterAction`** — add two fields to the return object (after `reach`):

```ts
castingTime: normalizeString(nextValue.castingTime),
damages: normalizeDamageParts(nextValue.damages),
```

- [ ] **Add `DamagePart` to the import** at top of `monsterSheetStore.ts`:

The file already imports from `'../types/system/dnd/monsterSheet'`. Add `DamagePart` to that import:
```ts
import type {
    DamagePart,
    LegendaryAction,
    LimitedUseResource,
    MonsterAction,
    MonsterFeature,
    MonsterMovement,
    MonsterSheet,
    RechargeType,
    Spell,
} from '../types/system/dnd/monsterSheet'
```

- [ ] **Run type check**

```bash
npx tsc --noEmit
```

Expected: monster store errors clear. Character store errors remain.

- [ ] **Commit**

```bash
git add src/store/monsterSheetStore.ts
git commit -m "feat: normalize castingTime and damages in monsterSheetStore"
```

---

## Task 5: characterSheetStore.ts — defaults + normalization

**Files:**
- Modify: `src/store/characterSheetStore.ts`

- [ ] **Add `normalizeDamageParts` helper** — add before `normalizeAttack` (around line 85). Same implementation as in monsterSheetStore:

```ts
import type { DamagePart } from '../types/system/dnd/DamagePart'

function normalizeDamageParts(value: unknown): DamagePart[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      dice: typeof item.dice === 'string' ? item.dice : '',
      type: typeof item.type === 'string' ? item.type : '',
      bonus: typeof item.bonus === 'string' ? item.bonus : '',
    }))
}
```

- [ ] **Update `createDefaultAttack`** (around line 69) — add two new fields:

Replace the full function body return:
```ts
function createDefaultAttack(): Attack {
  return {
    name: '',
    attackBonus: 0,
    attributeKey: 'manual',
    useProficiency: false,
    damage: '',
    damageType: '',
    range: '',
    notes: '',
    castingTime: '',
    damages: [],
  }
}
```

- [ ] **Update `normalizeAttack`** — add two fields inside the return object (after `notes`):

```ts
castingTime: typeof nextAttack.castingTime === 'string' ? nextAttack.castingTime : '',
damages: normalizeDamageParts(nextAttack.damages),
```

- [ ] **Update `createDefaultResource`** (around line 131) — add two new fields:

```ts
function createDefaultResource(): Resource {
  return {
    name: '',
    description: '',
    duration: '',
    range: '',
    action: '',
    current: 0,
    max: 0,
    resetOn: 'long-rest',
    customOrigin: '',
    allowCustomOrigin: false,
    castingTime: '',
    damages: [],
  }
}
```

- [ ] **Update `normalizeResource`** — add two fields inside the return object (after `allowCustomOrigin`):

```ts
castingTime: typeof nextResource.castingTime === 'string' ? nextResource.castingTime : '',
damages: normalizeDamageParts(nextResource.damages),
```

- [ ] **Run type check**

```bash
npx tsc --noEmit
```

Expected: **zero errors**. All type errors from Task 1 should now be resolved.

- [ ] **Commit**

```bash
git add src/store/characterSheetStore.ts
git commit -m "feat: normalize castingTime and damages in characterSheetStore"
```

---

## Task 6: MonsterFeaturesPanel

**Files:**
- Modify: `src/components/monster/MonsterFeaturesPanel/MonsterFeaturesPanel.tsx`
- Modify: `src/components/monster/MonsterFeaturesPanel/MonsterFeaturesPanel.module.css`

- [ ] **Add imports** to `MonsterFeaturesPanel.tsx`:

```tsx
import { useState } from 'react'    // already imported
import { DamagesEditor } from '../../DamagesEditor/DamagesEditor'
import { rollDamages, formatRollLine, type DamageRollSummary } from '../../../utils/diceRoller'
import type { DamagePart } from '../../../types/system/dnd/DamagePart'
```

- [ ] **Add roll state** inside `MonsterFeaturesPanel` function body, after the existing `collapsedIds` state:

```tsx
const [rollResults, setRollResults] = useState<Map<string, DamageRollSummary>>(new Map())

function handleRollDamage(featureId: string, damages: DamagePart[]) {
  setRollResults((prev) => new Map(prev).set(featureId, rollDamages(damages)))
}
```

- [ ] **Update `createFeature`** — add new fields:

```ts
function createFeature(): MonsterFeature {
    return {
        id: globalThis.crypto.randomUUID(),
        name: '',
        description: '',
        hasLimitedUses: false,
        maxUses: 1,
        currentUses: 1,
        recharge: 'none',
        duration: '',
        range: '',
        requirements: '',
        castingTime: '',
        damages: [],
    }
}
```

- [ ] **Add `castingTime` field in edit mode** — inside the edit mode card, after `cardHeader` and before the `checkboxLabel` for limited uses, add:

```tsx
<label className={styles.field}>
  Tempo de Conjuração
  <input
    type="text"
    value={feature.castingTime ?? ''}
    onChange={(event) => setFeature(index, { castingTime: event.target.value })}
    placeholder="1 ação, 1 ação bônus, 1 reação..."
  />
</label>
```

- [ ] **Add `DamagesEditor` in edit mode** — inside the edit mode card, after `detailsGrid` and before the description textarea:

```tsx
<div>
  <span className={styles.sectionLabel}>Danos</span>
  <DamagesEditor
    damages={feature.damages ?? []}
    onChange={(updated) => setFeature(index, { damages: updated })}
  />
</div>
```

- [ ] **Add `castingTime` chip in view mode** — inside `cardBody`, add `castingTime` to the existing `detailRow` condition and chips:

Replace the condition:
```tsx
{(feature.range.trim() || feature.duration.trim() || feature.requirements.trim()) && (
```
With:
```tsx
{(feature.range.trim() || feature.duration.trim() || feature.requirements.trim() || (feature.castingTime ?? '').trim()) && (
```

Add inside the `detailRow` div, after the existing chips:
```tsx
{(feature.castingTime ?? '').trim() && (
  <span className={styles.detailChip}>Tempo: {feature.castingTime}</span>
)}
```

- [ ] **Add roll button + result in view mode** — inside `cardBody`, after the description paragraph:

```tsx
{(feature.damages ?? []).length > 0 && (
  <div className={styles.rollArea}>
    <button
      type="button"
      className={styles.rollBtn}
      onClick={() => handleRollDamage(featureId, feature.damages ?? [])}
    >
      🎲 Rolar dano
    </button>
    {rollResults.has(featureId) && (
      <div className={styles.rollResult}>
        {rollResults.get(featureId)!.results.map((r, i) => (
          <span key={i} className={styles.rollLine}>{formatRollLine(r)}</span>
        ))}
        <span className={styles.rollTotal}>Total: {rollResults.get(featureId)!.total}</span>
      </div>
    )}
  </div>
)}
```

- [ ] **Add CSS** to `MonsterFeaturesPanel.module.css`:

```css
.sectionLabel {
    font-family: var(--font-display);
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-muted);
    display: block;
    margin-bottom: var(--space-2);
}

.rollArea {
    display: grid;
    gap: var(--space-2);
}

.rollBtn {
    align-self: start;
    padding: var(--space-1) var(--space-3);
    font-family: var(--font-display);
    font-size: var(--text-sm);
    background: rgba(255, 249, 235, 0.9);
    border: 1px solid var(--border-dark);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background var(--transition);
}

.rollBtn:hover {
    background: rgba(241, 227, 189, 0.9);
}

.rollResult {
    display: grid;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
    background: rgba(212, 196, 154, 0.25);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-sm);
}

.rollLine {
    font-size: var(--text-sm);
    color: var(--ink-muted);
    font-family: var(--font-display);
}

.rollTotal {
    font-family: var(--font-display);
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--accent);
    padding-top: var(--space-1);
    border-top: 1px solid var(--border-light);
}
```

- [ ] **Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Commit**

```bash
git add src/components/monster/MonsterFeaturesPanel/MonsterFeaturesPanel.tsx src/components/monster/MonsterFeaturesPanel/MonsterFeaturesPanel.module.css
git commit -m "feat: add castingTime, DamagesEditor, and dice rolling to MonsterFeaturesPanel"
```

---

## Task 7: MonsterActionsPanel

**Files:**
- Modify: `src/components/monster/MonsterActionsPanel/MonsterActionsPanel.tsx`
- Modify: `src/components/monster/MonsterActionsPanel/MonsterActionsPanel.module.css`

Actions and reactions both need the same treatment. Reactions use `MonsterFeature` type, so they also get `castingTime` and `damages`.

- [ ] **Add imports** to `MonsterActionsPanel.tsx`:

```tsx
import { DamagesEditor } from '../../DamagesEditor/DamagesEditor'
import { rollDamages, formatRollLine, type DamageRollSummary } from '../../../utils/diceRoller'
import type { DamagePart } from '../../../types/system/dnd/DamagePart'
```

- [ ] **Add roll state** inside `MonsterActionsPanel` function body, after `collapsedActionIds` and `collapsedReactionIds`:

```tsx
const [actionRollResults, setActionRollResults] = useState<Map<string, DamageRollSummary>>(new Map())
const [reactionRollResults, setReactionRollResults] = useState<Map<string, DamageRollSummary>>(new Map())

function handleRollAction(id: string, damages: DamagePart[]) {
  setActionRollResults((prev) => new Map(prev).set(id, rollDamages(damages)))
}

function handleRollReaction(id: string, damages: DamagePart[]) {
  setReactionRollResults((prev) => new Map(prev).set(id, rollDamages(damages)))
}
```

- [ ] **Update `createAction`** — add new fields:

```ts
function createAction(): MonsterAction {
    return {
        id: globalThis.crypto.randomUUID(),
        name: '',
        description: '',
        hasLimitedUses: false,
        maxUses: 1,
        currentUses: 1,
        recharge: 'none',
        isAttack: false,
        isMultiattack: false,
        attackCount: 1,
        attackType: '',
        attackBonus: '',
        damage: '',
        damageType: '',
        reach: '',
        castingTime: '',
        damages: [],
    }
}
```

- [ ] **Update `createReaction`** — add new fields:

```ts
function createReaction(): MonsterFeature {
    return {
        id: globalThis.crypto.randomUUID(),
        name: '',
        description: '',
        hasLimitedUses: false,
        maxUses: 1,
        currentUses: 1,
        recharge: 'none',
        duration: '',
        range: '',
        requirements: '',
        castingTime: '',
        damages: [],
    }
}
```

- [ ] **Add `castingTime` + `DamagesEditor` in edit mode for actions** — inside each action card in the edit branch, after the `isMultiattack` conditional and before the description `<label>`:

```tsx
<label className={styles.field}>
  Tempo de Conjuração
  <input
    type="text"
    value={action.castingTime ?? ''}
    onChange={(event) => setAction(index, { castingTime: event.target.value })}
    placeholder="1 ação, 1 ação bônus, 1 reação..."
  />
</label>

<div>
  <span className={styles.sectionLabel}>Danos</span>
  <DamagesEditor
    damages={action.damages ?? []}
    onChange={(updated) => setAction(index, { damages: updated })}
  />
</div>
```

- [ ] **Add `castingTime` + `DamagesEditor` in edit mode for reactions** — inside each reaction card, before the description `<label>`:

```tsx
<label className={styles.field}>
  Tempo de Conjuração
  <input
    type="text"
    value={reaction.castingTime ?? ''}
    onChange={(event) => setReaction(index, { castingTime: event.target.value })}
    placeholder="1 ação, 1 ação bônus, 1 reação..."
  />
</label>

<div>
  <span className={styles.sectionLabel}>Danos</span>
  <DamagesEditor
    damages={reaction.damages ?? []}
    onChange={(updated) => setReaction(index, { damages: updated })}
  />
</div>
```

- [ ] **Add `castingTime` chip in view mode for actions** — inside `cardBody` for regular actions, add `castingTime` chip to `metaRow`:

```tsx
{(action.castingTime ?? '').trim() && (
  <span className={styles.metaChip}>Tempo: {action.castingTime}</span>
)}
```

- [ ] **Add roll button + result in view mode for actions** — inside `cardBody`, after the description paragraph:

```tsx
{(action.damages ?? []).length > 0 && (
  <div className={styles.rollArea}>
    <button
      type="button"
      className={styles.rollBtn}
      onClick={() => handleRollAction(actionId, action.damages ?? [])}
    >
      🎲 Rolar dano
    </button>
    {actionRollResults.has(actionId) && (
      <div className={styles.rollResult}>
        {actionRollResults.get(actionId)!.results.map((r, i) => (
          <span key={i} className={styles.rollLine}>{formatRollLine(r)}</span>
        ))}
        <span className={styles.rollTotal}>Total: {actionRollResults.get(actionId)!.total}</span>
      </div>
    )}
  </div>
)}
```

- [ ] **Add same roll UI for reactions** — inside the reaction `cardBody`, using `reactionRollResults` and `handleRollReaction`:

```tsx
{(reaction.castingTime ?? '').trim() && (
  <span className={styles.metaChip}>Tempo: {reaction.castingTime}</span>
)}
{/* after description: */}
{(reaction.damages ?? []).length > 0 && (
  <div className={styles.rollArea}>
    <button
      type="button"
      className={styles.rollBtn}
      onClick={() => handleRollReaction(reactionId, reaction.damages ?? [])}
    >
      🎲 Rolar dano
    </button>
    {reactionRollResults.has(reactionId) && (
      <div className={styles.rollResult}>
        {reactionRollResults.get(reactionId)!.results.map((r, i) => (
          <span key={i} className={styles.rollLine}>{formatRollLine(r)}</span>
        ))}
        <span className={styles.rollTotal}>Total: {reactionRollResults.get(reactionId)!.total}</span>
      </div>
    )}
  </div>
)}
```

- [ ] **Add CSS** to `MonsterActionsPanel.module.css` — append at end:

```css
.sectionLabel {
    font-family: var(--font-display);
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-muted);
    display: block;
    margin-bottom: var(--space-2);
}

.rollArea {
    display: grid;
    gap: var(--space-2);
}

.rollBtn {
    align-self: start;
    padding: var(--space-1) var(--space-3);
    font-family: var(--font-display);
    font-size: var(--text-sm);
    background: rgba(255, 249, 235, 0.9);
    border: 1px solid var(--border-dark);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background var(--transition);
}

.rollBtn:hover {
    background: rgba(241, 227, 189, 0.9);
}

.rollResult {
    display: grid;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
    background: rgba(212, 196, 154, 0.25);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-sm);
}

.rollLine {
    font-size: var(--text-sm);
    color: var(--ink-muted);
    font-family: var(--font-display);
}

.rollTotal {
    font-family: var(--font-display);
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--accent);
    padding-top: var(--space-1);
    border-top: 1px solid var(--border-light);
}
```

- [ ] **Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Commit**

```bash
git add src/components/monster/MonsterActionsPanel/MonsterActionsPanel.tsx src/components/monster/MonsterActionsPanel/MonsterActionsPanel.module.css
git commit -m "feat: add castingTime, DamagesEditor, and dice rolling to MonsterActionsPanel"
```

---

## Task 8: ResourcesPanel

**Files:**
- Modify: `src/components/ResourcesPanel/ResourcesPanel.tsx`
- Modify: `src/components/ResourcesPanel/ResourcesPanel.module.css`

- [ ] **Add imports** to `ResourcesPanel.tsx`:

```tsx
import { DamagesEditor } from '../DamagesEditor/DamagesEditor'
import { rollDamages, formatRollLine, type DamageRollSummary } from '../../utils/diceRoller'
import type { DamagePart } from '../../types/system/dnd/DamagePart'
```

- [ ] **Add roll state** inside `ResourcesPanel` function body, after `collapsedIds` state:

```tsx
const [rollResults, setRollResults] = useState<Map<string, DamageRollSummary>>(new Map())

function handleRollDamage(resourceId: string, damages: DamagePart[]) {
  setRollResults((prev) => new Map(prev).set(resourceId, rollDamages(damages)))
}
```

- [ ] **Update `createResource`** — add new fields:

```ts
function createResource(): Resource {
  return {
    name: '',
    description: '',
    duration: '',
    range: '',
    action: '',
    current: 0,
    max: 0,
    resetOn: 'long-rest',
    customOrigin: '',
    allowCustomOrigin: false,
    castingTime: '',
    damages: [],
  }
}
```

- [ ] **Add `castingTime` input in edit mode** — in the `editStack`, add a new row between Linha 2 (with the origin/remove controls) and the description textarea:

```tsx
{/* Linha 3: Tempo de Conjuração */}
<div className={styles.editRow}>
  <input
    className={styles.editFieldMd}
    type="text"
    value={resource.castingTime ?? ''}
    placeholder="Tempo de Conjuração"
    onChange={(event) => setResource(index, { castingTime: event.target.value })}
  />
</div>
```

- [ ] **Add `DamagesEditor` in edit mode** — after the description `<textarea>` and before the max-uses `<div className={styles.editRow}>`:

```tsx
<DamagesEditor
  damages={resource.damages ?? []}
  onChange={(updated) => setResource(index, { damages: updated })}
/>
```

- [ ] **Add `castingTime` chip in view mode** — inside `featureBody > resourceMetaRow`, add after existing chips:

```tsx
{(resource.castingTime ?? '').trim() && (
  <span className={styles.resourceMeta}>Tempo: {resource.castingTime}</span>
)}
```

- [ ] **Add roll button + result in view mode** — inside `featureBody`, after the description paragraph:

```tsx
{(resource.damages ?? []).length > 0 && (
  <div className={styles.rollArea}>
    <button
      type="button"
      className={styles.rollBtn}
      onClick={() => handleRollDamage(resourceId, resource.damages ?? [])}
    >
      🎲 Rolar dano
    </button>
    {rollResults.has(resourceId) && (
      <div className={styles.rollResult}>
        {rollResults.get(resourceId)!.results.map((r, i) => (
          <span key={i} className={styles.rollLine}>{formatRollLine(r)}</span>
        ))}
        <span className={styles.rollTotal}>Total: {rollResults.get(resourceId)!.total}</span>
      </div>
    )}
  </div>
)}
```

- [ ] **Add CSS** to `ResourcesPanel.module.css` — append at end:

```css
.rollArea {
  display: grid;
  gap: var(--space-2);
}

.rollBtn {
  align-self: start;
  padding: var(--space-1) var(--space-3);
  font-family: var(--font-display);
  font-size: var(--text-sm);
  background: rgba(255, 249, 235, 0.9);
  border: 1px solid var(--border-dark);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition);
}

.rollBtn:hover {
  background: rgba(241, 227, 189, 0.9);
}

.rollResult {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  background: rgba(212, 196, 154, 0.25);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
}

.rollLine {
  font-size: var(--text-sm);
  color: var(--ink-muted);
  font-family: var(--font-display);
}

.rollTotal {
  font-family: var(--font-display);
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--accent);
  padding-top: var(--space-1);
  border-top: 1px solid var(--border-light);
}
```

- [ ] **Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Commit**

```bash
git add src/components/ResourcesPanel/ResourcesPanel.tsx src/components/ResourcesPanel/ResourcesPanel.module.css
git commit -m "feat: add castingTime, DamagesEditor, and dice rolling to ResourcesPanel"
```

---

## Task 9: AttacksPanel

**Files:**
- Modify: `src/components/AttacksPanel/AttacksPanel.tsx`
- Modify: `src/components/AttacksPanel/AttacksPanel.module.css`

The table keeps all existing columns. Each row gets an expand toggle (▸/▾) in a new rightmost cell. Expanding reveals a sub-`<tr>` with `castingTime` + `DamagesEditor` (edit mode) or roll results (view mode). Responsive CSS handles the sub-row display.

- [ ] **Add imports** to `AttacksPanel.tsx`:

```tsx
import { DamagesEditor } from '../DamagesEditor/DamagesEditor'
import { rollDamages, formatRollLine, type DamageRollSummary } from '../../utils/diceRoller'
import type { DamagePart } from '../../types/system/dnd/DamagePart'
```

- [ ] **Add state** inside `AttacksPanel` function body:

```tsx
const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
const [rollResults, setRollResults] = useState<Map<number, DamageRollSummary>>(new Map())

function toggleRow(index: number) {
  setExpandedRows((prev) => {
    const next = new Set(prev)
    if (next.has(index)) { next.delete(index) } else { next.add(index) }
    return next
  })
}

function handleRollDamage(index: number, damages: DamagePart[]) {
  setRollResults((prev) => new Map(prev).set(index, rollDamages(damages)))
}
```

- [ ] **Update `createAttack`**:

```ts
function createAttack(): Attack {
  return {
    name: '',
    attributeKey: 'str',
    useProficiency: false,
    attackBonus: 0,
    damage: '',
    damageType: '',
    range: '',
    notes: '',
    castingTime: '',
    damages: [],
  }
}
```

- [ ] **Update table header** — add expand-toggle column header at the end of `<thead>`:

In view mode thead:
```tsx
<th className={styles.expandTd} aria-label="Detalhes"></th>
```

In edit mode thead (alongside existing `notesTd` and `actionTd` headers):
```tsx
<th className={styles.expandTd} aria-label="Detalhes"></th>
```

- [ ] **Update each table row** — add expand toggle cell at the end of each `<tr>`, after the last `{isEditMode && <td>remove</td>}`:

```tsx
<td className={styles.expandTd} data-label="">
  <button
    type="button"
    className={styles.expandBtn}
    onClick={() => toggleRow(i)}
    aria-expanded={expandedRows.has(i)}
    aria-label={expandedRows.has(i) ? 'Recolher detalhes' : 'Expandir detalhes'}
  >
    {expandedRows.has(i) ? '▾' : '▸'}
  </button>
</td>
```

- [ ] **Add sub-row for each attack** — immediately after each `<tr key={i}>` closing tag (before the next iteration), add:

```tsx
{expandedRows.has(i) && (
  <tr className={styles.detailRow} key={`detail-${i}`}>
    <td colSpan={isEditMode ? 10 : 9}>
      {isEditMode ? (
        <div className={styles.detailContent}>
          <label className={styles.detailField}>
            Tempo de Conjuração
            <input
              type="text"
              value={attack.castingTime ?? ''}
              placeholder="1 ação, 1 ação bônus, 1 reação..."
              onChange={(event) => setAttack(i, { castingTime: event.target.value })}
            />
          </label>
          <div>
            <span className={styles.detailSectionLabel}>Danos</span>
            <DamagesEditor
              damages={attack.damages ?? []}
              onChange={(updated) => setAttack(i, { damages: updated })}
            />
          </div>
        </div>
      ) : (
        <div className={styles.detailContent}>
          {(attack.castingTime ?? '').trim() && (
            <span className={styles.castingChip}>Tempo: {attack.castingTime}</span>
          )}
          {(attack.damages ?? []).length > 0 && (
            <div className={styles.rollArea}>
              <button
                type="button"
                className={styles.rollBtn}
                onClick={() => handleRollDamage(i, attack.damages ?? [])}
              >
                🎲 Rolar dano
              </button>
              {rollResults.has(i) && (
                <div className={styles.rollResult}>
                  {rollResults.get(i)!.results.map((r, ri) => (
                    <span key={ri} className={styles.rollLine}>{formatRollLine(r)}</span>
                  ))}
                  <span className={styles.rollTotal}>Total: {rollResults.get(i)!.total}</span>
                </div>
              )}
            </div>
          )}
          {!(attack.castingTime ?? '').trim() && !(attack.damages ?? []).length && (
            <span className={styles.emptyDetail}>Nenhum tempo de conjuração ou dano extra cadastrado.</span>
          )}
        </div>
      )}
    </td>
  </tr>
)}
```

Note: `colSpan` values — edit mode has: Nome, Atributo, Prof., Bônus, Dano, Tipo, Alcance, Notas, ✕, ▸ = 10 columns. View mode: Nome, Atributo, Prof., Bônus, Dano, Tipo, Alcance, ▸ = 8 columns. Adjust if your actual column count differs.

- [ ] **Add CSS** to `AttacksPanel.module.css` — append before the responsive media queries:

```css
.expandTd {
  width: 2.5rem;
  text-align: center;
  white-space: nowrap;
}

.expandBtn {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: none;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  color: var(--ink-muted);
  cursor: pointer;
  transition: all var(--transition);
}

.expandBtn:hover {
  background: var(--accent-faint);
  border-color: var(--accent);
  color: var(--accent);
}

.detailRow > td {
  padding: 0;
  background: rgba(248, 243, 228, 0.9);
  border-bottom: 1px solid var(--border-light);
}

.detailContent {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
}

.detailField {
  display: grid;
  gap: var(--space-2);
  font-family: var(--font-display);
  font-size: var(--text-sm);
  color: var(--ink-muted);
}

.detailSectionLabel {
  font-family: var(--font-display);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-muted);
  display: block;
  margin-bottom: var(--space-2);
}

.castingChip {
  display: inline-flex;
  align-items: center;
  padding: 0.18rem 0.6rem;
  border: 1px solid var(--border-light);
  border-radius: 999px;
  background: rgba(255, 249, 235, 0.82);
  color: var(--ink-muted);
  font-size: var(--text-xs);
  font-weight: 700;
}

.rollArea {
  display: grid;
  gap: var(--space-2);
}

.rollBtn {
  align-self: start;
  padding: var(--space-1) var(--space-3);
  font-family: var(--font-display);
  font-size: var(--text-sm);
  background: rgba(255, 249, 235, 0.9);
  border: 1px solid var(--border-dark);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition);
}

.rollBtn:hover {
  background: rgba(241, 227, 189, 0.9);
}

.rollResult {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  background: rgba(212, 196, 154, 0.25);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
}

.rollLine {
  font-size: var(--text-sm);
  color: var(--ink-muted);
  font-family: var(--font-display);
}

.rollTotal {
  font-family: var(--font-display);
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--accent);
  padding-top: var(--space-1);
  border-top: 1px solid var(--border-light);
}

.emptyDetail {
  font-size: var(--text-sm);
  color: var(--ink-faint);
  font-style: italic;
}
```

- [ ] **Add responsive CSS for sub-row** — inside the `@media (max-width: 960px)` block, add:

```css
  /* Sub-row override — must not be a grid with multiple columns */
  .attackTable tbody tr.detailRow {
    display: block;
    padding: 0;
    background: rgba(248, 243, 228, 0.9);
    border: 1px solid var(--border-light);
    border-top: none;
    border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  }

  .attackTable tbody tr.detailRow td {
    display: block;
    width: 100%;
    border: none;
  }

  .expandTd {
    align-self: center;
    width: auto;
  }
```

- [ ] **Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Commit**

```bash
git add src/components/AttacksPanel/AttacksPanel.tsx src/components/AttacksPanel/AttacksPanel.module.css
git commit -m "feat: add castingTime, DamagesEditor, and dice rolling to AttacksPanel"
```

---

## Task 10: Final type check + spec review

- [ ] **Run full type check one last time**

```bash
npx tsc --noEmit
```

Expected: **zero errors**.

- [ ] **Manual browser test checklist**

Start the dev server: `npm run dev`

For **MonsterFeaturesPanel**:
- [ ] Open a monster/NPC sheet → edit mode → add a feature → verify "Tempo de Conjuração" input appears
- [ ] Add 2 damage parts (e.g. `2d6 Cortante +3`, `1d8 Radiante`) → save
- [ ] Exit edit mode → verify castingTime chip appears in feature body
- [ ] Click "🎲 Rolar dano" → verify each line shows correct format and total
- [ ] Click again → result updates (re-roll)

For **MonsterActionsPanel**:
- [ ] Same tests on an action and on a reaction

For **ResourcesPanel**:
- [ ] Open a PJ sheet → Habilidades tab → edit mode → add a resource → verify `castingTime` input and `DamagesEditor` appear
- [ ] Same roll/chip tests as above

For **AttacksPanel**:
- [ ] Open a PJ sheet → Combate tab → verify existing attacks are unaffected
- [ ] Click ▸ on an attack row → sub-row expands with `castingTime` input and DamagesEditor (edit mode)
- [ ] Add 1 damage part → save → exit edit mode
- [ ] Click ▸ in view mode → sub-row shows `castingTime` chip (if set) and "🎲 Rolar dano" button
- [ ] Click "🎲 Rolar dano" → verify results display
- [ ] Verify responsive layout at < 960px: sub-row still visible, not broken

- [ ] **Verify no data loss** — open a character that existed before this change → attacks/resources/features load normally with empty castingTime/damages arrays (no errors, no UI breakage)

- [ ] **Final commit (if any remaining changes)**

```bash
git add -A
git commit -m "feat: complete damages and casting time feature across all panels"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|---|---|
| Tempo de Conjuração em Habilidades e Ações | Tasks 6, 7, 8, 9 |
| DamagePart com dice/type/bonus | Task 1 |
| Múltiplos danos por item | Task 3 (DamagesEditor) |
| Adicionar e remover danos | Task 3 |
| Rolar danos com resultado inline | Tasks 6, 7, 8, 9 |
| Resultado por dado individual | Tasks 2 (formatRollLine), 6–9 |
| Total final | Tasks 2, 6–9 |
| Rolagem não altera PV | Tasks 6–9 (estado local apenas) |
| Retrocompatibilidade | Tasks 4, 5 (normalizeDamageParts fallback []) |
| Bônus vazio = 0 | Task 2 (parseBonus) |
| Dado inválido → rawRoll = 0 | Task 2 (parseDice returns null) |
| Responsividade | Task 9 (responsive CSS for sub-row), Task 3 (DamagesEditor CSS) |
| Funciona em NPC/Monstro | Tasks 6, 7 |
| Funciona em PJ | Tasks 8, 9 |

**No gaps found.**
