import { useState } from 'react'
import { getWeights, saveWeights, DEFAULT_WEIGHTS } from '../lib/weights.js'
import { getPreferences, savePreferences } from '../lib/preferences.js'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/useAuth.jsx'

// Page 5 — Réglages.
// Pour l'instant : la pondération du calculateur. Le reste (devise, compte,
// génération des recommandations) viendra avec les phases suivantes.
export default function Settings() {
  const { user } = useAuth()
  const [weights, setWeights] = useState(() => getWeights())
  const [saved, setSaved] = useState(false)
  const [prefs, setPrefs] = useState(() => getPreferences())

  // Met à jour une préférence et l'enregistre tout de suite.
  function updatePref(key, value) {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    savePreferences(next)
  }

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

      {/* Préférences */}
      <section className="mt-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="font-semibold">Préférences</h2>

        {/* Équilibre sécuritaire / risqué */}
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span>Équilibre visé</span>
            <span className="text-slate-400">
              {prefs.equilibre}% sûr · {100 - prefs.equilibre}% risqué
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={prefs.equilibre}
            onChange={(e) => updatePref('equilibre', Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>

        {/* Devise */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm">Devise</span>
          <select
            value={prefs.devise}
            onChange={(e) => updatePref('devise', e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-400"
          >
            <option value="CAD">CAD ($ canadien)</option>
          </select>
        </div>

        {/* Sections de l'accueil ouvertes par défaut */}
        <label className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm">Sections de l'accueil dépliées par défaut</span>
          <input
            type="checkbox"
            checked={prefs.sectionsOuvertes}
            onChange={(e) => updatePref('sectionsOuvertes', e.target.checked)}
            className="h-5 w-5 accent-emerald-500"
          />
        </label>

        {/* Génération automatique / manuelle */}
        <label className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm">
            Génération automatique le lundi
            <span className="block text-xs text-slate-500">Sinon, bouton manuel (Phase 2)</span>
          </span>
          <input
            type="checkbox"
            checked={prefs.generationAuto}
            onChange={(e) => updatePref('generationAuto', e.target.checked)}
            className="h-5 w-5 accent-emerald-500"
          />
        </label>
      </section>

      {/* Compte */}
      <section className="mt-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="font-semibold">Compte</h2>
        <p className="mt-1 text-sm text-slate-400">
          Connecté en tant que <span className="text-slate-200">{user?.email}</span>
        </p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-3 rounded-lg border border-rose-500/40 px-4 py-2 text-sm text-rose-300 hover:bg-rose-500/10"
        >
          Se déconnecter
        </button>
      </section>
    </div>
  )
}
