# Design: Tempo de Conjuração + Área de Dano Estruturado

**Data:** 2026-05-12  
**Status:** Aprovado

---

## Contexto

Habilidades e Ações de NPCs/Monstros e PJs precisam de campos para:
- **Tempo de Conjuração** (`castingTime`): campo de texto livre.
- **Danos estruturados** (`damages: DamagePart[]`): lista de partes de dano com dado, tipo e bônus, substituindo a dependência exclusiva nos campos legados `damage`/`damageType` (que permanecem intactos).
- **Rolagem de dano**: botão inline no modo de visualização que exibe o resultado sem alterar PV.

---

## Mapeamento de locais

| Contexto | Habilidades | Ações |
|---|---|---|
| Monstro/NPC | `MonsterFeaturesPanel` → `MonsterFeature[]` | `MonsterActionsPanel` → `MonsterAction[]` + reações |
| PJ | `ResourcesPanel` → `Resource[]` | `AttacksPanel` → `Attack[]` |

---

## Novo tipo: DamagePart

Definido em `src/types/system/dnd/monsterSheet.ts`, exportado por `src/types/system/dnd/index.ts`.

```ts
export interface DamagePart {
  dice: string   // "2d6", "1d8", "3d10" — notação XdY
  type: string   // "Cortante", "Fogo", "Radiante", etc.
  bonus: string  // "+4", "-1", "" — vazio tratado como 0
}
```

---

## Mudanças de tipo

### monsterSheet.ts
```ts
// MonsterFeature: adicionar
castingTime: string    // default: ''
damages: DamagePart[]  // default: []

// MonsterAction: adicionar
castingTime: string    // default: ''
damages: DamagePart[]  // default: []
// (damage: string e damageType: DamageType permanecem)
```

### Resource.ts
```ts
castingTime?: string   // default: ''
damages?: DamagePart[] // default: []
```

### Attack.ts
```ts
castingTime?: string   // default: ''
damages?: DamagePart[] // default: []
// (damage?: string e damageType?: string permanecem)
```

### index.ts
Exportar `DamagePart` de `monsterSheet`.

---

## Novo utilitário: diceRoller.ts

`src/utils/diceRoller.ts`

```ts
export interface DamageRollResult {
  dice: string
  type: string
  bonus: number    // parsed from DamagePart.bonus, 0 se vazio/inválido
  rawRoll: number  // soma dos dados sem bônus
  subtotal: number // rawRoll + bonus
}

export interface DamageRollSummary {
  results: DamageRollResult[]
  total: number
}

// parseDice("2d6") → { count: 2, sides: 6 } | null
// parseDice("invalid") → null → trata como 0
export function parseDice(notation: string): { count: number; sides: number } | null

// rollDamages(damages) → DamageRollSummary
export function rollDamages(damages: DamagePart[]): DamageRollSummary
```

Invariantes:
- Notação inválida → `rawRoll = 0`, resultado exibido com aviso ou suprimido.
- `bonus` vazio ou não-numérico → tratado como 0.
- `bonus` positivo ou negativo → somado corretamente.
- Resultado nunca altera estado do personagem.

---

## Novo componente: DamagesEditor

`src/components/DamagesEditor/DamagesEditor.tsx` + `.module.css`

Props:
```ts
interface DamagesEditorProps {
  damages: DamagePart[]
  onChange: (updated: DamagePart[]) => void
}
```

UI (modo edição):
- Lista de linhas: `[dado] [tipo] [bônus] [✕]`
- Botão "＋ Dano" para adicionar nova parte.
- Campos: `dice` (input texto, placeholder "2d6"), `type` (input texto, placeholder "Cortante"), `bonus` (input texto, placeholder "+4").
- Responsivo: campos em linha em telas largas, empilhados em telas estreitas.

Reutilizado nos 4 painéis.

---

## Mudanças nos painéis

### Modo edição (todos os 4 painéis)

- Campo `castingTime` (input texto, label "Tempo de Conjuração") adicionado após o nome.
- Seção `DamagesEditor` adicionada dentro do card/linha.

Para **AttacksPanel** (layout de tabela):
- Cada linha ganha uma célula extra com ícone ▸/▾.
- Ao expandir: sub-linha com `colspan=n` mostrando `castingTime` + `DamagesEditor`.
- Os campos existentes da tabela não mudam.

### Modo visualização (todos os 4 painéis)

- `castingTime` exibido como chip/tag quando não vazio.
- Quando `damages.length > 0`: botão "🎲 Rolar dano" visível.
- Ao clicar: rola todos os danos, exibe resultado inline abaixo do item.
- Novo clique substitui resultado anterior (rerola).
- **Nunca altera HP/PV**.

Formato de exibição:
```
2d6 cortante: 8 + 4 = 12
1d8 radiante: 5
Total: 17
```
(Linha de bônus suprimida quando bônus = 0.)

---

## Normalização nos stores

### monsterSheetStore.ts

`normalizeMonsterFeature`: adicionar:
```ts
castingTime: normalizeString(nextValue.castingTime),
damages: normalizeDamageParts(nextValue.damages),
```

`normalizeMonsterAction`: idem.

`createDefaultMonsterFeature`/`createDefaultMonsterAction`: adicionar `castingTime: ''`, `damages: []`.

### characterSheetStore.ts

`normalizeAttack`: adicionar `castingTime` e `damages` com defaults.

`normalizeResource`: idem.

`createDefaultAttack`/`createDefaultResource`: adicionar `castingTime: ''`, `damages: []`.

Helper compartilhado:
```ts
function normalizeDamageParts(value: unknown): DamagePart[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item) => typeof item === 'object' && item !== null)
    .map((item) => ({
      dice: typeof item.dice === 'string' ? item.dice : '',
      type: typeof item.type === 'string' ? item.type : '',
      bonus: typeof item.bonus === 'string' ? item.bonus : '',
    }))
}
```

---

## Arquivos modificados

| Arquivo | Tipo |
|---|---|
| `src/types/system/dnd/monsterSheet.ts` | Modificado — DamagePart + campos |
| `src/types/system/dnd/Resource.ts` | Modificado — campos opcionais |
| `src/types/system/dnd/Attack.ts` | Modificado — campos opcionais |
| `src/types/system/dnd/index.ts` | Modificado — exportar DamagePart |
| `src/utils/diceRoller.ts` | Novo |
| `src/components/DamagesEditor/DamagesEditor.tsx` | Novo |
| `src/components/DamagesEditor/DamagesEditor.module.css` | Novo |
| `src/store/monsterSheetStore.ts` | Modificado — normalização |
| `src/store/characterSheetStore.ts` | Modificado — normalização |
| `src/components/monster/MonsterFeaturesPanel/MonsterFeaturesPanel.tsx` | Modificado |
| `src/components/monster/MonsterActionsPanel/MonsterActionsPanel.tsx` | Modificado |
| `src/components/ResourcesPanel/ResourcesPanel.tsx` | Modificado |
| `src/components/AttacksPanel/AttacksPanel.tsx` | Modificado |

---

## Invariantes e restrições

- Campos `damage`/`damageType` existentes nunca são removidos nem migrados automaticamente.
- `damages: []` em dados antigos (ausência do campo) → normalizado como array vazio → nenhum impacto visual.
- Rolagem de dano: somente exibe resultado; nunca modifica o estado da ficha.
- Botão "Rolar dano" só aparece quando `damages.length > 0`.
- Bônus vazio = 0. Bônus negativo funciona corretamente.
- Dado inválido (`"abc"`, `""`) → `rawRoll = 0`.
