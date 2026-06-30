import { useParams, useNavigate } from 'react-router-dom'
import { getAssetById } from '../data/sampleAssets.js'
import ConfidenceBadge from '../components/ConfidenceBadge.jsx'
import { formatPercent } from '../lib/format.js'

const typeLabels = { action: 'Action', crypto: 'Crypto', metal: 'Métal précieux' }
const categorieLabels = { securitaire: 'Sécuritaire', risque: 'Risqué' }

// Page 2 — Analyse détaillée d'un actif (au clic depuis l'accueil).
export default function AssetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const asset = getAssetById(id)

  if (!asset) {
    return (
      <div>
        <button onClick={() => navigate(-1)} className="mb-4 text-sm text-emerald-400 hover:underline">
          ← Retour
        </button>
        <p className="text-slate-400">Actif introuvable.</p>
      </div>
    )
  }

  const evoColor = asset.evolution > 0 ? 'text-emerald-400' : asset.evolution < 0 ? 'text-rose-400' : 'text-slate-400'

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 text-sm text-emerald-400 hover:underline">
        ← Retour
      </button>

      {/* En-tête */}
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
          <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-300">
            {categorieLabels[asset.categorie] || asset.categorie}
          </span>
          <span className={`text-sm font-semibold ${evoColor}`}>
            {formatPercent(asset.evolution)} cette semaine
          </span>
        </div>
      </header>

      {/* Sections d'analyse */}
      <Section titre="Thèse d'investissement">{asset.these}</Section>

      {asset.metriques?.length > 0 && (
        <div className="mb-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-300">Métriques clés</h2>
          <div className="flex flex-wrap gap-2">
            {asset.metriques.map((m, i) => (
              <span key={i} className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-slate-300">
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      <Section titre="Contexte macro">{asset.macro}</Section>

      <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
        <h2 className="mb-1 text-sm font-semibold text-rose-300">⚠️ Points de risque</h2>
        <p className="text-sm text-slate-300">{asset.risques}</p>
      </div>

      {/* Sentiment : à brancher en Phase 2 (Reddit / Google Trends) */}
      <div className="mb-4 rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-500">
        📊 Sentiment (Reddit / Google Trends) — à venir en Phase 2.
      </div>
    </div>
  )
}

// Bloc de texte avec titre (réutilisé dans la page).
function Section({ titre, children }) {
  if (!children) return null
  return (
    <div className="mb-4">
      <h2 className="mb-1 text-sm font-semibold text-slate-300">{titre}</h2>
      <p className="text-sm leading-relaxed text-slate-300">{children}</p>
    </div>
  )
}
