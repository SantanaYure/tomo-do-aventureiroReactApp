import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.js'
import { AuthProvider } from './context/AuthContext'
import { purgeUnusableSheetDrafts } from './utils/sheetDraft'

// Remove apenas rascunhos que este build não consegue usar (formato de outra
// versão). Não apaga por idade: rascunho antigo ainda pode ser a única cópia de
// trabalho não salvo.
purgeUnusableSheetDrafts()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
