import { useEffect, useMemo, useState } from 'react'
import { getPriceHistory, analyseContexteAchat, analyseEntry } from '../lib/history.js'
import { formatCAD, formatPercent } from '../lib/format.js'
import CollapsibleSection from './CollapsibleSection.jsx'

// Analyse de performance a posteriori : pour chaque achat, juge le TIMING
// d'après le contexte de marché du moment (impulsion ? consolidation ?),
// mémorisé dans price_history à chaque génération de recommandations.
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
                    const vente = t.sens === 'vente'
                    const ctx = analyseContexteAchat(t.prixAchat, t.date, h.type, points, t.sens)
                    const fourchette = analyseEntry(t.prixAchat, t.date, points)
                    return (
                      <div key={t.id} className="rounded-md bg-slate-950/60 px-3 py-2 text-xs">
                        <div className="text-slate-400">
                          {vente ? 'Vente' : 'Achat'} du {t.date} à {formatCAD(t.prixAchat)}
                        </div>
                        {ctx ? (
                          <div className="mt-1">
                            <div className="font-medium text-slate-200">
                              {ctx.emoji} {ctx.titre}
                            </div>
                            <p className="mt-0.5 text-slate-400">{ctx.texte}</p>
                            <div className="mt-0.5 text-slate-600">{ctx.details}</div>
                          </div>
                        ) : (
                          <div className="mt-1 text-slate-500">
                            ⏳ Contexte de marché inconnu pour cette date : l'app enregistre
                            le contexte à chaque génération (lundi). Les achats faits à
                            partir de maintenant seront analysés automatiquement.
                          </div>
                        )}
                        {fourchette && (
                          <div className="mt-1 border-t border-slate-800 pt-1 text-slate-600">
                            Depuis {vente ? 'cette vente' : 'cet achat'}, prix observé entre{' '}
                            {formatCAD(fourchette.min)} et {formatCAD(fourchette.max)} (
                            {fourchette.nbPoints} relevés).
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
          Le verdict se base sur le contexte au moment de l'achat (impulsion,
          consolidation, chute), mémorisé à chaque génération de recommandations.
        </p>
      </CollapsibleSection>
    </div>
  )
}
