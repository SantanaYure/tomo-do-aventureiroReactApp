# Stack & Melhores Práticas — Tomo do Aventureiro

---

## Tecnologias e Versões

| Categoria | Tecnologia | Versão |
|-----------|-----------|--------|
| Framework UI | React | `^19.2.0` |
| Linguagem | TypeScript | `^5.9.3` (strict mode ativo) |
| Build Tool | Vite | `^7.3.1` |
| Roteamento | React Router DOM | `^7.13.1` |
| Backend / Auth / DB | Firebase | `^12.10.0` |
| Estilização | CSS Modules (nativo) | — |
| Upload de imagem | react-easy-crop | `^5.5.6` |
| Runtime | Node.js (ESM) | — |

### Dev Dependencies
| Ferramenta | Versão |
|-----------|--------|
| ESLint | `^9.39.1` |
| eslint-plugin-react-hooks | `^7.0.1` |
| eslint-plugin-react-refresh | `^0.4.24` |
| @vitejs/plugin-react | `^5.1.1` |
| @types/react | `^19.2.14` |
| @types/react-dom | `^19.2.3` |

> **Sem Tailwind.** O projeto usa CSS Modules puros com variáveis CSS globais definidas em `src/styles/theme.css`.

---

## Arquitetura de Pastas

```
src/
├── components/         # Componentes reutilizáveis (um por pasta, com .tsx + .module.css)
│   └── monster/        # Subpasta para componentes exclusivos de monstros
├── context/            # React Context (ex: AuthContext)
├── hooks/              # Custom hooks (prefixo `use`)
├── pages/              # Páginas (uma por pasta, com .tsx + .module.css)
├── services/           # Integrações externas (Firebase)
├── store/              # Estado global das fichas (Zustand-like, com funções puras)
├── styles/             # Tokens globais: theme.css, panel.module.css
├── types/              # Tipos TypeScript organizados por domínio
│   └── system/dnd/     # Tipos específicos do sistema D&D 5e
└── utils/              # Funções utilitárias puras
```

---

## Melhores Práticas — Baseadas no Código Atual

### 1. Componentes: Sempre Funcionais com Arrow Function ou Named Export

```tsx
// CORRETO — Named export + function declaration (padrão do projeto)
export function AttributesPanel({ character, isEditMode, onChangeCharacter }: Props) {
  return <section>...</section>
}

// TAMBÉM ACEITO — Arrow function como named export
export const AttributesPanel = ({ ... }: Props) => { ... }

// EVITAR — default export em componentes (só App.tsx usa default export)
export default function AttributesPanel() { ... }
```

### 2. Props: Sempre Tipadas com Interface Local

```tsx
// Declare a interface imediatamente antes do componente que a usa
interface AttributesPanelProps {
  character: Character
  isEditMode: boolean
  onChangeCharacter: (updated: Character) => void
}

export function AttributesPanel({ character, isEditMode, onChangeCharacter }: AttributesPanelProps) {
  ...
}
```

### 3. Handlers: Funções Nomeadas Dentro do Componente

```tsx
// CORRETO — funções nomeadas, legíveis
function handleSavingThrowKeyDown(event: KeyboardEvent<HTMLSpanElement>, key: keyof SavingThrows) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  cycleSavingThrowProf(key)
}

// EVITAR — arrow functions anônimas longas direto no JSX
onClick={(e) => { /* lógica complexa aqui */ }}
```

### 4. Estado e Imutabilidade

```tsx
// CORRETO — sempre crie novo array/objeto, nunca mute diretamente
function setAttrValue(index: number, value: number) {
  const updated = character.attributes.map((attr, i) =>
    i === index ? { ...attr, value: clampAttributeValue(value) } : attr
  )
  onChangeCharacter({ ...character, attributes: updated })
}
```

### 5. CSS Modules — Um Arquivo por Componente

```tsx
// Cada componente importa seus próprios estilos
import panelStyles from '../../styles/panel.module.css'  // estilos compartilhados
import styles from './AttributesPanel.module.css'         // estilos próprios

// Combinação de classes
<div className={`${styles.local} ${panelStyles.shared}`}>
```

### 6. Constantes de Configuração: Fora do Componente

```tsx
// CORRETO — constantes e mapas declarados fora do componente (evita recriação a cada render)
const ATTRIBUTE_ABBREVIATION: Record<Attribute['name'], string> = {
  Força: 'FOR',
  Destreza: 'DES',
  // ...
}

export function AttributesPanel(...) { ... }
```

### 7. Acessibilidade: ARIA e Teclado

```tsx
// Elementos interativos não-nativos sempre com role, tabIndex e onKeyDown
<span
  role="button"
  tabIndex={0}
  aria-pressed={isProficient}
  aria-label={`Proficiência em ${attribute.name}`}
  onClick={() => cycleSavingThrowProf(saveKey)}
  onKeyDown={(e) => handleKeyDown(e, saveKey)}
>
```

### 8. TypeScript: Strict Mode, Sem `any`

- `tsconfig.json` tem `"strict": true` — respeite.
- Use `type` para uniões simples e `interface` para objetos com props.
- Prefira `unknown` a `any` quando o tipo não for conhecido.
- Use type guards (`instanceof`, `typeof`, `in`) em vez de cast forçado.

```tsx
// CORRETO — type guard
function wrapError(error: unknown, fallback: string): Error {
  return new Error(getFirebaseErrorMessage(error) || fallback)
}
```

### 9. Firebase / Firestore

- A autenticação está centralizada em `src/context/AuthContext.tsx`.
- Nunca acesse `firebase/auth` diretamente de componentes — use o hook `useAuth()`.
- Operações de banco ficam em `src/hooks/` (ex: `useCharacterSheet.ts`).
- Serviços de auth brutos ficam em `src/services/authService.ts`.

### 10. Roteamento

- Rotas públicas: `/login`, `/cadastro`, `/verificar-email`, `/privacidade`.
- Rotas protegidas: tudo dentro do `<ProtectedRoute />` — verificam Firebase Auth + email verificado.
- Layout padrão: `<AppLayout>` com `<Sidebar>` + `<main>` via `<Outlet>`.
- Navegação programática: use `useNavigate()` do React Router DOM.

---

## Padrões de Nomenclatura

| Elemento | Convenção | Exemplo |
|---------|-----------|---------|
| Componentes | PascalCase | `CharacterHeader` |
| Hooks | camelCase com prefixo `use` | `useCharacterSheet` |
| Tipos/Interfaces | PascalCase | `CharacterSheet`, `SavingThrows` |
| Constantes de módulo | UPPER_SNAKE_CASE | `ATTRIBUTE_DISPLAY_ORDER` |
| Variáveis e funções | camelCase | `calcModifier`, `profBonus` |
| Arquivos de componente | PascalCase | `AttributesPanel.tsx` |
| Arquivos de estilo | PascalCase + `.module.css` | `AttributesPanel.module.css` |
| Arquivos de hook/util | camelCase | `useCharacterSheet.ts` |

---

## O Que Não Adicionar

- **Sem Tailwind** — o projeto tem seu próprio sistema de tokens, não adicione Tailwind.
- **Sem Redux / Zustand** — o estado é gerenciado via props + Context + hooks customizados.
- **Sem styled-components / emotion** — use CSS Modules.
- **Sem bibliotecas de UI** (MUI, Ant Design, Chakra) — os componentes são 100% customizados.
- **Sem class components** — apenas componentes funcionais.
