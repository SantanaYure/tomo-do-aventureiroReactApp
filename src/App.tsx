import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { Home } from './pages/Home/Home'
import { CharacterSheetPage } from './pages/CharacterSheetPage/CharacterSheetPage'
import { NewCharacterPage } from './pages/NewCharacterPage/NewCharacterPage'
import { LoginPage } from './pages/LoginPage/LoginPage'
import { MonsterSheetPage } from './pages/MonsterSheetPage/MonsterSheetPage'
import { NewMonsterPage } from './pages/NewMonsterPage/NewMonsterPage'
import { NotFound } from './pages/NotFound/NotFound'
import { Header } from './components/Header/Header'

function AppLayout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/ficha/nova" element={<NewCharacterPage />} />
          <Route path="/ficha/:id" element={<CharacterSheetPage />} />
          <Route path="/monstro/novo" element={<NewMonsterPage />} />
          <Route path="/monstro/:id" element={<MonsterSheetPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}