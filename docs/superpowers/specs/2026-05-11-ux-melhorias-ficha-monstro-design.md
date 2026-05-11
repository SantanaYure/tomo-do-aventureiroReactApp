# Design: Melhorias de UX/UI — Ficha de Monstro/NPC e Personagem

**Data:** 2026-05-11
**Status:** Aprovado

---

## Escopo

Quatro melhorias independentes de UX/UI:

1. Bloco de combate persistente em todas as abas da ficha de monstro/NPC
2. Rótulos claros para chips de deslocamento, resistências e imunidades
3. Título do navegador dinâmico com o nome da ficha
4. Nomenclatura correta dos arquivos JSON exportados

---

## 1. Bloco de combate persistente (MonsterCombatSummary)

### Problema
CA, PV, gerenciador de HP, deslocamentos, resistências e imunidades só estão acessíveis na aba Mesa (dentro de `MonsterTableMode`). Ao navegar para outra aba (Detalhes, Combate, Ações, etc.) o mestre perde acesso ao gerenciamento de HP em tempo de jogo.

### Solução
Criar o componente `MonsterCombatSummary` e renderizá-lo persistentemente em `MonsterSheetPage`, entre a barra de abas e o conteúdo da aba ativa.

**Novo componente:** `src/components/monster/MonsterCombatSummary/MonsterCombatSummary.tsx`

Props:
```ts
interface MonsterCombatSummaryProps {
  sheet: MonsterSheet
  onChange: (patch: DeepPartial<MonsterSheet>) => void
}
```

Conteúdo renderizado (sempre visível, fora do `tabpanel`):
- Linha com CA e PV atual/máximo
- Gerenciador de HP: input Valor + botões Dano / Cura / Temp (mesma lógica de `MonsterStatsPanel` e `MonsterTableMode`)
- Seção "Deslocamento" com label + chips (se houver movimentos)
- Seção "Resistências a Dano" com label + chips (se houver)
- Seção "Imunidades a Dano" com label + chips (se houver)
- Seção "Imunidades a Condições" com label + chips (se houver)

**Em `MonsterSheetPage`:** renderizar `<MonsterCombatSummary>` logo após o `restBar` e antes do `tabpanel`.

**Em `MonsterTableMode`:** remover a Seção B inteira (bloco de defesa e vida: statsGrid, hpControls, movementList, chipLists de resistências/imunidades). A Seção B não reaparece em nenhum outro lugar — `MonsterCombatSummary` é a única fonte.

---

## 2. Rótulos claros para chips (incluído no MonsterCombatSummary)

### Problema
Na aba Mesa atual, os chips de deslocamento, resistências, imunidades a dano e imunidades a condições aparecem sem qualquer label de contexto. O usuário precisa ter conhecimento prévio do sistema para entender o que cada grupo significa.

### Solução
Cada grupo de chips no `MonsterCombatSummary` recebe um `<span>` de label antes dos chips:

| Campo | Label |
|---|---|
| `stats.movements` | Deslocamento |
| `traits.resistances` | Resistências a Dano |
| `traits.immunities` | Imunidades a Dano |
| `traits.conditionImmunities` | Imunidades a Condições |

Grupos vazios continuam ocultos (sem renderizar label nem lista).

---

## 3. Título do navegador dinâmico

### Problema
A aba do navegador sempre exibe "Tomo do Aventureiro", independente de qual ficha está aberta.

### Solução
Adicionar `useEffect` em `CharacterSheetPage` e `MonsterSheetPage` que atualiza `document.title` assim que o `sheet` estiver disponível. O cleanup restaura o título original.

**CharacterSheetPage:**
```ts
useEffect(() => {
  if (!sheet) return
  const name = sheet.character.name.trim()
  document.title = name || 'Tomo do Aventureiro'
  return () => { document.title = 'Tomo do Aventureiro' }
}, [sheet?.character.name])
```

**MonsterSheetPage:**
```ts
useEffect(() => {
  if (!sheet) return
  const name = sheet.details.name.trim()
  document.title = name || 'Tomo do Aventureiro'
  return () => { document.title = 'Tomo do Aventureiro' }
}, [sheet?.details.name])
```

Sem ícones, sem prefixo — apenas o nome puro.

---

## 4. Nomenclatura dos arquivos JSON exportados

### Problema
Todos os personagens exportam com prefixo `tomo-personagem` e todos os monstros/NPCs com `tomo-monstro`, sem distinguir NPCs de monstros.

### Solução
Em `CharactersPage`, ajustar os dois handlers de export:

**`handleExportSheet` (personagem):**
```ts
// antes:  normalizeFileName(..., 'tomo-personagem')
// depois: normalizeFileName(..., 'personagem')
```

**`handleExportMonster` (monstro/NPC):**
```ts
const prefix = monster.data.details.kind === 'npc' ? 'npc' : 'monstro'
// antes:  normalizeFileName(..., 'tomo-monstro')
// depois: normalizeFileName(..., prefix)
```

Resultado dos nomes:
- `personagem-{nome-normalizado}.json`
- `npc-{nome-normalizado}.json`
- `monstro-{nome-normalizado}.json`

---

## Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `src/components/monster/MonsterCombatSummary/MonsterCombatSummary.tsx` | Criar (novo) |
| `src/components/monster/MonsterCombatSummary/MonsterCombatSummary.module.css` | Criar (novo) |
| `src/pages/MonsterSheetPage/MonsterSheetPage.tsx` | Importar e renderizar `MonsterCombatSummary`; remover dependência direta de Seção B |
| `src/components/monster/MonsterTableMode/MonsterTableMode.tsx` | Remover Seção B |
| `src/pages/CharacterSheetPage/CharacterSheetPage.tsx` | Adicionar `useEffect` de `document.title` |
| `src/pages/MonsterSheetPage/MonsterSheetPage.tsx` | Adicionar `useEffect` de `document.title` |
| `src/pages/CharactersPage/CharactersPage.tsx` | Ajustar prefixos de nome de arquivo no export |

---

## Checklist pós-implementação

- [ ] Navegar por todas as abas da ficha de monstro e confirmar que CA, PV e HP manager estão visíveis
- [ ] Aplicar Dano/Cura/Temp fora da aba Mesa e verificar que o HP atualiza corretamente
- [ ] Confirmar que labels (Deslocamento, Resistências a Dano, etc.) aparecem apenas quando o grupo tem itens
- [ ] Abrir ficha de personagem e verificar título da aba no browser
- [ ] Abrir ficha de monstro/NPC e verificar título da aba no browser
- [ ] Voltar para outra página e confirmar que o título volta para "Tomo do Aventureiro"
- [ ] Exportar um personagem e confirmar nome `personagem-*.json`
- [ ] Exportar um NPC e confirmar nome `npc-*.json`
- [ ] Exportar um monstro e confirmar nome `monstro-*.json`
