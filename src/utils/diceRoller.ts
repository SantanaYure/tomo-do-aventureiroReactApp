import type { DamagePart } from '../types/system/dnd/DamagePart'

export interface DamageRollResult {
  dice: string
  type: string
  bonus: number
  rawRoll: number
  subtotal: number
}

export interface DamageRollSummary {
  results: DamageRollResult[]
  total: number
}

function parseDice(notation: string): { count: number; sides: number } | null {
  const match = /^(\d+)d(\d+)$/i.exec(notation.trim())
  if (!match) return null
  const count = parseInt(match[1], 10)
  const sides = parseInt(match[2], 10)
  if (!Number.isFinite(count) || !Number.isFinite(sides) || count < 1 || sides < 1) return null
  return { count, sides }
}

function parseBonus(raw: string): number {
  const trimmed = raw.trim()
  if (!trimmed) return 0
  const cleaned = trimmed.replace(/^\+/, '')
  const parsed = parseInt(cleaned, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1
}

export function rollDamages(damages: DamagePart[]): DamageRollSummary {
  const results: DamageRollResult[] = []
  let total = 0
  for (const part of damages) {
    const parsed = parseDice(part.dice)
    const bonus = parseBonus(part.bonus)
    let rawRoll = 0
    if (parsed !== null) {
      for (let i = 0; i < parsed.count; i++) {
        rawRoll += rollDie(parsed.sides)
      }
    }
    const subtotal = Math.max(0, rawRoll + bonus)
    results.push({ dice: part.dice, type: part.type, bonus, rawRoll, subtotal })
    total += subtotal
  }
  return { results, total }
}

export function formatRollLine(result: DamageRollResult): string {
  const label = [result.dice, result.type].filter((part) => part && part.trim()).join(' ').trim()
  const prefix = label || '(sem dado)'
  if (result.bonus === 0) return `${prefix}: ${result.rawRoll}`
  const sign = result.bonus > 0 ? `+ ${result.bonus}` : `− ${Math.abs(result.bonus)}`
  return `${prefix}: ${result.rawRoll} ${sign} = ${result.subtotal}`
}
