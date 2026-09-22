// Seed de monstros do SRD (System Reference Document), convertidos para o
// formato de MonsterSheet do Tomo.
//
// Fonte: SRD 5.1 (2014) e SRD 5.2 (2024), ambos publicados pela Wizards of
// the Coast sob a licença Creative Commons CC-BY-4.0. Estatísticas
// conferidas contra a API pública do open5e (api.open5e.com/v2) e da
// dnd5eapi.co em 2026-09-22.
//
// Este é um conjunto inicial pequeno (prova de conceito do pipeline de
// importação), não o SRD completo — ver CLAUDE.md / discussão da branch
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
]
