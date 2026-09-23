# NEXT_PLAN: Rumo ao Gerenciamento Completo de Mesas de RPG

O **Tomo do Aventureiro** consolidou uma base sólida como criador e repositório de fichas D&D 5e (2024), com autenticação, persistência individual no Firestore e UI refinada (Glass Morphism). Contudo, a arquitetura atual é estritamente isolada por usuário (`users/{userId}`), funcionando como um gerenciador pessoal de personagens e monstros, e não como uma plataforma de mesa.

Para evoluir para um **Sistema Completo de Gerenciamento de Mesas de RPG**, são necessários cinco pilares fundamentais:

### 1. Salas e Campanhas Multiusuário
- **Criação de Mesas:** Fluxo em que o Mestre (DM) cria campanhas e compartilha códigos/links de convite com jogadores.
- **Vínculo de Fichas:** Jogadores associam seus PJs à mesa, definindo permissões de visualização e edição.
- **Modelo de Dados Compartilhado:** Reformulação das `firestore.rules` e coleções para comportar entidades compartilhadas (`campaigns/{campaignId}`).

### 2. Painel do Mestre e Sincronização em Tempo Real
- **Dashboard do DM:** Visão centralizada e em tempo real (`onSnapshot`) dos status vitais de todos os heróis (PV atual/máx, CA, Percepção Passiva, condições e slots de magia).
- **Injeção de Criaturas:** Instanciação ágil de monstros e NPCs criados no Tomo diretamente para a sessão em andamento.

### 3. Rastreador de Combate (Combat Tracker)
- **Ordem de Iniciativa:** Lista dinâmica e ordenada de turnos com entrada de heróis e monstros.
- **Gestão de Encontros:** Aplicação ágil de dano/cura, contagem de rodadas e controle de condições (ex.: atordoado, envenenado).

### 4. Rolagens Integradas e Chat da Mesa
- **Dados no Feed:** Disparo de rolagens com um clique a partir das estatísticas e ataques da própria ficha para o feed da sala, incluindo suporte a rolagens secretas do Mestre.
- **Histórico da Sessão:** Registro de rolagens, anúncios do narrador e falas de personagens (IC/OOC).

### 5. Handouts e Diário da Aventura
- **Distribuição de Conteúdo:** Compartilhamento de imagens, mapas, pistas e tesouros entre o grupo.
- **Anotações de Sessão:** Espaço para diários públicos de campanha e notas secretas do Mestre.

Com essas implementações, o Tomo do Aventureiro deixará de ser apenas um catálogo pessoal de fichas e se tornará um ambiente completo para preparação, facilitação e condução de sessões de RPG de mesa.
