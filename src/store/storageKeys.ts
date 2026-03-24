export function getScopedKey(baseKey: string, uid: string): string {
  return `${baseKey}:${uid}`
}
