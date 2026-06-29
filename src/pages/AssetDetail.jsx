import { useParams, useNavigate } from 'react-router-dom'

// Page 2 — Analyse détaillée d'un actif.
// On y arrive en cliquant sur un actif depuis l'accueil. À remplir en Phase 2.
export default function AssetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-emerald-400 hover:underline"
      >
        ← Retour
      </button>

      <header className="mb-6">
        <h1 className="text-2xl font-bold">Analyse détaillée</h1>
        <p className="mt-1 text-sm text-slate-400">Actif : {id}</p>
      </header>

      <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-500">
        🚧 Page en construction — Phase 2
      </div>
    </div>
  )
}
