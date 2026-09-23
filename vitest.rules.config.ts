import { defineConfig } from 'vitest/config'

// Testes das regras do Firestore (firestore.rules) contra o emulador local.
// Ficam fora de `src/` para não entrarem no `npm run test` (jsdom, sem
// emulador). Rodam com `npm run test:rules`, que sobe o emulador sozinho.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    // As regras fazem get() em outros documentos; o emulador é mais lento
    // que os testes de unidade.
    testTimeout: 30000,
    hookTimeout: 60000,
    // Um único arquivo por vez: todos compartilham o mesmo emulador.
    fileParallelism: false,
  },
})
