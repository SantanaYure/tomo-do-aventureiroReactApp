import { importCharacterSheetFromJSON, type ImportResult } from '../store/characterSheetStore'
import { importMonsterSheetFromJSON } from '../store/monsterSheetStore'
import { compressOversizedAvatarIfNeeded } from './importAvatarCompression'

/** Tamanho máximo de cada arquivo. Folga para a foto original em base64 antes da compressão. */
export const MAX_IMPORT_FILE_BYTES = 20 * 1024 * 1024

export type ImportScope = 'character' | 'monster' | 'npc' | 'unknown'

export type SheetImportOutcome = {
  fileName: string
  scope: ImportScope
  result: ImportResult
}

const failure = (reason: NonNullable<ImportResult['reason']>): ImportResult => ({
  imported: 0,
  skipped: 0,
  errors: 1,
  reason,
})

/**
 * Localiza os dados da ficha dentro do JSON. Aceita `{ id, data }`, a ficha
 * crua e `{ qualquerChave: { data } }`. Devolve a própria referência de dentro
 * de `parsed`: alterar o retorno altera o JSON completo.
 */
export function getImportedSheetData(parsed: unknown): Record<string, unknown> | null {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null

  const entry = parsed as Record<string, unknown>

  if (entry.data && typeof entry.data === 'object' && !Array.isArray(entry.data)) {
    return entry.data as Record<string, unknown>
  }

  // Ficha crua, sem o envelope { id, data }.
  if (
    (entry.character && typeof entry.character === 'object') ||
    (entry.details && typeof entry.details === 'object')
  ) {
    return entry
  }

  const entries = Object.values(entry)
  if (entries.length !== 1) return null

  const nestedEntry = entries[0]
  if (!nestedEntry || typeof nestedEntry !== 'object' || Array.isArray(nestedEntry)) return null

  const nestedRecord = nestedEntry as Record<string, unknown>
  if (!nestedRecord.data || typeof nestedRecord.data !== 'object' || Array.isArray(nestedRecord.data)) {
    return null
  }

  return nestedRecord.data as Record<string, unknown>
}

export function detectImportedSheetType(parsed: unknown): ImportScope {
  const data = getImportedSheetData(parsed)
  if (!data) return 'unknown'

  if (data.character && typeof data.character === 'object') return 'character'

  if (data.details && typeof data.details === 'object') {
    const details = data.details as Record<string, unknown>
    // Sem `kind` reconhecível, trata como monstro (o mesmo padrão da importação).
    const kind = typeof details.kind === 'string' ? details.kind.trim().toLowerCase() : ''
    return kind === 'npc' ? 'npc' : 'monster'
  }

  return 'unknown'
}

function readFileAsText(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

/** Importa um arquivo. Nunca lança: toda falha vira um `result` com `reason`. */
export async function importSheetFile(uid: string, file: File): Promise<SheetImportOutcome> {
  const fileName = file.name

  if (file.size > MAX_IMPORT_FILE_BYTES) {
    return { fileName, scope: 'unknown', result: failure('too-large') }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(await readFileAsText(file))
  } catch {
    return { fileName, scope: 'unknown', result: failure('invalid-json') }
  }

  const scope = detectImportedSheetType(parsed)
  if (scope === 'unknown') {
    return { fileName, scope, result: failure('not-a-sheet') }
  }

  const sheetData = getImportedSheetData(parsed)
  if (sheetData) await compressOversizedAvatarIfNeeded(sheetData, scope)

  const json = JSON.stringify(parsed)
  const result =
    scope === 'character'
      ? await importCharacterSheetFromJSON(uid, json)
      : await importMonsterSheetFromJSON(uid, json)

  return { fileName, scope, result }
}

/**
 * Importa os arquivos um de cada vez. Em sequência, e não em paralelo, para
 * não abrir várias imagens grandes na memória ao mesmo tempo e para que o
 * progresso mostrado corresponda ao arquivo em andamento.
 */
export async function importSheetFiles(
  uid: string,
  files: File[],
  onProgress?: (done: number, total: number, current: File) => void,
): Promise<SheetImportOutcome[]> {
  const outcomes: SheetImportOutcome[] = []
  for (const [index, file] of files.entries()) {
    onProgress?.(index, files.length, file)
    outcomes.push(await importSheetFile(uid, file))
  }
  return outcomes
}

const SCOPE_LABEL: Record<ImportScope, string> = {
  character: 'PJ',
  monster: 'Monstro',
  npc: 'NPC',
  unknown: 'Arquivo',
}

/*
 * Mensagens para quem usa o app, não para quem o programa: nada de "JSON",
 * "Firestore" ou "documento". O motivo técnico fica no `reason` e no console.
 */

function failureReasonText(reason: ImportResult['reason']): string {
  switch (reason) {
    case 'invalid-json':
      return 'Não conseguimos abrir esse arquivo. Ele pode estar danificado ou incompleto. Tente exportar a ficha de novo e importar outra vez.'
    case 'too-large':
      return 'Esse arquivo é grande demais para importar. Tente usar um avatar menor na ficha e exportar de novo.'
    case 'document-too-large':
      return 'A ficha é grande demais para salvar, mesmo depois de reduzirmos o avatar. Tente trocar por uma imagem menor.'
    case 'save-failed':
      return 'Abrimos a ficha, mas não conseguimos salvá-la agora. Confira sua internet e tente de novo.'
    default:
      return 'Esse arquivo não parece ser uma ficha do Tomo. Use um arquivo exportado pelo próprio Tomo.'
  }
}

/** Mensagem de um arquivo só, a mesma usada quando se importava um por vez. */
export function outcomeMessage({ scope, result }: SheetImportOutcome): string {
  if (result.imported > 0) return `${SCOPE_LABEL[scope]} importado com sucesso.`
  if (result.skipped > 0) return 'Essa ficha já está no seu Tomo, então ela foi mantida como estava.'
  if (result.errors > 0) return failureReasonText(result.reason)
  return 'Nenhuma ficha foi importada.'
}

/** Motivo curto de um arquivo que não entrou, para a lista do resumo. */
export function outcomeShortReason({ result }: SheetImportOutcome): string {
  if (result.skipped > 0) return 'já está no seu Tomo, então foi mantida como estava'
  switch (result.reason) {
    case 'invalid-json':
      return 'o arquivo está danificado ou incompleto e não abriu'
    case 'too-large':
      return 'o arquivo é grande demais para importar'
    case 'document-too-large':
      return 'a ficha é grande demais para salvar; tente um avatar menor'
    case 'save-failed':
      return 'não conseguimos salvar agora; confira sua internet e tente de novo'
    default:
      return 'não parece ser uma ficha do Tomo'
  }
}

export type ImportSummary = {
  imported: number
  skipped: number
  failed: number
  /** Texto principal. Com um arquivo só, é a mensagem detalhada de sempre. */
  message: string
  /** Arquivos que não entraram, com o motivo. Vazio quando há um arquivo só. */
  problems: Array<{ fileName: string; reason: string }>
  tone: 'ok' | 'error'
}

function fichas(count: number): string {
  return count === 1 ? '1 ficha' : `${count} fichas`
}

export function summarizeImport(outcomes: SheetImportOutcome[]): ImportSummary {
  const imported = outcomes.filter((o) => o.result.imported > 0).length
  const skipped = outcomes.filter((o) => o.result.imported === 0 && o.result.skipped > 0).length
  const failed = outcomes.length - imported - skipped
  const tone = imported === 0 && failed > 0 ? 'error' : 'ok'

  if (outcomes.length === 1) {
    return { imported, skipped, failed, message: outcomeMessage(outcomes[0]), problems: [], tone }
  }

  const problems = outcomes
    .filter((o) => o.result.imported === 0)
    .map((o) => ({ fileName: o.fileName, reason: outcomeShortReason(o) }))

  let message: string
  if (problems.length === 0) {
    message = `Pronto! ${fichas(imported)} ${imported === 1 ? 'foi importada' : 'foram importadas'}.`
  } else if (imported === 0) {
    message =
      skipped === outcomes.length
        ? 'Essas fichas já estavam no seu Tomo, então nada foi alterado.'
        : 'Não conseguimos importar essas fichas. Veja o que aconteceu com cada uma:'
  } else {
    const others = outcomes.length - imported === 1 ? 'com a outra' : 'com as outras'
    message = `${imported} de ${fichas(outcomes.length)} ${imported === 1 ? 'foi importada' : 'foram importadas'}. Veja o que aconteceu ${others}:`
  }

  return {
    imported,
    skipped,
    failed,
    message,
    problems: skipped === outcomes.length ? [] : problems,
    tone,
  }
}
