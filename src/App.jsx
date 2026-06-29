import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import AssetDetail from './pages/AssetDetail.jsx'
import Calculator from './pages/Calculator.jsx'
import Portfolio from './pages/Portfolio.jsx'
import Settings from './pages/Settings.jsx'

// Le "plan" de l'application : quelle page afficher selon l'adresse.
// La page Analyse détaillée n'est pas dans le menu : on y accède en
// cliquant sur un actif.
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/analyse/:id" element={<AssetDetail />} />
        <Route path="/calculateur" element={<Calculator />} />
        <Route path="/portefeuille" element={<Portfolio />} />
        <Route path="/reglages" element={<Settings />} />
      </Route>
    </Routes>
  )
}
