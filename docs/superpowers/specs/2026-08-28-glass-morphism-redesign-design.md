# Redesign Glass Morphism — Tomo do Aventureiro

- **Data:** 2026-08-28
- **Branch:** `design/glass-morphism-sheets`
- **Tipo:** Redesign visual (camada de apresentação). Sem mudança de regra de negócio, contrato de dados ou lógica de componente.
- **Origem:** Handoff `design_handoff_glass_morphism_sheets/` (5 protótipos `.dc.html` + documento de handoff).

---

## 1. Objetivo

Substituir integralmente o tema visual "pergaminho / tomo medieval" por um sistema **Glass Morphism + Flat** com paleta monocromática neutra (violeta acinzentado para destaque, sépia/dourada para HP), fundo escuro ou claro alternável, tipografia Cinzel + Inter, mantendo 100% da arquitetura, rotas, contratos de dados e funcionalidades atuais.

### Decisões tomadas (aprovadas pelo dono do projeto)

1. **Substituir** o tema pergaminho. O glass morphism passa a ser o único design. `design.md` é reescrito. `theme.css` passa a conter os tokens glass.
2. **Toggle claro/escuro completo**: `ThemeContext` + persistência em `localStorage` + botão na sidebar. Default = `prefers-color-scheme`.
3. **Uma branch, uma PR, commits por fase** (6 fases, seção 9).
4. Não há merge nem push sem aprovação humana explícita (contrato dos loops + memória do projeto).

### Não-objetivos

- Não alterar JSX além do necessário para o visual (ex.: adicionar wrapper de blobs, montar `ThemeProvider`, inserir botão de toggle).
- Não criar página "NovaFicha" nova: a criação de PJ é inline na `CharactersPage` e a de monstro é `NewMonsterPage`. A arquitetura de rotas atual (`App.tsx`) não muda.
- Não mexer em `src/services/firebase.ts`, `src/context/AuthContext.tsx`, `firestore.rules`, stores, hooks, `normalize*`, tipos.
- Não remover pastas/páginas vazias listadas no `CLAUDE.md` (feature "Sala Online" planejada).
- Não alterar `documentação.MD` (legado).

---

## 2. Levantamento do estado atual

| Fato | Número | Implicação |
|---|---|---|
| Arquivos `*.module.css` | 54 | Superfície da varredura |
| Referências `var(--token)` em módulos | ~1.900 | Repontar valores de token resolve a maior parte |
| Cores hex hardcoded em módulos | ~24 (Sidebar, LoginPage, RegisterPage, sheet pages, alguns modais) | Trocar manualmente por token |
| Literais `rgba(...)` em módulos | ~292 | Fundos pergaminho translúcidos — varredura manual por fase |
| Arquivos com borda `double` | 18 | Trocar por `1px solid var(--panel-border)` |
| `ThemeContext` / `data-theme` / toggle | inexistente | Subsistema novo |

### Restrições de teste que NÃO podem regredir

- `src/test/acessibilidade.test.ts`:
  - `index.css` mantém a regra global `:where(a, button, input, select, textarea, summary, [tabindex]):focus-visible { outline: 2px solid var(--accent); outline-offset: ...; }`.
  - Token `--accent` continua existindo e sendo uma cor de foco visível nos dois temas.
  - Nenhum CSS usa `outline: none` (fora de comentário).
  - `.topBarActions` em `CharacterSheetPage.module.css` e `MonsterSheetPage.module.css` mantém `flex-wrap: wrap` e **não** reintroduz `flex-shrink: 0`.
  - `MonsterActionsPanel.module.css` `.cardHeader` mantém `display: grid` + `grid-template-columns: minmax(0, 1fr) auto`; `.removeAction` mantém `width/height: 2.25rem`.
- `src/test/motion.test.ts`:
  - `theme.css` mantém o bloco `@media (prefers-reduced-motion: reduce)` com `--transition: 0ms`, `animation-duration: 0.01ms !important`, `scroll-behavior: auto !important`.
  - Nenhum CSS usa `transition: all`.
- `src/test/routeSplitting.test.ts`, `smoke.test.ts`: rotas e montagem não mudam.

---

## 3. Tokens — `src/styles/theme.css` (reescrita)

### 3.1 Fontes

```css
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
```

- `--font-display: 'Cinzel', 'Palatino Linotype', Georgia, serif;` (mantém)
- `--font-body: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;` (era Crimson Text)

### 3.2 Estrutura de temas

- `:root` → paleta **clara** glass (luminosidade invertida, conforme `buildTheme('light')` dos protótipos).
- `:root[data-theme="dark"]` → paleta **escura** glass (`buildTheme('dark')`).
- `data-theme` é escrito no `<html>` pelo `ThemeProvider`. Sem `data-theme`, aplica-se o tema claro (`:root`), e um bloco `@media (prefers-color-scheme: dark)` sobre `:root:not([data-theme])` espelha o escuro para o estado "system" antes do JS montar (evita flash).

### 3.3 Tokens novos (valores OKLCH exatos do handoff)

| Token | Dark | Light |
|---|---|---|
| `--bg` | `linear-gradient(160deg, oklch(15% 0.015 280), oklch(11% 0.01 280))` | `linear-gradient(160deg, oklch(97% 0.004 280), oklch(94% 0.006 280))` |
| `--blob-1` (violet) | `oklch(40% 0.05 300 / 0.22)` | `oklch(80% 0.04 300 / 0.22)` |
| `--blob-2` | `oklch(40% 0.04 240 / 0.16)` | `oklch(82% 0.03 240 / 0.16)` |
| `--blob-3` | `oklch(42% 0.03 280 / 0.14)` | `oklch(84% 0.02 280 / 0.14)` |
| `--panel-bg` | `oklch(28% 0.01 280 / 0.32)` | `oklch(100% 0 0 / 0.55)` |
| `--panel-border` | `oklch(90% 0.01 280 / 0.1)` | `oklch(20% 0.01 280 / 0.1)` |
| `--item-bg` | `oklch(33% 0.01 280 / 0.26)` | `oklch(100% 0 0 / 0.48)` |
| `--avatar-bg` | `oklch(33% 0.01 280 / 0.4)` | `oklch(100% 0 0 / 0.6)` |
| `--chip-bg` | `oklch(38% 0.01 280 / 0.28)` | `oklch(100% 0 0 / 0.5)` |
| `--chip-border` | `oklch(90% 0.01 280 / 0.09)` | `oklch(20% 0.01 280 / 0.09)` |
| `--chip-violet-bg` | `oklch(38% 0.05 300 / 0.3)` | `oklch(90% 0.03 300 / 0.6)` |
| `--chip-violet-border` | `oklch(70% 0.06 300 / 0.4)` | `oklch(55% 0.05 300 / 0.35)` |
| `--chip-violet-text` | `oklch(84% 0.03 300)` | `oklch(38% 0.05 300)` |
| `--input-bg` | `oklch(36% 0.01 280 / 0.4)` | `oklch(100% 0 0 / 0.7)` |
| `--track-bg` | `oklch(22% 0.01 280 / 0.5)` | `oklch(90% 0.005 280 / 0.6)` |
| `--danger-solid` | `oklch(38% 0.07 75)` | `oklch(38% 0.07 75)` |
| `--heal-solid` | `oklch(56% 0.07 75)` | `oklch(56% 0.07 75)` |
| `--temp-solid` | `oklch(70% 0.06 75)` | `oklch(70% 0.06 75)` |
| `--on-solid` | `oklch(97% 0.015 75)` | `oklch(97% 0.015 75)` |
| `--text` | `oklch(96% 0.005 280)` | `oklch(24% 0.01 280)` |
| `--text-muted` | `oklch(76% 0.01 280)` | `oklch(44% 0.01 280)` |
| `--text-faint` | `oklch(56% 0.01 280)` | `oklch(58% 0.01 280)` |
| `--blur-panel` | `blur(20px)` | `blur(20px)` |
| `--blur-blob` | `90px` | `90px` |

### 3.4 Apelidos de compatibilidade (o que faz as ~1.900 `var()` existentes continuarem válidas)

Os tokens antigos passam a apontar para os novos. Nenhum arquivo de módulo precisa trocar `var(--ink)` por `var(--text)` na fase 1.

```css
--ink: var(--text);
--ink-muted: var(--text-muted);
--ink-faint: var(--text-faint);
--ink-soft: var(--text-faint);

--accent: var(--chip-violet-text);          /* foco, links, sectionTitle */
--accent-light: var(--chip-violet-text);
--accent-faint: var(--chip-violet-bg);
--accent-soft: var(--chip-violet-bg);

--parchment-bg: transparent;                /* body pinta via --bg */
--parchment-light: var(--panel-bg);
--parchment-dark: var(--chip-bg);
--parchment-shadow: var(--chip-bg);
--parchment: var(--panel-bg);

--border: var(--panel-border);
--border-light: var(--panel-border);
--border-dark: var(--panel-border);
--input-border: var(--panel-border);

--rust: var(--danger-solid);   --rust-faint: var(--danger-solid);
--bronze: var(--heal-solid);   --bronze-faint: var(--heal-solid);
--pewter: var(--temp-solid);   --pewter-faint: var(--temp-solid);
```

> Os apelidos são a rede de segurança da fase 1. Nas fases seguintes, cada módulo tocado troca o apelido pelo token semântico correto (`--text`, `--panel-bg`, `--chip-violet-*` etc.) e remove `rgba()`/hex locais. Ao final da fase 6, os apelidos que sobrarem sem uso são removidos do `theme.css`.

### 3.5 Raios, sombras, espaçamento, transição

```css
--radius-sm: 8px;    /* chips, badges */
--radius: 8px;
--radius-md: 12px;   /* inputs, botões */
--radius-lg: 16px;   /* cards internos */
--radius-xl: 18px;   /* painéis principais */

--shadow-sm: none;
--shadow: 0 1px 2px oklch(0% 0 0 / 0.04);
--shadow-lg: 0 4px 24px oklch(0% 0 0 / 0.12);
--shadow-soft: var(--shadow-lg);
--shadow-card: var(--shadow);

/* espaçamento: mantém a escala atual (--space-1..12) */
--transition: 150ms ease;   /* mantém */
```

### 3.6 Bloco `prefers-reduced-motion`

Mantém **exatamente** como está hoje (`--transition: 0ms linear;` + rede de segurança `*`). Exigido por `motion.test.ts`.

### 3.7 `#root` / `main`

`#root { min-height: 100vh; }` mantém. `main { max-width: --page-max; ... }` mantém; `--page-max` passa a `1100px` (fichas). Formulários limitam largura no CSS de página, não no `main`.

---

## 4. `src/index.css` — ajustes

- `body`: remove o gradiente pergaminho + noise SVG. Passa a `background: var(--bg); background-attachment: fixed; color: var(--text); font-family: var(--font-body);`.
- `body` ganha `min-height: 100vh` (mantém).
- `a`: `color: var(--accent)` (= violeta). Hover mantém.
- `button` base: fundo `var(--item-bg)`, borda `1px solid var(--panel-border)`, `border-radius: var(--radius-md)`, `color: var(--text)`. Hover: `var(--chip-bg)`.
- `input, select, textarea` base: `background: var(--input-bg)`, `border: 1px solid var(--panel-border)`, `border-radius: var(--radius-md)`, `color: var(--text)`.
- `input:focus` etc.: `border-color: var(--accent)`; `box-shadow: 0 0 0 2px var(--chip-violet-bg)` (era `rgba(122,30,30,0.12)`).
- Regra `:focus-visible` global: **inalterada** (exigida por teste).
- `th`/`td` borders: `var(--panel-border)`.
- `.sr-only`: inalterada.

---

## 5. Subsistema de tema (novo)

### 5.1 `src/context/ThemeContext.tsx`

```
type ThemeMode = 'light' | 'dark'

ThemeProvider:
  - estado inicial: localStorage['tomo:theme'] se válido; senão matchMedia('(prefers-color-scheme: dark)') ? 'dark' : 'light'
  - efeito: document.documentElement.setAttribute('data-theme', mode); localStorage.setItem('tomo:theme', mode)
  - expõe { mode, toggle, setMode }

useTheme(): consome o contexto; lança se fora do provider.
```

- Sem dependência nova. Só React.
- Chave `localStorage`: `tomo:theme` (segue o padrão `tomo:*` / `tomo-*` já usado).

### 5.2 Montagem — `src/main.tsx`

```tsx
<StrictMode>
  <ThemeProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ThemeProvider>
</StrictMode>
```

### 5.3 Anti-flash

Script inline mínimo em `index.html` (`<head>`), antes do bundle:

```html
<script>
  try {
    var t = localStorage.getItem('tomo:theme');
    if (!t) t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
</script>
```

### 5.4 Botão de toggle

- Componente `src/components/ThemeToggle/ThemeToggle.tsx` (`.module.css`), reutilizável.
- Rótulo: `🌙 Modo escuro` / `☀️ Modo claro` (segue os protótipos: "Modo mesa" no dark — manter "Modo escuro" por clareza).
- `aria-pressed` reflete o estado; `aria-label` descreve a ação.
- Usado em: `Sidebar` (desktop, acima de "Sair"; e um item na bottom bar mobile) e nas telas de auth (posição fixa canto superior direito, glass).

---

## 6. AppShell e fundo — `src/App.tsx` / `App.module.css`

- `AppLayout` ganha uma camada de fundo:

```tsx
function AppLayout() {
  return (
    <div className={styles.appShell}>
      <div className={styles.blobs} aria-hidden="true">
        <span className={styles.blob1} /><span className={styles.blob2} /><span className={styles.blob3} />
      </div>
      <Sidebar />
      <main className={styles.mainContent}><Outlet /></main>
    </div>
  )
}
```

- `.appShell`: `position: relative; min-height: 100dvh; display: flex;` (mantém).
- `.blobs`: `position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0;`
- `.blob1/2/3`: círculos `border-radius: 50%; filter: blur(var(--blur-blob)); background: var(--blob-N);` posicionados nos cantos (top-left, right, bottom-center) conforme protótipos. Tamanhos 460–520px.
- `.mainContent`, `.blobs` filhos e `Sidebar` recebem `z-index: 1` relativo.
- As telas de auth (fora do `AppLayout`) replicam a camada de blobs no próprio CSS de página (já fazem algo parecido hoje).

---

## 7. Sidebar — `src/components/Sidebar/Sidebar.tsx` / `.module.css`

Estrutura JSX **mantida** (logo, ornamento, nav, spacer, área de usuário, bottom bar). Mudanças:

- `.sidebar`: `width: 230px; position: sticky; top: 0; align-self: flex-start; min-height: 100vh; background: var(--panel-bg); backdrop-filter: var(--blur-panel); border-right: 1px solid var(--panel-border);`
- `.ornamentLine`: vira um `1px` sutil `var(--panel-border)` (sem filigrana).
- `.navItem` / `.navItemActive`: item ativo com `background: var(--item-bg); color: var(--text);` inativo `color: var(--text-muted)`.
- Adiciona `<ThemeToggle />` acima do bloco `.userArea` (desktop) e um `<li>` na `.bottomList` (mobile).
- Remove os 5 hex hardcoded → tokens.
- Atalhos "Fichas Recentes": **não** nesta entrega (não está na arquitetura atual; os protótipos mostram links estáticos). Fica registrado como melhoria futura.

---

## 8. `panel.module.css` — reescrita (destrava vários painéis)

- `.panel`: `background: var(--panel-bg); backdrop-filter: var(--blur-panel); border: 1px solid var(--panel-border); border-radius: var(--radius-xl); box-shadow: none;`
- Remove `.panel::before` (moldura interna) e o `radial-gradient`.
- `.card` / `.listItem` / `.tableWrap`: `background: var(--item-bg); border: 1px solid var(--panel-border); border-radius: var(--radius-lg);`
- `.badge`: `border-radius: var(--radius-sm); background: var(--chip-bg); border-color: var(--chip-border);`
- `.addButton` / `.removeButton` / `.ghostButton`: fundos glass; `.removeButton` usa `var(--danger-solid)`/texto `var(--on-solid)` ou variante sutil (`color: var(--chip-violet-text)` sobre `--item-bg`) — decidir por contraste na implementação.
- `.sectionTitle` (badge de seção): `color: var(--chip-violet-text); background: transparent; border: none; font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.08em; font-size: var(--text-xs);` (conforme protótipos, o título de seção é só texto violeta, sem caixa).
- `.emptyState`: borda tracejada `var(--panel-border)`.

---

## 9. Fases (commits)

Cada fase termina com `npm run test` + `npm run typecheck` verdes e um commit local `design(fase N): ...`. Sem push/PR.

### Fase 1 — Fundação
`theme.css`, `index.css`, `index.html` (anti-flash), `ThemeContext.tsx`, `main.tsx`, `ThemeToggle/`, `App.tsx` + `App.module.css` (blobs), `Sidebar` + `.module.css`, `panel.module.css`, `design.md` (reescrita).
**Critério:** app monta nos dois temas; toggle persiste; foco visível; `motion`/`acessibilidade`/`routeSplitting`/`smoke` verdes.

### Fase 2 — Autenticação e páginas simples
`LoginPage`, `RegisterPage`, `EmailVerificationPage`, `Home`, `NotFound`, `PrivacyPolicyPage`, `PrivacyPolicyModal`, `UserMenu`, `Header`, `RouteFallback`, `ErrorBoundary`.
Card glass central; blobs; toggle flutuante; coluna de branding do login mantida com tratamento glass no desktop.

### Fase 3 — Dashboard e criação
`CharactersPage` + `.module.css`, `NewMonsterPage`, `NewCharacterPage`, `GroupManagerModal`, `GroupSelector`, `SheetActionsMenu`, `SheetNotices`.
Grid de cards glass; busca; chips violeta de tipo; grupos/import/export/filtros/delete preservados.

### Fase 4 — Ficha de PJ
`CharacterSheetPage` + `.module.css`, `CharacterHeader`, `CharacterCombatSummary`, `CharacterSheetSummary`, `CharacterTableMode`, `AttributesPanel`, `SkillsPanel`, `SkillPanel`, `CombatPanel`, `AttacksPanel`, `SpellsPanel`, `ResourcesPanel`, `InventoryPanel`, `CharacterDetailsPanel`, `ManagedResourceControls`, `ResourceDots`, `NumberInput`, `DamagesEditor`, `RollResultBlock`, `SheetTabs`, `ShortRestModal`, `AvatarCropper`.
Preservar `.topBarActions` flex-wrap.

### Fase 5 — Ficha de Monstro
`MonsterSheetPage` + `.module.css`, `components/monster/*` (`MonsterHeader`, `MonsterCombatSummary`, `MonsterStatsPanel`, `MonsterTraitsPanel`, `MonsterFeaturesPanel`, `MonsterActionsPanel`, `LegendaryActionsPanel`, `MonsterSpellsPanel`, `MonsterTableMode`, `ReorderControls`).
Preservar `MonsterActionsPanel` `.cardHeader` grid e `.removeAction` dimensões (teste).

### Fase 6 — Fechamento
Varredura final de `rgba()`/hex residuais (`grep`); remover apelidos de token órfãos; remover CSS morto; `npm run test` + `npm run typecheck` + `npm run build`; loop `accessibility-check` (contraste dos tokens novos, foco, teclado); atualizar `CLAUDE.md` (seção de stack: Inter; menção ao `ThemeContext` e `data-theme`) e `README.md` se citarem o tema; `doc-sync`.

---

## 10. Verificação

| Item | Como |
|---|---|
| Testes automatizados | `npm run test` verde ao fim de cada fase |
| Tipos | `npm run typecheck` verde |
| Build | `npm run build` verde na fase 6 |
| Sem `transition: all` / `outline: none` | `grep` + testes existentes |
| Contraste AA texto/fundo nos dois temas | conferência manual + `accessibility-check` |
| Glass / blur / blobs / responsividade real | **manual no navegador** (jsdom não avalia) — registrado como pendência para o dono do projeto |
| Sem chave/segredo Firebase no diff | `pr-readiness` |
| Escopo do diff = só apresentação | revisão de diff por fase |

---

## 11. Riscos

- **`backdrop-filter` empilhado**: painel glass dentro de painel glass pode ficar leitoso. Mitigação: `backdrop-filter` só no container de painel de 1º nível; cards internos usam `background` sólido-translúcido sem blur próprio.
- **Contraste do texto faint no tema claro** (`--text-faint: oklch(58%...)` sobre painel `oklch(100%/0.55)`): validar AA; subir luminosidade do faint no claro se falhar.
- **Performance dos blobs** com `blur(90px)` em `position: fixed`: aceitável (3 elementos, sem animação). Se houver jank em mobile, reduzir para 2 blobs ou `blur(70px)`.
- **`rgba()` esquecido**: aparece como cor quente fora de lugar. Fase 6 faz varredura `grep -rE "#[0-9a-fA-F]{3,}|rgba\(" src --include="*.module.css"`.
- **Regressão de teste de layout** (`.topBarActions`, `MonsterActionsPanel`): as fases 4 e 5 listam explicitamente o que preservar.

---

## 12. Fora de escopo / melhorias futuras

- Atalhos de "Fichas Recentes" na sidebar.
- Página `NovaFicha` unificada (seletor PJ/Monstro numa tela só).
- Animações de entrada de painel.
- Tokens de tema por usuário no Firestore.
