import { homeSections } from '../data/sampleAssets.js'
import CollapsibleSection from '../components/CollapsibleSection.jsx'
import AssetCard from '../components/AssetCard.jsx'

// Page 1 — Accueil : les recommandations de la semaine.
// Pour l'instant alimentée par des données d'exemple ; l'IA (Phase 2)
// remplacera ces données par de vraies recommandations.
export default function Home() {
  // Les métaux sont présentés comme un classement (1, 2, 3, 4).
  const isMetaux = (key) => key === 'metaux'

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Recommandations de la semaine</h1>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-400">Données d'exemple (semaine fictive)</p>
          <button
            disabled
            title="Disponible en Phase 2, avec le moteur IA"
            className="cursor-not-allowed rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-500"
          >
            Générer (Phase 2)
          </button>
        </div>
      </header>

      <p className="mb-4 rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-500">
        ℹ️ Ce sont des exemples fictifs pour illustrer l'affichage. Les vraies
        recommandations seront générées par l'IA en Phase 2.
      </p>

      {homeSections.map((section) => (
        <CollapsibleSection
          key={section.key}
          titre={section.titre}
          count={`${section.items.length}`}
          defaultOpen={!['mentions'].includes(section.key)}
        >
          {section.items.map((asset, i) => (
            <AssetCard key={asset.id} asset={asset} rang={isMetaux(section.key) ? i + 1 : null} />
          ))}
        </CollapsibleSection>
      ))}
    </div>
  )
}
