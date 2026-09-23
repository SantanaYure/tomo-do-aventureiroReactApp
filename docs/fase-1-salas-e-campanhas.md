# Especificação Técnica — Fase 1: Salas e Campanhas (Fundação Multiusuário)

- **Fase:** 1 (Fundação do Gerenciador de Mesas)
- **Branch:** `feat/fase-1-salas-e-campanhas`
- **Documento autoritativo de estilo:** [`design.md`](../design.md)
- **Documento autoritativo de arquitetura:** [`CLAUDE.md`](../CLAUDE.md)

---

## 1. Objetivo e Visão Geral

Habilitar o **Tomo do Aventureiro** a gerenciar campanhas e salas de RPG de forma multiusuário, permitindo que um **Mestre (DM)** crie mesas, convide **Jogadores** via código de acesso e que os jogadores vinculem seus Personagens de Jogador (PJs) existentes a essas mesas.

### Princípios desta fase
- **Zero regressão:** O sistema existente de criação e edição individual de fichas de PJ e Monstros permanece 100% operacional e inalterado.
- **Conformidade rigorosa com o Design System:** Adesão aos tokens OKLCH de [`design.md`](../design.md), estética Glass Morphism + Flat, botões `--radius-btn: 6px`, tipografia Cinzel + Inter e suporte integral aos temas **claro**, **escuro** e **pergaminho**.
- **Segurança e permissões granulares:** Cada usuário mantém posse de seus dados, compartilhando no contexto da mesa apenas o necessário para a condução do jogo.

---

## 2. Escopo

### O que está INCLUÍDO na Fase 1:
1. **Coleção de Campanhas no Firestore:** Modelagem de dados para mesas, membros e fichas vinculadas.
2. **Atualização de Regras de Segurança:** Novas regras em `firestore.rules` autorizando leitura e escrita compartilhada dentro das campanhas.
3. **Página de Campanhas (`/mesas`):**
   - Listagem de mesas onde o usuário atua como Mestre e mesas onde atua como Jogador.
   - Botão para criar nova mesa (+ Modal).
   - Botão para entrar em mesa via código (+ Modal).
4. **Página de Detalhes da Mesa (`/mesas/:id`):**
   - Cabeçalho com dados da mesa, Mestre responsável e código de convite rápido (com botão de copiar).
   - Lista de membros e seus respectivos PJs vinculados.
   - Gestão de membros pelo Mestre (remover jogador, renovar código).
5. **Vínculo de Personagens:**
   - Jogador pode selecionar um dos seus PJs existentes da sua conta para representar na mesa.
   - Sincronização básica de dados públicos do PJ para visualização da mesa.

### O que NÃO está incluído nesta fase (fases subsequentes):
- *Fase 2:* Painel do Mestre em tempo real com controle de recursos e inspeção ao vivo.
- *Fase 3:* Rolador de dados integrado e chat de mesa compartilhado.
- *Fase 4:* Rastreador de combate e iniciativa (Combat Tracker).
- *Fase 5:* Handouts, mapas táticos e diário de campanha.

---

## 3. Conformidade com o Design System

Todas as telas e componentes da Fase 1 devem respeitar os seguintes padrões definidos em [`design.md`](../design.md):

### 3.1 Painéis e Containers
- Fundo em Glass Morphism: `background: var(--panel-bg)`, `backdrop-filter: var(--blur-panel)` e borda `1px solid var(--panel-border)`.
- Raio de cantos de painéis principais: `--radius-xl` (18px) ou `--radius-lg` (16px para cards internos).
- Cards de mesa e itens de lista: `background: var(--item-bg)`, borda `1px solid var(--panel-border)` e hover sutil.
- **Proibido:** Fundos opacos arbitrários, bordas duplas (`double`) ou sombras carregadas fora de modais.

### 3.2 Tipografia e Cores
- **Títulos e Valores:** `--font-display` (`'Cinzel', serif`), com peso 600 ou 700.
- **Textos de Apoio e Rótulos:** `--font-body` (`'Inter', sans-serif`).
- **Cores Semânticas:**
  - Títulos: `var(--text)`
  - Subtítulos e metadados: `var(--text-muted)`
  - Rótulos discretos: `var(--text-faint)`
  - Badges de destaque e Mestre: `var(--chip-violet-bg)`, `var(--chip-violet-border)`, `var(--chip-violet-text)` (derivados de `--brand`).

### 3.3 Botões e Ações Interativas
- Todos os botões devem obrigatoriamente usar `--radius-btn: 6px`. **Nunca usar botões pílula ou `border-radius: 999px`**.
- Botões primários (Criar Mesa, Entrar): Acabamento com `--btn-gloss` e `--btn-sheen`.
- Botões secundários/fantasma: Fundo transparente com borda `var(--panel-border)` e hover em `var(--item-bg)`.
- Acessibilidade: O foco do teclado deve obrigatoriamente usar `outline: 2px solid var(--accent)` e nunca remover outline em `:focus-visible`.

### 3.4 Ícones Inline e Marcadores (Regra Clean)
- **Padrão Clean e Monocromático:** Todos os ícones devem seguir rigorosamente o padrão clean do projeto, herdando `currentColor`, sem cores nativas ou preenchimentos pesados. **Emojis são terminantemente proibidos**.
- **Navegação (Sidebar/Mobile):** Utilizar glifo Unicode textual monocromático padronizado: `♜` (torre/fortaleza para Mesas), alinhado com `⌂` (Home) e `⚔` (Fichas).
- **Interface e Conteúdo (`lucide-react`):** Traço fino (`strokeWidth: 1.5` ou `1.75`), integrados e proporcionais ao texto:
  - Criar: `Plus`
  - Entrar por código: `KeyRound`
  - Papel do Mestre: `Crown`
  - Papel de Jogador: `Shield` ou `User`
  - Copiar código / Sucesso: `Copy` e `Check`
  - Ações de perigo (remover, sair): `Trash2`, `LogOut`
  - Estados vazios: `Castle`, `ScrollText`

---

## 4. Arquitetura de Dados (Cloud Firestore)

### 4.1 Coleção: `/campaigns/{campaignId}`
```typescript
interface Campaign {
  id: string;                    // ID único do documento no Firestore
  name: string;                  // Nome da campanha/mesa (ex: "A Maldição de Strahd")
  description: string;           // Breve descrição ou sinopse da mesa
  system: 'dnd5e_2024';          // Sistema base (D&D 5e 2024)
  dmId: string;                  // UID do usuário Mestre (proprietário)
  dmName: string;                // Display name do Mestre para exibição rápida
  inviteCode: string;            // Código curto único (6 caracteres alfanuméricos, ex: "TM-7K9P")
  bannerUrl?: string;            // Imagem de capa opcional (URL ou padrão)
  createdAt: number;             // Timestamp de criação
  updatedAt: number;             // Timestamp da última alteração
  archived: boolean;             // Flag de arquivamento (false por padrão)
}
```

### 4.2 Subcoleção: `/campaigns/{campaignId}/members/{userId}`
```typescript
interface CampaignMember {
  userId: string;                // UID do membro autenticado
  displayName: string;           // Nome de exibição
  photoURL?: string;             // Foto de avatar
  role: 'dm' | 'player';         // Papel na mesa
  joinedAt: number;              // Timestamp de ingresso
  characterSheetId?: string;     // ID da ficha vinculada (para jogadores)
  characterName?: string;        // Nome do personagem vinculado
  characterClass?: string;       // Classe e nível do personagem vinculado (ex: "Guerreiro 3")
  characterAvatarUrl?: string;   // Avatar da ficha para exibição rápida
}
```

### 4.3 Consulta de Código de Convite
Para permitir a entrada via código sem expor a lista inteira de campanhas:
- Consulta indexada por `where('inviteCode', '==', code)`.

### 4.4 Proposta de `firestore.rules`
```javascript
// Regras para Campanhas e Membros
match /campaigns/{campaignId} {
  // Leitura permitida apenas se o usuário for membro ou o criador/DM
  allow read: if request.auth != null && (
    resource.data.dmId == request.auth.uid ||
    exists(/databases/$(database)/documents/campaigns/$(campaignId)/members/$(request.auth.uid))
  );

  // Criação permitida para usuários autenticados com e-mail verificado
  allow create: if request.auth != null &&
                   request.auth.token.email_verified == true &&
                   request.resource.data.dmId == request.auth.uid;

  // Atualização permitida apenas para o Mestre
  allow update, delete: if request.auth != null &&
                           resource.data.dmId == request.auth.uid;

  // Subcoleção de Membros
  match /members/{memberId} {
    // Membro pode ler os companheiros de mesa
    allow read: if request.auth != null && (
      get(/databases/$(database)/documents/campaigns/$(campaignId)).data.dmId == request.auth.uid ||
      exists(/databases/$(database)/documents/campaigns/$(campaignId)/members/$(request.auth.uid))
    );

    // Usuário pode se juntar (criar seu próprio membro) se tiver o código ou se for o DM
    allow create: if request.auth != null && request.auth.uid == memberId;

    // Usuário pode editar seus dados ou sair; Mestre pode remover qualquer membro
    allow update, delete: if request.auth != null && (
      request.auth.uid == memberId ||
      get(/databases/$(database)/documents/campaigns/$(campaignId)).data.dmId == request.auth.uid
    );
  }
}
```

---

## 5. Estrutura de Rotas e Navegação

### 5.1 Atualização de Rotas (`src/App.tsx`)
```tsx
// Novas rotas protegidas sob AppLayout
<Route path="/mesas" element={<CampaignsPage />} />
<Route path="/mesas/:id" element={<CampaignDetailPage />} />
```

### 5.2 Sidebar (`src/components/Sidebar/Sidebar.tsx`)
- Adicionar link de navegação para `/mesas`:
  - Ícone: `Users` ou `Dices`
  - Rótulo: `Mesas`
  - Comportamento de item ativo correspondente ao padrão da aplicação.

---

## 6. Fluxos do Usuário

### 6.1 Fluxo: Criar Nova Mesa (Mestre)
1. Usuário clica em `+ Nova Mesa` na página `/mesas`.
2. Modal abre solicitando: **Nome da Mesa** (obrigatório) e **Descrição** (opcional).
3. O sistema gera automaticamente um `inviteCode` alfanumérico único de 6 caracteres.
4. Ao salvar, cria o documento em `/campaigns/{id}` e o registro em `/campaigns/{id}/members/{dmId}` como `role: 'dm'`.
5. Redireciona o usuário para a página da mesa recém-criada (`/mesas/{id}`).

### 6.2 Fluxo: Entrar em uma Mesa com Código (Jogador)
1. Jogador clica em `Entrar com Código` na página `/mesas`.
2. Modal solicita o código de 6 caracteres.
3. O sistema valida o código no Firestore:
   - Se inválido ou expirado, exibe feedback de erro sem recarregar a tela.
   - Se válido, apresenta um resumo da mesa (Nome da Mesa, Nome do Mestre).
4. O modal exibe uma lista dos personagens de jogador existentes do usuário:
   - Jogador pode selecionar um PJ existente para vincular imediatamente, ou entrar como espectador/criar ficha posteriormente.
5. Ao confirmar, adiciona o registro em `/campaigns/{id}/members/{userId}` com `role: 'player'`.
6. Redireciona para `/mesas/{id}`.

### 6.3 Fluxo: Visualização da Mesa
- Exibe o cabeçalho com nome da mesa, badge do DM e o código de convite com botão "Copiar Link / Código".
- Grid de participantes com fotos de avatar, nome do jogador, nome do personagem vinculado e classe.
- Mestre dispõe de menu de contexto em cada card para remover membro se necessário.

---

## 7. Critérios de Aceite e Definição de Pronto (DoD)

1. **Testes Automatizados:**
   - `npm run typecheck` passa com 0 erros de TypeScript estrito.
   - `npm run test` (Vitest) mantém 100% dos testes existentes verdes.
   - Novos testes unitários criados para: utilitários de geração/validação de códigos de convite e normalização de entidades de campanha.
2. **Conformidade de Acessibilidade:**
   - Navegação completa por teclado nos modais e listas.
   - Foco visível (`:focus-visible`) e sem armadilhas de foco.
3. **Design e Temas:**
   - Verificação visual de que todos os painéis e cards utilizam as variáveis OKLCH e renderizam perfeitamente nos três temas: **Claro**, **Escuro** e **Pergaminho**.
