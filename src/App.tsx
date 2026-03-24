import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom'
import { Home } from './pages/Home/Home'
import { CharacterSheetPage } from './pages/CharacterSheetPage/CharacterSheetPage'
import { LoginPage } from './pages/LoginPage/LoginPage'
import { RegisterPage } from './pages/RegisterPage/RegisterPage'
import { EmailVerificationPage } from './pages/EmailVerificationPage/EmailVerificationPage'
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage/PrivacyPolicyPage'
import { MonsterSheetPage } from './pages/MonsterSheetPage/MonsterSheetPage'
import { NewMonsterPage } from './pages/NewMonsterPage/NewMonsterPage'
import { CharactersPage } from './pages/CharactersPage/CharactersPage'
import { NotFound } from './pages/NotFound/NotFound'
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute'
import { Sidebar } from './components/Sidebar/Sidebar'
import styles from './App.module.css'

function AppLayout() {
  return (
    <div className={styles.appShell}>
      <Sidebar />
      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/verificar-email" element={<EmailVerificationPage />} />
        <Route path="/privacidade" element={<PrivacyPolicyPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/fichas" element={<CharactersPage />} />
            <Route path="/ficha/nova" element={<Navigate to="/fichas" replace />} />
            <Route path="/ficha/:id" element={<CharacterSheetPage />} />
            <Route path="/monstro/novo" element={<NewMonsterPage />} />
            <Route path="/monstro/:id" element={<MonsterSheetPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
