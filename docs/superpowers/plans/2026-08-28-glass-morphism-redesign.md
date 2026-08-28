# Redesign Glass Morphism — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o tema visual "pergaminho" do Tomo do Aventureiro por um sistema Glass Morphism + Flat com toggle claro/escuro, sem tocar em regra de negócio, contrato de dados ou lógica de componente.

**Architecture:** Reponta os tokens em `src/styles/theme.css` para a paleta glass (OKLCH), com `:root` = claro e `:root[data-theme="dark"]` = escuro. Tokens antigos viram apelidos dos novos, então as ~1.900 referências `var()` existentes seguem válidas. Um `ThemeContext` novo grava `data-theme` no `<html>` e persiste em `localStorage`. As fases 2–5 varrem os 54 módulos CSS por área, trocando literais `rgba()`/hex por tokens e removendo enfeites pergaminho (bordas `double`, molduras `::before`, `radial-gradient`).

**Tech Stack:** React 19, TypeScript 5 (strict), Vite 7, CSS Modules, React Router 7. Sem dependência nova. Testes: Vitest 3 + Testing Library + jsdom.

**Spec:** `docs/superpowers/specs/2026-08-28-glass-morphism-redesign-design.md`

## Global Constraints

- Branch única `design/glass-morphism-sheets`. **Nunca** push, merge ou abrir PR sem "sim" explícito do dono. Commit local é livre.
- Não editar: `src/services/firebase.ts`, `src/context/AuthContext.tsx`, `firestore.rules`, `src/store/**`, `src/hooks/**`, `src/types/**`, funções `normalize*`, `documentação.MD`.
- Não remover pastas/páginas vazias listadas em `CLAUDE.md` ("Diretórios e páginas vazias").
- Não ler nem expor `.env*` ou qualquer segredo Firebase.
- JSX só muda para: montar `ThemeProvider`, inserir camada de blobs, inserir `<ThemeToggle />`. Nenhuma mudança de props, estado de domínio ou fluxo.
- Nenhum CSS pode usar `transition: all` nem `outline: none` (fora de comentário). Exigido por `src/test/motion.test.ts` e `src/test/acessibilidade.test.ts`.
- `src/styles/theme.css` mantém o bloco `@media (prefers-reduced-motion: reduce)` com `--transition: 0ms`, `animation-duration: 0.01ms !important`, `scroll-behavior: auto !important`.
- `src/index.css` mantém intacta a regra global `:where(a, button, input, select, textarea, summary, [tabindex]):focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; ... }`. O token `--accent` deve continuar existindo e ser uma cor de foco visível nos dois temas.
- `CharacterSheetPage.module.css` e `MonsterSheetPage.module.css`: `.topBarActions` mantém `flex-wrap: wrap` e **não** reintroduz `flex-shrink: 0`.
- `MonsterActionsPanel.module.css`: `.cardHeader` mantém `display: grid` + `grid-template-columns: minmax(0, 1fr) auto`; `.removeAction` mantém `width: 2.25rem; height: 2.25rem`.
- Convenção de import do projeto: `import App from './App.js'` (extensão `.js`/`.jsx` para arquivos `.ts`/`.tsx`) OU sem extensão (como `AuthContext`). Seguir o arquivo vizinho.
- Comandos de verificação: `npm run test` (Vitest, execução única), `npm run typecheck` (tsc --noEmit), `npm run build` (tsc + vite build). Rodar do diretório raiz.
- Ao fim de cada Task: `npm run test` e `npm run typecheck` verdes antes do commit. `npm run build` só nas Tasks marcadas.
- Mensagens de commit em português, prefixo `design:` ou `design(fase N):`. Terminar com:
  `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`

---

## File Structure

### Criados

| Arquivo | Responsabilidade |
|---|---|
| `src/context/ThemeContext.tsx` | `ThemeProvider` + `useTheme()`. Estado `'light' \| 'dark'`, persistência `localStorage['tomo:theme']`, escreve `data-theme` no `<html>`. |
| `src/components/ThemeToggle/ThemeToggle.tsx` | Botão reutilizável de alternância de tema. Consome `useTheme()`. |
| `src/components/ThemeToggle/ThemeToggle.module.css` | Estilo do botão. |
| `src/test/theme-tokens.test.ts` | Guarda de fonte: `theme.css` define os dois conjuntos de tokens; apelidos presentes; Inter no `@import`; bloco reduced-motion intacto. |
| `src/context/ThemeContext.test.tsx` | Comportamento: default segue `matchMedia`; `toggle` alterna e persiste; `data-theme` aplicado ao `<html>`. |

### Modificados (estrutura / código)

| Arquivo | Mudança |
|---|---|
| `src/styles/theme.css` | Reescrita dos tokens (paleta glass + apelidos + raios). |
| `src/index.css` | `body` background via `--bg`; base de `button`/`input`/`a` em tokens glass. |
| `index.html` | Script inline anti-flash no `<head>`. |
| `src/main.tsx` | Envolver `<App />` com `<ThemeProvider>`. |
| `src/App.tsx` | Camada de blobs dentro de `AppLayout`. |
| `src/App.module.css` | `.blobs` + `.blob1/2/3`; `z-index` de `.mainContent`. |
| `src/components/Sidebar/Sidebar.tsx` | Inserir `<ThemeToggle />` (desktop + bottom bar). |
| `src/components/Sidebar/Sidebar.module.css` | Reescrita: painel glass, remove marrom/dourado hardcoded. |
| `src/styles/panel.module.css` | Reescrita: `.panel` glass flat, remove `::before` e `radial-gradient`. |
| `design.md` | Reescrita: documenta o sistema Glass Morphism. |
| `CLAUDE.md` | Seção stack: Inter; menção a `ThemeContext` / `data-theme` (fase 6). |

### Modificados (varredura CSS — só valores visuais)

Fases 2–5. Regras de transformação na Task 10.

---

## Regra de transformação CSS (aplicada em toda varredura das fases 2–5)

Para cada `*.module.css` da área da fase:

1. **Fundos translúcidos pergaminho** → token:
   - `rgba(255, 249, 235, *)`, `rgba(255, 250, 241, *)`, `rgba(255, 252, 245, *)`, `rgba(255, 253, 244, *)`, `rgba(250, 245, 232, *)` e similares creme claro → `var(--panel-bg)` (container de painel) ou `var(--item-bg)` (card/linha interna).
   - `rgba(241, 227, 189, *)` / `#e8d9ad` / `#f0e6c8` (pergaminho médio) → `var(--chip-bg)`.
2. **Bordas:**
   - `border: 2px double *` / `border: 3px double *` → `border: 1px solid var(--panel-border)`.
   - `1px solid rgba(...)` creme/marrom → `1px solid var(--panel-border)` (ou `var(--chip-border)` em chips).
3. **Molduras / lavagens decorativas:**
   - Remover blocos `.panel::before` (ou `.X::before` cujo único papel é moldura `inset`).
   - Remover `radial-gradient(...)` e `linear-gradient(...)` que só dão textura de pergaminho. Manter gradientes funcionais (barra de HP).
4. **Raios:** `border-radius` de card/painel sobe para `var(--radius-lg)` (14–16 → 16) ou `var(--radius-xl)` (18–20). Chips/inputs → `var(--radius-sm)` / `var(--radius-md)`.
5. **Texto:** hex de tinta (`#1e1208`, `#5a3e28`, `#8a6e50`) → `var(--text)` / `var(--text-muted)` / `var(--text-faint)`.
6. **Accent:** `#7a1e1e`, `#a83232`, `rgba(122, 30, 30, *)` → `var(--chip-violet-text)` (texto/borda) ou `var(--chip-violet-bg)` (fundo).
7. **HP / dano-cura-temp:** `var(--rust*)` / `var(--bronze*)` / `var(--pewter*)` e os hex `#7a3018` / `#6e5010` / `#625a4a` → `var(--danger-solid)` / `var(--heal-solid)` / `var(--temp-solid)`; texto sobre eles → `var(--on-solid)`.
8. **Blur:** container de painel de 1º nível ganha `backdrop-filter: var(--blur-panel); -webkit-backdrop-filter: var(--blur-panel);`. Cards internos **não** recebem blur próprio (risco de leitoso empilhado).
9. **Sombras:** `box-shadow` pesada de card → remover ou `var(--shadow)`. Manter só em elementos flutuantes (modal, dropdown) via `var(--shadow-lg)`.
10. **Nunca** introduzir `transition: all` nem `outline: none`. Se encontrar `outline: none` legado, trocar por realce com `outline: 2px solid var(--accent)`.
11. Ao terminar a área, rodar: `grep -rE "#[0-9a-fA-F]{3,8}\b|rgba\(" src/components/<Area> src/pages/<Area> --include="*.module.css"` e justificar cada ocorrência restante (ex.: `rgba(0,0,0,0.5)` de overlay de modal é aceitável).

---

## Task 1: Tokens do tema (`theme.css`)

**Files:**
- Modify: `src/styles/theme.css` (reescrita completa)
- Test: `src/test/theme-tokens.test.ts` (criar)

**Interfaces:**
- Produces: variáveis CSS consumidas por todo o resto. Nomes-chave novos: `--bg`, `--panel-bg`, `--panel-border`, `--item-bg`, `--avatar-bg`, `--chip-bg`, `--chip-border`, `--chip-violet-bg`, `--chip-violet-border`, `--chip-violet-text`, `--input-bg`, `--track-bg`, `--danger-solid`, `--heal-solid`, `--temp-solid`, `--on-solid`, `--text`, `--text-muted`, `--text-faint`, `--blur-panel`, `--blur-blob`, `--blob-1`, `--blob-2`, `--blob-3`. Apelidos preservados: `--ink`, `--ink-muted`, `--ink-faint`, `--ink-soft`, `--accent`, `--accent-light`, `--accent-faint`, `--accent-soft`, `--parchment-bg`, `--parchment-light`, `--parchment-dark`, `--parchment-shadow`, `--parchment`, `--border`, `--border-light`, `--border-dark`, `--input-border`, `--rust`, `--rust-faint`, `--bronze`, `--bronze-faint`, `--pewter`, `--pewter-faint`. Mantidos: `--font-display`, `--font-body`, `--text-xs..3xl`, `--space-1..12`, `--radius-sm/-md/-lg`, `--radius`, `--radius-xl` (novo), `--shadow-sm/-lg/-soft/-card`, `--shadow`, `--transition`, `--page-max`.

- [ ] **Step 1: Escrever o teste de guarda**

`src/test/theme-tokens.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(join(process.cwd(), 'src', 'styles', 'theme.css'), 'utf8')

describe('tokens do tema glass', () => {
  it('importa Inter e Cinzel', () => {
    expect(css).toMatch(/family=Cinzel/)
    expect(css).toMatch(/family=Inter|&family=Inter/)
    expect(css).not.toMatch(/Crimson\+Text/)
  })

  it('define a paleta clara em :root e a escura em [data-theme="dark"]', () => {
    expect(css).toMatch(/:root\s*\{/)
    expect(css).toMatch(/:root\[data-theme=["']dark["']\]\s*\{/)
  })

  it('define os tokens glass semânticos', () => {
    for (const t of ['--panel-bg', '--panel-border', '--chip-violet-text', '--danger-solid', '--heal-solid', '--temp-solid', '--on-solid', '--text', '--text-muted', '--text-faint', '--blur-panel', '--bg']) {
      expect(css, t).toContain(t)
    }
  })

  it('mantém os apelidos de compatibilidade apontando para os tokens novos', () => {
    expect(css).toMatch(/--ink:\s*var\(--text\)/)
    expect(css).toMatch(/--accent:\s*var\(--chip-violet-text\)/)
    expect(css).toMatch(/--rust:\s*var\(--danger-solid\)/)
  })

  it('preserva o bloco de prefers-reduced-motion', () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/)
    expect(css).toMatch(/--transition:\s*0ms/)
    expect(css).toMatch(/animation-duration:\s*0\.01ms\s*!important/)
    expect(css).toMatch(/scroll-behavior:\s*auto\s*!important/)
  })

  it('não usa transition: all', () => {
    expect(css).not.toMatch(/transition:\s*all\b/)
  })
})
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npm run test -- theme-tokens`
Expected: FAIL (Crimson Text ainda presente, tokens glass ausentes).

- [ ] **Step 3: Reescrever `src/styles/theme.css`**

```css
/* Design tokens — Glass Morphism + Flat */

@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');

:root {
  /* ── Paleta glass — TEMA CLARO ── */
  --bg: linear-gradient(160deg, oklch(97% 0.004 280), oklch(94% 0.006 280));
  --blob-1: oklch(80% 0.04 300 / 0.22);
  --blob-2: oklch(82% 0.03 240 / 0.16);
  --blob-3: oklch(84% 0.02 280 / 0.14);

  --text: oklch(24% 0.01 280);
  --text-muted: oklch(44% 0.01 280);
  --text-faint: oklch(52% 0.01 280);

  --panel-bg: oklch(100% 0 0 / 0.55);
  --panel-border: oklch(20% 0.01 280 / 0.1);
  --item-bg: oklch(100% 0 0 / 0.48);
  --avatar-bg: oklch(100% 0 0 / 0.6);

  --chip-bg: oklch(100% 0 0 / 0.5);
  --chip-border: oklch(20% 0.01 280 / 0.09);
  --chip-violet-bg: oklch(90% 0.03 300 / 0.6);
  --chip-violet-border: oklch(55% 0.05 300 / 0.35);
  --chip-violet-text: oklch(38% 0.05 300);

  --input-bg: oklch(100% 0 0 / 0.7);
  --track-bg: oklch(90% 0.005 280 / 0.6);

  --danger-solid: oklch(38% 0.07 75);
  --heal-solid: oklch(56% 0.07 75);
  --temp-solid: oklch(70% 0.06 75);
  --on-solid: oklch(97% 0.015 75);

  --blur-panel: blur(20px);
  --blur-blob: 90px;

  /* ── Tipografia ── */
  --font-display: 'Cinzel', 'Palatino Linotype', Georgia, serif;
  --font-body: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;

  /* ── Espaçamento ── */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;

  /* ── Bordas ── */
  --radius-sm: 8px;
  --radius: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 18px;

  /* ── Sombras ── */
  --shadow-sm: none;
  --shadow: 0 1px 2px oklch(0% 0 0 / 0.04);
  --shadow-lg: 0 4px 24px oklch(0% 0 0 / 0.12);
  --shadow-soft: var(--shadow-lg);
  --shadow-card: var(--shadow);

  /* ── Transições ── */
  --transition: 150ms ease;

  --page-max: 1100px;

  /* ── Apelidos de compatibilidade (tokens do tema antigo) ── */
  --ink: var(--text);
  --ink-muted: var(--text-muted);
  --ink-faint: var(--text-faint);
  --ink-soft: var(--text-faint);

  --accent: var(--chip-violet-text);
  --accent-light: var(--chip-violet-text);
  --accent-faint: var(--chip-violet-bg);
  --accent-soft: var(--chip-violet-bg);

  --parchment-bg: transparent;
  --parchment-light: var(--panel-bg);
  --parchment-dark: var(--chip-bg);
  --parchment-shadow: var(--chip-bg);
  --parchment: var(--panel-bg);

  --border: var(--panel-border);
  --border-light: var(--panel-border);
  --border-dark: var(--panel-border);
  --input-border: var(--panel-border);

  --rust: var(--danger-solid);
  --rust-faint: color-mix(in oklab, var(--danger-solid) 14%, transparent);
  --bronze: var(--heal-solid);
  --bronze-faint: color-mix(in oklab, var(--heal-solid) 14%, transparent);
  --pewter: var(--temp-solid);
  --pewter-faint: color-mix(in oklab, var(--temp-solid) 14%, transparent);
}

/* ── Paleta glass — TEMA ESCURO (toggle explícito) ── */
:root[data-theme='dark'] {
  --bg: linear-gradient(160deg, oklch(15% 0.015 280), oklch(11% 0.01 280));
  --blob-1: oklch(40% 0.05 300 / 0.22);
  --blob-2: oklch(40% 0.04 240 / 0.16);
  --blob-3: oklch(42% 0.03 280 / 0.14);

  --text: oklch(96% 0.005 280);
  --text-muted: oklch(76% 0.01 280);
  --text-faint: oklch(60% 0.01 280);

  --panel-bg: oklch(28% 0.01 280 / 0.32);
  --panel-border: oklch(90% 0.01 280 / 0.1);
  --item-bg: oklch(33% 0.01 280 / 0.26);
  --avatar-bg: oklch(33% 0.01 280 / 0.4);

  --chip-bg: oklch(38% 0.01 280 / 0.28);
  --chip-border: oklch(90% 0.01 280 / 0.09);
  --chip-violet-bg: oklch(38% 0.05 300 / 0.3);
  --chip-violet-border: oklch(70% 0.06 300 / 0.4);
  --chip-violet-text: oklch(84% 0.03 300);

  --input-bg: oklch(36% 0.01 280 / 0.4);
  --track-bg: oklch(22% 0.01 280 / 0.5);
}

/* ── Estado "system" antes do JS montar: espelha o escuro ── */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --bg: linear-gradient(160deg, oklch(15% 0.015 280), oklch(11% 0.01 280));
    --blob-1: oklch(40% 0.05 300 / 0.22);
    --blob-2: oklch(40% 0.04 240 / 0.16);
    --blob-3: oklch(42% 0.03 280 / 0.14);
    --text: oklch(96% 0.005 280);
    --text-muted: oklch(76% 0.01 280);
    --text-faint: oklch(60% 0.01 280);
    --panel-bg: oklch(28% 0.01 280 / 0.32);
    --panel-border: oklch(90% 0.01 280 / 0.1);
    --item-bg: oklch(33% 0.01 280 / 0.26);
    --avatar-bg: oklch(33% 0.01 280 / 0.4);
    --chip-bg: oklch(38% 0.01 280 / 0.28);
    --chip-border: oklch(90% 0.01 280 / 0.09);
    --chip-violet-bg: oklch(38% 0.05 300 / 0.3);
    --chip-violet-border: oklch(70% 0.06 300 / 0.4);
    --chip-violet-text: oklch(84% 0.03 300);
    --input-bg: oklch(36% 0.01 280 / 0.4);
    --track-bg: oklch(22% 0.01 280 / 0.5);
  }
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --transition: 0ms linear;
  }

  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  html {
    scroll-behavior: auto !important;
  }
}

::selection {
  background: var(--chip-violet-bg);
  color: var(--text);
}

#root {
  min-height: 100vh;
}

main {
  width: 100%;
  max-width: var(--page-max);
  margin: 0 auto;
  padding-inline: 0.5rem;
}

@media (min-width: 480px) {
  main { padding-inline: 1rem; }
}

@media (min-width: 780px) {
  main { padding-inline: 1.5rem; }
}

fieldset {
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  background: var(--item-bg);
}

legend {
  padding: 0 var(--space-2);
  font-family: var(--font-display);
  color: var(--text-muted);
}

small { color: var(--text-muted); }

textarea {
  min-height: 7rem;
  resize: vertical;
}
```

> Nota: se `color-mix` causar problema no alvo de browsers, trocar `--rust-faint`/`--bronze-faint`/`--pewter-faint` por `var(--chip-bg)`. Verificar no build.

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npm run test -- theme-tokens`
Expected: PASS.

- [ ] **Step 5: Rodar a suíte inteira + typecheck**

Run: `npm run test` e depois `npm run typecheck`
Expected: `motion.test.ts` e `acessibilidade.test.ts` continuam verdes. Demais testes não regridem.

- [ ] **Step 6: Commit**

```bash
git add src/styles/theme.css src/test/theme-tokens.test.ts
git commit -m "design(fase 1): repontar tokens para a paleta glass morphism"
```

---

## Task 2: `index.css` e `index.html`

**Files:**
- Modify: `src/index.css`
- Modify: `index.html`

**Interfaces:**
- Consumes: tokens da Task 1.
- Produces: `<html data-theme>` já setado no primeiro paint (anti-flash).

- [ ] **Step 1: Editar `src/index.css`**

Trocar o bloco `body` por:

```css
body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text);
  background: var(--bg);
  background-attachment: fixed;
  min-height: 100vh;
  line-height: 1.6;
}
```

Trocar `a`:

```css
a { color: var(--accent); text-decoration: none; transition: color var(--transition); }
a:hover { color: var(--accent); text-decoration: underline; }
```

Trocar `button` base:

```css
button {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  cursor: pointer;
  border: 1px solid var(--panel-border);
  background: var(--item-bg);
  color: var(--text);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  transition: background var(--transition), border-color var(--transition), color var(--transition);
}
button:hover:not(:disabled) { background: var(--chip-bg); border-color: var(--panel-border); }
```

Trocar `input, select, textarea` base:

```css
input, select, textarea {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text);
  background: var(--input-bg);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  transition: border-color var(--transition), box-shadow var(--transition);
  width: 100%;
}
```

Trocar o realce de `input:focus`:

```css
input:focus, select:focus, textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--chip-violet-bg);
}
```

Trocar `th`/`td`:

```css
th { ... border-bottom: 1px solid var(--panel-border); ... color: var(--text-muted); }
td { ... border-bottom: 1px solid var(--panel-border); ... }
```

**Não tocar** na regra `:where(...):focus-visible` nem em `.sr-only` nem em `input[type="checkbox"]` (só trocar `accent-color: var(--accent)` se estiver hex).

- [ ] **Step 2: Editar `index.html`** — adicionar antes de `</head>`:

```html
<script>
  try {
    var t = localStorage.getItem('tomo:theme');
    if (t !== 'light' && t !== 'dark') {
      t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
</script>
```

- [ ] **Step 3: Verificar**

Run: `npm run test` e `npm run typecheck`
Expected: verdes.

- [ ] **Step 4: Commit**

```bash
git add src/index.css index.html
git commit -m "design(fase 1): base global glass e anti-flash de tema"
```

---

## Task 3: `ThemeContext`

**Files:**
- Create: `src/context/ThemeContext.tsx`
- Test: `src/context/ThemeContext.test.tsx`

**Interfaces:**
- Produces:
  - `type ThemeMode = 'light' | 'dark'`
  - `function ThemeProvider({ children }: { children: React.ReactNode }): JSX.Element`
  - `function useTheme(): { mode: ThemeMode; toggle: () => void; setMode: (m: ThemeMode) => void }`
  - Chave `localStorage`: `'tomo:theme'`.

- [ ] **Step 1: Escrever o teste**

`src/context/ThemeContext.test.tsx`:

```tsx
import { act, render, renderHook, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider, useTheme } from './ThemeContext'

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: false, media: q, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  }))
})
afterEach(() => vi.unstubAllGlobals())

describe('ThemeContext', () => {
  it('usa "light" quando não há preferência salva nem do SO', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.mode).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('respeita o valor salvo em localStorage', () => {
    localStorage.setItem('tomo:theme', 'dark')
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.mode).toBe('dark')
  })

  it('toggle alterna e persiste', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.toggle())
    expect(result.current.mode).toBe('dark')
    expect(localStorage.getItem('tomo:theme')).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('useTheme lança fora do provider', () => {
    expect(() => renderHook(() => useTheme())).toThrow()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test -- ThemeContext`
Expected: FAIL (módulo não existe).

- [ ] **Step 3: Implementar `src/context/ThemeContext.tsx`**

```tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'tomo:theme'

interface ThemeContextValue {
  mode: ThemeMode
  toggle: () => void
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readInitialMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* localStorage indisponível — cai no prefers-color-scheme */
  }
  try {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  } catch {
    /* matchMedia indisponível */
  }
  return 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readInitialMode)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode)
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      /* ignore */
    }
  }, [mode])

  const setMode = useCallback((next: ThemeMode) => setModeState(next), [])
  const toggle = useCallback(() => setModeState((m) => (m === 'dark' ? 'light' : 'dark')), [])

  const value = useMemo<ThemeContextValue>(() => ({ mode, toggle, setMode }), [mode, toggle, setMode])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme deve ser usado dentro de <ThemeProvider>')
  return ctx
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm run test -- ThemeContext`
Expected: PASS.

- [ ] **Step 5: Suíte + typecheck**

Run: `npm run test` e `npm run typecheck`
Expected: verdes.

- [ ] **Step 6: Commit**

```bash
git add src/context/ThemeContext.tsx src/context/ThemeContext.test.tsx
git commit -m "design(fase 1): ThemeContext com toggle e persistencia"
```

---

## Task 4: `ThemeToggle` + montar `ThemeProvider`

**Files:**
- Create: `src/components/ThemeToggle/ThemeToggle.tsx`
- Create: `src/components/ThemeToggle/ThemeToggle.module.css`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: `useTheme()` da Task 3.
- Produces: `function ThemeToggle({ className }: { className?: string }): JSX.Element`.

- [ ] **Step 1: Implementar `ThemeToggle.tsx`**

```tsx
import { useTheme } from '../../context/ThemeContext'
import styles from './ThemeToggle.module.css'

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, toggle } = useTheme()
  const isDark = mode === 'dark'

  return (
    <button
      type="button"
      className={`${styles.toggle} ${className ?? ''}`}
      onClick={toggle}
      aria-pressed={isDark}
      aria-label={isDark ? 'Mudar para o modo claro' : 'Mudar para o modo escuro'}
    >
      <span aria-hidden="true">{isDark ? '🌙' : '☀️'}</span>
      <span>{isDark ? 'Modo escuro' : 'Modo claro'}</span>
    </button>
  )
}
```

- [ ] **Step 2: `ThemeToggle.module.css`**

```css
.toggle {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  background: var(--item-bg);
  border: 1px solid var(--panel-border);
  color: var(--text);
  cursor: pointer;
  transition: background var(--transition), border-color var(--transition);
}

.toggle:hover:not(:disabled) {
  background: var(--chip-bg);
}
```

- [ ] **Step 3: Editar `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.js'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { purgeUnusableSheetDrafts } from './utils/sheetDraft'

purgeUnusableSheetDrafts()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
```

- [ ] **Step 4: Verificar**

Run: `npm run test` e `npm run typecheck`
Expected: verdes (`smoke.test.ts` monta o app — deve continuar OK; se ele renderiza sem `ThemeProvider`, ver Step 5).

- [ ] **Step 5: Ajuste de teste se necessário**

Se algum teste renderiza `<App />` ou um componente que agora chama `useTheme()` e quebra: envolver com `<ThemeProvider>` no helper de render do teste, OU (melhor) garantir que só o `ThemeToggle` usa `useTheme` e ele só aparece dentro de `Sidebar`/auth. `smoke.test.ts` deve renderizar a árvore real a partir de `main` — checar e adaptar o wrapper de teste, não o código de produção.

- [ ] **Step 6: Commit**

```bash
git add src/components/ThemeToggle src/main.tsx
git commit -m "design(fase 1): componente ThemeToggle e montagem do ThemeProvider"
```

---

## Task 5: AppShell — blobs de fundo

**Files:**
- Modify: `src/App.tsx` (função `AppLayout`)
- Modify: `src/App.module.css`

**Interfaces:**
- Consumes: tokens `--blob-1/2/3`, `--blur-blob`.

- [ ] **Step 1: Editar `AppLayout` em `src/App.tsx`**

```tsx
function AppLayout() {
  return (
    <div className={styles.appShell}>
      <div className={styles.blobs} aria-hidden="true">
        <span className={styles.blob1} />
        <span className={styles.blob2} />
        <span className={styles.blob3} />
      </div>
      <Sidebar />
      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Editar `src/App.module.css`**

```css
.appShell {
  position: relative;
  display: flex;
  min-height: 100dvh;
  width: 100%;
}

.blobs {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.blob1, .blob2, .blob3 {
  position: absolute;
  border-radius: 50%;
  filter: blur(var(--blur-blob));
}

.blob1 { top: -140px; left: -100px; width: 480px; height: 480px; background: var(--blob-1); }
.blob2 { top: 220px; right: -160px; width: 520px; height: 520px; background: var(--blob-2); }
.blob3 { bottom: -180px; left: 30%; width: 460px; height: 460px; background: var(--blob-3); }

.mainContent {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
}

@media (max-width: 860px) {
  .mainContent { padding-bottom: 3.75rem; }
}
```

(Sidebar recebe `z-index` no próprio módulo na Task 6.)

- [ ] **Step 3: Verificar**

Run: `npm run test` e `npm run typecheck`
Expected: verdes.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/App.module.css
git commit -m "design(fase 1): camada de blobs desfocados no AppShell"
```

---

## Task 6: Sidebar

**Files:**
- Modify: `src/components/Sidebar/Sidebar.tsx`
- Modify: `src/components/Sidebar/Sidebar.module.css` (reescrita)

**Interfaces:**
- Consumes: `ThemeToggle` (Task 4), tokens glass.

- [ ] **Step 1: Editar `Sidebar.tsx`** — importar e inserir o toggle.

Adicionar import: `import { ThemeToggle } from '../ThemeToggle/ThemeToggle'`

No `<aside>` desktop, logo antes do bloco `{user && (<div className={styles.userArea}>...)}`, inserir:

```tsx
<div className={styles.themeRow}>
  <ThemeToggle className={styles.themeToggle} />
</div>
```

Na `.bottomList` mobile, antes do `<li>` de logout (`{user && (...)}`), inserir:

```tsx
<li className={styles.bottomItem}>
  <ThemeToggle className={styles.bottomThemeToggle} />
</li>
```

- [ ] **Step 2: Reescrever `Sidebar.module.css`**

Manter os nomes de classe existentes (`.sidebar`, `.logoArea`, `.logoIcon`, `.logoText`, `.ornamentLine`, `.nav`, `.navList`, `.navItem`, `.navItemActive`, `.navIcon`, `.navLabel`, `.spacer`, `.userArea`, `.userInfo`, `.avatarWrapper`, `.avatarImg`, `.avatarFallback`, `.userText`, `.userName`, `.userEmail`, `.logoutButton`, `.logoutIcon`, `.bottomBar`, `.bottomList`, `.bottomItem`, `.bottomLink`, `.bottomLinkActive`, `.bottomIcon`, `.bottomLabel`) + adicionar `.themeRow`, `.themeToggle`, `.bottomThemeToggle`.

Regras-chave:

```css
.sidebar {
  display: flex;
  flex-direction: column;
  width: 230px;
  min-height: 100vh;
  position: sticky;
  top: 0;
  align-self: flex-start;
  flex-shrink: 0;
  z-index: 1;
  padding: var(--space-6) var(--space-4);
  gap: var(--space-5);
  background: var(--panel-bg);
  backdrop-filter: var(--blur-panel);
  -webkit-backdrop-filter: var(--blur-panel);
  border-right: 1px solid var(--panel-border);
}

.logoIcon { width: 6rem; height: 6rem; object-fit: contain; display: block; margin: 0 auto; }
.logoText {
  display: block; margin-top: var(--space-2);
  font-family: var(--font-display); font-size: 1rem; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--text); text-align: center; line-height: 1.25;
}

.ornamentLine { height: 1px; margin: 0; background: var(--panel-border); }

.navItem {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  text-decoration: none;
  color: var(--text-muted);
  font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600;
  letter-spacing: 0.02em;
  transition: background-color var(--transition), color var(--transition), border-color var(--transition);
}
.navItem:hover { color: var(--text); background: var(--item-bg); }
.navItemActive { color: var(--text); background: var(--item-bg); border-color: var(--panel-border); }

.spacer { flex: 1; }

.themeRow { padding: 0; }
.themeToggle { width: 100%; }

.avatarImg, .avatarFallback {
  width: 2.4rem; height: 2.4rem; border-radius: 50%;
  border: 1px solid var(--panel-border);
}
.avatarImg { object-fit: cover; }
.avatarFallback {
  background: var(--chip-violet-bg); color: var(--chip-violet-text);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-size: var(--text-sm); font-weight: 700;
}

.userName { font-family: var(--font-display); font-size: var(--text-sm); color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.userEmail { font-size: var(--text-xs); color: var(--text-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.logoutButton {
  display: flex; align-items: center; gap: var(--space-2); width: 100%;
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-family: var(--font-body); font-size: var(--text-xs); font-weight: 600;
  letter-spacing: 0.02em; cursor: pointer; text-align: left;
  transition: background-color var(--transition), color var(--transition), border-color var(--transition);
}
.logoutButton:hover { background: var(--item-bg); color: var(--text); }

.bottomBar {
  display: none;
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
  background: var(--panel-bg);
  backdrop-filter: var(--blur-panel);
  -webkit-backdrop-filter: var(--blur-panel);
  border-top: 1px solid var(--panel-border);
  padding-bottom: env(safe-area-inset-bottom);
}
/* .bottomList, .bottomItem: manter layout atual (flex, scroll-snap, scrollbar hidden) */

.bottomLink {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-5); min-width: 5rem; height: 3.75rem;
  background: transparent; border: none; border-top: 2px solid transparent;
  color: var(--text-faint);
  font-family: var(--font-body); font-size: var(--text-xs); letter-spacing: 0.02em;
  cursor: pointer; text-decoration: none; white-space: nowrap;
  transition: background-color var(--transition), color var(--transition), border-color var(--transition);
}
.bottomLink:hover { color: var(--text); }
.bottomLinkActive { color: var(--text); border-top-color: var(--chip-violet-border); background: var(--item-bg); }

.bottomThemeToggle {
  flex-direction: column; gap: var(--space-1); min-width: 5rem; height: 3.75rem;
  border: none; border-radius: 0; background: transparent; font-size: var(--text-xs);
}

@media (max-width: 860px) {
  .sidebar { display: none; }
  .bottomBar { display: block; }
}
```

Remover: todos os `#hex`, `rgba(...)`, `linear-gradient(...)` de pergaminho, o `background-image` de noise, `.navItem::before`, `!important`, `box-shadow` pesado, `filter: drop-shadow` do logo, `transition:` com lista de 6 propriedades (encurtar para as usadas).

- [ ] **Step 3: Verificar**

Run: `npm run test` e `npm run typecheck`
Expected: verdes. Se algum teste renderiza `<Sidebar />` sem `ThemeProvider`, envolver no wrapper do teste.

Run também: `grep -nE "#[0-9a-fA-F]{3,8}\b|rgba\(" src/components/Sidebar/Sidebar.module.css`
Expected: sem saída (ou só justificado).

- [ ] **Step 4: Commit**

```bash
git add src/components/Sidebar
git commit -m "design(fase 1): sidebar como painel glass com toggle de tema"
```

---

## Task 7: `panel.module.css`

**Files:**
- Modify: `src/styles/panel.module.css` (reescrita)

- [ ] **Step 1: Reescrever** mantendo todos os nomes de classe (`.panel`, `.panelHeader`, `.panelTitle`, `.panelSubtitle`, `.section`, `.sectionTitle`, `.card`, `.cardGrid`, `.toolbar`, `.row`, `.stack`, `.list`, `.listItem`, `.tableWrap`, `.addButton`, `.removeButton`, `.ghostButton`, `.counter`, `.counterValue`, `.badge`, `.note`, `.emptyState`, `.checkboxLabel`, `.compactInput`, `.narrowInput`, `.mediumInput`, `.wideInput`, `.fullWidth`).

```css
.panel {
  position: relative;
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5);
  text-align: left;
  background: var(--panel-bg);
  backdrop-filter: var(--blur-panel);
  -webkit-backdrop-filter: var(--blur-panel);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-xl);
}

/* .panel::before removido */

.panelHeader { display: flex; justify-content: space-between; align-items: baseline; gap: var(--space-3); flex-wrap: wrap; }
.panelTitle { font-family: var(--font-display); font-size: var(--text-xl); letter-spacing: 0.02em; color: var(--text); }
.panelSubtitle { color: var(--text-muted); font-style: italic; }

.section { display: grid; gap: var(--space-3); }
.sectionTitle {
  font-family: var(--font-display);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--chip-violet-text);
  align-self: flex-start;
}

.card {
  display: grid; gap: var(--space-2);
  padding: var(--space-4);
  background: var(--item-bg);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-lg);
}

.cardGrid { display: grid; gap: var(--space-3); grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
.toolbar, .row { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
.stack, .list { display: grid; gap: var(--space-2); }
.list { list-style: none; }

.listItem {
  display: grid; gap: var(--space-2);
  padding: var(--space-3);
  background: var(--item-bg);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-lg);
}

.tableWrap {
  overflow-x: auto;
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-lg);
  background: var(--item-bg);
}

.addButton { background: var(--chip-violet-bg); border-color: var(--chip-violet-border); color: var(--chip-violet-text); font-weight: 600; }
.removeButton { background: var(--item-bg); border-color: var(--panel-border); color: var(--chip-violet-text); }
.ghostButton { background: var(--item-bg); }

.counter { display: inline-flex; align-items: center; gap: var(--space-2); }
.counterValue { min-width: 2.5rem; text-align: center; font-weight: 700; font-size: var(--text-lg); font-family: var(--font-display); color: var(--text); }

.badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 2.4rem; padding: 0.15rem 0.6rem;
  border: 1px solid var(--chip-border);
  border-radius: var(--radius-sm);
  background: var(--chip-bg);
  font-size: var(--text-sm); font-weight: 700; color: var(--text);
}

.note { color: var(--text-muted); font-size: var(--text-sm); }

.emptyState {
  padding: var(--space-3);
  border: 1px dashed var(--panel-border);
  border-radius: var(--radius-lg);
  color: var(--text-muted);
  background: var(--item-bg);
}

.checkboxLabel { display: inline-flex; flex-direction: row; align-items: center; gap: var(--space-2); }
.compactInput { width: 4rem; }
.narrowInput { width: 5rem; }
.mediumInput { width: 7.5rem; }
.wideInput { width: min(100%, 18rem); }
.fullWidth { width: 100%; }

@media (max-width: 720px) {
  .panel { padding: var(--space-3); gap: var(--space-3); }
  .panelTitle { font-size: 1.3rem; }
  .cardGrid { grid-template-columns: 1fr; }
}

@media (max-width: 400px) {
  .panel { padding: var(--space-2); gap: var(--space-2); }
}
```

- [ ] **Step 2: Verificar**

Run: `npm run test` e `npm run typecheck`
Expected: verdes.

- [ ] **Step 3: Commit**

```bash
git add src/styles/panel.module.css
git commit -m "design(fase 1): panel compartilhado flat glass"
```

---

## Task 8: Reescrever `design.md`

**Files:**
- Modify: `design.md` (reescrita completa)

- [ ] **Step 1: Reescrever** `design.md` documentando:
  - Filosofia: Glass Morphism + Flat, paleta monocromática neutra (violeta acinzentado hue ~300 chroma baixo para destaque; sépia/dourada hue ~75 só variando luminosidade para HP). Sem verde/azul/vermelho tradicional.
  - Tabela completa dos tokens novos (copiar da spec seção 3, com valores dark e light).
  - Tabela dos apelidos de compatibilidade e a nota de que serão migrados/removidos.
  - Tipografia: Cinzel (títulos 600–800) + Inter (corpo 400–700).
  - Raios: 8 / 12 / 16 / 18. Blur: `blur(20px)` painel, `blur(90px)` blob.
  - Padrões de componente: painel glass (`background var(--panel-bg)` + `backdrop-filter` + `1px var(--panel-border)` + `radius 18`), card interno (`var(--item-bg)`, sem blur próprio), chip (`var(--chip-bg)`/`var(--chip-border)`), chip violeta, botões de HP (`--danger/heal/temp-solid` + `--on-solid`), sectionTitle (só texto violeta uppercase).
  - Tema claro/escuro: `data-theme` no `<html>` via `ThemeContext`, chave `tomo:theme`, default `prefers-color-scheme`.
  - Regras: sem Tailwind/styled-components; nunca hardcodar valor que exista como token; `backdrop-filter` só no painel de 1º nível; foco sempre `outline: 2px solid var(--accent)`; transições só em `background`/`color`/`border-color`/`opacity` e nunca `transition: all`.
  - Checklist de validação de coerência (adaptado do atual).

- [ ] **Step 2: Verificar** — `npm run test` (nada quebra; nenhum teste lê `design.md`).

- [ ] **Step 3: Commit**

```bash
git add design.md
git commit -m "design(fase 1): reescrever design.md para o sistema glass morphism"
```

---

## Task 9: Portão da Fase 1

- [ ] **Step 1:** Run `npm run test` — todos verdes.
- [ ] **Step 2:** Run `npm run typecheck` — sem erro.
- [ ] **Step 3:** Run `npm run build` — sem erro (valida que `color-mix`/OKLCH passam no build; se falhar, aplicar o fallback da Task 1 Step 3).
- [ ] **Step 4:** `grep -rnE "Crimson" src/` — sem saída.
- [ ] **Step 5 (manual, registrar):** dono do projeto abre `npm run dev`, confere: app monta claro e escuro, toggle na sidebar persiste após reload, foco por Tab visível, sem flash de tema. Anotar resultado no PR.
- [ ] **Step 6:** Commit vazio de marco, se desejado: `git commit --allow-empty -m "design(fase 1): fundacao concluida"`.

---

## Task 10: Fase 2 — Autenticação e páginas simples

**Files (todos `.module.css`, e `.tsx` só para blobs/toggle onde aplicável):**
- `src/pages/LoginPage/LoginPage.module.css` + `.tsx` (toggle flutuante)
- `src/pages/RegisterPage/RegisterPage.module.css` + `.tsx` (toggle flutuante)
- `src/pages/EmailVerificationPage/EmailVerificationPage.module.css` + `.tsx`
- `src/pages/Home/Home.module.css`
- `src/pages/NotFound/NotFound.module.css`
- `src/pages/PrivacyPolicyPage/PrivacyPolicyPage.module.css`
- `src/components/PrivacyPolicyModal/PrivacyPolicyModal.module.css`
- `src/components/UserMenu/UserMenu.module.css`
- `src/components/Header/Header.module.css`
- `src/components/RouteFallback/RouteFallback.module.css`
- `src/components/ErrorBoundary/ErrorBoundary.module.css`

**Interfaces:** consome tokens da Task 1; `ThemeToggle` da Task 4.

- [ ] **Step 1:** Para cada arquivo da lista, aplicar a **Regra de transformação CSS** (seção acima). Login/Register: card central `background: var(--panel-bg)` + `backdrop-filter: var(--blur-panel)` + `border-radius: var(--radius-xl)`; manter a coluna de branding no desktop com fundo `var(--item-bg)` e colapso mobile atual; blobs de fundo replicados no CSS de página (`position: fixed` + `filter: blur(var(--blur-blob))`).
- [ ] **Step 2:** Em `LoginPage.tsx` e `RegisterPage.tsx` e `EmailVerificationPage.tsx`: adicionar `<ThemeToggle />` posicionado `position: fixed; top: 20px; right: 20px; z-index: 2` (classe local `.themeFloat`). Import: `import { ThemeToggle } from '../../components/ThemeToggle/ThemeToggle'`.
- [ ] **Step 3:** `grep -nE "#[0-9a-fA-F]{3,8}\b|rgba\(" <arquivos da fase>` — justificar restos (overlays `rgba(0,0,0,.5)` de modal OK).
- [ ] **Step 4:** Run `npm run test` e `npm run typecheck` — verdes. `LoginPage`/`RegisterPage` podem ter testes de render: envolver com `ThemeProvider` + `MemoryRouter` no wrapper de teste se `useTheme` passar a ser chamado.
- [ ] **Step 5:** Commit `git add` dos arquivos da fase; `git commit -m "design(fase 2): telas de autenticacao e paginas simples em glass"`.

---

## Task 11: Fase 3 — Dashboard e criação

**Files:**
- `src/pages/CharactersPage/CharactersPage.module.css` (+ `.tsx` só se precisar de wrapper; provável que não)
- `src/pages/NewMonsterPage/NewMonsterPage.module.css`
- `src/pages/NewCharacterPage/NewCharacterPage.module.css`
- `src/components/GroupManagerModal/GroupManagerModal.module.css`
- `src/components/GroupSelector/GroupSelector.module.css`
- `src/components/SheetActionsMenu/SheetActionsMenu.module.css`
- `src/components/SheetNotices/SheetNotices.module.css`

- [ ] **Step 1:** Aplicar a Regra de transformação CSS a cada arquivo. `CharactersPage`: `.sheetList` vira grid `repeat(auto-fill, minmax(260px, 1fr))`; cada card `background: var(--panel-bg)` + `backdrop-filter` + `border-radius: var(--radius-lg)`; chip de tipo (PJ/NPC/Monstro) usa `var(--chip-violet-bg)`/`var(--chip-violet-border)`/`var(--chip-violet-text)`; chip de meta usa `var(--chip-bg)`. Skeletons: fundo `var(--item-bg)`, shimmer em `var(--chip-bg)`. Modais: overlay `oklch(0% 0 0 / 0.5)`, painel `var(--panel-bg)` + `var(--shadow-lg)`.
- [ ] **Step 2:** `grep` de hex/rgba nos arquivos da fase — justificar restos.
- [ ] **Step 3:** Run `npm run test` e `npm run typecheck` — verdes.
- [ ] **Step 4:** Commit `git commit -m "design(fase 3): dashboard de fichas e criacao em glass"`.

---

## Task 12: Fase 4 — Ficha de PJ

**Files (`.module.css` de cada; `.tsx` só se estritamente necessário para o visual):**
- `src/pages/CharacterSheetPage/CharacterSheetPage.module.css` (preservar `.topBarActions` flex-wrap; não reintroduzir `flex-shrink: 0`)
- `src/components/CharacterHeader/CharacterHeader.module.css`
- `src/components/CharacterCombatSummary/CharacterCombatSummary.module.css`
- `src/components/CharacterSheetSummary/CharacterSheetSummary.module.css`
- `src/components/CharacterTableMode/CharacterTableMode.module.css`
- `src/components/AttributesPanel/AttributesPanel.module.css`
- `src/components/SkillsPanel/SkillsPanel.module.css`
- `src/components/SkillPanel/SkillPanel.module.css`
- `src/components/CombatPanel/CombatPanel.module.css`
- `src/components/AttacksPanel/AttacksPanel.module.css`
- `src/components/SpellsPanel/SpellsPanel.module.css`
- `src/components/ResourcesPanel/ResourcesPanel.module.css`
- `src/components/InventoryPanel/InventoryPanel.module.css`
- `src/components/CharacterDetailsPanel/CharacterDetailsPanel.module.css`
- `src/components/ManagedResourceControls/ManagedResourceControls.module.css`
- `src/components/ResourceDots/ResourceDots.module.css`
- `src/components/NumberInput/NumberInput.module.css`
- `src/components/DamagesEditor/DamagesEditor.module.css`
- `src/components/RollResultBlock/RollResultBlock.module.css`
- `src/components/SheetTabs/SheetTabs.module.css`
- `src/components/ShortRestModal/ShortRestModal.module.css`
- `src/components/AvatarCropper/AvatarCropper.module.css`

- [ ] **Step 1:** Aplicar a Regra de transformação CSS. Pontos específicos:
  - `CharacterCombatSummary` / stat cards: `background: var(--item-bg)`, `border: 1px solid var(--panel-border)`, `border-radius: var(--radius-lg)`; label `var(--text-faint)` uppercase; valor `var(--font-display)` `var(--text)`.
  - Grade de atributos: `grid-template-columns: repeat(6, minmax(80px, 1fr))` (≤480px: `repeat(3, 1fr)`).
  - Barra de HP: trilho `var(--track-bg)`; preenchimento troca de `var(--heal-solid)` → `var(--temp-solid)` → `var(--danger-solid)` conforme razão (manter a lógica JS existente; só trocar as cores).
  - Botões Dano/Cura/Temp: `var(--danger-solid)`/`var(--heal-solid)`/`var(--temp-solid)` de fundo, `var(--on-solid)` de texto, `border: none`.
  - `ResourceDots`: dot preenchido `var(--chip-violet-border)`, vazio `var(--chip-bg)`.
  - `SheetTabs`: aba ativa `var(--item-bg)` + texto `var(--text)`; inativa `var(--text-muted)`. Preservar comportamento de teclado (só CSS muda).
  - Modais (`ShortRestModal`, `AvatarCropper`): overlay `oklch(0% 0 0 / 0.5)`, painel `var(--panel-bg)` + `var(--shadow-lg)`.
- [ ] **Step 2:** `grep` hex/rgba — justificar restos.
- [ ] **Step 3:** Run `npm run test` e `npm run typecheck` — verdes. Testes desta área: `AttacksPanel.rows`, `InventoryPanel.rows`, `ResourcesPanel.rows`, `SpellsPanel.*`, `SheetTabs`, `CharacterTableMode.abilities`, `CharacterSheetPage.*`, `acessibilidade` (`.topBarActions`). Todos devem seguir verdes — são de comportamento/estrutura, não de cor.
- [ ] **Step 4:** Commit `git commit -m "design(fase 4): ficha de PJ e paineis em glass"`.

---

## Task 13: Fase 5 — Ficha de Monstro

**Files:**
- `src/pages/MonsterSheetPage/MonsterSheetPage.module.css` (preservar `.topBarActions` flex-wrap)
- `src/components/monster/MonsterHeader/MonsterHeader.module.css`
- `src/components/monster/MonsterCombatSummary/MonsterCombatSummary.module.css`
- `src/components/monster/MonsterStatsPanel/MonsterStatsPanel.module.css`
- `src/components/monster/MonsterTraitsPanel/MonsterTraitsPanel.module.css`
- `src/components/monster/MonsterFeaturesPanel/MonsterFeaturesPanel.module.css`
- `src/components/monster/MonsterActionsPanel/MonsterActionsPanel.module.css` (**preservar** `.cardHeader` grid `minmax(0, 1fr) auto` e `.removeAction` `2.25rem`)
- `src/components/monster/LegendaryActionsPanel/LegendaryActionsPanel.module.css`
- `src/components/monster/MonsterSpellsPanel/MonsterSpellsPanel.module.css`
- `src/components/monster/MonsterTableMode/MonsterTableMode.module.css`
- `src/components/monster/ReorderControls/ReorderControls.module.css`

- [ ] **Step 1:** Aplicar a Regra de transformação CSS. Específicos:
  - Chips de resistência/imunidade/condição: todos usam `var(--chip-bg)`/`var(--chip-border)`; diferenciação por rótulo de grupo (mantém o padrão atual, só troca cor).
  - Grade de deslocamento, ações lendárias (pontos = dots como `ResourceDots`), slots de magia: mesmas cores de dot da fase 4.
  - `MonsterActionsPanel`: **não** mexer nas dimensões de `.cardHeader`/`.removeAction`; só cor/fundo/borda.
- [ ] **Step 2:** `grep` hex/rgba — justificar restos. Rodar especificamente:
  `grep -nE "grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto|width:\s*2\.25rem" src/components/monster/MonsterActionsPanel/MonsterActionsPanel.module.css` → deve continuar batendo.
- [ ] **Step 3:** Run `npm run test` e `npm run typecheck` — verdes (`acessibilidade.test.ts` cobre `MonsterActionsPanel`).
- [ ] **Step 4:** Commit `git commit -m "design(fase 5): ficha de monstro e paineis em glass"`.

---

## Task 14: Fase 6 — Fechamento

**Files:** varredura global; `CLAUDE.md`; `README.md` (se citar tema); `src/styles/theme.css` (remover apelidos órfãos).

- [ ] **Step 1: Varredura global de resíduos**

Run: `grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba\(" src --include="*.module.css"`
Para cada ocorrência: trocar por token ou justificar em comentário (overlays pretos de modal, SVG data-URI de ícone). Objetivo: nenhuma cor quente pergaminho restante.

Run: `grep -rn "Crimson\|parchment-\|--rust\|--bronze\|--pewter\|--ink-soft" src --include="*.module.css"`
Trocar usos remanescentes pelos tokens semânticos novos.

- [ ] **Step 2: Remover apelidos órfãos de `theme.css`**

Para cada apelido (`--parchment-*`, `--ink*`, `--accent-light`, `--rust*`, `--bronze*`, `--pewter*`, `--border`, `--border-light`, `--border-dark`, `--accent-soft`, `--ink-soft`): `grep -rn "var(--<apelido>)" src` — se zero usos fora de `theme.css`, remover a linha. **Manter** `--accent`, `--accent-faint` (usados por `index.css` `:focus-visible` e por regras globais) e qualquer um ainda referenciado.

Run: `npm run test` (o `acessibilidade.test.ts` exige `outline: 2px solid var(--accent)` em `index.css` — `--accent` deve permanecer).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: sem erro. Conferir tamanho do bundle CSS não explodiu.

- [ ] **Step 4: Atualizar `CLAUDE.md`**

- Tabela de stack: "Estilo | CSS Modules + variáveis CSS globais (theme.css) — **tema Glass Morphism com toggle claro/escuro**".
- Seção "Integrações externas / Google Fonts": trocar "Crimson Text" por "Inter".
- Adicionar em "Fluxos principais" um item curto: "Tema claro/escuro: `ThemeContext` grava `data-theme` no `<html>` e persiste em `localStorage['tomo:theme']`; default segue `prefers-color-scheme`."
- Seção "LocalStorage": adicionar `tomo:theme → 'light' | 'dark'`.
- "Observações para futuras sessões": nota de que `design.md` agora documenta o sistema glass (o pergaminho foi substituído nesta branch).

- [ ] **Step 5:** Run `npm run test` + `npm run typecheck` + `npm run build` — todos verdes.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "design(fase 6): varredura final, limpeza de tokens orfaos e doc-sync"
```

- [ ] **Step 7: Loop `accessibility-check`** — invocar a skill `project-loops` com o workflow `accessibility-check` para revisar contraste dos tokens novos (texto/painel nos dois temas), foco visível e navegação por teclado nas telas redesenhadas. Registrar achados; corrigir contraste subindo luminosidade de `--text-faint` no tema claro se falhar AA.

- [ ] **Step 8: Loop `pr-readiness`** — invocar `project-loops` workflow `pr-readiness`: checklist do `CLAUDE.md` item a item, `git status` sem `.env*`, escopo do diff = só apresentação + os 5 arquivos novos (ThemeContext, ThemeToggle x2, 2 testes). **Parar aqui e pedir aprovação humana explícita antes de qualquer push ou abertura de PR.**

---

## Self-Review (feito pelo autor do plano)

**1. Cobertura da spec:**
- Spec §3 (tokens) → Task 1. §4 (index.css) → Task 2. §5 (ThemeContext) → Tasks 3–4. §6 (AppShell/blobs) → Task 5. §7 (Sidebar) → Task 6. §8 (panel.module.css) → Task 7. §1 (design.md reescrita) → Task 8. §9 fases 2–6 → Tasks 10–14. §10 (verificação) → portões nas Tasks 9, 14 + Steps de teste em todas. §11 (riscos) → notas nas Tasks 1 (color-mix), 7/Regra (blur empilhado), 5 (blobs). §2 (restrições de teste) → Global Constraints + Steps específicos nas Tasks 12/13.
- Sem lacuna identificada.

**2. Placeholders:** As Tasks 10–13 usam a "Regra de transformação CSS" em vez de reproduzir 54 arquivos inteiros — é transformação mecânica de arquivos existentes, com regras explícitas e checklist de `grep` por fase, não um "TODO". As novas peças de código (Tasks 1–7) têm o conteúdo completo.

**3. Consistência de tipos:** `useTheme()` retorna `{ mode, toggle, setMode }` — usado assim em `ThemeToggle` (Task 4) e nos testes (Task 3). Chave `localStorage` `'tomo:theme'` consistente entre `index.html` (Task 2), `ThemeContext` (Task 3) e `CLAUDE.md` (Task 14). `ThemeToggle` assinatura `{ className?: string }` — usada em Sidebar (Task 6) e auth (Task 10). Tokens: nomes idênticos entre Task 1 (definição) e Tasks 7/10–13 (consumo).

---

## Execution Handoff

Plano salvo em `docs/superpowers/plans/2026-08-28-glass-morphism-redesign.md`.
