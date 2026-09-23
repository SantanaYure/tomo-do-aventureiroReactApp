import { deleteCharacterSheet } from '../store/characterSheetStore'
import { deleteMonsterSheet } from '../store/monsterSheetStore'

export type SheetDeleteTarget = {
  /** Coleção da ficha: PJ ou monstro/NPC (NPC mora na coleção de monstros). */
  type: 'character' | 'monster'
  id: string
  name: string
  /** Mesa em que a ficha está, para liberar o herói ou a criatura antes. */
  campaignId?: string | null
}

export type SheetDeleteOutcome = {
  target: SheetDeleteTarget
  ok: boolean
}

/** Chave estável de seleção: o mesmo id pode existir nas duas coleções. */
export function sheetKey(type: SheetDeleteTarget['type'], id: string): string {
  return `${type}:${id}`
}

/**
 * Exclui uma ficha. Se ela estiver numa mesa, libera antes o herói (PJ) ou
 * desvincula as criaturas (monstro/NPC), para não sobrar ninguém fantasma em
 * cena. É o mesmo caminho da exclusão individual.
 */
export async function deleteSheet(uid: string, target: SheetDeleteTarget): Promise<void> {
  const { releaseCharacterSheetFromCampaign, releaseMonsterSheetFromCampaign } = await import(
    '../store/campaignStore'
  )

  if (target.type === 'character') {
    if (target.campaignId) await releaseCharacterSheetFromCampaign(target.campaignId, uid, target.id)
    await deleteCharacterSheet(uid, target.id)
  } else {
    if (target.campaignId) await releaseMonsterSheetFromCampaign(target.campaignId, uid, target.id)
    await deleteMonsterSheet(uid, target.id)
  }
}

/**
 * Exclui várias fichas, uma de cada vez. Uma falha não interrompe as outras;
 * o resultado diz quais saíram e quais ficaram.
 */
export async function deleteSheets(
  uid: string,
  targets: SheetDeleteTarget[],
  onProgress?: (done: number, total: number, current: SheetDeleteTarget) => void,
): Promise<SheetDeleteOutcome[]> {
  const outcomes: SheetDeleteOutcome[] = []
  for (const [index, target] of targets.entries()) {
    onProgress?.(index, targets.length, target)
    try {
      await deleteSheet(uid, target)
      outcomes.push({ target, ok: true })
    } catch (error) {
      console.error(`Erro ao excluir a ficha ${target.id}:`, error)
      outcomes.push({ target, ok: false })
    }
  }
  return outcomes
}

export type DeleteSummary = {
  message: string
  problems: Array<{ fileName: string; reason: string }>
  tone: 'ok' | 'error'
}

const FAILED_REASON = 'não conseguimos excluir agora; confira sua internet e tente de novo'

function fichas(count: number): string {
  return count === 1 ? '1 ficha' : `${count} fichas`
}

/**
 * Resumo para o jogador. Excluir uma ficha só com sucesso não precisa de
 * aviso (ela some da lista); por isso devolve `null` nesse caso.
 */
export function summarizeDelete(outcomes: SheetDeleteOutcome[]): DeleteSummary | null {
  const deleted = outcomes.filter((o) => o.ok).length
  const failed = outcomes.filter((o) => !o.ok)
  const displayName = (o: SheetDeleteOutcome) => o.target.name.trim() || '(sem nome)'

  if (outcomes.length === 1) {
    if (deleted === 1) return null
    return {
      message: `Não conseguimos excluir "${displayName(outcomes[0])}" agora. Confira sua internet e tente de novo.`,
      problems: [],
      tone: 'error',
    }
  }

  const problems = failed.map((o) => ({ fileName: displayName(o), reason: FAILED_REASON }))

  if (failed.length === 0) {
    return {
      message: `Pronto! ${fichas(deleted)} ${deleted === 1 ? 'foi excluída' : 'foram excluídas'}.`,
      problems,
      tone: 'ok',
    }
  }

  if (deleted === 0) {
    return {
      message: 'Não conseguimos excluir essas fichas. Veja o que aconteceu com cada uma:',
      problems,
      tone: 'error',
    }
  }

  const others = failed.length === 1 ? 'com a outra' : 'com as outras'
  return {
    message: `${deleted} de ${fichas(outcomes.length)} ${deleted === 1 ? 'foi excluída' : 'foram excluídas'}. Veja o que aconteceu ${others}:`,
    problems,
    tone: 'ok',
  }
}
