import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getLatestRecommendation, findAsset } from '../lib/recommendations.js'
import { getPriceHistory, analyseContexteActuel } from '../lib/history.js'
import ConfidenceBadge from '../components/ConfidenceBadge.jsx'
import { formatPercent } from '../lib/format.js'

const typeLabels = { action: 'Action', crypto: 'Crypto', metal: 'Métal précieux' }
const categorieLabels = { securitaire: 'Sécuritaire', risque: 'Risqué' }

// Page 2 — Analyse détaillée d'un actif (au clic depuis l'accueil).
export default function AssetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [asset, setAsset] = useState(undefined) // undefined = en cours, null = introuvable
  const [contexte, setContexte] = useState(null)

  useEffect(() => {
    getLatestRecommendation().then((reco) => setAsset(findAsset(reco, id)))
  }, [id])

  // Contexte de marché du moment (impulsion / consolidation / …).
  useEffect(() => {
    if (!asset?.ticker) return
    getPriceHistory([asset.ticker]).then((history) => {
      setContexte(analyseContexteActuel(asset.type, history[asset.ticker]))
    })
  }, [asset?.ticker])

  const back = (
    <button onClick={() => navigate(-1)} className="mb-4 text-sm text-emerald-400 hover:underline">
      ← Retour
    </button>
  )

  if (asset === undefined) {
    return (
      <div>
        {back}
        <p className="text-slate-400">Chargement…</p>
      </div>
    )
  }

  if (!asset) {
    return (
      <div>
        {back}
        <p className="text-slate-400">Actif introuvable dans la dernière génération.</p>
      </div>
    )
  }

  const evoColor =
    asset.evolution > 0 ? 'text-emerald-400' : asset.evolution < 0 ? 'text-rose-400' : 'text-slate-400'

  return (
    <div>
      {back}

      <header className="mb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{asset.nom}</h1>
          <span className="text-sm text-slate-500">{asset.ticker}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ConfidenceBadge level={asset.confiance} />
          <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-300">
            {typeLabels[asset.type] || asset.type}
          </span>
          {asset.categorie && (
            <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-300">
              {categorieLabels[asset.categorie] || asset.categorie}
            </span>
          )}
          {asset.tier && (
            <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-300">
              Tier {asset.tier}
            </span>
          )}
          <span className={`text-sm font-semibold ${evoColor}`}>
            {formatPercent(asset.evolution)} cette semaine
          </span>
        </div>
      </header>

      {contexte && (
        <div className="mb-4 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
          <h2 className="mb-1 text-sm font-semibold text-slate-200">
            {contexte.emoji} Timing : {contexte.titre}
          </h2>
          <p className="text-sm leading-relaxed text-slate-300">{contexte.texte}</p>
          <p className="mt-1.5 text-xs text-slate-500">
            {contexte.details} · relevé du {contexte.date}
          </p>
        </div>
      )}

      <Section titre="Thèse d'investissement">{asset.these}</Section>

      <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
        <h2 className="mb-1 text-sm font-semibold text-rose-300">⚠️ Points de risque</h2>
        <p className="text-sm text-slate-300">{asset.risques || 'Non précisés.'}</p>
      </div>

      <SentimentBox sentiment={asset.sentiment} />
    </div>
  )
}

// Sentiment social StockTwits (signal secondaire). Masqué si indisponible.
function SentimentBox({ sentiment }) {
  if (!sentiment) return null
  const { messages_recents, haussiers, baissiers } = sentiment
  const tag = haussiers + baissiers
  let humeur = { texte: 'Ambiance mitigée', couleur: 'text-slate-300' }
  if (tag > 0) {
    const partHausse = haussiers / tag
    if (partHausse >= 0.6) humeur = { texte: 'Majorité haussière', couleur: 'text-emerald-400' }
    else if (partHausse <= 0.4) humeur = { texte: 'Majorité baissière', couleur: 'text-rose-400' }
  }
  return (
    <div className="mb-4 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
      <h2 className="mb-1 text-sm font-semibold text-slate-200">💬 Sentiment social (StockTwits)</h2>
      <p className="text-sm text-slate-300">
        <span className={`font-semibold ${humeur.couleur}`}>{humeur.texte}</span> ·{' '}
        {messages_recents} messages récents ·{' '}
        <span className="text-emerald-400">{haussiers} haussiers</span> /{' '}
        <span className="text-rose-400">{baissiers} baissiers</span>
      </p>
      <p className="mt-1.5 text-xs text-slate-500">
        Signal secondaire (ambiance des particuliers), à lire avec recul — un fort engouement
        n'est pas une garantie.
      </p>
    </div>
  )
}

function Section({ titre, children }) {
  if (!children) return null
  return (
    <div className="mb-4">
      <h2 className="mb-1 text-sm font-semibold text-slate-300">{titre}</h2>
      <p className="text-sm leading-relaxed text-slate-300">{children}</p>
    </div>
  )
}
