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
   - `[LEGADO]` — código mantido para retrocompatibilidade (ex: funções `normalizeLegacy*`, se ainda existirem)
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

**3.4 Listagem e busca**
- Identificar os hooks de listagem (verificar se ainda são `useCharacterSheets`/`useMonsterSheets`).
- Identificar o hook de busca (verificar se ainda é `useFirestoreSearch`).
- Verificar se o campo `name_lower` ainda é o mecanismo de busca por prefixo.

**3.5 Importação/exportação**
- Localizar funções de export (`exportCharacterSheetAsJSON` ou equivalente).
- Localizar funções de import e a função de detecção de tipo.
- Verificar limites (tamanho máximo de arquivo, regra de skip por ID existente).

---

### Passo 4 — Modelo de dados

**4.1 Identificar entidades**
- Localizar interfaces em `src/types/system/dnd/` (verificar se o caminho ainda é esse).
- Listar campos reais (não inventados) lendo os arquivos `.ts`.
- Distinguir tipo lido do Firestore (`Stored*`) do tipo de domínio (`CharacterSheet`, `MonsterSheet`).

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

> **Atenção:** Esta seção representa o estado observado no momento da criação/atualização desta Skill. Antes de citar qualquer item desta seção em uma análise, **validar contra o código atual**. Se algo divergir, seguir o código e registrar a divergência.

### Stack esperada

Verificar se o `package.json` ainda inclui:
- React, React DOM, React Router DOM
- Firebase
- react-easy-crop
- TypeScript, Vite, ESLint
- Verificar ausência de: framework de testes, script de typecheck, script de deploy customizado

### Estrutura esperada de diretórios em `src/`

| Pasta (snapshot) | Classificação esperada | Responsabilidade observada |
|---|---|---|
| `src/assets/` | [ATIVO] | Logo da marca |
| `src/components/` | [ATIVO] | Componentes de UI |
| `src/components/monster/` | [ATIVO] | Componentes da ficha de monstro |
| `src/components/session/` | [VAZIO] | Feature de sessão (não implementada) |
| `src/components/RoomHeader/` | [VAZIO] | Feature de sala |
| `src/components/RoomInstancesPanel/` | [VAZIO] | Feature de sala |
| `src/components/RoomMembersPanel/` | [VAZIO] | Feature de sala |
| `src/components/SheetGallery/` | [VAZIO] | Feature de galeria |
| `src/context/` | [ATIVO] | `AuthContext.tsx` |
| `src/hooks/` | [ATIVO] | Hooks de Firestore |
| `src/pages/` | [ATIVO + VAZIO] | Páginas roteadas |
| `src/pages/SalaDeJogoPage/` | [VAZIO] | Feature de sala |
| `src/pages/SalasPage/` | [VAZIO] | Feature de sala |
| `src/pages/SessionPage/` | [VAZIO] | Feature de sessão |
| `src/pages/SessionRoomPage/` | [VAZIO] | Feature de sessão |
| `src/realtime/session/` | [VAZIO] | Feature de tempo real |
| `src/services/` | [ATIVO] | Firebase init e auth |
| `src/store/` | [ATIVO] | CRUD + normalização |
| `src/styles/` | [ATIVO] | Design tokens |
| `src/types/system/dnd/` | [ATIVO] | Interfaces de dados |
| `src/types/gameRoom/` | [VAZIO] | Tipos de sala |
| `src/types/realtime/` | [VAZIO] | Tipos de tempo real |
| `src/utils/` | [ATIVO] | Utilitários auxiliares |

Validar cada linha: pastas podem ter sido criadas, esvaziadas ou removidas.

### Arquivos centrais esperados (ordem de leitura recomendada)

1. `src/services/firebase.ts`
2. `src/context/AuthContext.tsx`
3. `src/services/authService.ts`
4. `src/store/characterSheetStore.ts`
5. `src/store/monsterSheetStore.ts`
6. `src/store/defaultCharacterSheet.ts`
7. `src/App.tsx`
8. `src/types/system/dnd/CharacterSheet.ts`
9. `src/types/system/dnd/monsterSheet.ts`
10. `src/styles/theme.css`
11. `src/components/ProtectedRoute/ProtectedRoute.tsx`

Antes de citá-los como centrais, verificar se ainda existem e se ainda concentram a responsabilidade descrita.

### Modelo de dados esperado

- `CharacterSheet` deve agrupar: `character`, `resources`, `inventory`, `spells`, `attacks`, `combatNotes`, `isEditMode`.
- `MonsterSheet` deve agrupar: `systemId`, `details`, `stats`, `traits`, `features`, `actions`, `reactions`, `legendary`, `spells`.
- Documento Firestore deve incluir `name_lower` gerado em toda escrita.
- Tipos auxiliares esperados: `SavingStatus`, `Attack`, `Resource`, `Spell`, `Inventory`, `Character`, `MonsterAction`, `LegendaryAction`, `MonsterFeature`, `CreatureSize`, `DamageType`, `ConditionType`, `RechargeType`.

Verificar a presença e a forma atual desses tipos antes de afirmar.

### Origens de dados esperadas

| Dado | Origem esperada | Chave/Coleção esperada |
|---|---|---|
| Fichas de personagem | Firestore | `/users/{uid}/characterSheets/{id}` |
| Fichas de monstro/NPC | Firestore | `/users/{uid}/monsterSheets/{id}` |
| Avatar | Firestore | `data.character.avatar` ou `data.details.avatar` |
| Aberturas recentes | localStorage | `tomo:recentlyOpened` |
| Ordem customizada | localStorage | `tomo-char-order-{uid}` etc. |
| Aba ativa | sessionStorage | `character-sheet-active-tab:{id}` etc. |

Validar as chaves reais lendo as constantes no código.

### Riscos identificados (snapshot — verificar se ainda se aplicam)

> Antes de listar qualquer risco abaixo na análise final, confirmar que o arquivo/função citado ainda existe e que a invariante ainda é exigida pelo código atual.

**Arquivos críticos esperados:**
- `src/services/firebase.ts` — único ponto de inicialização do Firebase.
- `src/store/characterSheetStore.ts` → `normalizeCharacterSheet()` — retrocompatibilidade de dados salvos.
- `src/store/monsterSheetStore.ts` → `normalizeMonsterSheet()` — mesmo risco para monstros.
- `firestore.rules` — controle de acesso em produção (deploy separado via Firebase CLI).
- `src/context/AuthContext.tsx` — qualquer mudança impacta autenticação global.

**Invariantes esperadas:**
1. `name_lower` gerado em toda escrita Firestore (sem ele, busca quebra).
2. Debounce no salvamento (snapshot indica ~800ms — verificar valor atual).
3. Verificação de e-mail obrigatória no `ProtectedRoute`.
4. Toda leitura do Firestore passa por funções `normalize*`.

**Limitações técnicas esperadas:**
- ESLint cobrindo apenas `.js`/`.jsx` — verificar `eslint.config.js` atual; pode ter sido estendido.
- Sem framework de testes — validação manual no browser.
- Avatar como base64 no Firestore — risco de documentos próximos do limite de 1 MB.
- `documentação.MD` desatualizada — verificar se ainda existe e ainda descreve sistema antigo.

### Rotas esperadas (snapshot)

Públicas:
- `/login`, `/cadastro`, `/verificar-email`, `/privacidade`

Protegidas (via `ProtectedRoute`):
- `/`, `/fichas`, `/ficha/:id`, `/monstro/:id`, `/monstro/novo`, `*` (NotFound)

Validar lendo o roteador atual.

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
2. Identificar mecanismo: debounce, query Firestore, campo `name_lower`.
3. Validar geração de `name_lower` no store atual.
4. Verificar se há migração automática de documentos antigos sem `name_lower`.
5. Reportar funcionamento e limitações observadas (ex: prefixo vs. full-text).
