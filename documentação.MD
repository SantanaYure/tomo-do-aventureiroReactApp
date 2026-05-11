# Documentação Completa do Sistema

> **⚠️ DOCUMENTO LEGADO — NÃO USAR COMO REFERÊNCIA DE ARQUITETURA**
>
> Este arquivo descreve uma versão anterior do sistema que usava `localStorage` como persistência e não tinha autenticação. A arquitetura atual é fundamentalmente diferente:
>
> - **Persistência**: Firebase Firestore (em nuvem, por usuário autenticado)
> - **Autenticação**: Firebase Auth (e-mail/senha + Google, com verificação de e-mail obrigatória)
> - **Deploy**: Vercel (SPA com fallback para `index.html`)
> - **Fichas de monstro/NPC**: coleção separada (`monsterSheets`), tipo separado (`MonsterSheet`), página separada (`MonsterSheetPage`)
> - **Nomenclatura UI**: fichas de jogador são chamadas de "PJ" (não "Personagem") na interface
> - **Painéis persistentes**: `CharacterCombatSummary` e `MonsterCombatSummary` exibem stats acima das abas em todas as visualizações
>
> **Use [`CLAUDE.md`](CLAUDE.md) como referência autoritativa da arquitetura atual.**
>
> O conteúdo abaixo é mantido apenas como registro histórico.

---

## 1. Visão Geral

**Tomo do Aventureiro** é uma aplicação web SPA para criação, edição, visualização, armazenamento local, importação e exportação de fichas de personagem. O foco atual do sistema está em fichas inspiradas em D&D 5e, com interface em português, persistência local no navegador e organização visual em estilo pergaminho.

O sistema foi construído para funcionar sem backend. Toda a persistência é feita no navegador do usuário, principalmente via `localStorage`, com uma pequena persistência adicional em `sessionStorage` para preferências temporárias de navegação.

Principais objetivos do sistema:

- criar novas fichas rapidamente;
- editar todos os blocos centrais de uma ficha de personagem;
- alternar entre modo de edição e modo de visualização;
- manter os dados salvos automaticamente no navegador;
- exportar e importar fichas individualmente em JSON;
- oferecer cálculos automáticos para atributos derivados, perícias, ataques, magia e pontos de vida;
- manter uma interface consistente, temática e responsiva.

---

## 2. Stack Técnica

### 2.1 Tecnologias principais

- **React 19** para renderização da interface.
- **TypeScript** para tipagem estática.
- **Vite** para desenvolvimento e build.
- **React Router DOM** para roteamento da SPA.
- **CSS Modules** para encapsulamento de estilos.
- **react-easy-crop** para recorte do avatar do personagem.

### 2.2 Scripts disponíveis

No arquivo `package.json`, o projeto expõe os seguintes scripts:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

### 2.3 Dependências instaladas

Dependências de runtime:

- `react`
- `react-dom`
- `react-router-dom`
- `react-easy-crop`

Dependências de desenvolvimento:

- `vite`
- `typescript`
- `eslint`
- `@vitejs/plugin-react`
- tipos de React, Node e DOM

---

## 3. Como Executar o Projeto

### 3.1 Instalação

```bash
npm install
```

### 3.2 Ambiente de desenvolvimento

```bash
npm run dev
```

### 3.3 Build de produção

```bash
npm run build
```

### 3.4 Validação estática

```bash
npm run lint
```

### 3.5 Observação importante

O projeto não depende de API externa nem de banco remoto. Tudo funciona localmente no navegador, então o comportamento de persistência depende do ambiente do usuário e da disponibilidade de `localStorage`.

---

## 4. Arquitetura da Aplicação

### 4.1 Tipo de aplicação

O sistema é uma **Single Page Application**. A entrada está em `src/main.tsx`, que monta `App.tsx` no elemento `#root`.

Fluxo de inicialização:

1. `src/main.tsx` importa os estilos globais.
2. `src/main.tsx` renderiza `App.tsx` dentro de `StrictMode`.
3. `src/App.tsx` configura o roteamento com `BrowserRouter`.
4. As páginas carregam a store e os componentes conforme a rota ativa.

### 4.2 Camadas principais

O projeto está organizado em camadas simples:

- **pages**: telas de rota;
- **components**: blocos visuais e funcionais reutilizáveis da ficha;
- **store**: persistência e normalização de dados;
- **types**: contratos de dados do sistema;
- **styles**: tema global e utilitários visuais compartilhados;
- **utils**: utilidades específicas de domínio.

### 4.3 Filosofia de estado

Não há gerenciador de estado global complexo. A aplicação trabalha com:

- estado local React para interações da interface;
- leitura e gravação na store local por ID da ficha;
- persistência imediata das alterações relevantes.

---

## 5. Estrutura de Pastas

Estrutura resumida do projeto:

```text
.
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.js
├── eslint.config.js
├── public/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── App.css
│   ├── components/
│   │   ├── AttacksPanel/
│   │   ├── AttributesPanel/
│   │   ├── AvatarCropper/
│   │   ├── CharacterDetailsPanel/
│   │   ├── CharacterHeader/
│   │   ├── CombatPanel/
│   │   ├── InventoryPanel/
│   │   ├── ResourcesPanel/
│   │   ├── SkillsPanel/
│   │   └── SpellsPanel/
│   ├── pages/
│   │   ├── CharacterSheetPage/
│   │   ├── Home/
│   │   ├── NewCharacterPage/
│   │   └── NotFound/
│   ├── services/
│   ├── store/
│   │   ├── characterSheetStore.ts
│   │   └── defaultCharacterSheet.ts
│   ├── styles/
│   │   ├── panel.module.css
│   │   └── theme.css
│   ├── types/
│   │   └── system/dnd/
│   └── utils/
│       └── weaponCatalog.ts
└── documentação.MD
```

---

## 6. Rotas e Páginas

O roteamento é definido em `src/App.tsx`.

### 6.1 `/`

Página: `src/pages/Home/Home.tsx`

Responsabilidades:

- listar fichas existentes;
- criar acesso para abertura de uma ficha específica;
- permitir importação de uma ficha via JSON;
- permitir exportação de uma ficha específica via JSON;
- permitir exclusão de uma ficha;
- exibir feedback de importação.

### 6.2 `/ficha/nova`

Página: `src/pages/NewCharacterPage/NewCharacterPage.tsx`

Responsabilidades:

- criar uma nova ficha em branco com valores padrão;
- redirecionar imediatamente para a rota da ficha recém-criada.

### 6.3 `/ficha/:id`

Página: `src/pages/CharacterSheetPage/CharacterSheetPage.tsx`

Responsabilidades:

- carregar a ficha pelo `id` presente na URL;
- exibir todos os painéis funcionais da ficha;
- alternar entre modo de edição e visualização;
- salvar alterações automaticamente no armazenamento local;
- organizar a experiência principal da ficha em abas.

### 6.4 `*`

Página: `src/pages/NotFound/NotFound.tsx`

Responsabilidades:

- exibir erro 404 para rotas inválidas.

---

## 7. Fluxo Principal do Usuário

### 7.1 Criar uma ficha

1. O usuário acessa a Home.
2. Clica em `+ Nova Ficha`.
3. A aplicação cria um registro com os valores padrão.
4. O usuário é redirecionado para `/ficha/:id`.

### 7.2 Editar uma ficha

1. A ficha é aberta em modo de edição por padrão quando criada.
2. O usuário altera campos em qualquer painel.
3. A página consolida os dados atualizados.
4. A store salva a ficha pelo mesmo ID.

### 7.3 Visualizar uma ficha

1. O usuário conclui a edição pelo botão flutuante.
2. Os painéis passam a exibir versão condensada e de leitura.
3. Alguns blocos ficam recolhíveis para reduzir o volume visual.

### 7.4 Exportar uma ficha

1. O usuário clica em `Exportar JSON` na Home.
2. A aplicação serializa a ficha com metadados.
3. O navegador baixa um arquivo `.json`.

### 7.5 Importar uma ficha

1. O usuário clica em `Importar ficha` na Home.
2. Seleciona um arquivo JSON.
3. A store valida o conteúdo.
4. Se o ID ainda não existir, a ficha é adicionada.
5. Se já existir, a importação é ignorada sem sobrescrever.

---

## 8. Página da Ficha de Personagem

Arquivo principal: `src/pages/CharacterSheetPage/CharacterSheetPage.tsx`

### 8.1 Organização em abas

A ficha é dividida em 6 abas:

- `Principal`
- `Combate`
- `Magias`
- `Habilidades`
- `Inventário`
- `Detalhes`

### 8.2 Persistência da aba ativa

A aba ativa é salva em `sessionStorage` com a chave:

```text
character-sheet-active-tab:{id-da-ficha}
```

Isso preserva a navegação da sessão atual sem poluir a estrutura principal de dados da ficha.

Compatibilidade histórica:

- valores antigos com a aba `Recursos` são migrados em tempo de leitura para `Habilidades`.

### 8.3 Alternância de modo

O botão flutuante no fim da página controla `isEditMode`.

Quando `isEditMode` está:

- `true`: a interface mostra inputs, botões de adicionar/remover e controles de edição;
- `false`: a interface mostra a versão consolidada de leitura, com colapsos e ações rápidas específicas.

### 8.4 Composição por aba

#### Aba `Principal`

- `CharacterHeader`
- `AttributesPanel`
- `SkillsPanel`

#### Aba `Combate`

- `CombatPanel`
- `AttacksPanel`

#### Aba `Magias`

- `SpellsPanel`

#### Aba `Habilidades`

- `ResourcesPanel`

#### Aba `Inventário`

- `InventoryPanel`

#### Aba `Detalhes`

- `CharacterDetailsPanel`

---

## 9. Componentes e Responsabilidades

### 9.1 `CharacterHeader`

Arquivo: `src/components/CharacterHeader/CharacterHeader.tsx`

Responsável por:

- nome do personagem;
- raça;
- antecedente;
- alinhamento;
- XP;
- classes, subclasses, níveis e dados de vida;
- avatar do personagem.

Comportamentos importantes:

- exibe avatar apenas se existir no modo de visualização;
- abre o `AvatarCropper` no modo de edição;
- permite múltiplas classes;
- impede remoção da última classe.

### 9.2 `AvatarCropper`

Arquivo: `src/components/AvatarCropper/AvatarCropper.tsx`

Responsável por:

- seleção de imagem local;
- recorte quadrado 1:1;
- zoom e reposicionamento;
- geração do resultado final em JPEG Base64.

Características técnicas:

- saída em `400 x 400` pixels;
- compressão adaptativa;
- imagens com mais de 2 MB usam compressão mais forte;
- saída persistida em `character.avatar`.

### 9.3 `AttributesPanel`

Arquivo: `src/components/AttributesPanel/AttributesPanel.tsx`

Responsável por:

- valores dos 6 atributos principais;
- modificadores derivados;
- testes de resistência;
- cálculo do bônus de proficiência global.

### 9.4 `SkillsPanel`

Arquivo: `src/components/SkillsPanel/SkillsPanel.tsx`

Responsável por:

- 18 perícias do sistema;
- nível de proficiência por perícia;
- bônus misc por perícia;
- cálculo total automático;
- percepção passiva.

Estados de proficiência por perícia:

- `0`: sem proficiência;
- `1`: proficiente;
- `2`: expertise.

### 9.5 `CombatPanel`

Arquivo: `src/components/CombatPanel/CombatPanel.tsx`

Responsável por:

- classe de armadura;
- iniciativa;
- velocidade;
- pontos de vida máximos, atuais e temporários;
- dados de vida gastos;
- inspiração heroica;
- testes contra a morte;
- ações rápidas de dano, cura e vida temporária no modo de visualização.

### 9.6 `AttacksPanel`

Arquivo: `src/components/AttacksPanel/AttacksPanel.tsx`

Responsável por:

- cadastro de ataques do personagem;
- cálculo automático do bônus do ataque quando baseado em atributo;
- suporte a ataques manuais com bônus fixo;
- dano, tipo de dano, alcance e notas.

### 9.7 `SpellsPanel`

Arquivo: `src/components/SpellsPanel/SpellsPanel.tsx`

Responsável por:

- lista de magias por nível;
- slots por nível;
- escola de magia;
- tempo de conjuração;
- alcance;
- duração;
- marcação de concentração;
- marcação de magia preparada;
- atributo-chave de conjuração;
- cálculo de ataque mágico e CD das magias.

### 9.8 `ResourcesPanel`

Arquivo: `src/components/ResourcesPanel/ResourcesPanel.tsx`

Responsável por:

- gerenciamento de recursos especiais do personagem;
- usos atuais e máximos;
- nível associado, alcance, duração e ação;
- origem do recurso;
- redefinição por descanso curto ou longo;
- recolhimento individual e global na visualização.

### 9.9 `InventoryPanel`

Arquivo: `src/components/InventoryPanel/InventoryPanel.tsx`

Responsável por:

- itens do inventário;
- quantidade;
- peso;
- item equipado;
- descrição;
- moedas do personagem;
- cálculo do peso total.

### 9.10 `CharacterDetailsPanel`

Arquivo: `src/components/CharacterDetailsPanel/CharacterDetailsPanel.tsx`

Responsável por:

- aparência;
- história;
- traços;
- ideais;
- vínculos;
- fraquezas;
- idiomas;
- proficiências com armas;
- proficiências com ferramentas;
- treinamento com armaduras;
- itens sintonizados.

Na visualização:

- os blocos textuais são recolhíveis;
- a edição força os blocos a ficarem abertos.

---

## 10. Persistência e Armazenamento

Arquivo principal: `src/store/characterSheetStore.ts`

### 10.1 Chave de armazenamento

O sistema utiliza a chave:

```text
tomo-do-aventureiro:character-sheets
```

### 10.2 Estrutura persistida

Cada ficha é armazenada como `StoredCharacterSheet`:

```ts
interface StoredCharacterSheet {
  id: string
  data: CharacterSheet
  createdAt: string
  updatedAt: string
}
```

O conjunto completo é salvo como:

```ts
type CharacterSheetStoreMap = Record<string, StoredCharacterSheet>
```

### 10.3 Leitura e escrita

A store mantém:

- cache em memória;
- leitura do `localStorage` quando disponível;
- sincronização automática ao salvar;
- limpeza de armazenamento inválido se o JSON corromper.

### 10.4 Normalização

Toda ficha lida da store passa por normalização.

Isso garante:

- valores padrão em campos ausentes;
- coerção de tipos básicos;
- migração de dados legados;
- remoção de estados inconsistentes;
- correção de limites mínimos e máximos em campos numéricos.

Principais rotinas internas:

- `normalizeCharacterSheet()`
- `normalizeCharacter()`
- `normalizeResource()`
- `normalizeAttack()`

### 10.5 Operações públicas da store

Funções exportadas e seus papéis:

- `listCharacterSheets()`: retorna todas as fichas ordenadas por `updatedAt` mais recente;
- `getCharacterSheet(id)`: carrega uma ficha específica;
- `createCharacterSheet(initialValue?)`: cria e salva uma nova ficha;
- `saveCharacterSheet(id, sheet)`: persiste atualização da ficha;
- `deleteCharacterSheet(id)`: remove a ficha pelo ID;
- `createAndStoreCharacterSheet()`: atalho para criar usando o default;
- `exportCharacterSheetAsJSON(id)`: serializa uma ficha;
- `importCharacterSheetFromJSON(json)`: importa uma ficha individual.

---

## 11. Importação e Exportação de JSON

### 11.1 Exportação

A exportação gera JSON formatado da ficha completa, incluindo:

- `id`
- `data`
- `createdAt`
- `updatedAt`

O nome do arquivo é derivado do nome do personagem e normalizado para slug:

```text
tomo-personagem-{nome-normalizado}.json
```

### 11.2 Importação

A importação aceita um JSON contendo:

- uma `StoredCharacterSheet` direta;
- ou um objeto com uma única entrada aninhada contendo `data`.

Resultado da importação:

```ts
interface ImportResult {
  imported: number
  skipped: number
  errors: number
}
```

Regras:

- se o JSON for inválido, conta como erro;
- se o payload não representar uma ficha válida, conta como erro;
- se o ID já existir no armazenamento local, a importação é ignorada;
- a importação não sobrescreve fichas existentes.

### 11.3 Consequência prática

O sistema foi desenhado para ser seguro contra sobrescrita acidental, mas isso também significa que importar uma ficha com o mesmo ID não atualiza o registro existente.

---

## 12. Modelo de Dados Principal

### 12.1 `CharacterSheet`

Arquivo: `src/types/system/dnd/CharacterSheet.ts`

```ts
interface CharacterSheet {
  character: Character
  resources: Resource[]
  inventory: Inventory
  spells: Spell[]
  attacks: Attack[]
  combatNotes: string
  isEditMode: boolean
}
```

### 12.2 Extensão prática usada em runtime

Na página da ficha, existe uma extensão local do tipo:

```ts
type SheetWithSlots = CharacterSheet & {
  spellSlots?: Record<number, { current: number; max: number }>
}
```

Ou seja:

- `spellSlots` é usado pelo sistema atual;
- esse campo não está declarado na interface base `CharacterSheet`;
- porém é mantido em prática porque a store preserva chaves extras no objeto salvo.

### 12.3 `Character`

Arquivo: `src/types/system/dnd/Character.ts`

O personagem concentra os dados centrais da ficha.

#### Identidade

- `name`
- `avatar`
- `race`
- `background`
- `alignment`
- `size`
- `xp`

#### Narrativa

- `appearance`
- `backstory`
- `traits`
- `ideals`
- `bonds`
- `flaws`

#### Idiomas e proficiências

- `languages`
- `armorTraining`
- `weaponProficiencies`
- `weaponMasteries`
- `toolProficiencies`

#### Equipamentos especiais

- `attunementItems`
- `currency`

#### Combate

- `deathSaves`
- `heroicInspiration`
- `hitDiceSpent`
- `armorClassBase`
- `initiativeBonusExtra`
- `speed`

#### Magia e proficiência

- `proficiencyOverride`
- `spellcastingAbility`

#### Vida

- `hpAutoCalc`
- `hpBonusEntries`
- `hpMax`
- `hpCurrent`
- `hpTemp`

#### Percepção e resistências

- `passivePerceptionBonus`
- `savingThrows`

#### Progressão

- `classes`
- `skills`
- `attributes`

### 12.4 Entidades auxiliares

#### `Attribute`

```ts
type AttributeName =
  | 'Força'
  | 'Destreza'
  | 'Constituição'
  | 'Inteligência'
  | 'Sabedoria'
  | 'Carisma'

interface Attribute {
  name: AttributeName
  value: number
}
```

#### `SpellcastingAbility`

```ts
type SpellcastingAbility = AttributeName | ''
```

#### `Resource`

```ts
type ResourceReset = 'short-rest' | 'long-rest' | 'manual' | 'na'

type ResourceOrigin =
  | 'class'
  | 'subclass'
  | 'species'
  | 'background'
  | 'feat'
  | 'magic-item'
  | 'homebrew'
```

Campos usados:

- `name`
- `description`
- `duration`
- `level`
- `range`
- `action`
- `current`
- `max`
- `resetOn`
- `origin`
- `customOrigin`
- `allowCustomOrigin`

#### `Spell`

Campos usados:

- `name`
- `level`
- `school`
- `castingTime`
- `range`
- `duration`
- `components`
- `concentration`
- `prepared`
- `description`

#### `Attack`

```ts
type AttackAttributeKey =
  | 'str'
  | 'dex'
  | 'con'
  | 'int'
  | 'wis'
  | 'cha'
  | 'manual'
```

Campos usados:

- `name`
- `attackBonus`
- `attributeKey`
- `useProficiency`
- `damage`
- `damageType`
- `range`
- `notes`

#### `Inventory`

`Inventory` é um array de `InventoryItem`.

Campos de item:

- `id`
- `name`
- `quantity`
- `description`
- `weight`
- `equipped`

---

## 13. Valores Padrão da Ficha

Arquivo: `src/store/defaultCharacterSheet.ts`

Pontos importantes do default atual:

- nova ficha começa com `isEditMode: true`;
- avatar vazio;
- 6 atributos iniciam em `10`;
- velocidade inicia em `9m`;
- `spellcastingAbility` inicia em `Inteligência`;
- uma classe em branco já existe por padrão com nível `1`;
- recursos, inventário, magias e ataques começam vazios;
- vidas começam em `0`;
- percepção passiva extra começa em `0`;
- resistências começam sem proficiência;
- perícias começam sem proficiência nem bônus extra.

---

## 14. Regras de Cálculo Implementadas

### 14.1 Modificador de atributo

Função em `AttributesPanel.tsx`:

```ts
Math.floor((valor - 10) / 2)
```

### 14.2 Bônus de proficiência

Função em `AttributesPanel.tsx`:

```ts
Math.ceil(nivelTotal / 4) + 1
```

Onde `nivelTotal` é a soma dos níveis de todas as classes.

### 14.3 Testes de resistência

Fórmula:

```text
modificador do atributo + bônus de proficiência, se proficiente
```

Neste sistema, resistência usa apenas proficiência binária:

- `0`: sem proficiência;
- `1`: proficiente.

Não existe expertise em resistência.

### 14.4 Perícias

Fórmula:

```text
modificador do atributo + (nível de proficiência × bônus de proficiência) + misc
```

Níveis de proficiência das perícias:

- `0`: sem proficiência;
- `1`: proficiente;
- `2`: expertise.

### 14.5 Percepção passiva

Fórmula:

```text
10 + total da perícia Percepção + passivePerceptionBonus
```

### 14.6 Bônus de ataque

Se o ataque for manual:

```text
attack.attackBonus
```

Se o ataque for baseado em atributo:

```text
modificador do atributo escolhido + bônus de proficiência, se useProficiency = true
```

### 14.7 Ataque com magia

Fórmula:

```text
bônus de proficiência + modificador do atributo-chave de conjuração
```

### 14.8 CD das magias

Fórmula:

```text
8 + bônus de proficiência + modificador do atributo-chave de conjuração
```

### 14.9 HP máximo automático

Quando `hpAutoCalc = true`, o sistema calcula:

1. o primeiro nível com dado cheio;
2. os níveis seguintes com média do dado de vida;
3. o modificador de Constituição é somado a cada nível;
4. bônus extras vindos de `hpBonusEntries` são adicionados ao final.

Em termos práticos:

```text
HP natural = soma do primeiro nível cheio + níveis seguintes pela média + CON por nível
HP efetivo = HP natural + bônus extras
```

### 14.10 Vida atual e vida temporária

Regras implementadas no `CombatPanel`:

- dano consome vida temporária antes da vida atual;
- cura não ultrapassa o HP máximo efetivo;
- vida temporária rápida substitui apenas se o novo valor for maior que o valor atual;
- HP atual é limitado apenas pelo HP máximo efetivo, não pela soma com vida temporária.

---

## 15. Recursos e Descansos

No `ResourcesPanel`, cada recurso pode ser configurado com:

- usos atuais e máximos;
- nível associado;
- ação necessária;
- duração;
- alcance;
- origem;
- forma de recarga.

Recargas suportadas:

- `short-rest`
- `long-rest`
- `manual`
- `na`

A tela oferece ações para:

- resetar todos os recursos de descanso curto;
- resetar todos os recursos de descanso longo;
- resetar um recurso individual para seu valor máximo.

Na visualização, os cards podem ser:

- recolhidos individualmente;
- recolhidos ou expandidos em massa.

---

## 16. Inventário e Moedas

O sistema trata inventário como array simples de itens, com cálculo de peso total.

Moedas suportadas:

- `cp`
- `sp`
- `ep`
- `gp`
- `pp`

O peso total exibido na interface é calculado a partir dos itens cadastrados no inventário.

---

## 17. Tema Visual e Padrões de Interface

Arquivo principal do tema: `src/styles/theme.css`

### 17.1 Identidade visual

O sistema usa uma direção visual de pergaminho, com:

- tons quentes e sépia;
- bordas douradas e castanhas;
- tipografia clássica;
- painéis com aparência de documento medieval.

### 17.2 Tipografia

- títulos: **Cinzel**;
- corpo: **Crimson Text**.

### 17.3 Tokens relevantes

O tema define variáveis para:

- paleta de cores;
- tipografia;
- espaçamento;
- bordas;
- sombras;
- transições;
- largura máxima da página.

### 17.4 Padrões de estilização

O projeto prioriza:

- `CSS Modules` por componente;
- estilos compartilhados em `src/styles/panel.module.css`;
- ausência de Tailwind;
- preferência por classes em vez de `style={{ ... }}`.

---

## 18. Catálogo de Armas e Proficiências

Arquivo: `src/utils/weaponCatalog.ts`

O utilitário centraliza:

- categorias canônicas de armas;
- catálogo básico de armas conhecidas;
- normalização textual sem acentos;
- deduplicação de entradas;
- separação entre categorias canônicas e proficiências customizadas;
- sugestões de maestrias com base nas categorias escolhidas.

Categorias padrão:

- `Simples`
- `Marcial`
- `Exótica`

Funções importantes:

- `mergeWeaponProficiencies()`
- `toggleWeaponCategory()`
- `setCustomWeaponProficiencyValues()`
- `findMatchingWeaponProficiency()`
- `getSuggestedWeaponMasteries()`

---

## 19. Compatibilidade e Migração de Dados Legados

A store contém lógica explícita para lidar com formatos antigos de dados.

### 19.1 Campos legados já tratados

- `attunements` antigo é migrado para `attunementItems`;
- `backstoryPersonality` é migrado para `backstory`;
- campos removidos como `speciesTraits`, `feats` e `classFeatures` são descartados no processo de normalização;
- origens legadas de recursos são adaptadas para o formato atual;
- valores localizados antigos de atributos em ataques são convertidos para `str`, `dex`, `con`, `int`, `wis`, `cha` ou `manual`.

### 19.2 Objetivo dessa camada

Permitir evolução do esquema sem quebrar fichas que já estavam salvas em versões anteriores.

---

## 20. Campos Persistidos sem Forte Exposição Atual

Há alguns campos do modelo que existem e são persistidos, mas hoje não são protagonistas da interface.

### 20.1 `combatNotes`

- faz parte de `CharacterSheet`;
- é persistido e normalizado;
- atualmente não possui papel central evidente na composição principal da ficha.

### 20.2 `proficiencyOverride`

- existe em `Character`;
- é persistido no default e no modelo;
- atualmente não aparece como cálculo principal ativo nos painéis centrais.

### 20.3 `spellSlots`

- é usado ativamente pela tela de magias;
- porém não está tipado na interface base `CharacterSheet`;
- existe como extensão local da página.

Esses pontos são importantes para manutenção e futuras refatorações de tipos.

---

## 21. Decisões de Projeto e Limitações Atuais

### 21.1 Sem backend

Vantagens:

- simples de distribuir;
- sem autenticação obrigatória;
- sem dependência de serviços externos.

Limitações:

- os dados ficam presos ao navegador/dispositivo do usuário;
- limpar o armazenamento local pode apagar as fichas;
- não há sincronização automática entre dispositivos.

### 21.2 Avatares em Base64

Vantagens:

- integração simples com o armazenamento local;
- não exige servidor de upload.

Limitações:

- aumenta o tamanho do JSON salvo;
- pode pressionar os limites de `localStorage` caso muitas fichas usem imagens grandes.

### 21.3 Importação por ID

Como a importação não sobrescreve IDs existentes:

- evita perda acidental de dados;
- exige atenção caso o usuário queira substituir uma ficha antiga por uma importada.

### 21.4 Tipagem parcial do runtime

O caso de `spellSlots` mostra uma diferença entre:

- o tipo principal declarado;
- o formato realmente usado em runtime.

Esse ponto deve ser acompanhado em futuras evoluções do modelo.

---

## 22. Diretrizes para Evolução do Sistema

Ao adicionar ou alterar campos do domínio, recomenda-se atualizar em conjunto:

1. a interface TypeScript em `src/types/system/dnd/`;
2. os defaults em `src/store/defaultCharacterSheet.ts`;
3. a normalização em `src/store/characterSheetStore.ts`;
4. os componentes de edição e visualização que usam o campo;
5. a importação e exportação, quando necessário;
6. esta documentação.

Ao introduzir novas áreas da ficha, recomenda-se verificar:

1. se devem entrar em uma aba existente ou nova;
2. se exigem persistência em `sessionStorage` para UX;
3. se precisam de normalização para compatibilidade futura;
4. se alteram cálculos automáticos já existentes.

---

## 23. Resumo Executivo

Em seu estado atual, o sistema oferece:

- criação e edição completas de ficha de personagem;
- navegação por abas;
- persistência local robusta com normalização;
- importação e exportação por personagem em JSON;
- avatar com recorte;
- cálculos automáticos para atributos derivados, perícias, ataques, magia e vida;
- gerenciamento de inventário, recursos, ataques, detalhes narrativos e combate;
- interface temática consistente e responsiva.

O projeto está bem posicionado para continuar evoluindo como um editor de fichas offline-first, desde que a manutenção preserve a coerência entre tipos, defaults, normalização e interface.