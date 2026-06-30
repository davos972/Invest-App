import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import AssetDetail from './pages/AssetDetail.jsx'
import Calculator from './pages/Calculator.jsx'
import Portfolio from './pages/Portfolio.jsx'
import Settings from './pages/Settings.jsx'
import Login from './pages/Login.jsx'
import { useAuth } from './lib/useAuth.jsx'

// Le "plan" de l'application : quelle page afficher selon l'adresse.
// La page Analyse détaillée n'est pas dans le menu : on y accède en
// cliquant sur un actif.
export default function App() {
  const { session, loading } = useAuth()

  // Pendant qu'on vérifie si l'utilisateur est connecté.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Chargement…
      </div>
    )
  }

  // Pas connecté → on affiche la page de connexion.
  if (!session) {
    return <Login />
  }

  // Connecté → l'application normale.
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
