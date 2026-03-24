const STORAGE_KEY = 'tomo:recentlyOpened'

type RecentlyOpenedMap = Record<string, string> // id → ISO timestamp

function readMap(): RecentlyOpenedMap {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return {}
        const parsed: unknown = JSON.parse(raw)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
        return parsed as RecentlyOpenedMap
    } catch {
        return {}
    }
}

/** Registra que uma ficha com o `id` foi aberta agora. */
export function recordOpened(id: string): void {
    if (!id) return
    const map = readMap()
    map[id] = new Date().toISOString()
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
    } catch {
        // localStorage indisponível ou cheio — ignora silenciosamente
    }
}

/** Retorna o ISO timestamp da última abertura de `id`, ou `null` caso nunca tenha sido aberta. */
export function getOpenedAt(id: string): string | null {
    return readMap()[id] ?? null
}
