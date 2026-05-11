# Design System — Tomo do Aventureiro

## Filosofia visual

A interface imita a estética de um **tomo medieval iluminado**: pergaminho envelhecido, tinta sépia, metais gastos por uso. Toda decisão de cor parte dessa metáfora — não do design de software moderno.

**Princípios:**
- Paleta exclusivamente de tons quentes e terrosos. Sem verde vivo, azul saturado, roxo ou vermelho puro.
- Diferenciação semântica feita por **rótulos e tipografia**, não por cor de alerta moderna.
- Variações de peso, estilo e tom dentro da mesma família para distinguir categorias (não cores diferentes).
- Elegância por contenção: menos cor, mais forma.

---

## Tipografia

| Token | Valor | Uso |
|---|---|---|
| `--font-display` | `'Cinzel', 'Palatino Linotype', Georgia, serif` | Títulos, rótulos, valores numéricos, botões |
| `--font-body` | `'Crimson Text', 'Palatino Linotype', Georgia, serif` | Descrições, corpo de texto, chips de conteúdo |

Carregadas via Google Fonts (`@import` em `theme.css`):
- **Cinzel** pesos: 400, 600, 700
- **Crimson Text** pesos: 400 (normal e itálico), 600

### Escala de tamanhos

| Token | Valor | Uso típico |
|---|---|---|
| `--text-xs` | `0.75rem` | Rótulos de chip, labels de campo |
| `--text-sm` | `0.875rem` | Texto secundário, botões, meta de item |
| `--text-base` | `1rem` | Texto padrão |
| `--text-lg` | `1.125rem` | Valores de atributo |
| `--text-xl` | `1.25rem` | Valores principais (HP, CA) |
| `--text-2xl` | `1.5rem` | Títulos de seção |
| `--text-3xl` | `1.875rem` | Títulos de página |

Tamanhos não padronizados (hardcoded) usados pontualmente:
- `0.65rem` — micro-rótulos (statLabel, coinLabel, resetBadge)
- `0.62rem` — atributo curto (abilityShort, slotLevel)

---

## Paleta de cores

### Fundos — família pergaminho

| Token | Valor hex | Uso |
|---|---|---|
| `--parchment-bg` | `#f0e6c8` | Fundo geral da página |
| `--parchment-light` | `#faf5e8` | Campos de input, fundos de card |
| `--parchment-dark` | `#e8d9ad` | Fundo de chips, badges, botões secundários |
| `--parchment-shadow` | `#d4c49a` | Chips com ênfase (imune, condição) |

### Texto — família tinta

| Token | Valor hex | Uso |
|---|---|---|
| `--ink` | `#1e1208` | Texto principal, valores |
| `--ink-muted` | `#5a3e28` | Texto secundário, rótulos de grupo |
| `--ink-faint` | `#8a6e50` | Labels apagados, ícones, micro-rótulos |

Aliases de compatibilidade:
- `--ink-soft` → `var(--ink-faint)`

### Destaque — vermelho sépia (accent)

| Token | Valor hex | Uso |
|---|---|---|
| `--accent` | `#7a1e1e` | Links ativos, bordas de foco, sectionTitle |
| `--accent-light` | `#a83232` | statSub, variante mais clara |
| `--accent-faint` | `#f0d8d8` | Fundo de sectionTitle, seleção de texto |

Aliases de compatibilidade:
- `--accent-soft` → `var(--accent-faint)`

### Bordas

| Token | Valor hex | Uso |
|---|---|---|
| `--border` | `#b8965a` | Bordas de input, fieldset |
| `--border-light` | `#d4b87a` | Bordas de card, chip |
| `--border-dark` | `#8a6428` | Bordas de botão de ação |

### Input

| Token | Uso |
|---|---|
| `--input-bg: #fffdf4` | Fundo de campos de texto |
| `--input-border: #c4a06a` | Borda de campos de texto |

### Acento tonal funcional — metais envelhecidos

Usado exclusivamente para botões de ação com semântica de **perda / ganho / neutro**. Todos os tons derivam de metais e pigmentos antigos — sem cores modernas de alerta.

| Token | Valor | Metáfora | Ação |
|---|---|---|---|
| `--rust` | `#7a3018` | Ferrugem / cobre escuro | Dano (perda de HP) |
| `--rust-faint` | `rgba(122, 48, 24, 0.09)` | — | Fundo do botão Dano |
| `--bronze` | `#6e5010` | Bronze / dourado gasto | Cura (ganho de HP) |
| `--bronze-faint` | `rgba(110, 80, 16, 0.09)` | — | Fundo do botão Cura |
| `--pewter` | `#625a4a` | Chumbo sépia / ardósia quente | HP Temporário (neutro/defensivo) |
| `--pewter-faint` | `rgba(98, 90, 74, 0.08)` | — | Fundo do botão Temp |

**Regra:** A diferenciação entre Dano/Cura/Temp é de tom dentro da mesma família terrosa — não de cores opostas no espectro. Todos os três botões pertencem à mesma paleta.

---

## Espaçamento

| Token | Valor |
|---|---|
| `--space-1` | `0.25rem` |
| `--space-2` | `0.5rem` |
| `--space-3` | `0.75rem` |
| `--space-4` | `1rem` |
| `--space-5` | `1.25rem` |
| `--space-6` | `1.5rem` |
| `--space-8` | `2rem` |
| `--space-10` | `2.5rem` |
| `--space-12` | `3rem` |

---

## Bordas e raios

| Token | Valor | Uso |
|---|---|---|
| `--radius-sm` | `5px` | Chips, badges, inputs, botões |
| `--radius` | `4px` | Cards de stat, slotChip |
| `--radius-lg` | `8px` | — |
| `--radius-md` | `12px` | Fieldsets (alias) |

---

## Sombras

| Token | Valor | Uso |
|---|---|---|
| `--shadow-sm` | `0 1px 3px rgba(30,18,8,0.12)` | Elevação mínima |
| `--shadow` | `0 2px 8px rgba(30,18,8,0.18)` | Cards, dropdowns |
| `--shadow-lg` | `0 4px 16px rgba(30,18,8,0.22)` | Modais, painéis flutuantes |

Aliases de compatibilidade:
- `--shadow-soft` → `var(--shadow-lg)`
- `--shadow-card` → `var(--shadow)`

---

## Transições

| Token | Valor |
|---|---|
| `--transition` | `150ms ease` |

Usar apenas em propriedades interativas: `background`, `color`, `border-color`, `opacity`.

---

## Padrões de componente

### Botões de HP (Dano / Cura / Temp)

```css
/* Base compartilhada */
.hpBtn {
  padding: var(--space-1) var(--space-3);
  font-family: var(--font-display);
  font-size: var(--text-sm);
  letter-spacing: 0.03em;
  border: 1px solid var(--border-dark);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition);
}

/* Variantes por semântica */
.btnDamage { composes: hpBtn; background: var(--rust-faint);   color: var(--rust);   border-color: rgba(122, 48, 24, 0.28); }
.btnDamage:hover { background: rgba(122, 48, 24, 0.16); }

.btnHeal   { composes: hpBtn; background: var(--bronze-faint); color: var(--bronze); border-color: rgba(110, 80, 16, 0.28); }
.btnHeal:hover { background: rgba(110, 80, 16, 0.16); }

.btnTemp   { composes: hpBtn; background: var(--pewter-faint); color: var(--pewter); border-color: rgba(98, 90, 74, 0.25); }
.btnTemp:hover { background: rgba(98, 90, 74, 0.15); }
```

### Cards de stat (CA, HP, Iniciativa…)

```css
.statCard {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: var(--space-2) var(--space-1);
  background: rgba(255, 252, 240, 0.7);
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  text-align: center;
  min-width: 0;
}
```

Hierarquia interna:
- `.statLabel` — `font-display`, `0.65rem`, `ink-faint`, uppercase, letter-spacing
- `.statValue` — `font-display`, `text-xl`, `ink`, `line-height: 1`
- `.statMax` — `text-sm`, `ink-muted`, peso 400
- `.statSub` — `text-xs`, `accent-light`, `font-body`

### Cards colapsáveis (recursos, ataques, itens de inventário)

Padrão para qualquer item com conteúdo expandível:

```
.itemCard (container com border)
  ├── .itemToggle (button) ou .itemRow (div, para itens sem corpo)
  │     ├── .itemTitle
  │     ├── .itemMeta (chips de meta inline)
  │     └── .collapseIcon (▸ / ▾)
  └── .itemBody (conteúdo colapsável)
        ├── .description
        └── .metaRow > .metaChip[]
```

**Regra de colapso:** o ícone de toggle e o comportamento expansível só aparecem quando o item tem conteúdo no corpo. Itens sem corpo usam `.itemRow` (não clicável).

**Regra de ManagedResourceControls:** sempre fora do corpo colapsável — o usuário precisa gerenciar usos sem precisar expandir o card.

### Chips

Chips são rótulos de metadata compactos. Seguem a regra de **diferenciação por tom/peso/estilo, não por cor**.

```css
/* Base */
.chip {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  color: var(--ink-muted);
  background: var(--parchment-dark);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  padding: 2px var(--space-2);
}

/* Variantes semânticas — apenas tom e peso */
.chipResist { composes: chip; }                                            /* Normal */
.chipImmune { composes: chip; background: var(--parchment-shadow); font-weight: 600; }  /* Negrito */
.chipCondIm { composes: chip; background: var(--parchment-shadow); font-style: italic; } /* Itálico */
```

O contexto semântico (Resistência / Imunidade / Condição) é dado pelo **rótulo de grupo acima** (`chipGroupLabel`), não pela cor do chip.

### Section Title (badge de seção)

```css
.sectionTitle {
  font-family: var(--font-display);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
  padding: 2px var(--space-2);
  border: 1px solid var(--accent-faint);
  border-radius: var(--radius-sm);
  background: var(--accent-faint);
  white-space: nowrap;
  align-self: flex-start;
}
```

### Grids responsivos

**Stats grid** (painéis de combate):
```css
grid-template-columns: repeat(auto-fill, minmax(5.5rem, 1fr));
/* ≥480px: minmax(6rem, 1fr) */
/* HP card: grid-column: span 2 → span 1 em ≥480px */
```

**Atributos (6 colunas)**:
```css
grid-template-columns: repeat(6, 1fr);
/* <480px: repeat(3, 1fr) */
```

---

## Cores proibidas

Nunca usar em nenhum elemento de UI:

| Cor | Por quê |
|---|---|
| Verde vivo (`#00ff00`, `green`, `#1a6b2e`) | Fora da paleta; lembra alertas de software |
| Azul saturado (`blue`, `#0000ff`, `#1a3680`) | Fora da paleta; contraste cultural errado |
| Roxo / lilás (`purple`, `#800080`, `#5b1a80`) | Fora da paleta |
| Vermelho puro (`red`, `#ff0000`) | Fora da paleta; muito agressivo |
| Qualquer saturação > ~50% HSL | Quebra a coerência do tema envelhecido |

---

## Validação de coerência visual

Antes de aprovar uma mudança visual, verificar:

1. **Pertence à paleta?** A cor existe em `theme.css` ou deriva diretamente de um token?
2. **Se for nova cor funcional**, existe justificativa de metáfora (metal, pigmento, papel)?
3. **Diferenciação semântica** está em rótulo/tipografia e não só em cor?
4. **Hover state** usa a versão ligeiramente mais escura do mesmo tom (sem mudar de família)?
5. **Focus visible** usa `outline: 2px solid var(--accent)` (sem cor diferente)?
6. **Transições** usam `var(--transition)` (150ms ease)?

---

## Estrutura de arquivos de estilo

```
src/styles/
  theme.css          → tokens globais (única fonte de verdade de cores, tipografia, espaçamento)
  panel.module.css   → estilos compartilhados entre painéis

src/components/<Nome>/
  <Nome>.module.css  → estilos locais do componente (CSS Modules)
```

**Regras:**
- Nunca usar Tailwind, styled-components ou qualquer biblioteca de estilo.
- Nunca hardcodar valores que existem como token (cores, espaçamentos, raios, sombras).
- Adicionar novos tokens em `theme.css` quando um valor funcional se repete em mais de um lugar.
- `composes:` é permitido e recomendado para variantes de botão dentro do mesmo módulo.
