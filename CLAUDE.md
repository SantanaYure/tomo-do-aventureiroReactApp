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
| Ícones | Estritamente clean e monocromáticos (`currentColor`): `lucide-react` (SVG traço fino 1.5–1.75) e glifos Unicode (`⌂`, `⚔`, `♜`, `⚙`). Proibido emojis coloridos. |
| Estilo | CSS Modules + variáveis CSS globais (theme.css) — tema Glass Morphism com toggle claro/escuro |
| Linting | ESLint 9 (flat config) |
| Testes | Vitest 3 + Testing Library + jsdom |
| Deploy | Vercel |

Há testes automatizados de componentes, hooks, stores e invariantes de UI. Como o jsdom não executa layout real, media queries nem a integração autenticada com o Firebase, essas áreas ainda exigem validação manual no navegador.

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
    AttributesPanel/ SkillPanel/ Sidebar/ UserMenu/ (UserMenu = código morto)
    SettingsModal/  ← modal de configurações (identidade + AppearancePanel + sair); abre pela Sidebar
    AppearancePanel/ ← tema, cor de marca (presets/caixa de cores/hex-rgb-rgba) e tipografia (Clássica/Moderna; valores internos `literary`/`modern`)
    UserAvatar/     ← avatar do usuário: foto do provedor → Gravatar (hash do e-mail) → inicial do 1º nome
    AvatarCropper/ ProtectedRoute/ PrivacyPolicyModal/
    SrdMonsterPicker/ ← modal "Monstro do SRD" da lista de fichas (filtra pela preferência de regras)
    campaign/       ← mesas: CampaignCard (menu editar/excluir), Create/Join/DeleteCampaignModal,
                       HeroVitalCard, CreatureVitalCard (replicar), AddCreatureModal (clique adiciona),
                       InitiativeTracker (ordem, turno, fora do combate), MemberCard, LinkToCampaignModal,
                       SelectCharacterModal, ConditionsModal, HpAdjustModal
    RoomHeader/ RoomInstancesPanel/ RoomMembersPanel/ SheetGallery/  ← VAZIOS
  context/
    AuthContext.tsx    → provider de autenticação + hook useAuth()
    ThemeContext.tsx   → tema, cor de marca e tipografia
    RulesetContext.tsx → preferência de regras do SRD: '2014' | '2024' | 'all'
  data/srd/
    monsters.ts        → seed de monstros do SRD 5.1/5.2 (CC-BY-4.0) já no formato MonsterSheet
  hooks/
    index.ts
    useCharacterSheet.ts   → snapshot Firestore de uma ficha por id
    useCharacterSheets.ts  → lista de fichas do usuário (onSnapshot)
    useMonsterSheet.ts     → snapshot Firestore de um monstro por id
    useMonsterSheets.ts    → lista de monstros do usuário
    useFirestoreSearch.ts  → busca prefixada no Firestore com debounce (300ms)
    useCampaign.ts / useCampaigns.ts → mesa aberta (doc + membros) e lista de mesas do usuário
    useCreatureAvatars.ts  → avatar das criaturas lido da ficha (não fica na mesa, ver Riscos)
    useStaleCampaignLinkCleanup.ts → limpa vínculo órfão com a mesa ao abrir a própria ficha
  pages/
    Home/             → página inicial
    CharactersPage/   → lista de PJs, monstros e NPCs
    CharacterSheetPage/  → ficha completa do PJ (abas + CharacterCombatSummary persistente)
    MonsterSheetPage/    → ficha completa do monstro/NPC (abas + MonsterCombatSummary persistente)
    NewMonsterPage/      → redirecionamento legado (não implementado como página)
    NewCharacterPage/    → não utilizado (criação é feita direto na CharactersPage)
    LoginPage/ RegisterPage/ EmailVerificationPage/ VerifyEmailPage/
    PrivacyPolicyPage/ NotFound/
    CampaignsPage/       → lista de mesas (/mesas)
    CampaignDetailPage/  → mesa (/mesas/:id): iniciativa, heróis, criaturas, integrantes
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
    campaignStore.ts         → mesas, membros, criaturas, iniciativa, vínculo de fichas, exclusão
  styles/
    theme.css           → design tokens globais (CSS custom properties)
    panel.module.css    → estilos compartilhados entre painéis
  types/
    savingStatus.ts     → type SavingStatus = 'idle' | 'saving' | 'saved' | 'error'
    system/dnd/         → interfaces do modelo de dados D&D
      CharacterSheet.ts Character.ts Attack.ts Spell.ts Resource.ts
      Inventory.ts Attribute.ts Skill.ts monsterSheet.ts e outros
    campaign/campaign.ts → Campaign, CampaignMember, CampaignCreature, CampaignCombat
    system/dnd/Ruleset.ts → '2014' | '2024' | 'all'
    gameRoom/           → VAZIO
    realtime/           → VAZIO
  utils/
    recentlyOpened.ts   → registro de abertura recente em localStorage
    weaponCatalog.ts    → utilitários de proficiências com armas
    appearance.ts       → cor de marca + tipografia: aplica custom properties no <html>, valida cor, persiste
    initiative.ts       → regras puras de iniciativa (rolagem, ordem, turno) e numeração de réplicas
    ruleset.ts          → leitura/rótulos da preferência de regras (tomo:ruleset)
    inviteCode.ts       → código de convite das mesas
  App.tsx               → definição das rotas e layout principal
  main.tsx              → ponto de entrada (ThemeProvider > RulesetProvider > AuthProvider > App)
tests/rules/            → testes das regras do Firestore no emulador (npm run test:rules)
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
- **Seleção múltipla**: o botão "Selecionar" põe a lista em modo de seleção (caixa de marcar em cada card; clicar no card marca, não abre a ficha; o menu de ações some). A barra fixa mostra quantas estão marcadas, "Selecionar todas" (só as visíveis após busca e filtros) e "Excluir selecionadas". A confirmação lista os nomes e avisa quando alguma está numa mesa.
- **Exclusão** (individual e em lote) passa por `utils/deleteSheets.ts`: libera a ficha da mesa antes (`releaseCharacterSheetFromCampaign`/`releaseMonsterSheetFromCampaign`) e exclui, uma de cada vez; uma falha não interrompe as outras. Em lote, o `DiceRollLoader` mostra "Excluindo N de M" e, no fim, um resumo lista o que não saiu. Excluir uma ficha só com sucesso não mostra aviso

### Importação/exportação
- Fichas são exportadas como JSON via download no browser
- Importação aceita um ou vários arquivos JSON de uma vez (`utils/importSheetFiles.ts`): cada um é lido, tem o tipo detectado (PJ/monstro/NPC) e vai para o store correspondente, em sequência. Um arquivo com problema não interrompe os outros. Durante a importação, `DiceRollLoader` (d20 girando, com "Importando N de M" e o nome do arquivo) cobre a tela; no fim, um resumo conta importadas, repetidas e com erro e lista cada arquivo que não entrou com o motivo. Com um arquivo só, a mensagem é a detalhada de sempre. As mensagens são para o jogador: nada de "JSON", "Firestore" ou "documento" (há teste garantindo); o motivo técnico fica no `reason` e no console
- Fichas com ID já existente são ignoradas (sem sobrescrita)
- Id ausente ou inválido para o Firestore (`utils/firestoreId.ts`) vira id automático; a ficha crua, sem `{ id, data }`, também é aceita
- A validação da importação só exige `character` (PJ) ou `details` (monstro/NPC); o resto vem da normalização. `kind` é lido sem diferenciar maiúsculas
- Antes de gravar, `utils/firestoreSafe.ts` descarta lista dentro de lista (o Firestore recusa) e a importação recusa documento acima de ~1 MB (`FIRESTORE_DOC_SAFE_BYTES`). A falha traz `reason` (`invalid-json`, `not-a-sheet`, `too-large`, `document-too-large`, `save-failed`) e a tela mostra a mensagem correspondente
- Avatar importado acima de 500 KB de texto (`AVATAR_MAX_STORED_CHARS`) é recomprimido antes de salvar (`utils/importAvatarCompression.ts` + `utils/imageCompression.ts`): redesenha em canvas, WebP com fallback para JPEG, dimensão e qualidade decrescentes até caber. O limite é medido no data URL (o que o Firestore conta), não na imagem decodificada. Melhor esforço: se falhar, segue com a original e cai no `document-too-large`
- Limite de 20MB por arquivo de importação (folga para caber o avatar original antes da compressão acima)
- Nomes dos arquivos exportados: `pj-{nome}.json`, `monstro-{nome}.json`, `npc-{nome}.json`

### Painéis persistentes (visíveis em todas as abas)
- `CharacterCombatSummary` é renderizado **fora** do `role="tabpanel"`, entre a barra de abas e o conteúdo da aba ativa, na `CharacterSheetPage`. Exibe: CA, PV (com gestor de HP), iniciativa, deslocamento, bônus de proficiência, percepção passiva, atributo de conjuração e grid de 6 atributos (FOR/DES/CON/INT/SAB/CAR).
- `MonsterTraitsPanel` tem o campo **Sentidos** (`traits.senses: string[]`, um por linha, ex.: "Visão no escuro 18 m"), ao lado de Imunidades a Condições; fichas antigas recebem lista vazia na normalização. A percepção passiva continua calculada à parte.
- `MonsterCombatSummary` segue o mesmo padrão na `MonsterSheetPage`. Exibe: CA, PV (com gestor de HP), chips de movimento, resistências a dano, imunidades a dano e imunidades a condições.
- Ambos os componentes recebem a ficha completa e um callback de atualização — alterações no HP são salvas com o mesmo debounce de 800ms.

### Título da página (document.title)
- `CharacterSheetPage` define `document.title` com o nome do personagem assim que a ficha carrega; restaura `'Tomo do Aventureiro'` ao desmontar.
- `MonsterSheetPage` faz o mesmo com o nome do monstro/NPC.

### Aparência (tema + cor de marca + tipografia)
- `src/context/ThemeContext.tsx` expõe `ThemeProvider` + `useTheme()` com: `mode`/`setMode`/`toggle` (`light` | `dark` | `parchment`, ciclo claro → escuro → pergaminho → claro, default segue `prefers-color-scheme`), `brandColor`/`setBrandColor` e `fontChoice`/`setFontChoice`.
- **Persistência**: `localStorage['tomo:theme' | 'tomo:brand-color' | 'tomo:font']`.
- **Aplicação**: `data-theme` no `<html>` (tema) + custom properties inline no `<html>` para cor e fonte, via `src/utils/appearance.ts` (`applyAppearance`). A cor de marca deriva `--brand` e a família `--chip-violet-*` (logo `--accent`) por `color-mix`. Os botões sólidos (`--danger-*`, `--heal-*`, `--temp-*`, `--on-solid`, `--on-temp`) também seguem a marca via `solidTokens`: cor relativa `oklch(from <marca> …)` que mantém a claridade do tema e troca só o matiz. Sem marca, usam o violeta padrão (matiz 300) nos temas claro e escuro; o pergaminho mantém o próprio vermelho. Onde o navegador não suporta cor relativa, os botões ficam no padrão do tema. `fontChoice = 'modern'` troca `--font-display`/`--font-body` por `Inter` (vale sobre qualquer tema); `'literary'` remove os overrides.
- **Anti-flash**: o script inline em `index.html` reaplica os três no primeiro paint. **Espelha `applyAppearance` — manter em sincronia.**
- `ThemeProvider` é montado em `main.tsx` por fora do `AuthProvider`.
- `theme.css` define a paleta clara (glass) em `:root` e sobrescreve a escura (glass) e a pergaminho (paleta sépia legada, sem blur, corpo em Crimson Text) em `:root[data-theme="dark"|"parchment"]`.
- **Na UI**: telas de autenticação → botão `ThemeToggle` (ciclo de tema, glifo `☼`/`☾`/`❧`). App autenticado → painel **`AppearancePanel`** dentro do `SettingsModal` (tema em 3 botões, cor de marca, tipografia). A `Sidebar` não tem `ThemeToggle`; o acesso ao `SettingsModal` é pelo item "Configurações" (desktop: foto + rótulo; mobile: aba "Ajustes" ⚙). "Sair do sistema" também vive só no `SettingsModal`.

---

### Mesas (campanhas)
- **Papéis**: o mestre (`dmId`) controla criaturas, iniciativa, turno e integrantes; o jogador edita só o próprio documento de membro (vínculo de ficha, vitais, iniciativa); o "ajudante" (`canManageHeroes`) pode desvincular heróis de outros.
- **Mestre como jogador**: o mestre só aparece em "Heróis na Sessão" e na iniciativa se marcar `participatesAsPlayer` (card dele na aba Integrantes). Ter ficha vinculada não basta.
- **Criaturas** ficam num array em `campaigns/{id}.creatures`. Toda escrita nele passa por `mutateCreatures` (transação), nunca pelo estado local, para duas ações rápidas não se sobrescreverem.
- **Réplica**: `duplicateCreatureInCampaign` e a quantidade do `AddCreatureModal` numeram os nomes (`initiative.ts → namesForNewInstances/nextInstanceNames`).
- **Iniciativa**: valor em `creature.initiative` e `member.initiative` (fora de `vitals`, que a sincronização da ficha reescreve). Turno em `campaign.combat = { round, activeId }`, com ids `hero:{uid}` e `creature:{id}`. `outOfCombat` tira da ordem sem tirar de cena.
- **Limpeza de vínculo é sempre opcional**: remover jogador, desvincular, excluir mesa etc. gravam primeiro o essencial; escrever na ficha de outra pessoa pode ser negado e nunca derruba a operação (`commitWithOptionalWrites`, `safeGetDoc`). O que sobrar órfão é limpo quando o dono abre a ficha (`useStaleCampaignLinkCleanup`).
- **Excluir ficha vinculada** libera o herói (`releaseCharacterSheetFromCampaign`) ou mantém as criaturas em cena sem link (`releaseMonsterSheetFromCampaign`). **Excluir mesa** apaga membros + mesa no mesmo batch (o Firestore não apaga subcoleções sozinho).

### SRD e preferência de regras
- `tomo:ruleset` (Configurações → Aparência) filtra o conteúdo do SRD: D&D 5E (2014), D&D 5.5 (2024) ou Ambos.
- `src/data/srd/monsters.ts` é um seed pequeno, conferido contra o SRD oficial. O SRD 5.2 não tem Goblin nem Orc como monstro. Conteúdo CC-BY-4.0: manter a atribuição (rodapé do picker e página de créditos).

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

Mesas (coleção global):
```
campaigns/{campaignId}
  name, description, dmId, dmName, inviteCode, memberIds[], archived
  creatures: CampaignCreature[]   ← sem avatar base64 (limite de 1 MB do documento)
  combat: { round, activeId } | null
campaigns/{campaignId}/members/{uid}
  role 'dm' | 'player', canManageHeroes, participatesAsPlayer (só mestre)
  characterSheetId/Name/Class/AvatarUrl, vitals, initiative, outOfCombat
```

Regras de segurança (`firestore.rules`, testadas em `tests/rules/`): cada usuário lê e escreve os próprios dados; membros da mesa leem as fichas vinculadas a ela; o mestre pode limpar o vínculo e espelhar PV nas fichas dos jogadores; o jogador só grava campos do próprio documento de membro.

### LocalStorage
- `tomo:theme` → `'light' | 'dark' | 'parchment'` (preferência de tema)
- `tomo:brand-color` → cor de marca (hex/rgb/rgba); ausente = destaque padrão do tema
- `tomo:font` → `'literary' | 'modern'` (tipografia)
- `tomo:ruleset` → `'2014' | '2024' | 'all'` (conteúdo do SRD exibido)
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
- Carregadas via `@import` em `theme.css`: `Cinzel` (display) e `Inter` (corpo)

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

# Testes automatizados (execução única ou modo watch)
npm run test
npm run test:watch

# Verificação de tipos TypeScript
npm run typecheck

# Testes das regras do Firestore no emulador (precisa de Java 21; baixa o
# emulador na primeira vez)
npm run test:rules

# Smoke test contra uma URL implantada (pós-deploy)
npm run smoke -- https://tomo-do-aventureiro-react-app.vercel.app
```

**CI/CD** (GitHub Actions + Vercel) — ver [docs/ci-cd.md](docs/ci-cd.md):
- PR para `main`/`develop` e push na `main`: `ci.yml` roda o job **`verify`** (lint + typecheck + test + build + `npm audit`) e o job **`firestore-rules`** (regras no emulador). O Preview Deployment é criado pela **integração nativa da Vercel** (check `Vercel`), não por workflow.
- `deploy-staging.yml` / `deploy-production.yml` / `rollback.yml` implementam deploy 100% via Vercel CLI, mas ficam **dormentes** (job `guard`) até o secret `VERCEL_TOKEN` existir. Hoje o deploy segue como estava (Vercel nativo + `vercel --prod` manual). `monitoring.yml` roda smoke contra produção a cada 6h.
- Testes rodam **sem `.env`**: `src/test/setup.ts` mocka `src/services/firebase.ts`.
- Não há suíte E2E. jsdom não cobre layout real, media queries nem Firebase autenticado — validar no navegador (Preview) continua necessário.
- As regras do Firestore continuam com deploy manual (`firebase deploy --only firestore:rules`), fora do pipeline.

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
- **Avatar muito grande**: o documento da ficha tem limite de 1 MiB e o avatar vive dentro dele. Pela UI, o `AvatarCropper` limita a 400 KB; na importação, `compressOversizedAvatarIfNeeded` recomprime acima de 500 KB
- **Migrations de schema**: ao adicionar novos campos obrigatórios, garantir que `normalizeCharacterSheet`/`normalizeMonsterSheet` inicialize o campo com um valor padrão para documentos antigos
- **Documento da mesa tem limite de 1 MB**: `campaign.creatures` vive num único documento. Nunca guardar imagem base64 nas criaturas (`creatureAvatarForStorage` descarta); o avatar vem da ficha via `useCreatureAvatars`.
- **Mudou `firestore.rules`?** Rode/atualize `tests/rules/` e publique com `firebase deploy --only firestore:rules`. Os bugs mais graves das mesas vieram de regras (leitura negada derrubando o batch inteiro).
- **Pasta dentro do OneDrive**: a sincronização trava arquivos `.lock` do git e bloqueia exclusões. Preferir o projeto fora do OneDrive.
- **ESLint cobre apenas .js/.jsx**: o `eslint.config.js` atual não inclui `.ts/.tsx`. Erros de lint não são capturados para TypeScript via `npm run lint`

---

## Checklist antes de finalizar uma tarefa

- [ ] Rodou `npm run dev` e testou o caminho principal da feature no browser?
- [ ] Testou o estado de carregamento (loading) e o estado de erro?
- [ ] Se alterou um tipo em `src/types/`, verificou se as funções `normalize*` nos stores precisam ser atualizadas?
- [ ] Se adicionou campo ao modelo de dados, adicionou valor padrão em `defaultCharacterSheet.ts` ou `createDefaultMonsterSheet()`?
- [ ] Se alterou lógica de salvamento, confirmou que o campo `name_lower` ainda é gerado corretamente?
- [ ] Adicionou ou atualizou testes para o comportamento alterado?
- [ ] Rodou `npm run test` e `npm run typecheck`?
- [ ] Se alterou `firestore.rules` ou uma escrita em `campaignStore.ts`, atualizou `tests/rules/` e publicou as regras?
- [ ] Nenhuma chave Firebase ou secret foi incluída no código?
- [ ] Estilos usam variáveis CSS de `theme.css` em vez de valores hardcoded?

---

## Observações para futuras sessões do Claude Code

- O arquivo `documentação.MD` na raiz é um **documento legado**: foi mantido como registro histórico mas pode conter informações desatualizadas sobre a arquitetura anterior (ex: sistema sem Firebase). Usar `CLAUDE.md` como referência autoritativa.
- **Design system**: o tema visual foi migrado do "pergaminho" para **Glass Morphism + Flat** (painéis translúcidos com `backdrop-filter`, paleta OKLCH monocromática violeta/sépia). Há 3 temas: claro (glass), escuro (glass) e pergaminho (a paleta sépia original reaplicada sobre a estrutura flat). `design.md` documenta o sistema atual; os nomes de token antigos (`--ink*`, `--parchment*`, `--border-light/-dark`, `--rust/--bronze/--pewter`) foram removidos e substituídos por `--text*`, `--panel-*`, `--item-bg`, `--chip-*`, `--danger/heal/temp-solid` (o modo pergaminho reusa esses mesmos nomes, só troca os valores). Botões: sempre `--radius-btn` (6px), nunca pílula.
- **Nomenclatura UI — "PJ" vs "personagem"**: na interface visual (labels, botões, títulos, mensagens) o tipo de ficha de jogador é chamado de **PJ**. Internamente (tipos TypeScript, coleções Firestore, rotas, nomes de função) o termo `character`/`characterSheet` permanece inalterado. Nunca exibir "Personagem" em labels visíveis ao usuário para se referir a fichas de PJ.
- **`SpellsPanel` — espaços de magia**: tanto `onSpend` quanto `onRestore` devem ser passados ao `ManagedResourceControls` dos níveis de magia. Sem `onRestore`, os dots vazios ficam permanentemente desabilitados (bug corrigido).
- O ESLint está configurado apenas para `.js/.jsx`. Para verificar `.ts/.tsx`, usar `npm run typecheck`; os testes rodam com `npm run test`.
- Vitest usa jsdom. Testes de layout real, media queries e integração autenticada com Firebase continuam manuais no navegador.
- O projeto usa `"type": "module"` no `package.json` — todos os arquivos são ESM por padrão.
- Há um `.venv` Python na raiz — provavelmente residual de alguma ferramenta auxiliar; não faz parte do projeto frontend.
- O deploy no Vercel usa SPA fallback: todas as rotas desconhecidas retornam `index.html`. Isso está configurado em `vercel.json`.
- As regras do Firestore precisam de deploy separado via Firebase CLI. Alterar `firestore.rules` sem fazer o deploy não tem efeito em produção.
- O `firestore.rules` cobre `users/{userId}/**` (dono), leitura de fichas vinculadas por membros da mesa, e `campaigns/**`. Qualquer nova coleção precisa de regras e de casos em `tests/rules/`.
- Fim de linha: `.gitattributes` com `text=auto` (repositório em LF). Se um arquivo aparecer modificado sem mudança real, é quebra de linha; `git add --renormalize .` resolve.
