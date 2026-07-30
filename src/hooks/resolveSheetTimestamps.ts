// src/hooks/resolveSheetTimestamps.ts
// Resolve `createdAt`/`updatedAt` de um documento de ficha.
//
// Por que existe: documentos legados podem não ter esses campos. Fabricar
// `new Date().toISOString()` a cada snapshot, como era feito antes, produz um
// valor DIFERENTE em cada leitura do mesmo documento — e isso quebra duas coisas:
//
//  1. o autosave ancora o rascunho local no `updatedAt` conhecido; com um valor
//     novo a cada snapshot a âncora nunca casa e todo rascunho é descartado na
//     reabertura, deixando a ficha legada permanentemente sem rede de segurança;
//  2. `createdAt` fabricado é regravado no documento no save seguinte, movendo a
//     data de criação a cada gravação.
//
// A resolução aqui é determinística: mesmo documento, mesmo resultado, em
// qualquer sessão. Não altera o que é gravado no Firestore.

/** Usado quando o documento não tem nenhuma data utilizável. */
export const UNKNOWN_SHEET_TIMESTAMP = '1970-01-01T00:00:00.000Z'

export interface SheetTimestamps {
  createdAt: string
  updatedAt: string
}

export function resolveSheetTimestamps(
  rawCreatedAt: unknown,
  rawUpdatedAt: unknown,
): SheetTimestamps {
  const createdAt =
    typeof rawCreatedAt === 'string' && rawCreatedAt.length > 0
      ? rawCreatedAt
      : UNKNOWN_SHEET_TIMESTAMP

  const updatedAt =
    typeof rawUpdatedAt === 'string' && rawUpdatedAt.length > 0 ? rawUpdatedAt : createdAt

  return { createdAt, updatedAt }
}
