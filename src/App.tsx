import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home/Home'
import { CharacterSheetPage } from './pages/CharacterSheetPage/CharacterSheetPage'
import { NewCharacterPage } from './pages/NewCharacterPage/NewCharacterPage'
import { NotFound } from './pages/NotFound/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ficha/nova" element={<NewCharacterPage />} />
        <Route path="/ficha/:id" element={<CharacterSheetPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}