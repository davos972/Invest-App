import { Link } from 'react-router-dom'
import ConfidenceBadge from './ConfidenceBadge.jsx'
import { formatPercent } from '../lib/format.js'

// Couleur de l'évolution : vert si positif, rouge si négatif.
function evoColor(value) {
  if (value > 0) return 'text-emerald-400'
  if (value < 0) return 'text-rose-400'
  return 'text-slate-400'
}

// Carte cliquable d'un actif recommandé. Renvoie vers l'analyse détaillée.
// `contexte` (optionnel) : verdict de timing du moment (impulsion,
// consolidation, …) calculé depuis le dernier relevé de prix.
export default function AssetCard({ asset, rang, contexte }) {
  return (
    <Link
      to={`/analyse/${asset.id}`}
      className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 hover:border-slate-600"
    >
      {rang != null && (
        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-slate-300">
          {rang}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{asset.nom}</span>
          <span className="text-xs text-slate-500">{asset.ticker}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <ConfidenceBadge level={asset.confiance} />
          {contexte && (
            <span className="text-xs text-slate-400">
              {contexte.emoji} {contexte.titre}
            </span>
          )}
        </div>
      </div>
      <div className={`flex-none text-sm font-semibold ${evoColor(asset.evolution)}`}>
        {formatPercent(asset.evolution)}
      </div>
      <span className="flex-none text-slate-600">›</span>
    </Link>
  )
}
