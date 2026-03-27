# Design Tokens — Tomo do Aventureiro

Extraídos de `src/styles/theme.css` e `src/index.css`. Use estes valores como referência absoluta ao criar ou modificar qualquer componente visual.

---

## Paleta de Cores

### Fundos (Pergaminho)
| Token | Valor | Uso |
|-------|-------|-----|
| `--parchment-bg` | `#f0e6c8` | Fundo geral do body |
| `--parchment-light` | `#faf5e8` | Superfícies elevadas, botões em repouso |
| `--parchment-dark` | `#e8d9ad` | Hover de botões, fundos de campos |
| `--parchment-shadow` | `#d4c49a` | Sombras de superfície |

### Texto (Tinta)
| Token | Valor | Uso |
|-------|-------|-----|
| `--ink` | `#1e1208` | Texto principal (quase preto quente) |
| `--ink-muted` | `#5a3e28` | Texto secundário, labels |
| `--ink-faint` | `#8a6e50` | Texto desabilitado, placeholders |

### Destaque (Vinho/Bordô)
| Token | Valor | Uso |
|-------|-------|-----|
| `--accent` | `#7a1e1e` | Cor primária de destaque, links ativos, bordas de foco |
| `--accent-light` | `#a83232` | Hover de links e elementos de destaque |
| `--accent-faint` | `#f0d8d8` | Fundo suave de seleção, badges |

### Bordas
| Token | Valor | Uso |
|-------|-------|-----|
| `--border` | `#b8965a` | Borda padrão (ouro envelhecido) |
| `--border-light` | `#d4b87a` | Separadores sutis |
| `--border-dark` | `#8a6428` | Bordas com mais contraste |

### Inputs
| Token | Valor | Uso |
|-------|-------|-----|
| `--input-bg` | `#fffdf4` | Fundo de campos de texto |
| `--input-border` | `#c4a06a` | Borda de campos em repouso |

> **Foco de input**: borda muda para `--accent` + `box-shadow: 0 0 0 2px rgba(122, 30, 30, 0.12)`

---

## Tipografia

### Fontes
| Token | Família | Uso |
|-------|---------|-----|
| `--font-display` | `'Cinzel', 'Palatino Linotype', Georgia, serif` | Títulos (`h1`–`h6`), cabeçalhos de painel, labels de seção |
| `--font-body` | `'Crimson Text', 'Palatino Linotype', Georgia, serif` | Corpo de texto, inputs, botões, labels |

> Importadas via Google Fonts: `Cinzel` (pesos 400, 600, 700) + `Crimson Text` (regular, semibold, itálico).

### Escala de Tamanhos
| Token | Valor | Equivalente |
|-------|-------|-------------|
| `--text-xs` | `0.75rem` | 12px — micro labels, badges |
| `--text-sm` | `0.875rem` | 14px — textos de suporte, botões |
| `--text-base` | `1rem` | 16px — corpo padrão |
| `--text-lg` | `1.125rem` | 18px — destaque sutil |
| `--text-xl` | `1.25rem` | 20px — subtítulos |
| `--text-2xl` | `1.5rem` | 24px — títulos de seção |
| `--text-3xl` | `1.875rem` | 30px — títulos de página |

---

## Espaçamento

Sistema baseado em múltiplos de `0.25rem`:

| Token | Valor | Uso típico |
|-------|-------|-----------|
| `--space-1` | `0.25rem` | Gap mínimo entre ícone e texto |
| `--space-2` | `0.5rem` | Padding interno de badges, gap em listas densas |
| `--space-3` | `0.75rem` | Padding de células de tabela, gap padrão |
| `--space-4` | `1rem` | Padding de seções internas |
| `--space-5` | `1.25rem` | Espaço entre grupos de campos |
| `--space-6` | `1.5rem` | Margens entre componentes próximos |
| `--space-8` | `2rem` | Padding de painéis, separação de seções |
| `--space-10` | `2.5rem` | Espaço entre blocos maiores |
| `--space-12` | `3rem` | Margens de layout externas |

---

## Arredondamentos (Border Radius)

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-sm` | `2px` | Inputs, botões, elementos pequenos |
| `--radius` | `4px` | Cards, painéis secundários |
| `--radius-lg` | `8px` | Modais, painéis principais |
| `--radius-md` | `12px` | Alias de compatibilidade (equivale ao `--radius-lg` visual) |

> O projeto tem estética **angular-medieval**: evite `border-radius` maiores que `12px`. Nada de `rounded-full` em elementos de conteúdo.

---

## Sombras

| Token | Valor | Uso |
|-------|-------|-----|
| `--shadow-sm` | `0 1px 3px rgba(30,18,8,0.12)` | Elevação mínima |
| `--shadow` | `0 2px 8px rgba(30,18,8,0.18)` | Cards e painéis |
| `--shadow-lg` | `0 4px 16px rgba(30,18,8,0.22)` | Modais, dropdowns, elementos flutuantes |

> A cor da sombra é derivada de `--ink` (`#1e1208`), mantendo o tom quente.

---

## Transições

| Token | Valor | Uso |
|-------|-------|-----|
| `--transition` | `150ms ease` | Hover, foco, mudanças de estado de UI |

---

## Padrão de Painéis

Os painéis usam `src/styles/panel.module.css` como base compartilhada. Todo novo painel deve:
1. Usar `<section className={panelStyles.panel}>` como wrapper
2. Ter `<div className={panelStyles.panelHeader}>` com `h2.panelTitle` e opcionalmente `p.panelSubtitle`
3. Usar `<div className={panelStyles.section}>` para subseções internas
4. Usar `panelStyles.addButton` para botões de adição e `panelStyles.removeButton` para remoção

---

## Padrão de Fieldset

```css
fieldset {
  border: 2px double var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  background: rgba(255, 253, 244, 0.52);
}

legend {
  padding: 0 var(--space-2);
  font-family: var(--font-display);
  color: var(--ink-muted);
}
```

---

## O Que Nunca Fazer

- **Nunca** usar roxo, lilás ou violeta em nenhuma forma.
- **Nunca** usar `border-radius` maior que `12px` em componentes de conteúdo.
- **Nunca** importar novas fontes sem necessidade — as duas fontes do projeto cobrem todos os casos.
- **Nunca** usar sombras coloridas (ex: `box-shadow` em tons de azul ou verde).
