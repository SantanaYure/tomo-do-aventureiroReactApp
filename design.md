# Design System — Tomo do Aventureiro

## Filosofia visual

A interface adota **Glass Morphism + Flat**: painéis semitransparentes com desfoque de fundo (`backdrop-filter`), sobre um fundo escuro ou claro quase sem saturação, com 2–3 "blobs" desfocados dando profundidade sem cor viva. Sem molduras decorativas, sem gradientes ornamentais, sem sombras pesadas.

**Princípios:**
- Paleta de destaque **monocromática** em torno de um violeta acinzentado neutro (hue ~300, chroma baixo ~0.03–0.06). Sem verde, azul saturado ou vermelho puro.
- HP/dano/cura/temp: família **sépia/dourada** (hue ~75) variando só a luminosidade — dano é o tom mais escuro, cura o médio, temp o mais claro. Nada de vermelho/verde de "barra de HP".
- Diferenciação semântica por **rótulo e tipografia** quando possível, não por cor de alerta.
- Elegância por contenção: menos cor, menos sombra, mais forma e espaço.
- **Botões**: sempre quadrados de cantos levemente arredondados (`--radius-btn: 6px`) — nunca pílula/`999px`. Botões sólidos (HP, ações destrutivas) têm acabamento "espelhado": reflexo no topo + sombra sutil na base (`--btn-gloss`), realce de borda (`--btn-edge`) e brilho interno (`--btn-sheen`). Hover é suave: leve ganho de luminosidade da cor (`--*-hover`) e/ou intensificação do brilho, nunca salto de opacidade nem troca para cor neutra.
- **Três temas** alternáveis pelo mesmo `ThemeToggle` (ciclo): claro (glass), escuro (glass) e **pergaminho** (a paleta sépia/tinta original, sem glass, corpo em Crimson Text).

---

## Tokens — `src/styles/theme.css`

`theme.css` é a única fonte de verdade. `:root` define o **tema claro**; `:root[data-theme="dark"]` e `:root[data-theme="parchment"]` sobrescrevem para o **escuro** e o **pergaminho**. Um bloco `@media (prefers-color-scheme: dark)` sobre `:root:not([data-theme])` espelha o escuro para o estado "system" antes do JS montar. O `ThemeContext` (`src/context/ThemeContext.tsx`) grava `data-theme` no `<html>` e persiste em `localStorage['tomo:theme']` (`'light' | 'dark' | 'parchment'`); `toggle()` cicla claro → escuro → pergaminho → claro; o default (sem valor salvo) segue `prefers-color-scheme` (nunca cai em pergaminho automaticamente). Um script inline em `index.html` aplica `data-theme` no primeiro paint (anti-flash).

O **modo pergaminho** reusa os mesmos tokens semânticos, redefinindo-os com a paleta legada (`#1e1208` tinta, `#7a1e1e` sépia de destaque, cremes `#f5ead0`…), trocando `--font-body` para `'Crimson Text'`, zerando `--blur-panel` e os blobs, e reduzindo os raios de painel. Não restaura as molduras decorativas/duplas do tema original — é a paleta pergaminho sobre a estrutura flat atual.

### Cores (OKLCH)

| Token | Papel | Claro | Escuro |
|---|---|---|---|
| `--bg` | Fundo da página (gradiente) | `linear-gradient(160deg, oklch(97% .004 280), oklch(94% .006 280))` | `linear-gradient(160deg, oklch(15% .015 280), oklch(11% .01 280))` |
| `--blob-1` | Blob violeta | `oklch(80% .04 300 / .22)` | `oklch(40% .05 300 / .22)` |
| `--blob-2` | Blob neutro frio | `oklch(82% .03 240 / .16)` | `oklch(40% .04 240 / .16)` |
| `--blob-3` | Blob neutro quente | `oklch(84% .02 280 / .14)` | `oklch(42% .03 280 / .14)` |
| `--text` | Texto principal | `oklch(24% .01 280)` | `oklch(96% .005 280)` |
| `--text-muted` | Texto secundário | `oklch(44% .01 280)` | `oklch(76% .01 280)` |
| `--text-faint` | Rótulos apagados | `oklch(50% .01 280)` | `oklch(60% .01 280)` |
| `--panel-bg` | Painel de 1º nível | `oklch(100% 0 0 / .55)` | `oklch(28% .01 280 / .32)` |
| `--panel-border` | Borda de painel/base | `oklch(20% .01 280 / .1)` | `oklch(90% .01 280 / .1)` |
| `--item-bg` | Card/linha interna | `oklch(100% 0 0 / .48)` | `oklch(33% .01 280 / .26)` |
| `--avatar-bg` | Placeholder de avatar | `oklch(100% 0 0 / .6)` | `oklch(33% .01 280 / .4)` |
| `--chip-bg` | Chip neutro | `oklch(100% 0 0 / .5)` | `oklch(38% .01 280 / .28)` |
| `--chip-border` | Borda de chip | `oklch(20% .01 280 / .09)` | `oklch(90% .01 280 / .09)` |
| `--chip-violet-bg` | Chip/ação de destaque | `oklch(90% .03 300 / .6)` | `oklch(38% .05 300 / .3)` |
| `--chip-violet-border` | Borda do destaque | `oklch(55% .05 300 / .35)` | `oklch(70% .06 300 / .4)` |
| `--chip-violet-text` | Texto do destaque, links, foco, sectionTitle | `oklch(38% .05 300)` | `oklch(84% .03 300)` |
| `--input-bg` | Fundo de campo | `oklch(100% 0 0 / .7)` | `oklch(36% .01 280 / .4)` |
| `--track-bg` | Trilho de barra de progresso | `oklch(90% .005 280 / .6)` | `oklch(22% .01 280 / .5)` |
| `--danger-solid` | Botão/estado Dano | `oklch(38% .07 75)` | igual |
| `--heal-solid` | Botão/estado Cura | `oklch(56% .07 75)` | igual |
| `--temp-solid` | Botão/estado Temp | `oklch(70% .06 75)` | igual |
| `--on-solid` | Texto sobre os sólidos sépia | `oklch(97% .015 75)` | igual |

### Blur

| Token | Valor | Uso |
|---|---|---|
| `--blur-panel` | `blur(20px)` | `backdrop-filter` de painel de 1º nível |
| `--blur-blob` | `90px` | `filter: blur()` dos blobs de fundo |

### Apelidos de compatibilidade

Os tokens do tema anterior ("pergaminho") continuam definidos como apelidos, apontando para os novos, para não quebrar módulos ainda não migrados:

`--ink` → `--text` · `--ink-muted` → `--text-muted` · `--ink-faint`/`--ink-soft` → `--text-faint` · `--accent`/`--accent-light` → `--chip-violet-text` · `--accent-faint`/`--accent-soft` → `--chip-violet-bg` · `--parchment-light`/`--parchment` → `--panel-bg` · `--parchment-dark`/`--parchment-shadow` → `--chip-bg` · `--border`/`--border-light`/`--border-dark`/`--input-border` → `--panel-border` · `--rust`/`--bronze`/`--pewter` → `--danger-solid`/`--heal-solid`/`--temp-solid`.

> Os apelidos são temporários. Cada módulo tocado deve migrar para o token semântico correto. `--accent` e `--accent-faint` são exceção: `index.css` os usa na regra global de `:focus-visible` e devem permanecer.

---

## Tipografia

| Token | Valor | Uso |
|---|---|---|
| `--font-display` | `'Cinzel', 'Palatino Linotype', Georgia, serif` | Títulos, rótulos de seção, valores numéricos |
| `--font-body` | `'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` | Corpo, descrições, botões, chips |
| `--font-serif` | `'Crimson Text', 'Palatino Linotype', Georgia, serif` | Serifa "de tomo": corpo do modo pergaminho (onde `--font-body` = `var(--font-serif)`) e o `ThemeToggle` nos três temas |

Carregadas via `@import` em `theme.css`: **Cinzel** 600/700/800, **Inter** 400/500/600/700, **Crimson Text** 400/600 (+itálico).

### Ícones inline

Sempre monocromáticos e herdando `currentColor` — nunca emoji coloridos (puxam uma fonte à parte e destoam). Duas fontes:

- **Glifos Unicode** para marcadores curtos que já convivem bem com a fonte da UI. Ex.: Sidebar `⌂` `⚔` `⇥`; `ThemeToggle` `☼` (claro) `☾` (escuro) `❧` (pergaminho), este último em `var(--font-serif)` nos três temas.
- **`lucide-react`** para ícones de conteúdo (tipos de ficha, estados vazios). SVG de traço, `strokeWidth` 1.5–1.75, `size` casado ao contexto. Ex.: `Home` usa `Swords` (PJ), `Skull` (monstro), `Users` (NPC), `ScrollText` (vazio). O ícone fica dentro de um selo de vidro (`--panel-bg` + `--blur-panel` + `--panel-border`, `--radius-md`) com a cor em `--text-muted`.

### Escala

`--text-xs 0.75rem` · `--text-sm 0.875rem` · `--text-base 1rem` · `--text-lg 1.125rem` · `--text-xl 1.25rem` · `--text-2xl 1.5rem` · `--text-3xl 1.875rem`.

---

## Espaçamento

`--space-1 .25rem` · `--space-2 .5rem` · `--space-3 .75rem` · `--space-4 1rem` · `--space-5 1.25rem` · `--space-6 1.5rem` · `--space-8 2rem` · `--space-10 2.5rem` · `--space-12 3rem`.

---

## Raios

| Token | Valor | Uso |
|---|---|---|
| `--radius-btn` | `6px` | **Todos os botões** (quadrados, cantos levemente arredondados) |
| `--radius-sm` / `--radius` | `8px` | Chips, badges |
| `--radius-md` | `12px` | Campos de formulário (input, select, textarea) |
| `--radius-lg` | `16px` | Cards internos, listItem, tableWrap |
| `--radius-xl` | `18px` | Painéis principais |

No modo pergaminho os raios de painel encolhem (`--radius-lg: 10px`, `--radius-xl: 12px`, `--radius-sm: 5px`); `--radius-btn` permanece 6px.

---

## Sombras

`--shadow-sm: none` · `--shadow: 0 1px 2px oklch(0% 0 0 / .04)` (card, uso raro) · `--shadow-lg: 0 4px 24px oklch(0% 0 0 / .12)` (modais, dropdowns). Aliases: `--shadow-soft` → `--shadow-lg`, `--shadow-card` → `--shadow`. Painéis glass **não** levam sombra.

---

## Transições

`--transition: 150ms ease`. Usar só em `background`, `color`, `border-color`, `opacity`. **Nunca** `transition: all` (anima layout, causa reflow — barrado por `src/test/motion.test.ts`). O bloco `@media (prefers-reduced-motion: reduce)` em `theme.css` zera o token e neutraliza animações/rolagem — não removê-lo.

---

## Padrões de componente

### Painel glass (1º nível)

```css
background: var(--panel-bg);
backdrop-filter: var(--blur-panel);
-webkit-backdrop-filter: var(--blur-panel);
border: 1px solid var(--panel-border);
border-radius: var(--radius-xl);
```

**`backdrop-filter` só no painel de 1º nível.** Cards internos empilhados usam `background: var(--item-bg)` sem blur próprio — blur aninhado fica leitoso.

### Card interno

```css
background: var(--item-bg);
border: 1px solid var(--panel-border);
border-radius: var(--radius-lg);
```

### Chip

```css
background: var(--chip-bg);
border: 1px solid var(--chip-border);
border-radius: var(--radius-sm);
font-family: var(--font-body);
font-size: var(--text-xs);
color: var(--text-muted);
padding: 3px var(--space-2);
```

Variante de destaque (tipo de ficha, item sintonizado, imunidade): `--chip-violet-bg` / `--chip-violet-border` / `--chip-violet-text`.

### Section title

Só texto — sem caixa.

```css
font-family: var(--font-display);
font-size: var(--text-xs);
font-weight: 700;
letter-spacing: 0.08em;
text-transform: uppercase;
color: var(--chip-violet-text);
```

### Botões de HP (Dano / Cura / Temp)

Sólidos sépia com acabamento espelhado. `--radius-btn`, borda de realce, reflexo e brilho:

```css
.hpBtn {
  border: 1px solid var(--btn-edge);
  border-radius: var(--radius-btn);
  color: var(--on-solid);
  background-image: var(--btn-gloss);      /* reflexo topo + sombra base */
  box-shadow: var(--btn-sheen);            /* brilho interno superior */
  transition: background-color var(--transition), box-shadow var(--transition);
}
.hpBtn:hover:not(:disabled) { box-shadow: var(--btn-sheen-hover); }

.btnDamage { background-color: var(--danger-solid); }
.btnDamage:hover:not(:disabled) { background-color: var(--danger-hover); }
.btnHeal   { background-color: var(--heal-solid); }
.btnHeal:hover:not(:disabled)   { background-color: var(--heal-hover); }
.btnTemp   { background-color: var(--temp-solid); color: var(--on-temp); }
.btnTemp:hover:not(:disabled)   { background-color: var(--temp-hover); }
```

`--on-temp` (sépia escuro) no botão Temp para contraste AA sobre o tom claro.
O mesmo acabamento vale para os botões destrutivos (`.confirmDeleteBtn`, `.confirmDangerBtn`, `.dangerBtn`).

**Tema escuro:** os sólidos sépia destoam da paleta fria do glass escuro. Sob `:root[data-theme='dark']` os botões de HP (`.btnDamage/.btnHeal/.btnTemp` das duas `CombatSummary`) perdem o preenchimento e seguem a lógica dos demais botões neutros do tema — `border-color: var(--panel-border)`, `background-color: var(--item-bg)`, `color: var(--text-muted)`, sem `--btn-gloss` nem `--btn-sheen`; hover para `var(--chip-bg)` / `var(--text)`. A distinção Dano/Cura/Temp passa a ser só o rótulo. Claro e pergaminho mantêm os sólidos. A barra de HP continua usando `--*-solid` em todos os temas.

### Barra de HP

Trilho `var(--track-bg)`; preenchimento troca de tom conforme a razão atual/máx: `> 50%` → `--heal-solid`; `> 25%` → `--temp-solid`; `<= 25%` → `--danger-solid`. A lógica de razão é do componente; o CSS só fornece as cores.

### Pontos de uso (recursos, ações lendárias, espaços de magia)

Dot preenchido: `var(--chip-violet-border)`. Dot vazio: `var(--chip-bg)`. Sempre com botão "Recarregar" fora do corpo colapsável.

### Abas de ficha (`SheetTabs`)

Aba inativa: `color: var(--text-muted)`, fundo transparente. Hover e aba ativa: `background: var(--item-bg)` + `color: var(--text)`; a ativa ainda em `font-weight: 600`. **Sem** borda inferior colorida nem realce — o estado é só peso + preenchimento. Foco de teclado: `outline: 2px solid var(--accent); outline-offset: -2px` (só `:focus-visible`).

### Ritmo vertical da página de ficha

Os blocos de topo (`CharacterHeader`, `.tabBarShell`, `.combatSummary`, `.tabContent`) usam o mesmo gap responsivo: `--space-4` → `--space-5` (≥480) → `--space-6` (≥600) → `--space-8` (≥780). O `.combatSummary` embrulha o resumo de combate persistente para dar esse mesmo respiro entre os painéis internos e o conteúdo da aba.

### Grades

- Atributos: `grid-template-columns: repeat(6, minmax(80px, 1fr))`; `<480px`: `repeat(3, 1fr)`.
- Cards de ficha (dashboard): `repeat(auto-fill, minmax(260px, 1fr))`.
- Faixa de combate: `repeat(auto-fit, minmax(160px, 1fr))`.

### Blobs de fundo

3 `<span>` em `.blobs` (`position: fixed; inset: 0; pointer-events: none; z-index: 0`), cada um `border-radius: 50%; filter: blur(var(--blur-blob))`, cor `var(--blob-1/2/3)`, 460–520px, posicionados nos cantos. O `AppLayout` os monta para páginas autenticadas; telas de auth replicam no próprio CSS.

---

## Cores proibidas

Nunca hardcodar cor em módulo CSS. Nunca usar hex/rgb literais de cor de marca ou alerta (`#7a1e1e`, `green`, `blue`, `red`, cremes de pergaminho `#f0e6c8` etc.). Exceção tolerada: `oklch(0% 0 0 / .5)` para overlay de modal e cores dentro de `data:` URI de ícone SVG.

---

## Validação de coerência visual

Antes de aprovar uma mudança:

1. A cor vem de um token de `theme.css` (ou deriva de um via `color-mix`)?
2. Painel de 1º nível: tem `backdrop-filter: var(--blur-panel)` e **um só** nível de blur?
3. Diferenciação semântica está em rótulo/tipografia, não só em cor?
4. Foco de teclado: `outline: 2px solid var(--accent)` (regra global em `index.css`) — não sobrescrito, nunca `outline: none`?
5. Transições: só propriedades de pintura, nunca `transition: all`?
6. Funciona nos dois temas (claro e escuro)? Contraste de texto AA nos dois?

---

## Estrutura de arquivos de estilo

```
src/styles/
  theme.css          → tokens globais (cores, tipografia, espaçamento, raios, blur)
  panel.module.css   → classes compartilhadas entre painéis

src/context/
  ThemeContext.tsx   → ThemeProvider + useTheme(); data-theme + localStorage

src/components/<Nome>/
  <Nome>.module.css  → estilos locais (CSS Modules)
```

**Regras:**
- Sem Tailwind, styled-components ou qualquer lib de estilo.
- Nunca hardcodar valor que exista como token.
- Novo valor funcional repetido em >1 lugar vira token em `theme.css`.
- `composes:` permitido para variantes de botão no mesmo módulo.
