import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.js'
import { AuthProvider } from './context/AuthContext'
import { purgeStaleSheetDrafts } from './utils/sheetDraft'

// Rascunhos órfãos (fichas excluídas, versões antigas do formato) não devem
// ocupar cota do localStorage para sempre.
purgeStaleSheetDrafts()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
