# Aba "Mesa" — Modo de Jogo para Personagens, Monstros e NPCs

**Data:** 2026-05-02
**Status:** Aprovado

---

## Visão geral

Adicionar uma aba **"Mesa"** como primeira aba em `CharacterSheetPage` e `MonsterSheetPage`. A aba reúne os dados mais relevantes para uso durante uma sessão de jogo em uma única tela interativa, eliminando a necessidade de navegar entre abas durante combate ou interpretação.

---

## Contexto do repositório

- `CharacterSheetSummary` existe em `src/components/CharacterSheetSummary/` com um "Resumo de Mesa" read-only, mas **não está importado em lugar nenhum**. Será absorvido logicamente por `CharacterTableMode`.
- `CharacterSheetPage` tem abas: Principal, Combate, Magias, Habilidades, Inventário, Detalhes.
- `MonsterSheetPage` tem abas: Detalhes, Combate, Habilidades, Ações, Magias, Lendárias. Os botões de descanso ficam **fora das abas** (na `restBar`).
- `ManagedResourceControls` é o componente de rastreamento de usos já existente.
- O padrão de cards colapsáveis já existe em `MonsterFeaturesPanel`, `MonsterActionsPanel` e `LegendaryActionsPanel`.

---

## Abordagem

**Abordagem A — Nova aba "Mesa" com componentes dedicados.**

Cada tipo de ficha ganha um componente próprio que agrega os dados em seções compactas. Os painéis existentes não são alterados.

---

## Arquivos

### Novos

| Arquivo | Responsabilidade |
|---|---|
| `src/components/CharacterTableMode/CharacterTableMode.tsx` | Aba Mesa de personagens |
| `src/components/CharacterTableMode/CharacterTableMode.module.css` | Estilos da aba Mesa de personagens |
| `src/components/monster/MonsterTableMode/MonsterTableMode.tsx` | Aba Mesa de monstros/NPCs |
| `src/components/monster/MonsterTableMode/MonsterTableMode.module.css` | Estilos da aba Mesa de monstros/NPCs |

### Alterados

| Arquivo | Mudança |
|---|---|
| `src/pages/CharacterSheetPage/CharacterSheetPage.tsx` | Adiciona `'Mesa'` como primeiro item em `TABS`, renderiza `CharacterTableMode` |
| `src/pages/MonsterSheetPage/MonsterSheetPage.tsx` | Adiciona `'Mesa'` como primeiro item em `TABS`, renderiza `MonsterTableMode` com `isEditing={false}` |

### Não alterados

- Todos os painéis existentes (`MonsterStatsPanel`, `MonsterActionsPanel`, `MonsterFeaturesPanel`, etc.)
- `CharacterSheetSummary` (mantido, não deletado, não conectado)
- Fluxo de salvamento, descanso e edição

---

## Interfaces dos componentes

```ts
// CharacterTableMode — aba Mesa é sempre modo visualização interativa
interface CharacterTableModeProps {
  sheet: CharacterSheet
  onUpdate: (updated: CharacterSheet) => void
}

// MonsterTableMode — segue o padrão MonsterComponentProps existente,
// mas isEditing é sempre passado como false pela MonsterSheetPage
// onChange ainda é necessário para rastreamento interativo de recursos
interface MonsterTableModeProps {
  sheet: MonsterSheet
  isEditing: false
  onChange: (patch: DeepPartial<MonsterSheet>) => void
}
```

---

## CharacterTableMode — Seções

### A — Stats rápidos

Grid de chips com: CA, PV atual/máximo (+ HP temporário se > 0), Iniciativa, Deslocamento, Bônus de Proficiência, Percepção Passiva, Conjuração (se `spellcastingAbility` preenchido).

Abaixo do grid: campo numérico de valor + botões **Dano / Cura / Temp** para ajuste de HP em combate.

Cálculos reutilizados: `calcModifier`, `calcProficiencyBonus` (já exportados de `AttributesPanel`). Lógica de HP reutilizada do `CombatPanel`/`CharacterSheetSummary`.

### B — Atributos

6 cards compactos (Força, Destreza, Constituição, Inteligência, Sabedoria, Carisma) com valor e modificador formatado (`+X` ou `−X`).

Reutiliza `calcModifier` exportado de `AttributesPanel`.

### C — Recursos gerenciáveis

Lista dos recursos em `sheet.resources`. Para cada recurso:
- Nome e badge de recarga (Desc. curto / Desc. longo / Manual)
- Bolinhas clicáveis via `ResourceDots`
- Botões de gastar/restaurar via `ManagedResourceControls`

Recursos com `max === 0` são omitidos. Seção omitida se não houver recursos.

Atualização via `onUpdate({ ...sheet, resources: updatedResources })`.

### D — Ataques resumidos

Tabela compacta com: nome do ataque, bônus calculado (reutiliza `calcAttackBonus` de `AttacksPanel`), dano e tipo de dano.

Omitida se `sheet.attacks` estiver vazio.

### E — Espaços de magia

Exibida apenas se `character.spellcastingAbility` estiver preenchido.

Chips por nível (1º ao 9º) com espaços disponíveis/máximos clicáveis para gastar/recuperar. Usa `sheet.spellSlots`. Níveis sem slots configurados são omitidos.

---

## MonsterTableMode — Seções

A aba "Mesa" de monstros/NPCs recebe sempre `isEditing={false}`.

### A — Identidade

Nome, badge de tipo (Monstro / NPC), linha de meta (espécie · tamanho · alinhamento), classe da criatura (se preenchida). ND e XP em chips de destaque.

Sem avatar, sem descrição/lore (esses ficam na aba Detalhes).

### B — Defesa e vida

Grid de chips: CA, HP atual/máximo, HP temporário (se > 0). Chips de deslocamento (ex: "Terra 9m · Voo 18m").

Abaixo: campo numérico de valor + botões **Dano / Cura / Temp** — reutiliza a lógica do `MonsterStatsPanel` em modo view.

Resistências, imunidades a dano, imunidades a condições: chips coloridos. Seções omitidas se os arrays estiverem vazios.

### C — Atributos e traços

6 cards compactos (For, Des, Con, Int, Sab, Car) com valor e modificador.

Subsseções compactas (omitidas se vazias):
- Testes de resistência
- Perícias
- Idiomas
- Percepção passiva (calculada)

### D — Habilidades especiais

Cards colapsáveis para cada `MonsterFeature` em `sheet.features`.

Se `hasLimitedUses === true`: `ManagedResourceControls` com botões de gastar/restaurar e badge de recarga.

Seção omitida se `sheet.features` estiver vazio.

### E — Ações, reações e ações bônus

- Multiataques (`isMultiattack === true`) destacados no topo fora da lista principal.
- Demais ações em cards colapsáveis. Header colapsado exibe: nome, bônus de ataque e dano (se `isAttack`), usos (se limitado).
- `ManagedResourceControls` para ações com `hasLimitedUses === true`.
- Reações em subseção separada com o mesmo padrão de cards.

Seções omitidas individualmente se os arrays estiverem vazios.

### F — Ações lendárias

Exibida **somente** se `sheet.legendary.actions.length > 0`.

- Tracker de pontos lendários via `ManagedResourceControls` fixado no topo da seção, com botão "Resetar turno".
- Cards colapsáveis para cada ação lendária, com custo em pontos e botão de gastar.

---

## Regras de implementação

1. `MonsterTableMode` sempre recebe `isEditing={false}` — a aba Mesa nunca entra em modo edição. O botão "Editar ficha" alterna `isEditing` globalmente na `MonsterSheetPage`, mas como `MonsterTableMode` ignora esse valor, não há efeito visual na aba Mesa. O usuário precisa trocar de aba para usar o modo edição.
2. Nenhum painel existente é modificado.
3. Toda lógica de cálculo é reutilizada das funções já exportadas (`calcModifier`, `calcProficiencyBonus`, `calcAttackBonus`, lógica de HP de `MonsterStatsPanel`).
4. `ManagedResourceControls` e `ResourceDots` são usados diretamente — sem reimplementar.
5. Seções vazias não poluem a interface (verificação explícita antes de renderizar).
6. Estilos seguem o padrão de `CharacterSheetSummary.module.css` e `panel.module.css`.
7. Sem novas dependências externas.

---

## Critérios de aceite

1. Aba "Mesa" aparece como primeira aba em fichas de personagem, monstro e NPC.
2. Controles de HP funcionam e salvam via debounce.
3. Recursos gerenciáveis (personagem) funcionam com `ResourceDots` e `ManagedResourceControls`.
4. Habilidades, ações e reações (monstro) exibem tracker de usos quando `hasLimitedUses`.
5. Ações lendárias exibem tracker de pontos; botão "Resetar turno" funciona.
6. Seções sem dados não aparecem.
7. Abas existentes continuam funcionando normalmente.
8. Modo edição (`isEditing`) não afeta a aba Mesa.
9. Botões de descanso (fora das abas) continuam funcionando.
10. `CharacterSheetSummary` não é alterado nem deletado.

---

## Validação manual

1. Abrir ficha de monstro com ações, habilidades e ações lendárias → acessar aba Mesa → conferir dados.
2. Aplicar dano e cura via controles de HP → confirmar persistência.
3. Gastar uso de habilidade/ação com usos limitados → confirmar contador.
4. Gastar pontos lendários → resetar turno → confirmar.
5. Abrir NPC sem ações lendárias → aba Mesa não deve quebrar, seção F não aparece.
6. Abrir ficha com poucos dados (campos vazios) → nenhuma seção vazia poluindo a tela.
7. Abrir ficha de personagem → aba Mesa com HP, recursos, ataques e espaços de magia.
8. Aplicar dano ao personagem e gastar recurso → confirmar persistência.
9. Navegar para outras abas e voltar → dados consistentes.
10. Usar botão "Editar ficha" → não afeta a aba Mesa.

---

## Não está no escopo

- Magias na aba Mesa de monstros (ficam na aba Magias).
- Condições, marcação de alvo, iniciativa ou anotações rápidas (não há base no projeto).
- Alterar `CharacterSheetSummary`.
- Conectar `CharacterSheetSummary` ao `CharacterSheetPage`.
- Testes automatizados (projeto não tem framework de testes).
