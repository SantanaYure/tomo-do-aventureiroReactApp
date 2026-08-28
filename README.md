# Tomo do Aventureiro

## Visão geral

**Tomo do Aventureiro** é uma aplicação web SPA para criação, edição e gerenciamento de fichas de personagem, monstros e NPCs inspirados no sistema D&D 5e (2024). A interface é inteiramente em português do Brasil e tem tema visual Glass Morphism com alternância clara/escura.

Os dados são salvos por conta de usuário no Firebase Firestore. A autenticação é feita via Firebase Auth (e-mail/senha ou Google) e exige verificação de e-mail antes de conceder acesso à aplicação. Não há backend customizado: toda a lógica reside no frontend.

---

## Status do projeto

- Em produção, implantado via Vercel
- Funcionalidades de ficha de personagem e ficha de monstro/NPC implementadas e funcionais
- Autenticação com verificação de e-mail implementada
- Testes automatizados com Vitest + Testing Library; layout real e integração autenticada com Firebase continuam com validação manual no browser
- Várias pastas de features planejadas existem no repositório mas estão **completamente vazias**: `SalasPage`, `SessionPage`, `SessionRoomPage`, `SalaDeJogoPage`, `realtime/session/`, `components/session/`, `types/gameRoom/`, `types/realtime/`, `RoomHeader`, `RoomInstancesPanel`, `RoomMembersPanel`, `SheetGallery`

---

## Stack

| Tecnologia | Versão | Uso |
|---|---|---|
| React | 19 | Framework de UI |
| TypeScript | 5 (strict) | Tipagem estática |
| Vite | 7 | Build e servidor de desenvolvimento |
| React Router DOM | 7 | Roteamento SPA |
| Firebase Auth | 12 | Autenticação de usuários |
| Firebase Firestore | 12 | Banco de dados em nuvem |
| react-easy-crop | 5 | Recorte de avatar |
| CSS Modules | — | Estilização encapsulada por componente |
| ESLint | 9 | Linting (flat config) |
| Vitest + Testing Library | 3 | Testes de componentes, hooks, stores e invariantes de UI |
| Vercel | — | Deploy e hospedagem |

---

## Funcionalidades principais

| Funcionalidade | Arquivos principais |
|---|---|
| Dashboard com fichas recentes e contadores | `src/pages/Home/Home.tsx` |
| Listagem, busca, filtro e ordenação de fichas | `src/pages/CharactersPage/CharactersPage.tsx` |
| Ficha de personagem completa com abas | `src/pages/CharacterSheetPage/CharacterSheetPage.tsx` |
| Ficha de monstro/NPC com abas | `src/pages/MonsterSheetPage/MonsterSheetPage.tsx` |
| Recorte e upload de avatar (base64) | `src/components/AvatarCropper/AvatarCropper.tsx` |
| Exportação de ficha como JSON | `src/store/characterSheetStore.ts`, `monsterSheetStore.ts` |
| Importação de ficha via arquivo JSON | `src/pages/CharactersPage/CharactersPage.tsx` |
| Salvamento automático com debounce (800ms) | `CharacterSheetPage.tsx`, `MonsterSheetPage.tsx` |
| Autenticação e-mail/senha e Google | `src/services/authService.ts`, `src/context/AuthContext.tsx` |
| Verificação obrigatória de e-mail | `src/components/ProtectedRoute/ProtectedRoute.tsx` |
| Reset de senha por e-mail | `src/services/authService.ts` |
| Busca por nome no Firestore (prefixo) | `src/hooks/useFirestoreSearch.ts` |
| Ordenação customizada por drag-and-drop | `src/pages/CharactersPage/CharactersPage.tsx` |

### Abas da ficha de personagem
`Principal` · `Combate` · `Magias` · `Habilidades` · `Inventário` · `Detalhes`

### Abas da ficha de monstro
`Detalhes` · `Combate` · `Habilidades` · `Ações` · `Magias` · `Lendárias`

---

## Como rodar o projeto

### Pré-requisitos

- Node.js 18 ou superior
- npm
- Uma conta e projeto no [Firebase Console](https://console.firebase.google.com/) com **Authentication** e **Firestore** habilitados

### Instalação

```bash
# Clone o repositório
git clone <url-do-repositório>
cd tomo-do-aventureiro

# Instale as dependências
npm install
```

### Configuração do ambiente

Crie um arquivo `.env` na raiz do projeto com as credenciais do seu projeto Firebase:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

> Os valores estão disponíveis nas configurações do projeto no Firebase Console. **Nunca commite o `.env` com valores reais.** O arquivo já está no `.gitignore`.

### Desenvolvimento

```bash
npm run dev
```

O servidor de desenvolvimento sobe em `http://localhost:5173` com hot-reload.

---

## Scripts disponíveis

| Script | Comando | Descrição |
|---|---|---|
| `dev` | `vite` | Inicia o servidor de desenvolvimento |
| `build` | `vite build` | Gera o build de produção na pasta `dist/` |
| `preview` | `vite preview` | Serve o build de produção localmente |
| `lint` | `eslint .` | Executa o linter (cobre apenas `.js` e `.jsx`) |
| `test` | `vitest run` | Executa a suíte automatizada uma vez |
| `test:watch` | `vitest` | Executa os testes em modo de observação |
| `typecheck` | `tsc --noEmit` | Verifica os tipos TypeScript sem gerar arquivos |

> **Atenção:** o ESLint está configurado apenas para `.js/.jsx`. Arquivos `.ts/.tsx` são verificados por `npm run typecheck`. O Vitest usa jsdom, portanto layout real, media queries e fluxos autenticados no Firebase ainda precisam de validação no navegador.

---

## Variáveis de ambiente

Todas as variáveis usam o prefixo `VITE_` e são acessadas via `import.meta.env` pelo Vite.

| Variável | Descrição |
|---|---|
| `VITE_FIREBASE_API_KEY` | Chave de API do Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domínio de autenticação Firebase |
| `VITE_FIREBASE_PROJECT_ID` | ID do projeto Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de Storage Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID do Firebase |
| `VITE_FIREBASE_APP_ID` | App ID do Firebase |

Não existe arquivo `.env.example` no repositório. Use a tabela acima como referência.

---

## Estrutura do projeto

```
tomo-do-aventureiro/
├── public/
├── src/
│   ├── assets/
│   │   ├── brandLogo.ts          # URL da logo hospedada no Cloudinary
│   │   └── logo-tomodoaventureiro.png
│   ├── components/
│   │   ├── monster/              # Componentes exclusivos da ficha de monstro
│   │   │   ├── LegendaryActionsPanel/
│   │   │   ├── MonsterActionsPanel/
│   │   │   ├── MonsterFeaturesPanel/
│   │   │   ├── MonsterHeader/
│   │   │   ├── MonsterSpellsPanel/
│   │   │   ├── MonsterStatsPanel/
│   │   │   ├── MonsterTraitsPanel/
│   │   │   └── shared.ts
│   │   ├── AttacksPanel/
│   │   ├── AttributesPanel/
│   │   ├── AvatarCropper/
│   │   ├── CharacterDetailsPanel/
│   │   ├── CharacterHeader/
│   │   ├── CombatPanel/
│   │   ├── Header/
│   │   ├── InventoryPanel/
│   │   ├── PrivacyPolicyModal/
│   │   ├── ProtectedRoute/
│   │   ├── ResourcesPanel/
│   │   ├── Sidebar/
│   │   ├── SkillPanel/
│   │   ├── SkillsPanel/
│   │   ├── SpellsPanel/
│   │   ├── UserMenu/
│   │   ├── RoomHeader/           # ← vazio (feature não implementada)
│   │   ├── RoomInstancesPanel/   # ← vazio
│   │   ├── RoomMembersPanel/     # ← vazio
│   │   ├── SheetGallery/         # ← vazio
│   │   └── session/              # ← vazio
│   ├── context/
│   │   └── AuthContext.tsx        # Provider e hook useAuth()
│   ├── hooks/
│   │   ├── index.ts
│   │   ├── useCharacterSheet.ts
│   │   ├── useCharacterSheets.ts
│   │   ├── useFirestoreSearch.ts
│   │   ├── useMonsterSheet.ts
│   │   └── useMonsterSheets.ts
│   ├── pages/
│   │   ├── CharacterSheetPage/
│   │   ├── CharactersPage/
│   │   ├── EmailVerificationPage/
│   │   ├── Home/
│   │   ├── LoginPage/
│   │   ├── MonsterSheetPage/
│   │   ├── NewCharacterPage/     # não utilizado ativamente
│   │   ├── NewMonsterPage/       # não utilizado ativamente
│   │   ├── NotFound/
│   │   ├── PrivacyPolicyPage/
│   │   ├── RegisterPage/
│   │   ├── VerifyEmailPage/
│   │   ├── SalaDeJogoPage/       # ← vazio
│   │   ├── SalasPage/            # ← vazio
│   │   ├── SessionPage/          # ← vazio
│   │   └── SessionRoomPage/      # ← vazio
│   ├── realtime/
│   │   └── session/              # ← vazio
│   ├── services/
│   │   ├── authService.ts         # Operações de autenticação Firebase
│   │   └── firebase.ts            # Inicialização do app Firebase
│   ├── store/
│   │   ├── characterSheetStore.ts # CRUD + normalização de fichas de personagem
│   │   ├── defaultCharacterSheet.ts
│   │   └── monsterSheetStore.ts   # CRUD + normalização de fichas de monstro
│   ├── styles/
│   │   ├── panel.module.css       # Estilos compartilhados entre painéis
│   │   └── theme.css              # Design tokens globais (CSS custom properties)
│   ├── types/
│   │   ├── savingStatus.ts
│   │   ├── system/dnd/            # Interfaces do modelo de dados D&D
│   │   │   ├── CharacterSheet.ts
│   │   │   ├── Character.ts
│   │   │   ├── monsterSheet.ts
│   │   │   └── (Attack, Spell, Resource, Inventory, Attribute, Skill...)
│   │   ├── gameRoom/              # ← vazio
│   │   └── realtime/              # ← vazio
│   ├── utils/
│   │   ├── recentlyOpened.ts      # Registro de fichas abertas no localStorage
│   │   └── weaponCatalog.ts       # Utilitários de proficiências com armas
│   ├── App.tsx                    # Definição de rotas e layout principal
│   ├── index.css                  # Reset global
│   └── main.tsx                   # Ponto de entrada
├── .env                           # Credenciais Firebase (não commitado)
├── .gitignore
├── CLAUDE.md                      # Contexto para Claude Code
├── eslint.config.js
├── firebase.json                  # Config de deploy Firebase
├── firestore.rules                # Regras de segurança do Firestore
├── index.html
├── package.json
├── tsconfig.json
├── vercel.json                    # Configuração de deploy Vercel (SPA fallback)
└── vite.config.js
```

---

## Arquivos importantes

| Arquivo | Responsabilidade |
|---|---|
| `src/services/firebase.ts` | Inicializa o Firebase App, exporta `auth` e `db` |
| `src/context/AuthContext.tsx` | Estado global de autenticação; hook `useAuth()` |
| `src/services/authService.ts` | Login Google, e-mail/senha, registro, reset, verificação |
| `src/store/characterSheetStore.ts` | CRUD Firestore + normalização de fichas de personagem |
| `src/store/monsterSheetStore.ts` | CRUD Firestore + normalização de fichas de monstro |
| `src/store/defaultCharacterSheet.ts` | Valores padrão de uma ficha vazia |
| `src/types/system/dnd/CharacterSheet.ts` | Interface raiz da ficha de personagem |
| `src/types/system/dnd/monsterSheet.ts` | Interfaces da ficha de monstro |
| `src/styles/theme.css` | Design tokens: paleta, tipografia, espaçamento, sombras |
| `src/components/ProtectedRoute/ProtectedRoute.tsx` | Guarda de rota: exige autenticação + e-mail verificado |
| `src/App.tsx` | Todas as rotas da aplicação |
| `firestore.rules` | Regras de segurança: cada usuário acessa apenas seus dados |
| `vercel.json` | Fallback SPA: todas as rotas apontam para `index.html` |
| `CLAUDE.md` | Documentação técnica para uso com Claude Code |

---

## Fluxos principais

### 1. Autenticação

```
Acesso a rota protegida
  → ProtectedRoute verifica user + emailVerified (AuthContext)
  → Sem user           → redireciona /login
  → Sem emailVerified  → redireciona /verificar-email
  → OK                 → renderiza a rota
```

Suporte a login por Google (`signInWithPopup`) e e-mail/senha. O registro cria a conta, define o `displayName` e envia e-mail de verificação. O acesso ao sistema só é liberado após verificação.

### 2. Carregamento de ficha

```
CharacterSheetPage monta
  → useCharacterSheet(uid, id) abre onSnapshot no Firestore
  → Cada snapshot passa por normalizeCharacterSheet()
  → Estado local (useState) é populado apenas na primeira carga
  → Edições subsequentes atualizam apenas o estado local
```

### 3. Salvamento automático

```
Usuário edita qualquer campo
  → handleUpdate() atualiza o estado local imediatamente
  → Cancela o timer anterior e inicia novo debounce de 800ms
  → Após 800ms sem edição → saveCharacterSheet() grava no Firestore
  → SavingStatus: 'idle' → 'saving' → (success) → 'idle'
```

### 4. Listagem e busca

```
CharactersPage monta
  → useCharacterSheets + useMonsterSheets → onSnapshot por coleção
  → Busca ativa: useFirestoreSearch consulta campo name_lower com prefixo
  → Debounce de 300ms antes de disparar a query
  → Resultados filtrados e ordenados localmente via useMemo
  → Ordem customizada persistida em localStorage por uid
```

### 5. Importação/exportação

```
Exportação: serializa StoredCharacterSheet/Monster como JSON → download browser
Importação: lê arquivo JSON → detecta tipo (character/monster/npc)
  → valida estrutura mínima → verifica se ID já existe no Firestore
  → Se não existe: salva; se já existe: ignora (sem sobrescrita)
  → Limite: 2MB por arquivo
```

---

## Modelo de dados

### CharacterSheet

Tipo raiz: `src/types/system/dnd/CharacterSheet.ts`

```
CharacterSheet
  character: Character       (nome, raça, classes, atributos, PV, perícias, etc.)
  resources: Resource[]      (habilidades com usos limitados)
  inventory: Inventory       (itens e equipamentos)
  spells: Spell[]            (magias conhecidas)
  attacks: Attack[]          (ataques configurados)
  combatNotes: string
  isEditMode: boolean
```

### MonsterSheet

Tipo raiz: `src/types/system/dnd/monsterSheet.ts`

```
MonsterSheet
  systemId: 'dnd5e-monster'
  details: { name, kind (monster|npc), avatar, species, size, alignment, ... }
  stats: { hpCurrent, maxHp, ac, movements[], strength, dexterity, ... }
  traits: { savingThrows, skills, resistances, immunities, challengeRating, xp, ... }
  features: MonsterFeature[]
  actions: MonsterAction[]
  reactions: MonsterFeature[]
  legendary: { pointsPerRound, actions: LegendaryAction[] }
  spells: { items: Spell[], slots, spellcastingAbility }
```

### Normalização

Todo dado lido do Firestore passa por `normalizeCharacterSheet()` ou `normalizeMonsterSheet()` antes de ser usado. Essas funções garantem compatibilidade com dados salvos em versões anteriores do schema e preenchem campos ausentes com valores padrão.

---

## Persistência

| Dado | Onde é salvo | Detalhes |
|---|---|---|
| Fichas de personagem | Firestore `/users/{uid}/characterSheets/{id}` | Persistência em nuvem por usuário |
| Fichas de monstro/NPC | Firestore `/users/{uid}/monsterSheets/{id}` | Persistência em nuvem por usuário |
| Avatar | Campo `data.character.avatar` no Firestore | Base64 (JPEG/PNG/WebP) |
| Histórico de aberturas | `localStorage` → chave `tomo:recentlyOpened` | Mapa `{id → ISOTimestamp}` |
| Ordem customizada de fichas | `localStorage` → `tomo-char-order-{uid}`, `tomo-monster-order-{uid}`, `tomo-npc-order-{uid}` | Array de IDs |
| Aba ativa da ficha | `sessionStorage` → `character-sheet-active-tab:{id}` e `monster-sheet-active-tab:{id}` | Nome da aba |

O Firestore é inicializado com `persistentLocalCache` e `persistentMultipleTabManager`, permitindo uso offline e suporte a múltiplas abas.

---

## Integrações externas

| Serviço | Uso |
|---|---|
| **Firebase Authentication** | Login Google e e-mail/senha, verificação de e-mail, reset de senha |
| **Firebase Firestore** | Banco de dados por usuário com regras de segurança |
| **Vercel** | Hospedagem e deploy contínuo |
| **Cloudinary** | Hospedagem dos ícones/favicon do projeto (referenciados em `index.html` e `brandLogo.ts`) |
| **Google Fonts** | Fontes `Cinzel` (display) e `Inter` (corpo), carregadas via `@import` em `theme.css` |

---

## Padrões de desenvolvimento

### Convenções de nomes

- **Componentes**: PascalCase em pasta própria com arquivo `.tsx` e `.module.css` de mesmo nome
- **Hooks**: camelCase com prefixo `use` — ex: `useCharacterSheet`
- **Funções de store**: camelCase descritivo — ex: `saveCharacterSheet`, `normalizeMonsterSheet`
- **Tipos e interfaces**: PascalCase — ex: `CharacterSheet`, `SavingStatus`
- **Exports**: named exports em todos os componentes (sem `export default` nos componentes)

### Estilização

- CSS Modules para estilos locais por componente
- Design tokens globais em `src/styles/theme.css` (prefixo `--`)
- Paleta Glass Morphism (OKLCH): `--panel-*`, `--text*`, `--chip-*`, `--danger/heal/temp-solid`
- Fontes: `--font-display` (Cinzel) e `--font-body` (Inter)
- Não usar `styled-components`, Tailwind ou outras libs de estilo

### Gerenciamento de estado

- Estado local com `useState` nas páginas de ficha — sem Zustand, Redux ou Context de dados
- `AuthContext` é a única store global, exclusiva para autenticação
- Hooks retornam `{ data, loading, error }` no padrão Firestore

### Tratamento de erros

- Erros do Firebase Auth são traduzidos para português em `authService.ts`
- Erros de rede em hooks são expostos via campo `error: Error | null`
- Erros em operações secundárias (ex: migração silenciosa de `name_lower`) são suprimidos

---

## Documentação e uso com IA

O repositório contém um arquivo `CLAUDE.md` na raiz, criado especificamente para fornecer contexto ao **Claude Code** (Anthropic). Ele documenta:

- Stack e ferramentas reais
- Estrutura do repositório com explicações de responsabilidade
- Fluxos principais do sistema
- Modelo de dados e persistência
- Variáveis de ambiente
- Padrões de código e convenções
- Cuidados ao alterar o projeto

> **Atenção:** O arquivo `documentação.MD` na raiz está desatualizado — descreve um sistema baseado em `localStorage` sem autenticação, anterior à migração para Firebase. Não deve ser usado como referência da arquitetura atual.

---

## Checklist antes de finalizar mudanças

- [ ] Rodou `npm run dev` e testou o caminho principal da alteração no browser?
- [ ] Testou o estado de carregamento (loading) e o estado de erro?
- [ ] Adicionou ou atualizou testes para o comportamento alterado?
- [ ] Rodou `npm run test` e `npm run typecheck`?
- [ ] Se adicionou ou alterou campo do modelo de dados: atualizou as funções `normalize*` no store e adicionou valor padrão em `defaultCharacterSheet.ts` ou `createDefaultMonsterSheet()`?
- [ ] Se alterou salvamento: o campo `name_lower` ainda é gerado corretamente?
- [ ] Nenhuma credencial Firebase foi incluída no código ou no commit?
- [ ] Estilos usam variáveis CSS de `theme.css` em vez de valores fixos?
- [ ] Se alterou `firestore.rules`: fez o deploy via Firebase CLI (`firebase deploy --only firestore:rules`)?

---

## Licença

Licença não identificada no repositório.
