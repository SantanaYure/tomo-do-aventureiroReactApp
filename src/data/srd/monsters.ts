// Seed de monstros do SRD (System Reference Document), convertidos para o
// formato de MonsterSheet do Tomo.
//
// Fonte: SRD 5.1 (2014) e SRD 5.2 (2024), ambos publicados pela Wizards of
// the Coast sob a licença Creative Commons CC-BY-4.0. Estatísticas
// conferidas contra a API pública do open5e (api.open5e.com/v2) e da
// dnd5eapi.co em 2026-09-22.
//
// É uma seleção de monstros comuns (17 stat blocks), não o SRD completo — ver CLAUDE.md / discussão da branch
// feat/conteudo-srd para o plano de expansão (magias, itens, mais
// monstros).
//
// Distâncias convertidas de pés para metros pela tabela padrão usada nas
// edições em português (1 pé = 0,3 m; 5 pés = 1,5 m). Alcances em pés
// truncados para inteiro pelo normalizeMonsterSheet ao salvar — limitação
// já existente do modelo de dados, não introduzida por este seed.

import type { MonsterAction, MonsterFeature, MonsterSheet } from '../../types/system/dnd/monsterSheet'

/** Recorte do que este seed preenche de um MonsterSheet; o resto vem de createDefaultMonsterSheet() via normalizeMonsterSheet. */
export interface SrdMonsterTemplateData {
  details: Partial<MonsterSheet['details']>
  stats: Partial<MonsterSheet['stats']>
  traits: Partial<MonsterSheet['traits']>
  actions?: Array<Partial<MonsterAction>>
  features?: Array<Partial<MonsterFeature>>
}

export interface SrdMonsterTemplate {
  id: string
  name: string
  ruleset: '2014' | '2024'
  challengeRating: string
  /** Créditos de origem, para exibir junto do conteúdo importado. */
  source: string
  data: SrdMonsterTemplateData
}

export const SRD_MONSTER_TEMPLATES: SrdMonsterTemplate[] = [
  {
    id: 'srd-2014-goblin',
    name: 'Goblin',
    ruleset: '2014',
    challengeRating: '1/4',
    source: 'SRD 5.1 (2014) — Wizards of the Coast, CC-BY-4.0',
    data: {
      details: {
        species: 'Humanoide (goblinoide)',
        size: 'Pequeno',
        alignment: 'Neutro e mau',
      },
      stats: {
        maxHp: 7,
        hpCurrent: 7,
        ac: 15,
        movements: [{ id: 'movement-1', source: 'Terra', distance: 9 }],
        strength: 8,
        dexterity: 14,
        constitution: 10,
        intelligence: 10,
        wisdom: 8,
        charisma: 8,
      },
      traits: {
        skills: ['Furtividade +6'],
        languages: ['Comum', 'Goblin'],
        challengeRating: '1/4',
        xp: 50,
      },
      actions: [
        {
          name: 'Cimitarra',
          isAttack: true,
          attackType: 'Corpo-a-corpo',
          attackBonus: '+4',
          reach: '1,5 m',
          damage: '1d6 + 2',
          damageType: 'Corte',
          description:
            'Ataque com Arma Corpo a Corpo: +4 para acertar, alcance 1,5 m, um alvo. Acerto: 5 (1d6 + 2) de dano cortante.',
        },
        {
          name: 'Arco Curto',
          isAttack: true,
          attackType: 'Distância',
          attackBonus: '+4',
          reach: '24/96 m',
          damage: '1d6 + 2',
          damageType: 'Perfuração',
          description:
            'Ataque com Arma à Distância: +4 para acertar, alcance 24/96 m, um alvo. Acerto: 5 (1d6 + 2) de dano perfurante.',
        },
      ],
      features: [
        {
          name: 'Fuga Ágil',
          description:
            'O goblin pode usar a ação Desengajar ou Esconder-se como uma ação bônus em cada um dos seus turnos.',
        },
      ],
    },
  },
  {
    id: 'srd-2014-skeleton',
    name: 'Esqueleto',
    ruleset: '2014',
    challengeRating: '1/4',
    source: 'SRD 5.1 (2014) — Wizards of the Coast, CC-BY-4.0',
    data: {
      details: {
        species: 'Morto-vivo',
        size: 'Médio',
        alignment: 'Leal e mau',
        description: 'Vulnerável a dano de concussão (o modelo de ficha atual não tem um campo dedicado a vulnerabilidades).',
      },
      stats: {
        maxHp: 13,
        hpCurrent: 13,
        ac: 13,
        movements: [{ id: 'movement-1', source: 'Terra', distance: 9 }],
        strength: 10,
        dexterity: 14,
        constitution: 15,
        intelligence: 6,
        wisdom: 8,
        charisma: 5,
      },
      traits: {
        languages: ['Entende os idiomas que tinha em vida, mas não consegue falar'],
        immunities: ['Veneno'],
        conditionImmunities: ['Exaustão', 'Envenenado'],
        challengeRating: '1/4',
        xp: 50,
      },
      actions: [
        {
          name: 'Espada Curta',
          isAttack: true,
          attackType: 'Corpo-a-corpo',
          attackBonus: '+4',
          reach: '1,5 m',
          damage: '1d6 + 2',
          damageType: 'Perfuração',
          description:
            'Ataque com Arma Corpo a Corpo: +4 para acertar, alcance 1,5 m, um alvo. Acerto: 5 (1d6 + 2) de dano perfurante.',
        },
        {
          name: 'Arco Curto',
          isAttack: true,
          attackType: 'Distância',
          attackBonus: '+4',
          reach: '24/96 m',
          damage: '1d6 + 2',
          damageType: 'Perfuração',
          description:
            'Ataque com Arma à Distância: +4 para acertar, alcance 24/96 m, um alvo. Acerto: 5 (1d6 + 2) de dano perfurante.',
        },
      ],
    },
  },
  {
    id: 'srd-2024-skeleton',
    name: 'Esqueleto',
    ruleset: '2024',
    challengeRating: '1/4',
    source: 'SRD 5.2 (2024) — Wizards of the Coast, CC-BY-4.0',
    data: {
      details: {
        species: 'Morto-vivo',
        size: 'Médio',
        alignment: 'Leal e mau',
        description: 'Vulnerável a dano de concussão (o modelo de ficha atual não tem um campo dedicado a vulnerabilidades).',
      },
      stats: {
        maxHp: 13,
        hpCurrent: 13,
        ac: 14,
        movements: [
          { id: 'movement-1', source: 'Terra', distance: 9 },
          { id: 'movement-2', source: 'Escalada', distance: 4 },
          { id: 'movement-3', source: 'Natação', distance: 4 },
        ],
        strength: 10,
        dexterity: 16,
        constitution: 15,
        intelligence: 6,
        wisdom: 8,
        charisma: 5,
      },
      traits: {
        languages: ['Entende Comum e mais um idioma, mas não consegue falar'],
        immunities: ['Veneno'],
        conditionImmunities: ['Exaustão', 'Envenenado'],
        challengeRating: '1/4',
        xp: 50,
      },
      actions: [
        {
          name: 'Espada Curta',
          isAttack: true,
          attackType: 'Corpo-a-corpo',
          attackBonus: '+5',
          reach: '1,5 m',
          damage: '1d6 + 3',
          damageType: 'Perfuração',
          description: 'Ataque com Arma: +5 para acertar, alcance 1,5 m. 6 (1d6 + 3) de dano perfurante.',
        },
        {
          name: 'Arco Curto',
          isAttack: true,
          attackType: 'Distância',
          attackBonus: '+5',
          reach: '24/96 m',
          damage: '1d6 + 3',
          damageType: 'Perfuração',
          description: 'Ataque com Arma: +5 para acertar, alcance 24/96 m. 6 (1d6 + 3) de dano perfurante.',
        },
      ],
    },
  },
  {
    id: 'srd-2014-wolf',
    name: 'Lobo',
    ruleset: '2014',
    challengeRating: '1/4',
    source: 'SRD 5.1 (2014) — Wizards of the Coast, CC-BY-4.0',
    data: {
      details: {
        species: 'Fera',
        size: 'Médio',
        alignment: 'Sem alinhamento',
      },
      stats: {
        maxHp: 11,
        hpCurrent: 11,
        ac: 13,
        movements: [{ id: 'movement-1', source: 'Terra', distance: 12 }],
        strength: 12,
        dexterity: 15,
        constitution: 12,
        intelligence: 3,
        wisdom: 12,
        charisma: 6,
      },
      traits: {
        skills: ['Percepção +3', 'Furtividade +4'],
        challengeRating: '1/4',
        xp: 50,
      },
      actions: [
        {
          name: 'Mordida',
          isAttack: true,
          attackType: 'Corpo-a-corpo',
          attackBonus: '+4',
          reach: '1,5 m',
          damage: '2d4 + 2',
          damageType: 'Perfuração',
          description:
            'Ataque com Arma Corpo a Corpo: +4 para acertar, alcance 1,5 m, um alvo. Acerto: 7 (2d4 + 2) de dano perfurante. Se o alvo for uma criatura, deve ser bem-sucedido em um teste de resistência de Força CD 11, ou ficará caído.',
        },
      ],
      features: [
        {
          name: 'Audição e Olfato Aguçados',
          description:
            'O lobo tem vantagem em testes de Sabedoria (Percepção) que dependam de audição ou olfato.',
        },
        {
          name: 'Táticas de Matilha',
          description:
            'O lobo tem vantagem em jogadas de ataque contra uma criatura se pelo menos um aliado do lobo estiver a 1,5 m dela e o aliado não estiver incapacitado.',
        },
      ],
    },
  },
  {
    id: 'srd-2024-wolf',
    name: 'Lobo',
    ruleset: '2024',
    challengeRating: '1/4',
    source: 'SRD 5.2 (2024) — Wizards of the Coast, CC-BY-4.0',
    data: {
      details: {
        species: 'Fera',
        size: 'Médio',
        alignment: 'Sem alinhamento',
      },
      stats: {
        maxHp: 11,
        hpCurrent: 11,
        ac: 12,
        movements: [{ id: 'movement-1', source: 'Terra', distance: 12 }],
        strength: 14,
        dexterity: 15,
        constitution: 12,
        intelligence: 3,
        wisdom: 12,
        charisma: 6,
      },
      traits: {
        skills: ['Percepção +5', 'Furtividade +4'],
        challengeRating: '1/4',
        xp: 50,
      },
      actions: [
        {
          name: 'Mordida',
          isAttack: true,
          attackType: 'Corpo-a-corpo',
          attackBonus: '+4',
          reach: '1,5 m',
          damage: '1d6 + 2',
          damageType: 'Perfuração',
          description:
            'Ataque com Arma: +4, alcance 1,5 m. 5 (1d6 + 2) de dano perfurante. Se o alvo for uma criatura Média ou menor, ela recebe a condição Caído.',
        },
      ],
      features: [
        {
          name: 'Táticas de Matilha',
          description:
            'O lobo tem Vantagem em jogadas de ataque contra uma criatura se pelo menos um aliado do lobo estiver a 1,5 m dela e o aliado não tiver a condição Incapacitado.',
        },
      ],
    },
  },

  // ── Ampliação (conferida contra api.open5e.com/v2, 2026-09-22) ──
  {
    id: 'srd-2014-zombie',
    name: 'Zumbi',
    ruleset: '2014',
    challengeRating: '1/4',
    source: 'SRD 5.1 (2014) — Wizards of the Coast, CC-BY-4.0',
    data: {
      details: { species: 'Morto-vivo', size: 'Médio', alignment: 'Neutro e mau' },
      stats: {
        maxHp: 22, hpCurrent: 22, ac: 8,
        movements: [{ id: 'movement-1', source: 'Terra', distance: 6 }],
        strength: 13, dexterity: 6, constitution: 16, intelligence: 3, wisdom: 6, charisma: 5,
      },
      traits: {
        savingThrows: ['Sabedoria +0'],
        languages: ['Entende os idiomas que tinha em vida, mas não consegue falar'],
        conditionImmunities: ['Envenenado'],
        challengeRating: '1/4', xp: 50,
      },
      actions: [
        {
          name: 'Pancada', isAttack: true, attackType: 'Corpo-a-corpo', attackBonus: '+3', reach: '1,5 m',
          damage: '1d6 + 1', damageType: 'Concussão',
          description: 'Ataque com Arma Corpo a Corpo: +3 para acertar, alcance 1,5 m, um alvo. Acerto: 4 (1d6 + 1) de dano de concussão.',
        },
      ],
      features: [
        {
          name: 'Fortitude Morto-Vivo',
          description: 'Se um dano reduzir o zumbi a 0 pontos de vida, ele faz um teste de resistência de Constituição com CD 5 + o dano sofrido, a menos que o dano seja radiante ou de um acerto crítico. Se for bem-sucedido, o zumbi fica com 1 ponto de vida.',
        },
      ],
    },
  },
  {
    id: 'srd-2024-zombie',
    name: 'Zumbi',
    ruleset: '2024',
    challengeRating: '1/4',
    source: 'SRD 5.2 (2024) — Wizards of the Coast, CC-BY-4.0',
    data: {
      details: { species: 'Morto-vivo', size: 'Médio', alignment: 'Neutro e mau' },
      stats: {
        maxHp: 15, hpCurrent: 15, ac: 8,
        movements: [{ id: 'movement-1', source: 'Terra', distance: 6 }],
        strength: 13, dexterity: 6, constitution: 16, intelligence: 3, wisdom: 6, charisma: 5,
      },
      traits: {
        savingThrows: ['Sabedoria +0'],
        languages: ['Entende Comum e mais um idioma, mas não consegue falar'],
        immunities: ['Veneno'],
        conditionImmunities: ['Exaustão', 'Envenenado'],
        challengeRating: '1/4', xp: 50,
      },
      actions: [
        {
          name: 'Pancada', isAttack: true, attackType: 'Corpo-a-corpo', attackBonus: '+3', reach: '1,5 m',
          damage: '1d8 + 1', damageType: 'Concussão',
          description: 'Ataque com Arma: +3, alcance 1,5 m. 5 (1d8 + 1) de dano de concussão.',
        },
      ],
      features: [
        {
          name: 'Fortitude Morto-Vivo',
          description: 'Se um dano reduzir o zumbi a 0 Pontos de Vida, ele faz um teste de resistência de Constituição (CD 5 mais o dano sofrido), a menos que o dano seja Radiante ou de um Acerto Crítico. Se for bem-sucedido, o zumbi fica com 1 Ponto de Vida.',
        },
      ],
    },
  },
  {
    id: 'srd-2014-ghoul',
    name: 'Carniçal',
    ruleset: '2014',
    challengeRating: '1',
    source: 'SRD 5.1 (2014) — Wizards of the Coast, CC-BY-4.0',
    data: {
      details: { species: 'Morto-vivo', size: 'Médio', alignment: 'Caótico e mau' },
      stats: {
        maxHp: 22, hpCurrent: 22, ac: 12,
        movements: [{ id: 'movement-1', source: 'Terra', distance: 9 }],
        strength: 13, dexterity: 15, constitution: 10, intelligence: 7, wisdom: 10, charisma: 6,
      },
      traits: {
        languages: ['Comum'],
        immunities: ['Veneno'],
        conditionImmunities: ['Enfeitiçado', 'Exaustão', 'Envenenado'],
        challengeRating: '1', xp: 200,
      },
      actions: [
        {
          name: 'Mordida', isAttack: true, attackType: 'Corpo-a-corpo', attackBonus: '+2', reach: '1,5 m',
          damage: '2d6 + 2', damageType: 'Perfuração',
          description: 'Ataque com Arma Corpo a Corpo: +2 para acertar, alcance 1,5 m, uma criatura. Acerto: 9 (2d6 + 2) de dano perfurante.',
        },
        {
          name: 'Garras', isAttack: true, attackType: 'Corpo-a-corpo', attackBonus: '+4', reach: '1,5 m',
          damage: '2d4 + 2', damageType: 'Corte',
          description: 'Ataque com Arma Corpo a Corpo: +4 para acertar, alcance 1,5 m, um alvo. Acerto: 7 (2d4 + 2) de dano cortante. Se o alvo for uma criatura que não seja elfo nem morto-vivo, deve ser bem-sucedido em um teste de resistência de Constituição CD 10 ou ficará paralisado por 1 minuto. O alvo pode repetir o teste no fim de cada um dos seus turnos, encerrando o efeito em si mesmo com um sucesso.',
        },
      ],
    },
  },
  {
    id: 'srd-2024-ghoul',
    name: 'Carniçal',
    ruleset: '2024',
    challengeRating: '1',
    source: 'SRD 5.2 (2024) — Wizards of the Coast, CC-BY-4.0',
    data: {
      details: { species: 'Morto-vivo', size: 'Médio', alignment: 'Caótico e mau' },
      stats: {
        maxHp: 22, hpCurrent: 22, ac: 12,
        movements: [{ id: 'movement-1', source: 'Terra', distance: 9 }],
        strength: 13, dexterity: 15, constitution: 10, intelligence: 7, wisdom: 10, charisma: 6,
      },
      traits: {
        languages: ['Comum'],
        immunities: ['Veneno'],
        conditionImmunities: ['Enfeitiçado', 'Exaustão', 'Envenenado'],
        challengeRating: '1', xp: 200,
      },
      actions: [
        {
          name: 'Ataques Múltiplos', isMultiattack: true, attackCount: 2,
          description: 'O carniçal faz dois ataques de Mordida.',
        },
        {
          name: 'Mordida', isAttack: true, attackType: 'Corpo-a-corpo', attackBonus: '+4', reach: '1,5 m',
          damage: '1d6 + 2', damageType: 'Perfuração',
          damages: [{ dice: '1d6', bonus: '+2', type: 'Perfuração' }, { dice: '1d6', bonus: '', type: 'Necrótico' }],
          description: 'Ataque com Arma: +4, alcance 1,5 m. 5 (1d6 + 2) de dano perfurante mais 3 (1d6) de dano necrótico.',
        },
        {
          name: 'Garra', isAttack: true, attackType: 'Corpo-a-corpo', attackBonus: '+4', reach: '1,5 m',
          damage: '1d4 + 2', damageType: 'Corte',
          description: 'Ataque com Arma: +4, alcance 1,5 m. 4 (1d4 + 2) de dano cortante. Se o alvo for uma criatura que não seja Morto-vivo nem elfo, faz um teste de resistência de Constituição CD 10. Falha: o alvo recebe a condição Paralisado até o fim do próximo turno dele.',
        },
      ],
    },
  },
  {
    id: 'srd-2014-ogre',
    name: 'Ogro',
    ruleset: '2014',
    challengeRating: '2',
    source: 'SRD 5.1 (2014) — Wizards of the Coast, CC-BY-4.0',
    data: {
      details: { species: 'Gigante', size: 'Grande', alignment: 'Caótico e mau' },
      stats: {
        maxHp: 59, hpCurrent: 59, ac: 11,
        movements: [{ id: 'movement-1', source: 'Terra', distance: 12 }],
        strength: 19, dexterity: 8, constitution: 16, intelligence: 5, wisdom: 7, charisma: 7,
      },
      traits: { languages: ['Comum', 'Gigante'], challengeRating: '2', xp: 450 },
      actions: [
        {
          name: 'Clava Grande', isAttack: true, attackType: 'Corpo-a-corpo', attackBonus: '+6', reach: '1,5 m',
          damage: '2d8 + 4', damageType: 'Concussão',
          description: 'Ataque com Arma Corpo a Corpo: +6 para acertar, alcance 1,5 m, um alvo. Acerto: 13 (2d8 + 4) de dano de concussão.',
        },
        {
          name: 'Azagaia', isAttack: true, attackType: 'Distância', attackBonus: '+6', reach: '1,5 m ou 9/36 m',
          damage: '2d6 + 4', damageType: 'Perfuração',
          description: 'Ataque com Arma Corpo a Corpo ou à Distância: +6 para acertar, alcance 1,5 m ou distância 9/36 m, um alvo. Acerto: 11 (2d6 + 4) de dano perfurante.',
        },
      ],
    },
  },
  {
    id: 'srd-2024-ogre',
    name: 'Ogro',
    ruleset: '2024',
    challengeRating: '2',
    source: 'SRD 5.2 (2024) — Wizards of the Coast, CC-BY-4.0',
    data: {
      details: { species: 'Gigante', size: 'Grande', alignment: 'Caótico e mau' },
      stats: {
        maxHp: 68, hpCurrent: 68, ac: 11,
        movements: [{ id: 'movement-1', source: 'Terra', distance: 12 }],
        strength: 19, dexterity: 8, constitution: 16, intelligence: 5, wisdom: 7, charisma: 7,
      },
      traits: { languages: ['Comum', 'Gigante'], challengeRating: '2', xp: 450 },
      actions: [
        {
          name: 'Clava Grande', isAttack: true, attackType: 'Corpo-a-corpo', attackBonus: '+6', reach: '1,5 m',
          damage: '2d8 + 4', damageType: 'Concussão',
          description: 'Ataque com Arma: +6, alcance 1,5 m. 13 (2d8 + 4) de dano de concussão.',
        },
        {
          name: 'Azagaia', isAttack: true, attackType: 'Distância', attackBonus: '+6', reach: '1,5 m ou 9/36 m',
          damage: '2d6 + 4', damageType: 'Perfuração',
          description: 'Ataque com Arma Corpo a Corpo ou à Distância: +6, alcance 1,5 m ou distância 9/36 m. 11 (2d6 + 4) de dano perfurante.',
        },
      ],
    },
  },
  {
    id: 'srd-2014-owlbear',
    name: 'Urso-Coruja',
    ruleset: '2014',
    challengeRating: '3',
    source: 'SRD 5.1 (2014) — Wizards of the Coast, CC-BY-4.0',
    data: {
      details: { species: 'Monstruosidade', size: 'Grande', alignment: 'Sem alinhamento' },
      stats: {
        maxHp: 59, hpCurrent: 59, ac: 13,
        movements: [{ id: 'movement-1', source: 'Terra', distance: 12 }],
        strength: 20, dexterity: 12, constitution: 17, intelligence: 3, wisdom: 12, charisma: 7,
      },
      traits: { skills: ['Percepção +3'], challengeRating: '3', xp: 700 },
      actions: [
        {
          name: 'Ataques Múltiplos', isMultiattack: true, attackCount: 2,
          description: 'O urso-coruja faz dois ataques: um com o bico e um com as garras.',
        },
        {
          name: 'Bico', isAttack: true, attackType: 'Corpo-a-corpo', attackBonus: '+7', reach: '1,5 m',
          damage: '1d10 + 5', damageType: 'Perfuração',
          description: 'Ataque com Arma Corpo a Corpo: +7 para acertar, alcance 1,5 m, uma criatura. Acerto: 10 (1d10 + 5) de dano perfurante.',
        },
        {
          name: 'Garras', isAttack: true, attackType: 'Corpo-a-corpo', attackBonus: '+7', reach: '1,5 m',
          damage: '2d8 + 5', damageType: 'Corte',
          description: 'Ataque com Arma Corpo a Corpo: +7 para acertar, alcance 1,5 m, um alvo. Acerto: 14 (2d8 + 5) de dano cortante.',
        },
      ],
      features: [
        {
          name: 'Visão e Olfato Aguçados',
          description: 'O urso-coruja tem vantagem em testes de Sabedoria (Percepção) que dependam de visão ou olfato.',
        },
      ],
    },
  },
  {
    id: 'srd-2024-owlbear',
    name: 'Urso-Coruja',
    ruleset: '2024',
    challengeRating: '3',
    source: 'SRD 5.2 (2024) — Wizards of the Coast, CC-BY-4.0',
    data: {
      details: { species: 'Monstruosidade', size: 'Grande', alignment: 'Sem alinhamento' },
      stats: {
        maxHp: 59, hpCurrent: 59, ac: 13,
        movements: [{ id: 'movement-1', source: 'Terra', distance: 12 }],
        strength: 20, dexterity: 12, constitution: 17, intelligence: 3, wisdom: 12, charisma: 7,
      },
      traits: { skills: ['Percepção +5'], challengeRating: '3', xp: 700 },
      actions: [
        {
          name: 'Ataques Múltiplos', isMultiattack: true, attackCount: 2,
          description: 'O urso-coruja faz dois ataques de Dilacerar.',
        },
        {
          name: 'Dilacerar', isAttack: true, attackType: 'Corpo-a-corpo', attackBonus: '+7', reach: '1,5 m',
          damage: '2d8 + 5', damageType: 'Corte',
          description: 'Ataque com Arma: +7, alcance 1,5 m. 14 (2d8 + 5) de dano cortante.',
        },
      ],
    },
  },
  {
    id: 'srd-2014-giant-spider',
    name: 'Aranha Gigante',
    ruleset: '2014',
    challengeRating: '1',
    source: 'SRD 5.1 (2014) — Wizards of the Coast, CC-BY-4.0',
    data: {
      details: { species: 'Fera', size: 'Grande', alignment: 'Sem alinhamento' },
      stats: {
        maxHp: 26, hpCurrent: 26, ac: 14,
        movements: [
          { id: 'movement-1', source: 'Terra', distance: 9 },
          { id: 'movement-2', source: 'Escalada', distance: 9 },
        ],
        strength: 14, dexterity: 16, constitution: 12, intelligence: 2, wisdom: 11, charisma: 4,
      },
      traits: { skills: ['Furtividade +7'], challengeRating: '1', xp: 200 },
      actions: [
        {
          name: 'Mordida', isAttack: true, attackType: 'Corpo-a-corpo', attackBonus: '+5', reach: '1,5 m',
          damage: '1d8 + 3', damageType: 'Perfuração',
          damages: [{ dice: '1d8', bonus: '+3', type: 'Perfuração' }, { dice: '2d8', bonus: '', type: 'Veneno' }],
          description: 'Ataque com Arma Corpo a Corpo: +5 para acertar, alcance 1,5 m, uma criatura. Acerto: 7 (1d8 + 3) de dano perfurante, e o alvo faz um teste de resistência de Constituição CD 11, sofrendo 9 (2d8) de dano de veneno se falhar, ou metade se for bem-sucedido. Se o dano de veneno reduzir o alvo a 0 pontos de vida, ele fica estável, mas envenenado por 1 hora, mesmo que recupere pontos de vida, e paralisado enquanto estiver envenenado dessa forma.',
        },
        {
          name: 'Teia', isAttack: true, attackType: 'Distância', attackBonus: '+5', reach: '9/18 m',
          hasLimitedUses: true, maxUses: 1, currentUses: 1, recharge: 'recharge56',
          description: 'Recarga 5–6. Ataque com Arma à Distância: +5 para acertar, distância 9/18 m, uma criatura. Acerto: o alvo fica impedido pela teia. Com uma ação, o alvo impedido pode fazer um teste de Força CD 12, rompendo a teia com um sucesso. A teia também pode ser atacada e destruída (CA 10; 5 PV; vulnerabilidade a dano de fogo; imunidade a dano de concussão, veneno e psíquico).',
        },
      ],
      features: [
        {
          name: 'Escalar como Aranha',
          description: 'A aranha pode escalar superfícies difíceis, inclusive de cabeça para baixo no teto, sem precisar fazer um teste de atributo.',
        },
        {
          name: 'Sentido de Teia',
          description: 'Enquanto estiver em contato com uma teia, a aranha sabe a localização exata de qualquer outra criatura em contato com a mesma teia.',
        },
        {
          name: 'Andarilha da Teia',
          description: 'A aranha ignora restrições de movimento causadas por teias.',
        },
      ],
    },
  },
  {
    id: 'srd-2024-giant-spider',
    name: 'Aranha Gigante',
    ruleset: '2024',
    challengeRating: '1',
    source: 'SRD 5.2 (2024) — Wizards of the Coast, CC-BY-4.0',
    data: {
      details: { species: 'Fera', size: 'Grande', alignment: 'Sem alinhamento' },
      stats: {
        maxHp: 26, hpCurrent: 26, ac: 14,
        movements: [
          { id: 'movement-1', source: 'Terra', distance: 9 },
          { id: 'movement-2', source: 'Escalada', distance: 9 },
        ],
        strength: 14, dexterity: 16, constitution: 12, intelligence: 2, wisdom: 11, charisma: 4,
      },
      traits: { skills: ['Percepção +4'], challengeRating: '1', xp: 200 },
      actions: [
        {
          name: 'Mordida', isAttack: true, attackType: 'Corpo-a-corpo', attackBonus: '+5', reach: '1,5 m',
          damage: '1d8 + 3', damageType: 'Perfuração',
          damages: [{ dice: '1d8', bonus: '+3', type: 'Perfuração' }, { dice: '2d6', bonus: '', type: 'Veneno' }],
          description: 'Ataque com Arma: +5, alcance 1,5 m. 7 (1d8 + 3) de dano perfurante mais 7 (2d6) de dano de veneno.',
        },
        {
          name: 'Teia',
          hasLimitedUses: true, maxUses: 1, currentUses: 1, recharge: 'recharge56',
          description: 'Recarga 5–6. Teste de resistência de Destreza: CD 13, uma criatura que a aranha consiga ver a até 18 m. Falha: o alvo recebe a condição Impedido até a teia ser destruída (CA 10; 5 PV; vulnerabilidade a dano de Fogo; imunidade a dano de Veneno e Psíquico).',
        },
      ],
      features: [
        {
          name: 'Escalar como Aranha',
          description: 'A aranha pode escalar superfícies difíceis, inclusive pelo teto, sem precisar fazer um teste de atributo.',
        },
        {
          name: 'Andarilha da Teia',
          description: 'A aranha ignora restrições de movimento causadas por teias e sabe a localização de qualquer outra criatura em contato com a mesma teia.',
        },
      ],
    },
  },
  {
    id: 'srd-2014-bandit',
    name: 'Bandido',
    ruleset: '2014',
    challengeRating: '1/8',
    source: 'SRD 5.1 (2014) — Wizards of the Coast, CC-BY-4.0',
    data: {
      details: { kind: 'npc', species: 'Humanoide (qualquer espécie)', size: 'Médio', alignment: 'Qualquer não leal' },
      stats: {
        maxHp: 11, hpCurrent: 11, ac: 12,
        movements: [{ id: 'movement-1', source: 'Terra', distance: 9 }],
        strength: 11, dexterity: 12, constitution: 12, intelligence: 10, wisdom: 10, charisma: 10,
      },
      traits: { languages: ['Um idioma qualquer (geralmente Comum)'], challengeRating: '1/8', xp: 25 },
      actions: [
        {
          name: 'Cimitarra', isAttack: true, attackType: 'Corpo-a-corpo', attackBonus: '+3', reach: '1,5 m',
          damage: '1d6 + 1', damageType: 'Corte',
          description: 'Ataque com Arma Corpo a Corpo: +3 para acertar, alcance 1,5 m, um alvo. Acerto: 4 (1d6 + 1) de dano cortante.',
        },
        {
          name: 'Besta Leve', isAttack: true, attackType: 'Distância', attackBonus: '+3', reach: '24/96 m',
          damage: '1d8 + 1', damageType: 'Perfuração',
          description: 'Ataque com Arma à Distância: +3 para acertar, distância 24/96 m, um alvo. Acerto: 5 (1d8 + 1) de dano perfurante.',
        },
      ],
    },
  },
  {
    id: 'srd-2024-bandit',
    name: 'Bandido',
    ruleset: '2024',
    challengeRating: '1/8',
    source: 'SRD 5.2 (2024) — Wizards of the Coast, CC-BY-4.0',
    data: {
      details: { kind: 'npc', species: 'Humanoide', size: 'Médio', alignment: 'Neutro' },
      stats: {
        maxHp: 11, hpCurrent: 11, ac: 12,
        movements: [{ id: 'movement-1', source: 'Terra', distance: 9 }],
        strength: 11, dexterity: 12, constitution: 12, intelligence: 10, wisdom: 10, charisma: 10,
      },
      traits: { languages: ['Comum', 'Gíria de Ladrão'], challengeRating: '1/8', xp: 25 },
      actions: [
        {
          name: 'Cimitarra', isAttack: true, attackType: 'Corpo-a-corpo', attackBonus: '+3', reach: '1,5 m',
          damage: '1d6 + 1', damageType: 'Corte',
          description: 'Ataque com Arma: +3, alcance 1,5 m. 4 (1d6 + 1) de dano cortante.',
        },
        {
          name: 'Besta Leve', isAttack: true, attackType: 'Distância', attackBonus: '+3', reach: '24/96 m',
          damage: '1d8 + 1', damageType: 'Perfuração',
          description: 'Ataque com Arma à Distância: +3, distância 24/96 m. 5 (1d8 + 1) de dano perfurante.',
        },
      ],
    },
  },
]
