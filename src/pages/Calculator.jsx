import { useMemo, useState } from 'react'
import { sampleMainAssets, sampleHonorableMentions } from '../data/sampleAssets.js'
import { getWeights } from '../lib/weights.js'
import { formatCAD, formatPercent } from '../lib/format.js'
import ConfidenceBadge from '../components/ConfidenceBadge.jsx'

// Page 3 — Calculateur d'allocation (Logique B : points pondérés).
export default function Calculator() {
  // Montant à répartir, saisi par l'utilisateur.
  const [amountInput, setAmountInput] = useState('')
  // Montant "validé" au clic sur Calculer (sépare la saisie du calcul affiché).
  const [amount, setAmount] = useState(0)
  // Faut-il aussi proposer les mentions honorables ?
  const [showMentions, setShowMentions] = useState(false)

  // Pondération choisie dans les Réglages (relue à chaque ouverture de la page).
  const weights = useMemo(() => getWeights(), [])

  // La liste des placements proposés (+ mentions honorables si demandé).
  const assets = useMemo(
    () => (showMentions ? [...sampleMainAssets, ...sampleHonorableMentions] : sampleMainAssets),
    [showMentions],
  )

  // Quels placements sont cochés. Par défaut : tous les placements principaux.
  const [selected, setSelected] = useState(() =>
    new Set(sampleMainAssets.map((a) => a.id)),
  )

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Cœur de la Logique B : on additionne les points des placements cochés,
  // puis chaque placement reçoit sa part proportionnelle de la somme.
  const allocations = useMemo(() => {
    const chosen = assets.filter((a) => selected.has(a.id))
    const totalPoints = chosen.reduce((sum, a) => sum + (weights[a.confiance] || 0), 0)
    return chosen.map((a) => {
      const points = weights[a.confiance] || 0
      const part = totalPoints > 0 ? (amount * points) / totalPoints : 0
      return { ...a, points, montant: part }
    })
  }, [assets, selected, weights, amount])

  function handleCalculer(e) {
    e.preventDefault()
    const value = parseFloat(amountInput.replace(',', '.'))
    setAmount(Number.isFinite(value) && value > 0 ? value : 0)
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Calculateur d'allocation</h1>
        <p className="mt-1 text-sm text-slate-400">
          Entre une somme : on la répartit entre les placements selon leur niveau
          de confiance.
        </p>
      </header>

      {/* Saisie du montant */}
      <form onSubmit={handleCalculer} className="mb-6 flex flex-wrap items-end gap-3">
        <label className="flex-1 min-w-[180px]">
          <span className="mb-1 block text-sm text-slate-400">Somme à investir (CAD)</span>
          <input
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="ex : 1000"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-lg outline-none focus:border-emerald-400"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-emerald-500 px-5 py-2 font-medium text-slate-950 hover:bg-emerald-400"
        >
          Calculer
        </button>
      </form>

      {/* Note d'exemple tant que l'IA n'est pas branchée */}
      <p className="mb-4 rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-500">
        ℹ️ Placements d'exemple (données fictives). Les vraies recommandations
        arriveront avec l'IA en Phase 2.
      </p>

      {/* Résultat : liste des placements + part allouée */}
      <div className="space-y-2">
        {allocations.map((a) => (
          <label
            key={a.id}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3 hover:border-slate-700"
          >
            <input
              type="checkbox"
              checked={selected.has(a.id)}
              onChange={() => toggle(a.id)}
              className="h-5 w-5 accent-emerald-500"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{a.nom}</span>
                <span className="text-xs text-slate-500">{a.ticker}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <ConfidenceBadge level={a.confiance} />
                <span className="text-xs text-slate-500">
                  {formatPercent(a.evolution)} cette semaine
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-emerald-300">{formatCAD(a.montant)}</div>
              <div className="text-xs text-slate-500">{a.points} pts</div>
            </div>
          </label>
        ))}
      </div>

      {/* Bouton pour ajouter les mentions honorables */}
      {!showMentions && (
        <button
          onClick={() => setShowMentions(true)}
          className="mt-4 w-full rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-600"
        >
          + Avoir plus d'indices (mentions honorables)
        </button>
      )}

      {/* Total de contrôle */}
      <div className="mt-6 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3">
        <span className="text-sm text-slate-400">
          Total réparti ({selected.size} placement{selected.size > 1 ? 's' : ''})
        </span>
        <span className="text-lg font-bold">
          {formatCAD(allocations.reduce((sum, a) => sum + a.montant, 0))}
        </span>
      </div>
    </div>
  )
}
