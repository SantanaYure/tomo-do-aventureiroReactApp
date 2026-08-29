// Setup global do Vitest: matchers do jest-dom e limpeza entre testes.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// `src/services/firebase.ts` inicializa o Firebase no import — `getAuth()` lança
// `auth/invalid-api-key` sem `VITE_FIREBASE_API_KEY`. Nos testes o Firestore é
// sempre mockado (jsdom, sem rede); aqui neutralizamos a inicialização para a
// suíte não depender de um `.env`. Testes que precisam de comportamento
// específico do Firestore continuam mockando `firebase/firestore` por conta.
vi.mock('../services/firebase', () => ({ auth: {}, db: {} }))

afterEach(() => {
  cleanup()
})

// jsdom não implementa IntersectionObserver, usado pelas páginas de ficha.
if (!('IntersectionObserver' in globalThis)) {
  class IntersectionObserverStub implements IntersectionObserver {
    readonly root = null
    readonly rootMargin = ''
    readonly thresholds: ReadonlyArray<number> = []
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
  }

  Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: IntersectionObserverStub,
  })
}
