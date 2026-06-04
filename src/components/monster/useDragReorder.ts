import { useRef, useState } from 'react'
import type { DragEvent } from 'react'

// Seletor usado pelo handle para localizar o cartão (drag image = cartão inteiro).
const CARD_SELECTOR = '[data-reorder-card]'

export interface DragHandleProps {
    draggable: true
    onDragStart: (event: DragEvent<HTMLElement>) => void
    onDragEnd: () => void
}

export interface DragCardProps {
    'data-reorder-card': true
    onDragOver: (event: DragEvent<HTMLElement>) => void
    onDragLeave: (event: DragEvent<HTMLElement>) => void
    onDrop: (event: DragEvent<HTMLElement>) => void
}

export interface UseDragReorderResult {
    /** Índice do item sendo arrastado (ou null). */
    draggingIndex: number | null
    /** Índice do item atualmente sob o cursor durante o arraste (ou null). */
    overIndex: number | null
    /** Move o item uma posição para cima. */
    moveUp: (index: number) => void
    /** Move o item uma posição para baixo. */
    moveDown: (index: number) => void
    /** Props para o cartão (alvo de soltura). */
    getCardProps: (index: number) => DragCardProps
    /** Props para o ícone de arraste (origem do arraste). */
    getHandleProps: (index: number) => DragHandleProps
}

/**
 * Reordenação manual de uma lista por arrastar e soltar (drag and drop nativo
 * do HTML5) com alternativa acessível via mover para cima/baixo.
 *
 * Cada instância só responde ao seu próprio arraste (via ref interna), de modo
 * que arrastar um item de uma lista e soltar sobre outra lista (outra instância)
 * é simplesmente ignorado — impedindo mover itens entre seções.
 *
 * Não cria estrutura de dados nova: apenas devolve um novo array reordenado
 * para `onReorder`, que deve persistir a ordem pelo fluxo normal da ficha.
 */
export function useDragReorder<T>(
    items: T[],
    onReorder: (next: T[]) => void,
): UseDragReorderResult {
    const draggingIndexRef = useRef<number | null>(null)
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
    const [overIndex, setOverIndex] = useState<number | null>(null)

    function reset() {
        draggingIndexRef.current = null
        setDraggingIndex(null)
        setOverIndex(null)
    }

    function move(from: number, to: number) {
        if (
            from === to ||
            from < 0 ||
            to < 0 ||
            from >= items.length ||
            to >= items.length
        ) {
            return
        }

        const next = items.slice()
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        onReorder(next)
    }

    function moveUp(index: number) {
        move(index, index - 1)
    }

    function moveDown(index: number) {
        move(index, index + 1)
    }

    function getCardProps(index: number): DragCardProps {
        return {
            'data-reorder-card': true,
            onDragOver: (event) => {
                if (draggingIndexRef.current === null) return
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
                if (overIndex !== index) setOverIndex(index)
            },
            onDragLeave: (event) => {
                // Ignora dragleave disparado ao entrar em um filho do cartão.
                if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    return
                }
                setOverIndex((current) => (current === index ? null : current))
            },
            onDrop: (event) => {
                if (draggingIndexRef.current === null) return
                event.preventDefault()
                move(draggingIndexRef.current, index)
                reset()
            },
        }
    }

    function getHandleProps(index: number): DragHandleProps {
        return {
            draggable: true,
            onDragStart: (event) => {
                draggingIndexRef.current = index
                setDraggingIndex(index)
                event.dataTransfer.effectAllowed = 'move'
                // Necessário para iniciar o arraste em alguns navegadores (Firefox).
                event.dataTransfer.setData('text/plain', String(index))

                const card = event.currentTarget.closest(CARD_SELECTOR)
                if (card instanceof HTMLElement) {
                    event.dataTransfer.setDragImage(card, 16, 16)
                }
            },
            onDragEnd: () => {
                reset()
            },
        }
    }

    return {
        draggingIndex,
        overIndex,
        moveUp,
        moveDown,
        getCardProps,
        getHandleProps,
    }
}
