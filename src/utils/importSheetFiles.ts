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

function failureReasonText(reason: ImportResult['reason']): string {
  switch (reason) {
    case 'invalid-json':
      return 'O arquivo não é um JSON válido. Confira se ele não foi cortado ou editado com erro de sintaxe.'
    case 'too-large':
      return 'O arquivo passa de 20 MB. Reduza a imagem do avatar e tente de novo.'
    case 'document-too-large':
      return 'A ficha ficou grande demais para salvar, mesmo depois de reduzir o avatar. Troque a imagem por uma menor e tente de novo.'
    case 'save-failed':
      return 'A ficha foi lida, mas não foi possível salvá-la. Verifique sua conexão e tente de novo.'
    default:
      return 'O arquivo não parece ser uma ficha do Tomo. Ele precisa ter "character" (PJ) ou "details" (monstro ou NPC).'
  }
}

/** Mensagem de um arquivo só, a mesma usada quando se importava um por vez. */
export function outcomeMessage({ scope, result }: SheetImportOutcome): string {
  const label = SCOPE_LABEL[scope]
  const labelLow = scope === 'character' || scope === 'npc' ? label : label.toLowerCase()

  if (result.imported > 0) return `${label} importado com sucesso.`
  if (result.skipped > 0) return `Esse ${labelLow} já existe e não foi sobrescrito.`
  if (result.errors > 0) return failureReasonText(result.reason)
  return `Nenhum ${labelLow} foi importado.`
}

/** Motivo curto de um arquivo que não entrou, para a lista do resumo. */
export function outcomeShortReason({ result }: SheetImportOutcome): string {
  if (result.skipped > 0) return 'já existe, não foi sobrescrito'
  switch (result.reason) {
    case 'invalid-json':
      return 'JSON inválido'
    case 'too-large':
      return 'arquivo acima de 20 MB'
    case 'document-too-large':
      return 'ficha grande demais para salvar'
    case 'save-failed':
      return 'não foi possível salvar'
    default:
      return 'não é uma ficha do Tomo'
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

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

export function summarizeImport(outcomes: SheetImportOutcome[]): ImportSummary {
  const imported = outcomes.filter((o) => o.result.imported > 0).length
  const skipped = outcomes.filter((o) => o.result.imported === 0 && o.result.skipped > 0).length
  const failed = outcomes.length - imported - skipped
  const tone = imported === 0 && failed > 0 ? 'error' : 'ok'

  if (outcomes.length === 1) {
    return { imported, skipped, failed, message: outcomeMessage(outcomes[0]), problems: [], tone }
  }

  const parts = [plural(imported, 'ficha importada', 'fichas importadas')]
  if (skipped > 0) parts.push(plural(skipped, 'já existia', 'já existiam'))
  if (failed > 0) parts.push(plural(failed, 'com erro', 'com erro'))

  const problems = outcomes
    .filter((o) => o.result.imported === 0)
    .map((o) => ({ fileName: o.fileName, reason: outcomeShortReason(o) }))

  return {
    imported,
    skipped,
    failed,
    message: `${parts.join(', ')} de ${plural(outcomes.length, 'arquivo', 'arquivos')}.`,
    problems,
    tone,
  }
}
