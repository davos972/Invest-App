import { useState } from 'react'
import { getWeights, saveWeights, DEFAULT_WEIGHTS } from '../lib/weights.js'

// Page 5 — Réglages.
// Pour l'instant : la pondération du calculateur. Le reste (devise, compte,
// génération des recommandations) viendra avec les phases suivantes.
export default function Settings() {
  const [weights, setWeights] = useState(() => getWeights())
  const [saved, setSaved] = useState(false)

  function updateWeight(level, value) {
    const number = parseInt(value, 10)
    setWeights((prev) => ({ ...prev, [level]: Number.isFinite(number) ? number : 0 }))
    setSaved(false)
  }

  function handleSave() {
    saveWeights(weights)
    setSaved(true)
  }

  function handleReset() {
    setWeights({ ...DEFAULT_WEIGHTS })
    saveWeights({ ...DEFAULT_WEIGHTS })
    setSaved(true)
  }

  const levels = [
    { key: 'High', label: 'Confiance élevée' },
    { key: 'Medium', label: 'Confiance moyenne' },
    { key: 'Low', label: 'Confiance faible' },
  ]

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Réglages</h1>
        <p className="mt-1 text-sm text-slate-400">
          Ajuste le fonctionnement de ton calculateur.
        </p>
      </header>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="font-semibold">Pondération du calculateur</h2>
        <p className="mt-1 text-sm text-slate-400">
          Plus un niveau a de points, plus il reçoit une grosse part de la somme.
        </p>

        <div className="mt-4 space-y-3">
          {levels.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <span className="text-sm">{label}</span>
              <input
                type="number"
                min="0"
                value={weights[key]}
                onChange={(e) => updateWeight(key, e.target.value)}
                className="w-20 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-center outline-none focus:border-emerald-400"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
          >
            Enregistrer
          </button>
          <button
            onClick={handleReset}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-600"
          >
            Réinitialiser (5 / 3 / 2)
          </button>
          {saved && <span className="text-sm text-emerald-400">✓ Enregistré</span>}
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-500">
        🚧 À venir : devise, équilibre sécuritaire / risqué, génération des
        recommandations, connexion au compte.
      </section>
    </div>
  )
}
