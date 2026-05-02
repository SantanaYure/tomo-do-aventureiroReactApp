export type ManagedResourceStatus = 'unavailable' | 'depleted' | 'full' | 'available'

export interface ManagedResource {
  current: number
  max: number
}

export type ManagedResourceInput = Partial<{
  current: number
  max: number
  currentUses: number
  maxUses: number
  remaining: number
  total: number
  value: number
  uses: number
  charges: number
  spent: number
  pointsUsed: number
  pointsPerRound: number
}>

function normalizeInteger(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.trunc(value))
    : fallback
}

function firstFiniteNumber(...values: unknown[]): number | undefined {
  return values.find((value): value is number => (
    typeof value === 'number' && Number.isFinite(value)
  ))
}

export function resolveManagedResource(resource: ManagedResourceInput): ManagedResource {
  const max = normalizeInteger(
    firstFiniteNumber(
      resource.max,
      resource.maxUses,
      resource.total,
      resource.charges,
      resource.uses,
      resource.pointsPerRound,
    ),
  )
  const rawCurrent = firstFiniteNumber(
    resource.current,
    resource.currentUses,
    resource.remaining,
    resource.value,
  )
  const spent = firstFiniteNumber(resource.spent, resource.pointsUsed)
  const current = normalizeInteger(
    rawCurrent ?? (spent === undefined ? 0 : max - spent),
  )

  return {
    current: Math.min(max, current),
    max,
  }
}

export function getResourceStatus(resource: ManagedResourceInput): ManagedResourceStatus {
  const { current, max } = resolveManagedResource(resource)

  if (max <= 0) return 'unavailable'
  if (current <= 0) return 'depleted'
  if (current >= max) return 'full'
  return 'available'
}

export function canSpend(resource: ManagedResourceInput, amount = 1): boolean {
  const { current } = resolveManagedResource(resource)
  const normalizedAmount = Math.max(1, Math.trunc(amount))

  return current >= normalizedAmount
}

export function spendResource(resource: ManagedResourceInput, amount = 1): ManagedResource {
  const resolved = resolveManagedResource(resource)
  const normalizedAmount = Math.max(1, Math.trunc(amount))

  return {
    ...resolved,
    current: Math.max(0, resolved.current - normalizedAmount),
  }
}

export function canRestore(resource: ManagedResourceInput): boolean {
  const { current, max } = resolveManagedResource(resource)

  return max > 0 && current < max
}

export function restoreResource(resource: ManagedResourceInput, amount = 1): ManagedResource {
  const resolved = resolveManagedResource(resource)
  const normalizedAmount = Math.max(1, Math.trunc(amount))

  return {
    ...resolved,
    current: Math.min(resolved.max, resolved.current + normalizedAmount),
  }
}

export function restoreResourceFull(resource: ManagedResourceInput): ManagedResource {
  const resolved = resolveManagedResource(resource)

  return {
    ...resolved,
    current: resolved.max,
  }
}

export function setResourceCurrent(
  resource: ManagedResourceInput,
  value: number,
): ManagedResource {
  const resolved = resolveManagedResource(resource)

  return {
    ...resolved,
    current: Math.min(resolved.max, normalizeInteger(value)),
  }
}

export function setResourceMax(
  resource: ManagedResourceInput,
  value: number,
  minimum = 0,
): ManagedResource {
  const resolved = resolveManagedResource(resource)
  const nextMax = Math.max(minimum, normalizeInteger(value, minimum))
  const nextCurrent =
    resolved.max === 0 || resolved.current >= resolved.max
      ? nextMax
      : Math.min(nextMax, resolved.current)

  return {
    current: nextCurrent,
    max: nextMax,
  }
}
