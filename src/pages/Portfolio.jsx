import { useEffect, useMemo, useState } from 'react'
import {
  getTransactions,
  addTransaction,
  deleteTransaction,
  getPrices,
  setPrice,
  buildHoldings,
  buildSummary,
} from '../lib/portfolio.js'
import { sampleMainAssets } from '../data/sampleAssets.js'
import { fetchCryptoPrices, isKnownCrypto } from '../lib/prices.js'
import { formatCAD, formatPercent } from '../lib/format.js'

// Couleur verte si gain, rouge si perte.
function pnlColor(value) {
  if (value > 0) return 'text-emerald-400'
  if (value < 0) return 'text-rose-400'
  return 'text-slate-400'
}

const emptyForm = { nom: '', ticker: '', type: 'action', quantite: '', prixAchat: '', date: '' }

// Page 4 — Portefeuille & historique.
export default function Portfolio() {
  // "version" force le rechargement des données après chaque modification.
  const [version, setVersion] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [prices, setPrices] = useState({})
  const [loading, setLoading] = useState(true)

  // Charge les données (cloud ou navigateur) à l'ouverture et après chaque modif.
  useEffect(() => {
    let actif = true
    setLoading(true)
    Promise.all([getTransactions(), getPrices()]).then(([tx, pr]) => {
      if (!actif) return
      setTransactions(tx)
      setPrices(pr)
      setLoading(false)
    })
    return () => {
      actif = false
    }
  }, [version])

  const holdings = useMemo(() => buildHoldings(transactions, prices), [transactions, prices])
  const summary = useMemo(() => buildSummary(holdings), [holdings])

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [expanded, setExpanded] = useState(null)

  const refresh = () => setVersion((v) => v + 1)

  // Pré-remplit le formulaire quand on choisit un placement d'exemple.
  function pickSample(id) {
    const asset = sampleMainAssets.find((a) => a.id === id)
    if (asset) {
      setForm((f) => ({ ...f, nom: asset.nom, ticker: asset.ticker, type: asset.type }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nom || !form.quantite || !form.prixAchat) return
    await addTransaction({
      nom: form.nom,
      ticker: form.ticker || form.nom,
      type: form.type,
      quantite: parseFloat(form.quantite.replace(',', '.')),
      prixAchat: parseFloat(form.prixAchat.replace(',', '.')),
      date: form.date || new Date().toISOString().slice(0, 10),
    })
    setForm(emptyForm)
    setShowForm(false)
    refresh()
  }

  async function handleSetPrice(holding, value) {
    const price = parseFloat(String(value).replace(',', '.'))
    if (Number.isFinite(price)) {
      await setPrice(holding.ticker, price, { nom: holding.nom, type: holding.type })
      refresh()
    }
  }

  const [refreshing, setRefreshing] = useState(false)
  const [priceMsg, setPriceMsg] = useState(null)

  // Va chercher les prix crypto en direct et met à jour le portefeuille.
  async function handleRefreshPrices() {
    const cryptos = holdings.filter((h) => isKnownCrypto(h.ticker))
    if (cryptos.length === 0) {
      setPriceMsg('Aucune crypto reconnue à mettre à jour.')
      return
    }
    setRefreshing(true)
    setPriceMsg(null)
    const prix = await fetchCryptoPrices(cryptos.map((h) => h.ticker))
    for (const h of cryptos) {
      if (prix[h.ticker] != null) {
        await setPrice(h.ticker, prix[h.ticker], { nom: h.nom, type: h.type })
      }
    }
    setRefreshing(false)
    setPriceMsg(`✓ ${Object.keys(prix).length} prix crypto mis à jour`)
    refresh()
  }

  const aDesCryptos = holdings.some((h) => isKnownCrypto(h.ticker))

  return (
    <div>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Portefeuille</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
        >
          {showForm ? 'Annuler' : '+ Nouvel investissement'}
        </button>
      </header>

      {/* Vue d'ensemble */}
      <section className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <div className="text-xs text-slate-400">Capital total</div>
          <div className="mt-1 text-lg font-bold">{formatCAD(summary.valeurActuelle)}</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <div className="text-xs text-slate-400">Gain / perte</div>
          <div className={`mt-1 text-lg font-bold ${pnlColor(summary.pnl)}`}>
            {formatPercent(summary.pnlPct)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <div className="text-xs text-slate-400">P&amp;L ($)</div>
          <div className={`mt-1 text-lg font-bold ${pnlColor(summary.pnl)}`}>
            {formatCAD(summary.pnl)}
          </div>
        </div>
      </section>

      {/* Rafraîchir les prix crypto en direct */}
      {aDesCryptos && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            onClick={handleRefreshPrices}
            disabled={refreshing}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-slate-600 disabled:opacity-50"
          >
            {refreshing ? 'Mise à jour…' : '🔄 Rafraîchir les prix crypto'}
          </button>
          {priceMsg && <span className="text-sm text-emerald-400">{priceMsg}</span>}
        </div>
      )}

      {/* Formulaire de nouvel investissement */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 space-y-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4"
        >
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Choisir un placement d'exemple (optionnel)
            </label>
            <select
              onChange={(e) => pickSample(e.target.value)}
              defaultValue=""
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-emerald-400"
            >
              <option value="">— Saisie manuelle —</option>
              {sampleMainAssets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nom} ({a.ticker})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Nom" value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} placeholder="Apple" />
            <Field label="Code / ticker" value={form.ticker} onChange={(v) => setForm({ ...form, ticker: v })} placeholder="AAPL" />
            <div>
              <label className="mb-1 block text-xs text-slate-400">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-emerald-400"
              >
                <option value="action">Action</option>
                <option value="crypto">Crypto</option>
                <option value="metal">Métal précieux</option>
              </select>
            </div>
            <Field label="Date d'achat" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
            <Field label="Quantité" type="number" value={form.quantite} onChange={(v) => setForm({ ...form, quantite: v })} placeholder="2" />
            <Field label="Prix d'achat (CAD)" type="number" value={form.prixAchat} onChange={(v) => setForm({ ...form, prixAchat: v })} placeholder="150" />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-500 px-4 py-2 font-medium text-slate-950 hover:bg-emerald-400"
          >
            Enregistrer l'investissement
          </button>
        </form>
      )}

      {/* Liste des placements détenus */}
      {loading ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-500">
          Chargement…
        </div>
      ) : holdings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-500">
          Aucun investissement pour l'instant. Clique sur « Nouvel investissement ».
        </div>
      ) : (
        <div className="space-y-2">
          {holdings.map((h) => {
            const partCapital =
              summary.valeurActuelle > 0 ? (h.valeurActuelle / summary.valeurActuelle) * 100 : 0
            const isOpen = expanded === h.key
            return (
              <div key={h.key} className="rounded-xl border border-slate-800 bg-slate-900/50">
                <button
                  onClick={() => setExpanded(isOpen ? null : h.key)}
                  className="flex w-full items-center justify-between gap-3 p-3 text-left"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{h.nom}</span>
                      <span className="text-xs text-slate-500">{h.ticker}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {h.quantite} unité{h.quantite > 1 ? 's' : ''} · {partCapital.toFixed(1)} % du capital
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${pnlColor(h.pnl)}`}>{formatCAD(h.pnl)}</div>
                    <div className={`text-xs ${pnlColor(h.pnl)}`}>{formatPercent(h.pnlPct)}</div>
                  </div>
                </button>

                {/* Historique déroulant */}
                {isOpen && (
                  <div className="border-t border-slate-800 p-3 text-sm">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-400">Prix actuel (CAD) :</span>
                      <input
                        type="number"
                        step="any"
                        defaultValue={prices[h.ticker] ?? ''}
                        placeholder={h.prixMoyen.toFixed(2)}
                        onBlur={(e) => handleSetPrice(h, e.target.value)}
                        className="w-28 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 outline-none focus:border-emerald-400"
                      />
                      <span className="text-xs text-slate-500">
                        Prix moyen d'achat : {formatCAD(h.prixMoyen)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {h.transactions.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between gap-2 rounded-lg bg-slate-900 px-3 py-2"
                        >
                          <span className="text-slate-300">{t.date}</span>
                          <span className="text-slate-400">
                            {t.quantite} × {formatCAD(t.prixAchat)}
                          </span>
                          <button
                            onClick={async () => {
                              await deleteTransaction(t.id)
                              refresh()
                            }}
                            className="text-xs text-rose-400 hover:underline"
                          >
                            Supprimer
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Petit champ de formulaire réutilisable.
function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={type === 'number' ? 'decimal' : undefined}
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-emerald-400"
      />
    </div>
  )
}
