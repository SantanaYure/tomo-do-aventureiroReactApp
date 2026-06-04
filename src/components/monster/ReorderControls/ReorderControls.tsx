import type { DragHandleProps } from '../useDragReorder'
import styles from './ReorderControls.module.css'

interface ReorderControlsProps {
    /** Nome do item, usado nos rótulos acessíveis dos botões. */
    label: string
    isFirst: boolean
    isLast: boolean
    onMoveUp: () => void
    onMoveDown: () => void
    handleProps: DragHandleProps
}

/**
 * Barra de reordenação exibida no topo de cada cartão editável:
 * ícone de arraste (drag and drop) à esquerda e botões mover para
 * cima/baixo (alternativa acessível) à direita.
 */
export function ReorderControls({
    label,
    isFirst,
    isLast,
    onMoveUp,
    onMoveDown,
    handleProps,
}: ReorderControlsProps) {
    return (
        <div className={styles.bar}>
            <span
                className={styles.handle}
                title="Arraste para reordenar"
                aria-hidden="true"
                {...handleProps}
            >
                ⠿
            </span>

            <div className={styles.moveButtons}>
                <button
                    type="button"
                    className={styles.moveButton}
                    onClick={onMoveUp}
                    disabled={isFirst}
                    aria-label={`Mover ${label} para cima`}
                    title="Mover para cima"
                >
                    ↑
                </button>
                <button
                    type="button"
                    className={styles.moveButton}
                    onClick={onMoveDown}
                    disabled={isLast}
                    aria-label={`Mover ${label} para baixo`}
                    title="Mover para baixo"
                >
                    ↓
                </button>
            </div>
        </div>
    )
}

/**
 * Combina a classe base do cartão com as classes de estado de arraste
 * (item arrastado / alvo sob o cursor). Mantém os estilos de reordenação
 * centralizados neste módulo, evitando duplicação entre os painéis.
 */
export function reorderCardClass(
    baseClass: string,
    isDragging: boolean,
    isDragOver: boolean,
): string {
    return [
        baseClass,
        isDragging ? styles.cardDragging : '',
        isDragOver ? styles.cardDragOver : '',
    ]
        .filter(Boolean)
        .join(' ')
}
