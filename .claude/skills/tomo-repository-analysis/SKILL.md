---
name: tomo-repository-analysis
description: Skill procedural para análise, documentação e mapeamento do repositório Tomo do Aventureiro (SPA React/TypeScript com Firebase). Use ao entender a arquitetura, preparar mudanças com segurança, mapear fluxos, ou separar comportamento real de código morto/feature planejada.
---

# Tomo Repository Analysis

## Regra global — fonte de verdade

> **Se qualquer informação desta Skill divergir do código atual, o código é a fonte de verdade. A Skill deve registrar a divergência e seguir o código.**

Toda informação textual aqui (estrutura de pastas, nomes de arquivos, rotas, fluxos, riscos) é um **snapshot** do estado observado no momento da criação/atualização desta Skill. Antes de afirmar qualquer coisa sobre o projeto, verificar diretamente no código (`src/`, `package.json`, configs). Sempre que encontrar divergência:

1. Seguir o que o código indica.
2. Registrar a divergência na seção "Incertezas e Lacunas" da análise produzida.
3. Sugerir (sem executar) a atualização desta Skill ou do `CLAUDE.md` na seção de incertezas.

---

## Descrição

Skill procedural para análise estática do repositório **Tomo do Aventureiro** — uma SPA React/TypeScript para gerenciamento de fichas de D&D 5e com persistência no Firebase Firestore.

Use esta Skill sempre que precisar entender a arquitetura atual, preparar uma mudança com segurança, revisar se uma implementação respeita os padrões do projeto ou separar comportamento real de código morto ou intenção futura.

---

## Gatilhos de uso

Invocar esta Skill quando o usuário pedir para:

- entender o projeto Tomo do Aventureiro
- analisar a arquitetura atual
- documentar o sistema ou um módulo específico
- mapear fluxos de dados, navegação ou persistência
- identificar arquivos centrais ou responsabilidades
- preparar uma refatoração com segurança
- revisar se uma mudança respeita o padrão do projeto
- separar o que é comportamento atual do que é plano futuro, legado ou código morto
- identificar riscos antes de alterar arquivos críticos

---

## Objetivo

Produzir uma análise fiel ao estado **real e atual** do repositório que permita:

1. Entender o que o sistema faz hoje (não o que estava planejado nem o que esta Skill descreve)
2. Identificar arquivos e funções centrais com suas responsabilidades reais
3. Mapear fluxos de autenticação, CRUD, persistência e busca **conforme observados no código**
4. Distinguir com precisão: código ativo / código morto / feature planejada não implementada
5. Listar riscos concretos antes de qualquer mudança, validados contra o estado atual

---

## Pré-condições

Antes de iniciar a análise, verificar:

- [ ] `CLAUDE.md` existe na raiz? Se sim, ler como ponto de partida (não como verdade absoluta).
- [ ] `package.json` está acessível?
- [ ] A pasta `src/` está acessível?
- [ ] Verificar se o `.env` existe (não é necessário para análise estática, mas indica se o ambiente local está configurado).

Se `CLAUDE.md` ou esta Skill divergirem do código, seguir o código (ver "Regra global").

---

## Regras de execução

> A regra de "código é a fonte de verdade" está definida na **Regra global** acima e se aplica a tudo abaixo. As regras a seguir são complementares e específicas de execução.

1. **`documentação.MD` (raiz):** o snapshot atual indica que descreve um sistema antigo baseado em localStorage. Verificar antes de citar e tratar como suspeita até confirmar.
2. **Nunca inventar arquivos, tipos, rotas ou funções.** Se algo não for encontrado, registrar como "não identificado no repositório".
3. **Classificação explícita** ao listar pastas/arquivos:
   - `[ATIVO]` — código implementado e em uso real (verificado por leitura)
   - `[VAZIO]` — pasta/arquivo que existe mas não tem implementação (verificado por listagem)
   - `[LEGADO]` — código mantido para retrocompatibilidade ou redirecionamento (ex: `NewCharacterPage`, `NewMonsterPage`, `VerifyEmailPage`)
   - `[PLANEJADO]` — feature referenciada em pastas/tipos vazios sem código
4. **Não modificar, refatorar, criar ou deletar nenhum arquivo de código** — apenas leitura e análise.
5. **Não executar comandos que alterem estado.** Comandos de leitura/validação (`npx tsc --noEmit`, `npm run lint`) são permitidos.
6. **`npm run build` e `npm run dev` não devem ser executados por padrão** — rodar apenas se necessário para validar uma hipótese específica ou se solicitado pelo usuário.
7. **Citar caminhos reais** em toda menção de arquivo (ex: `src/store/characterSheetStore.ts`). Se citar uma linha, verificar se ainda corresponde ao conteúdo descrito.
8. **Registrar incertezas** explicitamente ao final da análise.

---

## Workflow

> Cada passo é uma ação executável. Os nomes de arquivos/pastas citados são **hipóteses iniciais a verificar**, não garantias.

### Passo 1 — Levantamento inicial

**1.1 Ler `CLAUDE.md` (se existir)**
- Absorver o mapeamento já feito como ponto de partida.
- Sinalizar mentalmente: este conteúdo precisa ser validado contra o código.

**1.2 Ler `package.json`**
- Identificar stack real (dependencies, devDependencies).
- Listar scripts disponíveis.
- Registrar o que **não existe** (ex: scripts de teste, typecheck, deploy).

**1.3 Verificar arquivos de configuração na raiz**

Para cada um dos arquivos abaixo, verificar se existe e ler o conteúdo atual:

- `vite.config.js` (ou `.ts`) — plugins de build
- `tsconfig.json` — strict mode, target, includes
- `eslint.config.js` (ou `.mjs`) — **verificar quais extensões são cobertas** (.js, .jsx, .ts, .tsx)
- `firebase.json` — apontamento para `firestore.rules`
- `firestore.rules` — regras de acesso (verificar padrão `users/{userId}/**`)
- `vercel.json` — verificar se há fallback SPA configurado
- `.gitignore` — confirmar que `.env` está ignorado

Se algum desses arquivos não existir ou tiver mudado de nome, registrar a divergência.

---

### Passo 2 — Estrutura de diretórios

**2.1 Listar `src/` e classificar cada subpasta**

Para cada pasta encontrada em `src/`:
1. Listar arquivos dentro dela.
2. Classificar como `[ATIVO]`, `[VAZIO]`, `[LEGADO]` ou `[PLANEJADO]`.
3. Inferir responsabilidade pela leitura dos arquivos principais.

Consultar a seção **"Inventário de Referência"** abaixo como ponto de partida — mas validar cada item: pastas podem ter sido criadas, removidas, preenchidas ou esvaziadas desde a última atualização desta Skill.

**2.2 Identificar arquivos centrais por leitura**

A leitura prioritária recomendada está na seção "Inventário de Referência". Antes de assumir que esses arquivos ainda são os centrais:
- Verificar se cada arquivo ainda existe.
- Verificar se a responsabilidade descrita ainda corresponde ao conteúdo atual.
- Se algum arquivo central foi movido/renomeado/dividido, registrar a divergência.

---

### Passo 3 — Fluxos do sistema

Para cada fluxo abaixo, **mapear pela leitura do código atual**, não pela descrição desta Skill:

**3.1 Roteamento**
- Ler o arquivo de rotas (verificar se ainda é `src/App.tsx`).
- Listar rotas públicas e protegidas observadas.
- Identificar o componente de guarda (verificar se ainda é `ProtectedRoute`).

**3.2 Autenticação**
- Identificar o provider de auth (verificar se ainda é `src/context/AuthContext.tsx`).
- Listar métodos expostos pelo hook `useAuth()` (ou equivalente).
- Verificar se a verificação de e-mail ainda é obrigatória.

**3.3 CRUD de fichas**
- Verificar se ainda existem stores em `src/store/` para personagem e monstro.
- Mapear funções de criação, leitura, edição e exclusão.
- Identificar o mecanismo de salvamento (verificar se o debounce ainda é de 800ms — pode ter mudado).
- Verificar se MonsterSheetPage usa deep merge patch (e não sobrescreve a ficha inteira).

**3.4 Listagem e busca**
- Identificar os hooks de listagem (verificar se ainda são `useCharacterSheets`/`useMonsterSheets`).
- Identificar o hook de busca (verificar se ainda é `useFirestoreSearch`).
- Verificar se o campo `name_lower` ainda é o mecanismo de busca por prefixo.
- Verificar se `useFirestoreSearch` usa requestIdRef para evitar race conditions.

**3.5 Importação/exportação**
- Localizar funções de export (`exportCharacterSheetAsJSON` ou equivalente).
- Localizar funções de import e a função de detecção de tipo.
- Verificar limites (tamanho máximo de arquivo, regra de skip por ID existente).

**3.6 Ordenação customizada (drag-drop)**
- Verificar se `CharactersPage` implementa drag-drop para reordenar fichas.
- Identificar as chaves de localStorage onde a ordem é persistida.

---

### Passo 4 — Modelo de dados

**4.1 Identificar entidades**
- Localizar interfaces em `src/types/system/dnd/` (verificar se o caminho ainda é esse).
- Listar campos reais (não inventados) lendo os arquivos `.ts`.
- Distinguir tipo lido do Firestore (`Stored*`) do tipo de domínio (`CharacterSheet`, `MonsterSheet`).
- Verificar se `CharacterSheet` inclui `spellSlots` como campo separado de `spells`.

**4.2 Mapear origem de cada dado**

Para cada categoria de dado, verificar onde está armazenado:
- Firestore (e em qual coleção/path)
- localStorage (e com qual chave)
- sessionStorage (e com qual chave)

Validar as chaves contra as constantes reais no código (não confiar nos nomes citados nesta Skill).

---

### Passo 5 — Riscos e dependências críticas

**Antes de listar riscos, verificar se cada um ainda se aplica ao estado atual do código.** Riscos descritos no snapshot abaixo podem ter sido mitigados, alterados ou tornados obsoletos por refatorações posteriores.

Para cada risco candidato:
1. Confirmar que o arquivo/função citado ainda existe.
2. Confirmar que a invariante descrita ainda é exigida pelo código.
3. Se o risco não se aplicar mais, registrá-lo como "obsoleto" na análise.

Ver "Inventário de Referência → Riscos identificados" para o snapshot a validar.

---

### Passo 6 — Saída: estrutura da análise gerada

Ao final do workflow, produzir análise com as seguintes seções:

1. **Visão Geral** — o que o sistema faz hoje (verificado).
2. **Stack Identificada** — tecnologia, versão, scripts disponíveis, o que não existe.
3. **Estrutura de Diretórios** — tabela com classificação `[ATIVO/VAZIO/LEGADO/PLANEJADO]`.
4. **Arquivos Centrais** — arquivo, responsabilidade, por que é crítico.
5. **Fluxos Mapeados** — autenticação, CRUD, persistência, busca, import/export.
6. **Modelo de Dados** — entidades com campos reais, origem de cada dado.
7. **Integrações Externas** — Firebase Auth, Firestore, Vercel, etc.
8. **Riscos Identificados** — apenas os validados contra o código atual.
9. **Features Não Implementadas** — pastas/tipos vazios.
10. **Divergências em relação a `CLAUDE.md` / esta Skill** — o que mudou.
11. **Incertezas e Lacunas** — o que não foi possível determinar por análise estática.

---

### Passo 7 — Validação

Comandos permitidos para validação (executar apenas se relevante para a análise):

```bash
# Verificar se o projeto compila sem erros de tipo
npx tsc --noEmit

# Verificar lint (verificar antes quais extensões são cobertas)
npm run lint
```

Comandos a **não** executar por padrão:
- `npm run build` — não é necessário para análise estática. Executar apenas se solicitado pelo usuário ou se necessário para validar uma hipótese específica.
- `npm run dev` — idem.
- Qualquer comando que altere estado, faça commit ou deploy.

Se executar comandos de validação, registrar o resultado na análise sem tentar corrigir erros encontrados — o objetivo é documentar, não modificar.

---

## Critérios de qualidade

A análise produzida é considerada adequada se:

- [ ] Cita apenas arquivos verificados como existentes no repositório
- [ ] Usa classificação explícita `[ATIVO]`, `[VAZIO]`, `[PLANEJADO]`, `[LEGADO]`
- [ ] Separa fato (verificado no código) de hipótese (inferido ou incerto)
- [ ] Identifica e lista pastas vazias como features não implementadas
- [ ] Não trata `documentação.MD` ou esta Skill como verdade — usa o código como fonte
- [ ] Registra incertezas e divergências ao final
- [ ] Cita caminhos completos nos arquivos mencionados
- [ ] Não sugere mudanças, refatorações ou correções — apenas descreve estado atual

---

## Limitações

Esta Skill é estritamente de análise e documentação. Ela **não deve**:

- Implementar funcionalidades novas
- Corrigir bugs identificados
- Refatorar código existente
- Fazer commit de qualquer alteração
- Apagar ou renomear arquivos
- Criar arquivos além de documentos de análise (`.md` de saída)
- Alterar `firestore.rules` (requer deploy separado via Firebase CLI)
- Atualizar `CLAUDE.md` sem instrução explícita do usuário

Se durante a análise for identificado um problema crítico (segurança, dado corrompido), **reportar apenas** — não agir.

---

## Inventário de Referência (snapshot — validar contra o código atual)

> **Atenção:** Esta seção representa o estado observado em 2026-05-03. Antes de citar qualquer item desta seção em uma análise, **validar contra o código atual**. Se algo divergir, seguir o código e registrar a divergência.

### Stack verificada

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework UI | React + React DOM | 19.2 |
| Roteamento | React Router DOM | 7.13 |
| Build/Dev | Vite + @vitejs/plugin-react | 7.3 / 5.1 |
| Linguagem | TypeScript | 5.9 (strict: true) |
| Banco de dados | Firebase | 12.10 |
| Crop de avatar | react-easy-crop | 5.5 |
| Linting | ESLint (flat config) | 9.39 |

**Scripts disponíveis** (confirmados em `package.json`):
- `npm run dev` — servidor de desenvolvimento (Vite)
- `npm run build` — build de produção
- `npm run preview` — servir build localmente
- `npm run lint` — ESLint (apenas `.js`/`.jsx` — **sem suporte TypeScript**)

**O que NÃO existe**:
- Script `tsc` / typecheck — rodar manualmente com `npx tsc --noEmit`
- Framework de testes — sem Vitest, Jest, Cypress, etc.
- Script de deploy customizado — deploy feito direto pelo Vercel via push

**Observações de configuração**:
- `eslint.config.js` usa flat config (ESLint 9). Cobre **somente `.js` e `.jsx`** — erros TypeScript não são capturados por `npm run lint`
- `tsconfig.json`: target ES2020, module ESNext, moduleResolution bundler, include: `["src"]`
- `firebase.json`: aponta `firestore.rules` para deploy via Firebase CLI
- `firestore.rules`: regra única `match /users/{userId}/{document=**}` — cobre todas as subcoleções
- `vercel.json`: catch-all SPA configurado (`src: "/(.*)" → dest: "/index.html"`)

---

### Estrutura verificada de diretórios em `src/`

| Pasta | Classificação | Responsabilidade |
|---|---|---|
| `src/assets/` | [ATIVO] | Logo da marca (`brandLogo.ts` + PNG) |
| `src/components/` | [ATIVO] | Componentes de UI |
| `src/components/AttacksPanel/` | [ATIVO] | Painel de ataques |
| `src/components/AttributesPanel/` | [ATIVO] | Atributos (Força-Carisma) |
| `src/components/AvatarCropper/` | [ATIVO] | Crop de imagem com react-easy-crop |
| `src/components/CharacterDetailsPanel/` | [ATIVO] | Raça, background, aparência, backstory |
| `src/components/CharacterHeader/` | [ATIVO] | Cabeçalho com nome e nível |
| `src/components/CharacterSheetSummary/` | [ATIVO] | Resumo da ficha de personagem |
| `src/components/CharacterTableMode/` | [ATIVO] | View "Mesa" para fichas de personagem |
| `src/components/CombatPanel/` | [ATIVO] | CA, HP, iniciativa, death saves |
| `src/components/Header/` | [ATIVO] | Cabeçalho global da aplicação |
| `src/components/InventoryPanel/` | [ATIVO] | Inventário de itens |
| `src/components/ManagedResourceControls/` | [ATIVO] | Controles para recursos gerenciados |
| `src/components/NumberInput/` | [ATIVO] | Input customizado para números |
| `src/components/PrivacyPolicyModal/` | [ATIVO] | Modal de política de privacidade |
| `src/components/ProtectedRoute/` | [ATIVO] | Guard de rotas (auth + emailVerified) |
| `src/components/ResourceDots/` | [ATIVO] | Visualização de recursos com pontos |
| `src/components/ResourcesPanel/` | [ATIVO] | Recursos (ki, sorcery points, etc.) |
| `src/components/Sidebar/` | [ATIVO] | Menu lateral da aplicação |
| `src/components/SkillPanel/` | [ATIVO] | Painel de uma perícia individual |
| `src/components/SkillsPanel/` | [ATIVO] | Conjunto de perícias |
| `src/components/SpellsPanel/` | [ATIVO] | Painel de magias e spell slots |
| `src/components/UserMenu/` | [ATIVO] | Menu de usuário (logout, perfil) |
| `src/components/monster/LegendaryActionsPanel/` | [ATIVO] | Ações lendárias de monstro |
| `src/components/monster/MonsterActionsPanel/` | [ATIVO] | Ações e reações de monstro |
| `src/components/monster/MonsterFeaturesPanel/` | [ATIVO] | Features/habilidades do monstro |
| `src/components/monster/MonsterHeader/` | [ATIVO] | Cabeçalho da ficha de monstro |
| `src/components/monster/MonsterSpellsPanel/` | [ATIVO] | Magias do monstro |
| `src/components/monster/MonsterStatsPanel/` | [ATIVO] | Stats e traços do monstro |
| `src/components/monster/MonsterTableMode/` | [ATIVO] | View "Mesa" para fichas de monstro |
| `src/components/monster/MonsterTraitsPanel/` | [ATIVO] | Traços do monstro |
| `src/components/monster/shared.ts` | [ATIVO] | Utilitários compartilhados (DeepPartial) |
| `src/components/session/` | [VAZIO] | Feature de sessão não iniciada |
| `src/components/RoomHeader/` | [VAZIO] | Feature de sala não iniciada |
| `src/components/RoomInstancesPanel/` | [VAZIO] | Feature de sala não iniciada |
| `src/components/RoomMembersPanel/` | [VAZIO] | Feature de sala não iniciada |
| `src/components/SheetGallery/` | [VAZIO] | Feature de galeria não iniciada |
| `src/context/` | [ATIVO] | `AuthContext.tsx` — estado global de auth |
| `src/hooks/` | [ATIVO] | Hooks de Firestore e busca |
| `src/pages/CharacterSheetPage/` | [ATIVO] | Ficha de personagem — 7 abas |
| `src/pages/MonsterSheetPage/` | [ATIVO] | Ficha de monstro — 7 abas |
| `src/pages/CharactersPage/` | [ATIVO] | Lista, busca, import/export, drag-drop |
| `src/pages/Home/` | [ATIVO] | Landing page autenticada |
| `src/pages/LoginPage/` | [ATIVO] | Form de login |
| `src/pages/RegisterPage/` | [ATIVO] | Form de registro |
| `src/pages/EmailVerificationPage/` | [ATIVO] | Verificação de e-mail (atual) |
| `src/pages/PrivacyPolicyPage/` | [ATIVO] | Política de privacidade |
| `src/pages/NotFound/` | [ATIVO] | Página 404 |
| `src/pages/NewMonsterPage/` | [LEGADO] | Redirecionamento — criação via CharactersPage |
| `src/pages/NewCharacterPage/` | [LEGADO] | Não utilizado — criação via CharactersPage |
| `src/pages/VerifyEmailPage/` | [LEGADO] | Duplicado — EmailVerificationPage é o atual |
| `src/pages/SalaDeJogoPage/` | [VAZIO] | Feature de sala de jogo não iniciada |
| `src/pages/SalasPage/` | [VAZIO] | Feature de salas não iniciada |
| `src/pages/SessionPage/` | [VAZIO] | Feature de sessão não iniciada |
| `src/pages/SessionRoomPage/` | [VAZIO] | Feature de sessão não iniciada |
| `src/realtime/session/` | [VAZIO] | Feature de tempo real não iniciada |
| `src/services/` | [ATIVO] | Firebase init e autenticação |
| `src/store/` | [ATIVO] | CRUD + normalização de dados |
| `src/styles/` | [ATIVO] | Design tokens e estilos compartilhados |
| `src/types/system/dnd/` | [ATIVO] | 18 interfaces D&D 5e |
| `src/types/gameRoom/` | [VAZIO] | Tipos de sala não definidos |
| `src/types/realtime/` | [VAZIO] | Tipos de tempo real não definidos |
| `src/utils/` | [ATIVO] | Utilitários auxiliares |

---

### Arquivos centrais verificados (ordem de leitura recomendada)

1. `src/services/firebase.ts` — único ponto de init do Firebase; exporta `auth` e `db`
2. `src/context/AuthContext.tsx` — hook `useAuth()`; qualquer mudança impacta auth global
3. `src/services/authService.ts` — funções de Google, email/senha, reset, verificação
4. `src/store/characterSheetStore.ts` — CRUD + `normalizeCharacterSheet()` + `defaultCharacterSheet`
5. `src/store/monsterSheetStore.ts` — CRUD + `normalizeMonsterSheet()` + `createDefaultMonsterSheet()`
6. `src/store/defaultCharacterSheet.ts` — valores padrão de ficha nova
7. `src/App.tsx` — definição de rotas e layout principal
8. `src/types/system/dnd/CharacterSheet.ts` — tipo raiz da ficha de personagem
9. `src/types/system/dnd/monsterSheet.ts` — tipos da ficha de monstro
10. `src/styles/theme.css` — design tokens globais
11. `src/components/ProtectedRoute/ProtectedRoute.tsx` — guarda de rota
12. `src/hooks/useFirestoreSearch.ts` — busca com debounce e proteção contra race conditions

---

### Modelo de dados verificado

#### `CharacterSheet` (src/types/system/dnd/CharacterSheet.ts)
```typescript
interface CharacterSheet {
  character: Character
  resources: Resource[]
  inventory: Inventory
  spells: Spell[]
  spellSlots: SpellSlots          // campo separado de spells (verificado)
  attacks: Attack[]
  combatNotes: string
  isEditMode: boolean
}
```

#### `MonsterSheet` (src/types/system/dnd/monsterSheet.ts)
```typescript
interface MonsterSheet {
  systemId: 'dnd5e-monster'
  details: { name, kind: 'monster'|'npc', avatar, species, size, alignment, creatureClass, description, lore, guide }
  stats: { hpCurrent, maxHp, hpTemp, ac, movements[], atributos (10 cada) }
  traits: { savingThrows[], skills[], languages[], resistances[], immunities[], conditionImmunities[], challengeRating, xp }
  features: MonsterFeature[]
  actions: MonsterAction[]
  reactions: MonsterFeature[]
  legendary: { pointsPerRound, pointsUsed, description, actions: LegendaryAction[] }
  spells: { spellcastingAbility, proficiencyBonus, items: Spell[], slots: Record<number, {current, max}> }
}
```

#### Tipos auxiliares confirmados
`SavingStatus`, `Attack`, `Resource`, `Spell`, `Inventory`, `Character`, `MonsterAction`, `LegendaryAction`, `MonsterFeature`, `CreatureSize`, `DamageType`, `ConditionType`, `RechargeType`, `AttackType`, `Class`, `Currency`, `CurrencyType`, `DeathSaves`, `SavingThrows`, `ArmorTraining`, `AttunementItem`, `SkillName`

#### Documento Firestore
- Inclui `name_lower` gerado em toda escrita (campo obrigatório para busca)
- Inclui `createdAt` e `updatedAt` (ISO string)
- Campo `data` contém a entidade normalizada (`CharacterSheet` ou `MonsterSheet`)

---

### Origens de dados verificadas

| Dado | Origem | Chave/Coleção |
|---|---|---|
| Fichas de personagem | Firestore | `/users/{uid}/characterSheets/{id}` |
| Fichas de monstro/NPC | Firestore | `/users/{uid}/monsterSheets/{id}` |
| Avatar de personagem | Firestore (base64) | `data.character.avatar` |
| Avatar de monstro | Firestore (base64) | `data.details.avatar` |
| Aberturas recentes | localStorage | `tomo:recentlyOpened` |
| Ordem de personagens | localStorage | `tomo-char-order-{uid}` |
| Ordem de monstros | localStorage | `tomo-monster-order-{uid}` |
| Ordem de NPCs | localStorage | `tomo-npc-order-{uid}` |
| Aba ativa (personagem) | sessionStorage | `character-sheet-active-tab:{id}` |
| Aba ativa (monstro) | sessionStorage | `monster-sheet-active-tab:{id}` |

---

### Rotas verificadas (src/App.tsx)

**Públicas** (sem `ProtectedRoute`):
- `/login` → `LoginPage`
- `/cadastro` → `RegisterPage`
- `/verificar-email` → `EmailVerificationPage`
- `/privacidade` → `PrivacyPolicyPage`

**Protegidas** (dentro de `ProtectedRoute`):
- `/` → `Home`
- `/fichas` → `CharactersPage`
- `/ficha/:id` → `CharacterSheetPage`
- `/monstro/:id` → `MonsterSheetPage`
- `/monstro/novo` → `NewMonsterPage` (redirect legado)
- `/ficha/nova` → `Navigate to /fichas`
- `*` → `NotFound`

**Lógica do ProtectedRoute** (verificada):
1. Se `loading` → mostra spinner "Abrindo o tomo..."
2. Se não `user` → redireciona para `/login`
3. Se `!emailVerified` → redireciona para `/verificar-email`
4. Caso contrário → renderiza `<Outlet />`

---

### Funções exportadas dos stores (verificadas)

#### `src/store/characterSheetStore.ts`
- `createCharacterSheet(uid, initialValue?)` → `StoredCharacterSheet`
- `saveCharacterSheet(uid, id, sheet)` → persiste no Firestore
- `deleteCharacterSheet(uid, id)` → deleta
- `exportCharacterSheetAsJSON(sheet)` → string JSON serializado
- `importCharacterSheetFromJSON(uid, json)` → `ImportResult`
- `normalizeCharacterSheet(value)` → dados normalizados com defaults e compat legada
- `defaultCharacterSheet` — objeto exportado com valores padrão

#### `src/store/monsterSheetStore.ts`
- `createMonsterSheet(uid)` → monstro novo
- `saveMonsterSheet(uid, id, data)` → persiste
- `deleteMonsterSheet(uid, id)` → deleta
- `exportMonsterSheetAsJSON(monster)` → JSON
- `importMonsterSheetFromJSON(uid, json)` → `MonsterImportResult`
- `normalizeMonsterSheet(raw)` → normaliza com validações de tipos (CreatureSize, DamageType, RechargeType)
- `createDefaultMonsterSheet()` → estado padrão

---

### Hook `useAuth()` verificado

```typescript
{
  user: User | null
  uid: string | null
  loading: boolean
  emailVerified: boolean
  loginWithGoogle(): Promise<void>
  registerWithEmail(name, surname, email, password): Promise<void>
  loginWithEmail(email, password, keepLoggedIn): Promise<void>
  resendVerificationEmail(): Promise<void>
  sendPasswordReset(email): Promise<void>
  refreshUser(): Promise<boolean>
}
```

---

### Abas das páginas de ficha (verificadas)

#### `CharacterSheetPage` — 7 abas
1. Mesa — `CharacterTableMode` (view table-like)
2. Principal — atributos, perícias, info básica
3. Combate — CA, HP, iniciativa, death saves
4. Magias — spells e spell slots
5. Habilidades — recursos, ki, sorcery points
6. Inventário — itens
7. Detalhes — raça, background, aparência, backstory, traits, ideals, bonds, flaws

#### `MonsterSheetPage` — 7 abas
1. Mesa — `MonsterTableMode` (view table-like)
2. Detalhes — name, kind, species, size, alignment, description, lore, guide
3. Combate — HP, AC, movements, atributos
4. Habilidades — saving throws, skills, languages, resistances, immunities
5. Ações — actions e reactions
6. Magias — spellcasting ability, spells, slots
7. Lendárias — legendary actions

---

### Mecanismos de salvamento (verificados)

- **Debounce**: `SAVE_DEBOUNCE_MS = 800` em ambas as páginas de ficha
- **CharacterSheetPage**: salva `CharacterSheet` completo via `saveCharacterSheet(uid, id, sheet)`
- **MonsterSheetPage**: usa **deep merge patch** (não sobrescreve a ficha inteira) via `saveMonsterSheet`
- **Status de salvamento**: rastreado via `SavingStatus` (`'idle' | 'saving' | 'saved' | 'error'`)
- **Timer limpo** ao desmontar o componente

---

### Hook `useFirestoreSearch` (verificado)

- **Debounce**: `DEBOUNCE_MS = 300`
- **Limite de resultados**: `RESULTS_LIMIT = 20`
- **Mecanismo de busca**: `name_lower >= term && name_lower <= term` (prefixo)
- **Race condition fix**: `requestIdRef` incrementado a cada query — respostas obsoletas descartadas
- **Retorno**: `{ characters[], monsters[], isSearching, searchError, retrySearch() }`

---

### Riscos identificados (snapshot — verificar se ainda se aplicam)

> Antes de listar qualquer risco abaixo na análise final, confirmar que o arquivo/função citado ainda existe e que a invariante ainda é exigida pelo código atual.

**Arquivos críticos:**
- `src/services/firebase.ts` — único ponto de init do Firebase
- `src/store/characterSheetStore.ts` → `normalizeCharacterSheet()` — retrocompat de dados salvos
- `src/store/monsterSheetStore.ts` → `normalizeMonsterSheet()` — idem para monstros
- `firestore.rules` — controle de acesso em produção (deploy separado via Firebase CLI)
- `src/context/AuthContext.tsx` — qualquer mudança impacta autenticação global

**Invariantes críticas:**
1. `name_lower` gerado em toda escrita Firestore (sem ele, busca quebra silenciosamente)
2. Debounce de 800ms no salvamento — protege contra writes excessivos
3. Verificação de e-mail obrigatória no `ProtectedRoute`
4. Toda leitura do Firestore passa por funções `normalize*` antes de uso

**Limitações técnicas:**
- ESLint cobre apenas `.js`/`.jsx` — erros TypeScript não são detectados por `npm run lint`
- Sem framework de testes — validação manual no browser
- Avatar como base64 no Firestore — documentos próximos do limite de 1 MB
- `documentação.MD` na raiz descreve sistema antigo baseado em localStorage — não usar como referência

---

## Referências

Arquivos lidos como fonte primária (validar existência antes de citar):

| Arquivo | Tipo | Prioridade |
|---|---|---|
| `CLAUDE.md` | Documentação técnica | Alta — ler primeiro, validar contra código |
| `package.json` | Manifesto do projeto | Alta |
| `src/services/firebase.ts` | Inicialização de serviços | Alta |
| `src/context/AuthContext.tsx` | Estado global | Alta |
| `src/store/characterSheetStore.ts` | CRUD + normalização | Alta |
| `src/store/monsterSheetStore.ts` | CRUD + normalização | Alta |
| `src/App.tsx` | Roteamento | Alta |
| `src/types/system/dnd/CharacterSheet.ts` | Modelo de dados | Alta |
| `src/types/system/dnd/monsterSheet.ts` | Modelo de dados | Alta |
| `src/styles/theme.css` | Design tokens | Média |
| `firestore.rules` | Segurança do banco | Média |
| `vercel.json` | Configuração de deploy | Baixa |
| `eslint.config.js` | Configuração de linting | Baixa |
| `tsconfig.json` | Configuração TypeScript | Baixa |
| `documentação.MD` | Possivelmente desatualizada — validar antes de usar | Baixa |

---

## Exemplos

### Exemplo 1: "Entenda o projeto Tomo do Aventureiro para mim"

1. Ler `CLAUDE.md` (se existir) → ponto de partida.
2. Validar stack lendo `package.json`.
3. Validar rotas lendo o arquivo de roteamento atual.
4. Listar `src/` e classificar cada subpasta.
5. Produzir visão geral com seções: O que é / Stack / Rotas / Dados / Integrações.
6. Registrar features não implementadas (pastas vazias) e divergências em relação ao snapshot desta Skill.

### Exemplo 2: "Quero adicionar um novo campo à ficha de personagem"

1. Localizar a interface de personagem (verificar se ainda está em `src/types/system/dnd/Character.ts`).
2. Localizar o default da ficha (verificar `src/store/defaultCharacterSheet.ts`).
3. Localizar `normalizeCharacterSheet()` no store atual e verificar como tratar dados antigos sem o campo.
4. Identificar componentes que renderizam dados próximos (busca em `src/components/`).
5. Reportar quais arquivos precisariam ser alterados e por quê.
6. Alertar sobre normalização obrigatória para dados já salvos.
7. Não implementar — apenas mapear o impacto.

### Exemplo 3: "Existe algum sistema de sessão de jogo implementado?"

1. Listar arquivos em cada pasta candidata (`src/pages/SalasPage/`, `src/pages/SessionPage/`, `src/realtime/session/`, `src/types/gameRoom/`, `src/types/realtime/`, `src/components/session/`).
2. Para cada uma, classificar como `[VAZIO]` ou `[ATIVO]` conforme o conteúdo encontrado.
3. Se alguma pasta deixou de estar vazia desde o snapshot, registrar a divergência e descrever o que foi implementado.
4. Reportar o estado atual: implementada, parcialmente implementada ou não implementada.

### Exemplo 4: "A busca por nome funciona bem?"

1. Localizar o hook de busca (verificar se ainda é `src/hooks/useFirestoreSearch.ts`).
2. Identificar mecanismo: debounce 300ms, query Firestore, campo `name_lower`, proteção contra race conditions via `requestIdRef`.
3. Validar geração de `name_lower` no store atual.
4. Verificar se há migração automática de documentos antigos sem `name_lower`.
5. Reportar funcionamento e limitações observadas (ex: prefixo vs. full-text, limite de 20 resultados).

### Exemplo 5: "Quero adicionar uma nova aba à ficha de monstro"

1. Ler `src/pages/MonsterSheetPage/MonsterSheetPage.tsx` — identificar onde as abas são definidas e como o estado de aba ativa é gerenciado (sessionStorage).
2. Identificar o componente da aba existente mais próxima em funcionalidade (em `src/components/monster/`).
3. Mapear como o componente recebe dados (props do `MonsterSheetPage`) e como dispara atualizações (callback `handleUpdate`).
4. Identificar a estrutura de tipos relevante em `src/types/system/dnd/monsterSheet.ts`.
5. Alertar sobre impacto na normalização (`normalizeMonsterSheet`) se o novo campo não tiver default para dados existentes.
6. Não implementar — apenas mapear o impacto e os arquivos a alterar.
