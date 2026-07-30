import { memo } from 'react'
import type { LocalBackupError } from '../../hooks/useSheetAutosave'
import styles from './SheetNotices.module.css'

export interface SheetNoticesProps {
  /** Falha ao gravar a cópia local de segurança, quando houver. */
  localBackupError: LocalBackupError | null
  /** Momento do rascunho recuperado, em ISO, quando houver. */
  recoveredDraftAt: string | null
  onSaveNow: () => void
  onDismissRecovery: () => void
}

function formatRecoveredAt(isoTimestamp: string): string {
  const parsed = new Date(isoTimestamp)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleString('pt-BR')
}

/**
 * Avisos de persistência das fichas (falha de cópia local e recuperação de
 * rascunho), numa região fixa que não participa do fluxo do documento.
 *
 * Antes eram blocos entre a barra superior e o cabeçalho: aparecer ou sumir
 * empurrava a ficha inteira. Aqui, entrar e sair não move nada.
 */
export const SheetNotices = memo(function SheetNotices({
  localBackupError,
  recoveredDraftAt,
  onSaveNow,
  onDismissRecovery,
}: SheetNoticesProps) {
  if (!localBackupError && !recoveredDraftAt) {
    return null
  }

  const recoveredAtLabel = recoveredDraftAt ? formatRecoveredAt(recoveredDraftAt) : ''

  return (
    <div className={styles.region}>
      {localBackupError && (
        <div className={`${styles.notice} ${styles.noticeWarning}`} role="alert">
          <span>
            {localBackupError === 'quota'
              ? 'O armazenamento do navegador está cheio: não foi possível guardar uma cópia local de segurança desta ficha.'
              : 'Não foi possível guardar uma cópia local de segurança desta ficha neste navegador.'}{' '}
            Se a conexão cair agora, alterações recentes podem ser perdidas.
          </span>
          <button type="button" className={styles.dismiss} onClick={onSaveNow}>
            Salvar agora
          </button>
        </div>
      )}

      {recoveredDraftAt && (
        <div className={styles.notice} role="status" aria-live="polite">
          <span>
            Recuperamos alterações que não chegaram a ser salvas
            {recoveredAtLabel && ` (${recoveredAtLabel})`}. Elas já estão sendo enviadas.
          </span>
          <button type="button" className={styles.dismiss} onClick={onDismissRecovery}>
            Entendi
          </button>
        </div>
      )}
    </div>
  )
})
