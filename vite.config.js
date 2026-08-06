import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Os testes de custo de render digitam com userEvent em listas grandes
    // dentro do jsdom. Passavam isolados e estouravam o limite padrão de 5s
    // sob carga paralela, ficando instáveis. O gargalo é o jsdom, não o
    // código; um limite folgado evita falha intermitente sem mascarar defeito.
    testTimeout: 20000,
  },
})
