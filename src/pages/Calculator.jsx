import { useEffect, useMemo, useState } from 'react'
import { sampleMainAssets, sampleHonorableMentions } from '../data/sampleAssets.js'
import { getLatestRecommendation, mainAssets, honorableMentions } from '../lib/recommendations.js'
import { getWeights } from '../lib/weights.js'
import { addTransaction, setPrice } from '../lib/portfolio.js'
import { fetchCryptoPrices, fetchStockPrices, isKnownCrypto } from '../lib/prices.js'
import { formatCAD, formatPercent } from '../lib/format.js'
import ConfidenceBadge from '../components/ConfidenceBadge.jsx'

// Page 3 — Calculateur d'allocation (Logique B : points pondérés).
export default function Calculator() {
  const [amountInput, setAmountInput] = useState('')
  const [amount, setAmount] = useState(0)
  const [showMentions, setShowMentions] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [registerMsg, setRegisterMsg] = useState(null)

  // Pondération choisie dans les Réglages.
  const weights = useMemo(() => getWeights(), [])

  // Recommandations réelles (repli sur les exemples si aucune génération).
  const [reco, setReco] = useState(null)
  useEffect(() => {
    getLatestRecommendation().then(setReco)
  }, [])

  const usingSample = !reco
  const mainList = useMemo(() => (reco ? mainAssets(reco) : sampleMainAssets), [reco])
  const mentionsList = useMemo(
    () => (reco ? honorableMentions(reco) : sampleHonorableMentions),
    [reco],
  )

  const assets = useMemo(
    () => (showMentions ? [...mainList, ...mentionsList] : mainList),
    [showMentions, mainList, mentionsList],
  )

  // Par défaut : tous les placements principaux cochés. Recalculé si la liste change.
  const [selected, setSelected] = useState(() => new Set())
  useEffect(() => {
    setSelected(new Set(mainList.map((a) => a.id)))
  }, [mainList])

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Logique B : chaque actif reçoit sa part proportionnelle à ses points.
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
    setRegisterMsg(null)
  }

  // Ajoute les placements calculés au portefeuille : pour chacun, on achète
  // au prix actuel la quantité correspondant au montant alloué.
  async function handleRegister() {
    const chosen = allocations.filter((a) => a.montant > 0)
    if (chosen.length === 0) return
    const ok = window.confirm(
      `Ajouter ces ${chosen.length} placements à ton portefeuille ? ` +
        `Chacun sera enregistré comme un achat au prix actuel.`,
    )
    if (!ok) return

    setRegistering(true)
    setRegisterMsg(null)
    try {
      // Prix actuels en CAD (crypto via CoinGecko, le reste via notre serveur).
      const cryptoTickers = chosen.filter((a) => isKnownCrypto(a.ticker)).map((a) => a.ticker)
      const autresTickers = chosen.filter((a) => !isKnownCrypto(a.ticker)).map((a) => a.ticker)
      const [cryptoPrix, autresPrix] = await Promise.all([
        fetchCryptoPrices(cryptoTickers),
        fetchStockPrices(autresTickers),
      ])
      const prix = { ...cryptoPrix, ...autresPrix }

      const today = new Date().toISOString().slice(0, 10)
      let ajoutes = 0
      let ignores = 0
      for (const a of chosen) {
        const p = prix[a.ticker]
        if (p && p > 0) {
          await addTransaction({
            nom: a.nom,
            ticker: a.ticker,
            type: a.type,
            quantite: +(a.montant / p).toFixed(6),
            prixAchat: p,
            date: today,
          })
          await setPrice(a.ticker, p, { nom: a.nom, type: a.type })
          ajoutes++
        } else {
          ignores++
        }
      }
      setRegisterMsg(
        `✓ ${ajoutes} placement${ajoutes > 1 ? 's' : ''} ajouté${ajoutes > 1 ? 's' : ''} au portefeuille` +
          (ignores ? ` — ${ignores} sans prix ignoré${ignores > 1 ? 's' : ''}` : ''),
      )
    } catch (e) {
      setRegisterMsg(`⚠️ ${e.message}`)
    } finally {
      setRegistering(false)
    }
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

      {usingSample && (
        <p className="mb-4 rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-500">
          ℹ️ Placements d'exemple (données fictives). Génère les recommandations
          depuis l'accueil pour utiliser les vrais placements.
        </p>
      )}

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

      {!showMentions && (
        <button
          onClick={() => setShowMentions(true)}
          className="mt-4 w-full rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-600"
        >
          + Avoir plus d'indices (mentions honorables)
        </button>
      )}

      <div className="mt-6 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3">
        <span className="text-sm text-slate-400">
          Total réparti ({selected.size} placement{selected.size > 1 ? 's' : ''})
        </span>
        <span className="text-lg font-bold">
          {formatCAD(allocations.reduce((sum, a) => sum + a.montant, 0))}
        </span>
      </div>

      {amount > 0 && (
        <div className="mt-3 space-y-2">
          <button
            onClick={handleRegister}
            disabled={registering}
            className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {registering ? 'Ajout en cours…' : '➕ Ajouter ces placements à mon portefeuille'}
          </button>
          <p className="text-xs text-slate-500">
            Chaque placement sélectionné sera enregistré comme un achat au prix
            actuel, dans l'onglet Portefeuille.
          </p>
          {registerMsg && <p className="text-sm text-emerald-400">{registerMsg}</p>}
        </div>
      )}
    </div>
  )
}
