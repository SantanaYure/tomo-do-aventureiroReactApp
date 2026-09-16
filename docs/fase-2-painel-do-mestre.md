# Especificação Técnica — Fase 2: Painel do Mestre e Sincronização em Tempo Real

- **Fase:** 2 (Painel do Mestre e Sincronização em Tempo Real)
- **Branch:** `feat/fase-1-salas-e-campanhas`
- **Documento autoritativo de estilo:** [`design.md`](../design.md)
- **Documento autoritativo de arquitetura:** [`CLAUDE.md`](../CLAUDE.md)

---

## 1. Objetivo e Visão Geral

Permitir que o **Mestre (DM)** e os **Jogadores** acompanhem em tempo real o estado de combate e os status vitais de todos os heróis vinculados à mesa, e que o Mestre possa instanciar e gerenciar criaturas e monstros durante as sessões do **Tomo do Aventureiro**.

### Princípios desta fase
- **Conformidade com o Design System:** Adesão integral às variáveis OKLCH de `design.md`, estética Glass Morphism + Flat, botões `--radius-btn: 6px`, família sépia/dourada para HP (`--danger-solid`, `--heal-solid`, `--temp-solid`, `--track-bg`) e ausência total de emojis e botões pílula.
- **Sincronização em Tempo Real sem custo de rules:** Uso inteligente das coleções `/campaigns/{id}` e `/campaigns/{id}/members/{userId}`, permitindo que dados vitais e criaturas sejam sincronizados via `onSnapshot` sem exigir novas publicações de regras de segurança no Firestore.
- **Autonomia do Mestre e Jogadores:** Tanto o Mestre quanto o próprio jogador podem atualizar os PVs e condições de seu personagem na mesa.

---

## 2. Modelagem de Dados

### 2.1 Status Vital do Personagem (`CharacterVitals`)
```typescript
export interface CharacterVitals {
  hpCurrent: number
  hpMax: number
  hpTemp: number
  armorClass: number
  passivePerception: number
  heroicInspiration: boolean
  conditions: string[]
  deathSaves: {
    successes: number
    failures: number
  }
  spellSlots?: Record<string, { current: number; max: number }>
}
```

### 2.2 Criaturas na Sessão (`CampaignCreature`)
```typescript
export interface CampaignCreature {
  id: string
  name: string
  monsterSheetId?: string | null
  avatar?: string | null
  hpCurrent: number
  hpMax: number
  hpTemp: number
  armorClass: number
  passivePerception?: number
  conditions: string[]
  addedAt: number
}
```

### 2.3 Lista de Condições Oficiais D&D (2024)
- Abalado (Frightened)
- Agarrado (Grappled)
- Atordoado (Stunned)
- Caído (Prone)
- Cego (Blinded)
- Enfeitiçado (Charmed)
- Envenenado (Poisoned)
- Impedido (Restrained)
- Incapacitado (Incapacitated)
- Invisível (Invisible)
- Paralisado (Paralyzed)
- Petrificado (Petrified)
- Surdo (Deafened)
- Inconsciente (Unconscious)
- Exaustão (Exhaustion)

---

## 3. Componentes da Fase 2

1. **`HeroVitalCard`:** Exibe card glass do PJ com:
   - Avatar com fallback para iniciais e nome do jogador/PJ.
   - Barra de PV dinâmica com proporção e cores semânticas sépia.
   - Badges de CA (`Shield`) e Percepção Passiva (`Eye`).
   - Marcador de Salvaguardas Contra a Morte (quando PV = 0).
   - Marcador de Inspiração Heróica (`Sparkles`).
   - Chips de condições ativas com botão de remoção rápida e adição.
   - Ações rápidas de Dano e Cura (-5, -1, +1, +5 ou valor customizado).

2. **`CreatureVitalCard`:** Exibe card de monstro instanciado em cena:
   - Nome, avatar e tipo.
   - Barra de PV, CA e condições.
   - Botão para remover criatura (derrotada/encerrada).

3. **`AddCreatureModal`:**
   - Permite ao Mestre importar monstros da sua biblioteca (`useMonsterSheets`) ou cadastrar uma criatura rápida personalizada (nome, PV máx, CA).

4. **`ConditionsModal`:**
   - Diálogo acessível para selecionar ou desmarcar condições ativas de uma entidade (PJ ou Criatura).
