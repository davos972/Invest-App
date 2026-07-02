import { useEffect, useState } from 'react'
import { getPreferences } from '../lib/preferences.js'
import {
  getLatestRecommendation,
  generateRecommendations,
  toSections,
} from '../lib/recommendations.js'
import CollapsibleSection from '../components/CollapsibleSection.jsx'
import AssetCard from '../components/AssetCard.jsx'

// Page 1 — Accueil : les recommandations de la semaine (générées par l'IA).
export default function Home() {
  const prefs = getPreferences()
  const [reco, setReco] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    setReco(await getLatestRecommendation())
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      await generateRecommendations()
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const sections = toSections(reco)
  const dateAffichee = reco?.date_generation || reco?.generated_at?.slice(0, 10)

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Recommandations de la semaine</h1>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-400">
            {dateAffichee ? `Générées le ${dateAffichee}` : 'Aucune génération pour l’instant'}
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {generating ? 'Génération en cours…' : reco ? 'Régénérer' : 'Générer'}
          </button>
        </div>
      </header>

      {generating && (
        <p className="mb-4 rounded-lg bg-slate-900 px-3 py-2 text-sm text-slate-300">
          ⏳ L'IA analyse les marchés… Cela peut prendre jusqu'à une minute, ne
          ferme pas la page.
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          ⚠️ {error}
        </p>
      )}

      {reco?.avertissement_global && (
        <p className="mb-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
          ⚠️ {reco.avertissement_global}
        </p>
      )}

      {loading ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-500">
          Chargement…
        </div>
      ) : !reco ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
          <p>Aucune recommandation pour l'instant.</p>
          <p className="mt-1 text-sm text-slate-500">
            Clique sur « Générer » pour lancer la première analyse de l'IA.
          </p>
        </div>
      ) : (
        sections.map((section) => (
          <CollapsibleSection
            key={section.key}
            titre={section.titre}
            count={`${section.items.length}`}
            defaultOpen={prefs.sectionsOuvertes && section.key !== 'mentions'}
          >
            {section.items.length === 0 ? (
              <p className="px-1 py-2 text-sm text-slate-500">Aucun actif retenu.</p>
            ) : (
              section.items.map((asset, i) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  rang={section.key === 'metaux' ? asset.rang || i + 1 : null}
                />
              ))
            )}
          </CollapsibleSection>
        ))
      )}
    </div>
  )
}
