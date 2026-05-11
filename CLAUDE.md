# CLAUDE.md

## Visão geral do projeto

**Tomo do Aventureiro** é uma SPA web para criação e gerenciamento de fichas de personagem e monstros/NPCs no sistema D&D 5e (2024), com interface totalmente em português do Brasil. Os dados são persistidos no Firebase Firestore por usuário autenticado. O sistema exige verificação de e-mail para acesso.

O projeto está em produção, implantado via Vercel. Não há backend customizado: toda a lógica roda no frontend, e o Firestore é o banco de dados.

---

## Stack e ferramentas

| Camada | Tecnologia |
|---|---|
| Linguagem | TypeScript 5 (strict) |
| Framework UI | React 19 |
| Build/Dev | Vite 7 |
| Roteamento | React Router DOM 7 |
| Banco de dados | Firebase Firestore (persistência em nuvem) |
| Autenticação | Firebase Auth (e-mail/senha + Google) |
| Crop de avatar | react-easy-crop |
| Estilo | CSS Modules + variáveis CSS globais (theme.css) |
| Linting | ESLint 9 (flat config) |
| Deploy | Vercel |

Não há framework de testes instalado (sem Jest, Vitest, Cypress, etc.).

---

## Estrutura do repositório

```
src/
  assets/         → brandLogo.ts (URL da logo), imagem PNG do logotipo
  components/     → componentes de UI por painel/domínio
    monster/      → componentes exclusivos da ficha de monstro
                     MonsterCombatSummary/ ← painel persistente de stats do monstro/NPC
    session/      → VAZIO — feature de sessão não implementada
    CharacterCombatSummary/ ← painel persistente de stats e atributos do PJ (visível em todas as abas)
    CharacterTableMode/     ← modo mesa do PJ: apenas Seções C/D/E (recursos, ataques, espaços de magia)
    AttacksPanel/ CharacterHeader/ CombatPanel/ InventoryPanel/
    ResourcesPanel/ SkillsPanel/ SpellsPanel/ CharacterDetailsPanel/
    AttributesPanel/ SkillPanel/ Sidebar/ UserMenu/
    AvatarCropper/ ProtectedRoute/ PrivacyPolicyModal/
    RoomHeader/ RoomInstancesPanel/ RoomMembersPanel/ SheetGallery/  ← VAZIOS
  context/
    AuthContext.tsx → provider de autenticação + hook useAuth()
  hooks/
    index.ts
    useCharacterSheet.ts   → snapshot Firestore de uma ficha por id
    useCharacterSheets.ts  → lista de fichas do usuário (onSnapshot)
    useMonsterSheet.ts     → snapshot Firestore de um monstro por id
    useMonsterSheets.ts    → lista de monstros do usuário
    useFirestoreSearch.ts  → busca prefixada no Firestore com debounce (300ms)
  pages/
    Home/             → página inicial
    CharactersPage/   → lista de PJs, monstros e NPCs
    CharacterSheetPage/  → ficha completa do PJ (abas + CharacterCombatSummary persistente)
    MonsterSheetPage/    → ficha completa do monstro/NPC (abas + MonsterCombatSummary persistente)
    NewMonsterPage/      → redirecionamento legado (não implementado como página)
    NewCharacterPage/    → não utilizado (criação é feita direto na CharactersPage)
    LoginPage/ RegisterPage/ EmailVerificationPage/ VerifyEmailPage/
    PrivacyPolicyPage/ NotFound/
    SalaDeJogoPage/ SalasPage/ SessionPage/ SessionRoomPage/ ← VAZIOS
  realtime/
    session/          → VAZIO — feature de sessão não implementada
  services/
    firebase.ts       → inicialização do Firebase App, Auth e Firestore
    authService.ts    → funções de autenticação (Google, email/senha, reset, etc.)
  store/
    characterSheetStore.ts  → CRUD + normalização de fichas de personagem
    monsterSheetStore.ts    → CRUD + normalização de fichas de monstro
    defaultCharacterSheet.ts → valores padrão de uma ficha vazia
  styles/
    theme.css           → design tokens globais (CSS custom properties)
    panel.module.css    → estilos compartilhados entre painéis
  types/
    savingStatus.ts     → type SavingStatus = 'idle' | 'saving' | 'saved' | 'error'
    system/dnd/         → interfaces do modelo de dados D&D
      CharacterSheet.ts Character.ts Attack.ts Spell.ts Resource.ts
      Inventory.ts Attribute.ts Skill.ts monsterSheet.ts e outros
    gameRoom/           → VAZIO
    realtime/           → VAZIO
  utils/
    recentlyOpened.ts   → registro de abertura recente em localStorage
    weaponCatalog.ts    → utilitários de proficiências com armas
  App.tsx               → definição das rotas e layout principal
  main.tsx              → ponto de entrada (monta AuthProvider + App)
  index.css             → reset global e importação de theme.css
```

---

## Arquivos importantes

| Arquivo | Responsabilidade |
|---|---|
| [src/services/firebase.ts](src/services/firebase.ts) | Inicializa Firebase; exporta `auth` e `db` |
| [src/context/AuthContext.tsx](src/context/AuthContext.tsx) | Estado de autenticação global; hook `useAuth()` |
| [src/store/characterSheetStore.ts](src/store/characterSheetStore.ts) | CRUD + normalização de fichas de personagem no Firestore |
| [src/store/monsterSheetStore.ts](src/store/monsterSheetStore.ts) | CRUD + normalização de fichas de monstro |
| [src/store/defaultCharacterSheet.ts](src/store/defaultCharacterSheet.ts) | Valores padrão de uma ficha nova |
| [src/styles/theme.css](src/styles/theme.css) | Design tokens: cores, tipografia, espaçamentos, sombras |
| [src/types/system/dnd/CharacterSheet.ts](src/types/system/dnd/CharacterSheet.ts) | Tipo raiz da ficha de personagem |
| [src/types/system/dnd/monsterSheet.ts](src/types/system/dnd/monsterSheet.ts) | Tipos da ficha de monstro |
| [src/components/CharacterCombatSummary/CharacterCombatSummary.tsx](src/components/CharacterCombatSummary/CharacterCombatSummary.tsx) | Painel persistente de stats (CA, PV, iniciativa, atributos) da ficha de PJ |
| [src/components/monster/MonsterCombatSummary/MonsterCombatSummary.tsx](src/components/monster/MonsterCombatSummary/MonsterCombatSummary.tsx) | Painel persistente de stats da ficha de monstro/NPC |
| [firestore.rules](firestore.rules) | Regras de segurança do Firestore |
| [vercel.json](vercel.json) | Configuração de deploy: fallback para index.html (SPA) |
| [.env](\.env) | Credenciais Firebase — **não commitado, não expor** |

---

## Fluxos principais

### Autenticação
1. Usuário acessa qualquer rota protegida → `ProtectedRoute` verifica `user` e `emailVerified`
2. Sem usuário → redireciona para `/login`
3. Usuário sem e-mail verificado → redireciona para `/verificar-email`
4. `AuthProvider` ouve `onAuthStateChanged` do Firebase e mantém o estado global

### Carregamento de ficha
1. `useCharacterSheet(uid, id)` abre um `onSnapshot` no Firestore
2. Cada snapshot é passado por `normalizeCharacterSheet()` antes de ser exposto
3. A página armazena uma cópia local no state (`useState`) e usa-a para edição
4. Alterações disparam `handleUpdate()` → debounce de 800ms → `saveCharacterSheet()` no Firestore

### Salvamento automático
- As páginas `CharacterSheetPage` e `MonsterSheetPage` usam debounce de **800ms**
- O status de salvamento é rastreado via `SavingStatus` (`'idle' | 'saving' | 'saved' | 'error'`)
- O timer é limpo ao desmontar o componente

### Listagem e busca
- `CharactersPage` carrega todas as fichas e monstros via `useCharacterSheets` e `useMonsterSheets`
- Busca por nome usa `useFirestoreSearch`, que consulta o campo `name_lower` no Firestore com prefixo
- O campo `name_lower` é gerado automaticamente ao salvar (normalizado para lowercase pt-BR)
- Ordenação customizada é persistida no `localStorage` por uid

### Importação/exportação
- Fichas são exportadas como JSON via download no browser
- Importação lê um arquivo JSON, detecta o tipo (PJ/monstro/NPC) e chama a função de import correspondente
- Fichas com ID já existente são ignoradas (sem sobrescrita)
- Limite de 2MB por arquivo de importação
- Nomes dos arquivos exportados: `pj-{nome}.json`, `monstro-{nome}.json`, `npc-{nome}.json`

### Painéis persistentes (visíveis em todas as abas)
- `CharacterCombatSummary` é renderizado **fora** do `role="tabpanel"`, entre a barra de abas e o conteúdo da aba ativa, na `CharacterSheetPage`. Exibe: CA, PV (com gestor de HP), iniciativa, deslocamento, bônus de proficiência, percepção passiva, atributo de conjuração e grid de 6 atributos (FOR/DES/CON/INT/SAB/CAR).
- `MonsterCombatSummary` segue o mesmo padrão na `MonsterSheetPage`. Exibe: CA, PV (com gestor de HP), chips de movimento, resistências a dano, imunidades a dano e imunidades a condições.
- Ambos os componentes recebem a ficha completa e um callback de atualização — alterações no HP são salvas com o mesmo debounce de 800ms.

### Título da página (document.title)
- `CharacterSheetPage` define `document.title` com o nome do personagem assim que a ficha carrega; restaura `'Tomo do Aventureiro'` ao desmontar.
- `MonsterSheetPage` faz o mesmo com o nome do monstro/NPC.

---

## Modelo de dados e persistência

### Firestore
Estrutura de coleções por usuário:
```
users/{uid}/characterSheets/{sheetId}
  data: CharacterSheet         ← ficha normalizada
  name_lower: string           ← nome em lowercase (para busca)
  createdAt: string (ISO)
  updatedAt: string (ISO)

users/{uid}/monsterSheets/{monsterId}
  data: MonsterSheet
  name_lower: string
  createdAt: string (ISO)
  updatedAt: string (ISO)
```

Regra de segurança: cada usuário só pode ler e escrever seus próprios documentos (`request.auth.uid == userId`).

### LocalStorage
- `tomo:recentlyOpened` → map de `{id: ISOTimestamp}` com últimas aberturas
- `tomo-char-order-{uid}` → ordem customizada de personagens
- `tomo-monster-order-{uid}` → ordem customizada de monstros
- `tomo-npc-order-{uid}` → ordem customizada de NPCs

### SessionStorage
- `character-sheet-active-tab:{id}` → aba ativa da ficha de personagem
- `monster-sheet-active-tab:{id}` → aba ativa da ficha de monstro

### Avatar
O avatar do personagem/monstro é salvo como **data URL base64** (JPEG/PNG/WebP) diretamente no Firestore. Tamanho elevado pode impactar performance de leitura.

---

## Integrações externas

### Firebase Authentication
- Login com Google (`signInWithPopup`)
- Login com e-mail e senha
- Registro com verificação obrigatória de e-mail (`sendEmailVerification`)
- Reset de senha (`sendPasswordResetEmail`)
- Persistência configurável: `browserLocalPersistence` (lembrar login) ou `browserSessionPersistence`

### Firebase Firestore
- Inicializado com `persistentLocalCache` e `persistentMultipleTabManager` (multi-tab offline)
- Queries usam `onSnapshot` (tempo real) para fichas abertas
- Busca usa `getDocs` com filtro de prefixo no campo `name_lower`

### Google Fonts
- Carregadas via `@import` em `theme.css`: `Cinzel` (display) e `Crimson Text` (corpo)

---

## Variáveis de ambiente

Todas as variáveis são prefixadas com `VITE_` (expostas ao bundler via `import.meta.env`):

| Variável | Descrição |
|---|---|
| `VITE_FIREBASE_API_KEY` | Chave de API do Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domínio de autenticação |
| `VITE_FIREBASE_PROJECT_ID` | ID do projeto Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de storage |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID do Firebase |
| `VITE_FIREBASE_APP_ID` | App ID do Firebase |

O arquivo `.env` está no `.gitignore` e **nunca deve ser commitado**. Para configurar um novo ambiente, crie o `.env` na raiz com os valores do console Firebase.

---

## Comandos úteis

```bash
# Instalar dependências
npm install

# Servidor de desenvolvimento (http://localhost:5173)
npm run dev

# Build de produção (gera pasta dist/)
npm run build

# Servir o build localmente
npm run preview

# Linting (apenas .js e .jsx — ver observações)
npm run lint
```

**Não existe** script para:
- Verificação de tipos TypeScript (`tsc --noEmit`) — precisa rodar manualmente se necessário
- Testes automatizados — não há framework de testes instalado

Para verificar tipos manualmente:
```bash
npx tsc --noEmit
```

---

## Padrões de código

### Nomenclatura
- Componentes: PascalCase (`CharacterHeader`, `AttacksPanel`)
- Hooks: camelCase prefixado com `use` (`useCharacterSheet`, `useAuth`)
- Funções de store/serviço: camelCase descritivo (`saveCharacterSheet`, `normalizeCharacterSheet`)
- Tipos/interfaces: PascalCase (`CharacterSheet`, `MonsterSheet`, `SavingStatus`)
- Arquivos de componente: cada componente em pasta própria com `.tsx` e `.module.css` de mesmo nome

### Estrutura de componentes
- Cada componente de página em `src/pages/<NomePage>/<NomePage>.tsx`
- Cada componente reutilizável em `src/components/<NomePanel>/<NomePanel>.tsx`
- CSS local: `<NomePanel>.module.css` na mesma pasta
- Componentes exportados como named exports (não default)

### Estilização
- CSS Modules para estilos locais
- Variáveis CSS globais definidas em `src/styles/theme.css` (prefixo `--`)
- Tokens: `--parchment-*` (cores), `--ink*` (texto), `--accent*` (destaque), `--font-display/body`, `--space-*`, `--radius-*`, `--shadow-*`
- Não usar `styled-components`, `tailwind` ou qualquer outra biblioteca de estilo — apenas CSS Modules

### Normalização de dados
- Todo dado lido do Firestore passa por uma função `normalize*` antes de ser usado
- As funções de normalização garantem retrocompatibilidade com versões antigas dos dados
- Campos legados são mapeados para os campos atuais dentro das funções `normalize*`
- Nunca acessar `raw.data` diretamente sem normalizar

### Gerenciamento de estado
- Não há Zustand, Redux ou Context de dados — o estado é local (`useState`) nas páginas
- `AuthContext` é a única store global, exclusivamente para estado de autenticação
- Dados do Firestore são carregados via hooks que retornam `{ data, loading, error }`

### Tratamento de erros
- Erros do Firebase Auth são convertidos para mensagens em português em `authService.ts`
- Erros de rede em hooks de carregamento são expostos via campo `error: Error | null`
- Erros silenciados apenas em operações secundárias (ex: commit de migração de `name_lower`)

---

## Cuidados ao alterar o projeto

### Arquivos sensíveis
- `src/services/firebase.ts` — alterar a inicialização pode quebrar toda a persistência
- `src/store/characterSheetStore.ts` e `monsterSheetStore.ts` — normalizações garantem compatibilidade com dados já salvos no Firestore; remover campos ou mudar nomes de tipos pode corromper fichas existentes
- `firestore.rules` — deploy manual via Firebase CLI (`firebase deploy --only firestore:rules`)
- `src/context/AuthContext.tsx` — qualquer alteração aqui impacta toda a autenticação

### Fluxos que não devem ser quebrados
- A verificação de e-mail no `ProtectedRoute` deve permanecer obrigatória
- O debounce de 800ms no save das fichas evita writes excessivos no Firestore
- O campo `name_lower` deve ser gerado em **toda** operação de criação e salvamento, pois é usado nas queries de busca
- O `onSnapshot` nas páginas de ficha mantém os dados sincronizados — não substituir por `getDoc` simples

### Decisões arquiteturais já assumidas
- **Sem backend customizado**: toda lógica está no frontend + Firestore
- **Avatar como base64 no Firestore**: sem Firebase Storage — simplifica arquitetura mas limita tamanho
- **Ficha de monstro separada da ficha de personagem**: coleções diferentes, tipos diferentes, páginas diferentes
- **Normalização defensiva**: todo campo vindo do Firestore é validado e tem fallback para valor padrão

### Diretórios e páginas vazias (features planejadas, não implementadas)
Os seguintes itens existem no projeto mas **não têm código**:
- `src/pages/SalaDeJogoPage/`, `SalasPage/`, `SessionPage/`, `SessionRoomPage/`
- `src/components/session/`, `RoomHeader/`, `RoomInstancesPanel/`, `RoomMembersPanel/`, `SheetGallery/`
- `src/realtime/session/`, `src/types/gameRoom/`, `src/types/realtime/`

Não remover essas pastas sem confirmar com o dono do projeto — podem representar trabalho futuro planejado.

### Riscos comuns
- **Avatar muito grande**: imagens base64 de alta resolução aumentam o tamanho do documento Firestore; sempre usar o `AvatarCropper` antes de salvar
- **Migrations de schema**: ao adicionar novos campos obrigatórios, garantir que `normalizeCharacterSheet`/`normalizeMonsterSheet` inicialize o campo com um valor padrão para documentos antigos
- **ESLint cobre apenas .js/.jsx**: o `eslint.config.js` atual não inclui `.ts/.tsx`. Erros de lint não são capturados para TypeScript via `npm run lint`

---

## Checklist antes de finalizar uma tarefa

- [ ] Rodou `npm run dev` e testou o caminho principal da feature no browser?
- [ ] Testou o estado de carregamento (loading) e o estado de erro?
- [ ] Se alterou um tipo em `src/types/`, verificou se as funções `normalize*` nos stores precisam ser atualizadas?
- [ ] Se adicionou campo ao modelo de dados, adicionou valor padrão em `defaultCharacterSheet.ts` ou `createDefaultMonsterSheet()`?
- [ ] Se alterou lógica de salvamento, confirmou que o campo `name_lower` ainda é gerado corretamente?
- [ ] Rodou `npx tsc --noEmit` para verificar erros de tipo?
- [ ] Nenhuma chave Firebase ou secret foi incluída no código?
- [ ] Estilos usam variáveis CSS de `theme.css` em vez de valores hardcoded?

---

## Observações para futuras sessões do Claude Code

- O arquivo `documentação.MD` na raiz é um **documento legado**: foi mantido como registro histórico mas pode conter informações desatualizadas sobre a arquitetura anterior (ex: sistema sem Firebase). Usar `CLAUDE.md` como referência autoritativa.
- **Nomenclatura UI — "PJ" vs "personagem"**: na interface visual (labels, botões, títulos, mensagens) o tipo de ficha de jogador é chamado de **PJ**. Internamente (tipos TypeScript, coleções Firestore, rotas, nomes de função) o termo `character`/`characterSheet` permanece inalterado. Nunca exibir "Personagem" em labels visíveis ao usuário para se referir a fichas de PJ.
- **`SpellsPanel` — espaços de magia**: tanto `onSpend` quanto `onRestore` devem ser passados ao `ManagedResourceControls` dos níveis de magia. Sem `onRestore`, os dots vazios ficam permanentemente desabilitados (bug corrigido).
- O ESLint está configurado apenas para `.js/.jsx`. Para verificar `.ts/.tsx`, usar `npx tsc --noEmit`.
- Não há testes automatizados. Toda verificação é manual no browser.
- O projeto usa `"type": "module"` no `package.json` — todos os arquivos são ESM por padrão.
- Há um `.venv` Python na raiz — provavelmente residual de alguma ferramenta auxiliar; não faz parte do projeto frontend.
- O deploy no Vercel usa SPA fallback: todas as rotas desconhecidas retornam `index.html`. Isso está configurado em `vercel.json`.
- As regras do Firestore precisam de deploy separado via Firebase CLI. Alterar `firestore.rules` sem fazer o deploy não tem efeito em produção.
- O `firestore.rules` atual permite que cada usuário leia e escreva apenas seus próprios dados (subcoleção `users/{userId}/**`). Qualquer nova coleção que não siga esse padrão precisará de regras adicionais.
