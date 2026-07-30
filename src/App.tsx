import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom'
import { Home } from './pages/Home/Home'
import { LoginPage } from './pages/LoginPage/LoginPage'
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute'
import { RouteFallback } from './components/RouteFallback/RouteFallback'
import { Sidebar } from './components/Sidebar/Sidebar'
import styles from './App.module.css'

/*
 * Home e LoginPage ficam no pacote inicial de propósito: são os dois pontos de
 * entrada do app, e carregá-los sob demanda faria justamente a primeira tela
 * piscar. O resto vai sob demanda — as fichas concentram a maior parte do
 * código (todos os painéis) e são alcançadas por clique, onde a espera se
 * sobrepõe à busca dos dados no Firestore que já acontecia.
 */
const CharactersPage = lazy(() =>
  import('./pages/CharactersPage/CharactersPage').then((m) => ({ default: m.CharactersPage })),
)
const CharacterSheetPage = lazy(() =>
  import('./pages/CharacterSheetPage/CharacterSheetPage').then((m) => ({ default: m.CharacterSheetPage })),
)
const MonsterSheetPage = lazy(() =>
  import('./pages/MonsterSheetPage/MonsterSheetPage').then((m) => ({ default: m.MonsterSheetPage })),
)
const NewMonsterPage = lazy(() =>
  import('./pages/NewMonsterPage/NewMonsterPage').then((m) => ({ default: m.NewMonsterPage })),
)
const RegisterPage = lazy(() =>
  import('./pages/RegisterPage/RegisterPage').then((m) => ({ default: m.RegisterPage })),
)
const EmailVerificationPage = lazy(() =>
  import('./pages/EmailVerificationPage/EmailVerificationPage').then((m) => ({ default: m.EmailVerificationPage })),
)
const PrivacyPolicyPage = lazy(() =>
  import('./pages/PrivacyPolicyPage/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })),
)
const NotFound = lazy(() =>
  import('./pages/NotFound/NotFound').then((m) => ({ default: m.NotFound })),
)

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
      {/*
        Suspense em volta de todas as rotas, e não por rota: o Sidebar e o
        layout permanecem montados durante a troca, então só a área de
        conteúdo troca — a moldura do app não pisca.
      */}
      <Suspense fallback={<RouteFallback />}>
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
      </Suspense>
    </BrowserRouter>
  )
}
