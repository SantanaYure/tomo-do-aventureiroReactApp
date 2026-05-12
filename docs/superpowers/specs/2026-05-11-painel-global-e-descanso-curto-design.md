# Design: Painel Global de Combate + Modal de Descanso Curto em Duas Fases

**Data:** 2026-05-11  
**Status:** Aprovado

---

## Contexto

A `CharacterCombatSummary` atualmente só aparece nas abas `Principal` e `Mesa`. O objetivo é torná-la um painel global visível em todas as abas, e melhorar o `ShortRestModal` para exibir os resultados da rolagem antes de aplicar a cura.

---

## Mudança 1 — CharacterCombatSummary global

**Arquivo afetado:** `src/pages/CharacterSheetPage/CharacterSheetPage.tsx`

Remover a condição `(activeTab === 'Principal' || activeTab === 'Mesa')` que envolve o `<CharacterCombatSummary>`. O componente já está posicionado fora do `role="tabpanel"`, acima do conteúdo da aba ativa — basta deixá-lo incondicional.

Sem novas props, sem novos estilos, sem duplicação.

---

## Mudança 2 — ShortRestModal em duas fases

**Arquivo afetado:** `src/components/ShortRestModal/ShortRestModal.tsx`

### Estado novo

```ts
type Phase = 'select' | 'result'

const [phase, setPhase] = useState<Phase>('select')
const [rollResults, setRollResults] = useState<{ dieLabel: string; roll: number }[]>([])
const [totalRolled, setTotalRolled] = useState(0)
```

O modal sempre abre em `phase = 'select'`. Ao cancelar ou fechar, todos os estados acima são limpos (o modal é desmontado pelo pai, então o reset é automático).

### Fase 1 — select

- UI atual (seletores de dados por tipo, contador de dados disponíveis).
- Botão **"Rolar"** (substituindo "Rolar e descansar"):
  - Habilitado apenas se `totalPending >= 1`.
  - Ao clicar: rola cada dado individualmente, armazena em `rollResults`, calcula `totalRolled` (soma bruta sem CON), muda `phase` para `'result'`.
  - **Não altera a ficha.**
- Botão **"Cancelar"** → fecha modal sem efeitos.

### Fase 2 — result

Corpo do modal exibe:

```
d10: 7
d10: 4
d6:  3
──────────────
CON: +6        ← linha exibida somente se conMod ≠ 0
Total: 20 PV
```

- Cada entrada de `rollResults` como uma linha `dieLabel: roll`.
- Se `conMod ≠ 0`: linha separada `CON: {fmt(conMod * totalPending)}`.
- Linha de total: `Total: {Math.max(0, totalRolled + conMod * totalPending)} PV`.
- A seleção de dados **não é editável** nesta fase.
- Botão **"Aplicar cura"** → chama `onConfirm(Math.max(0, totalRolled + conMod * totalPending), totalPending)`.
- Botão **"Cancelar"** → fecha modal sem efeitos (dados não são debitados).

### Assinatura de onConfirm

Permanece inalterada: `(hpHealed: number, diceSpent: number) => void`.

### handleShortRestConfirm (CharacterSheetPage)

Permanece intacto — já aplica HP e debita dados corretamente.

---

## Invariantes e restrições

- `totalPending` = soma de todos os dados selecionados entre todas as classes.
- Não é possível selecionar mais dados do que `remaining` (já garantido pelo seletor).
- `hpHealed` passado a `onConfirm` é `Math.max(0, totalRolled + conMod * totalPending)` — pode ser 0 se CON muito negativa e rolagens baixas.
- O pai (`CharacterSheetPage`) capeia o HP em `hpMax` via `handleShortRestConfirm`.

---

## Arquivos modificados

| Arquivo | Tipo de mudança |
|---|---|
| `src/pages/CharacterSheetPage/CharacterSheetPage.tsx` | Remover condição de aba no `CharacterCombatSummary` |
| `src/components/ShortRestModal/ShortRestModal.tsx` | Adicionar estado de fase + lógica de duas fases |
| `src/components/ShortRestModal/ShortRestModal.module.css` | Estilos para a seção de resultados (linha por dado, total) |

Nenhum novo componente. Nenhuma mudança em tipos ou stores.
