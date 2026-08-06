import { memo } from 'react'
import type { LocalBackupError } from '../../hooks/useSheetAutosave'
import styles from './SheetNotices.module.css'

export interface SheetNoticesProps {
  /** Falha ao gravar a cópia local de segurança, quando houver. */
  localBackupError: LocalBackupError | null
  /** Momento do rascunho recuperado, em ISO, quando houver. */
  recoveredDraftAt: string | null
  /** Outra aba ou aparelho gravou esta ficha enquanto havia edição pendente. */
  remoteChangedElsewhere: boolean
  onSaveNow: () => void
  onDismissRecovery: () => void
  onDismissRemoteChange: () => void
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
  remoteChangedElsewhere,
  onSaveNow,
  onDismissRecovery,
  onDismissRemoteChange,
}: SheetNoticesProps) {
  if (!localBackupError && !recoveredDraftAt && !remoteChangedElsewhere) {
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

      {remoteChangedElsewhere && (
        <div className={`${styles.notice} ${styles.noticeWarning}`} role="alert">
          <span>
            Esta ficha também foi alterada em outro lugar (outra aba ou aparelho).
            Ao salvar, o que está nesta tela vai prevalecer. Recarregue se quiser
            ver a outra versão antes de continuar.
          </span>
          <button type="button" className={styles.dismiss} onClick={onDismissRemoteChange}>
            Entendi
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
