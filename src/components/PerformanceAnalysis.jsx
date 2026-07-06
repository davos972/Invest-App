import { useEffect, useMemo, useState } from 'react'
import { getPriceHistory, analyseEntry } from '../lib/history.js'
import { formatCAD, formatPercent } from '../lib/format.js'
import CollapsibleSection from './CollapsibleSection.jsx'

// Analyse de performance a posteriori : pour chaque achat, compare ton prix
// d'entrée à la fourchette de prix observée depuis (historique hebdomadaire).
export default function PerformanceAnalysis({ holdings }) {
  const [history, setHistory] = useState(null)

  const tickers = useMemo(() => holdings.map((h) => h.ticker).filter(Boolean), [holdings])

  useEffect(() => {
    if (tickers.length === 0) {
      setHistory({})
      return
    }
    getPriceHistory(tickers).then(setHistory)
  }, [tickers.join(',')])

  if (holdings.length === 0) return null

  // Meilleure et pire position (selon le % de gain / perte actuel).
  const classees = [...holdings].sort((a, b) => b.pnlPct - a.pnlPct)
  const meilleure = classees[0]
  const pire = classees[classees.length - 1]

  return (
    <div className="mt-6">
      <CollapsibleSection titre="📊 Analyse de performance" defaultOpen={false}>
        {/* Vue d'ensemble : meilleure / pire position */}
        {holdings.length > 1 && (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-slate-900 p-3">
              <div className="text-xs text-slate-400">Meilleure position</div>
              <div className="mt-1 text-sm font-medium">{meilleure.nom}</div>
              <div className="text-sm font-semibold text-emerald-400">
                {formatPercent(meilleure.pnlPct)}
              </div>
            </div>
            <div className="rounded-lg bg-slate-900 p-3">
              <div className="text-xs text-slate-400">Position la plus faible</div>
              <div className="mt-1 text-sm font-medium">{pire.nom}</div>
              <div className={`text-sm font-semibold ${pire.pnlPct < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatPercent(pire.pnlPct)}
              </div>
            </div>
          </div>
        )}

        {/* Détail par placement : timing de chaque achat */}
        {history == null ? (
          <p className="px-1 py-2 text-sm text-slate-500">Chargement de l'historique…</p>
        ) : (
          holdings.map((h) => {
            const points = history[h.ticker] || []
            return (
              <div key={h.key} className="rounded-lg bg-slate-900 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {h.nom} <span className="text-xs text-slate-500">{h.ticker}</span>
                  </span>
                  <span className={`text-sm font-semibold ${h.pnlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatPercent(h.pnlPct)}
                  </span>
                </div>

                <div className="mt-2 space-y-2">
                  {h.transactions.map((t) => {
                    const a = analyseEntry(t.prixAchat, t.date, points)
                    return (
                      <div key={t.id} className="rounded-md bg-slate-950/60 px-3 py-2 text-xs">
                        <div className="text-slate-400">
                          Achat du {t.date} à {formatCAD(t.prixAchat)}
                        </div>
                        {a ? (
                          <div className="mt-1">
                            <span className="text-slate-200">
                              {a.verdict.emoji} {a.verdict.texte}
                            </span>
                            <div className="mt-0.5 text-slate-500">
                              Fourchette observée depuis : {formatCAD(a.min)} – {formatCAD(a.max)} ({a.nbPoints} relevés)
                            </div>
                          </div>
                        ) : (
                          <div className="mt-1 text-slate-500">
                            ⏳ Historique encore trop court pour juger le timing (les prix
                            sont relevés à chaque génération, le lundi).
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}

        <p className="px-1 pt-1 text-xs text-slate-600">
          L'app mémorise les prix à chaque génération de recommandations :
          l'analyse devient plus précise semaine après semaine.
        </p>
      </CollapsibleSection>
    </div>
  )
}
