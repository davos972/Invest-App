// Lecture et génération des recommandations hebdomadaires.
import { supabase, isSupabaseConfigured } from './supabase.js'

// Met un actif de l'IA au format utilisé par les composants de l'app.
function normalize(a) {
  return {
    id: a.ticker,
    nom: a.nom,
    ticker: a.ticker,
    type: a.type,
    categorie: a.categorie,
    tier: a.tier,
    rang: a.rang,
    confiance: a.niveau_confiance,
    evolution: a.evolution_semaine_pct ?? 0,
    these: a.resume_these,
    risques: a.points_risque,
  }
}

// Récupère la dernière recommandation enregistrée (ou null).
export async function getLatestRecommendation() {
  if (!isSupabaseConfigured) return null
  const { data: row, error } = await supabase
    .from('weekly_recommendations')
    .select('data, generated_at')
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !row?.data) return null
  return { ...row.data, generated_at: row.generated_at }
}

// Demande une nouvelle génération au serveur (peut prendre jusqu'à ~1 min).
export async function generateRecommendations(model) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('Tu dois être connecté.')

  const res = await fetch('/api/generate-recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(model ? { model } : {}),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`)
  return json.data
}

// Les 6 sections de la page d'accueil, à partir d'une recommandation.
export function toSections(reco) {
  if (!reco) return []
  const metaux = [...(reco.metaux || [])].sort((a, b) => (a.rang || 0) - (b.rang || 0))
  return [
    { key: 'actions-sec', titre: 'Actions — Sécuritaire', items: (reco.actions?.securitaire || []).map(normalize) },
    { key: 'actions-risk', titre: 'Actions — Risqué', items: (reco.actions?.risque || []).map(normalize) },
    { key: 'crypto-sec', titre: 'Crypto — Sécuritaire', items: (reco.crypto?.securitaire || []).map(normalize) },
    { key: 'crypto-risk', titre: 'Crypto — Risqué', items: (reco.crypto?.risque || []).map(normalize) },
    { key: 'metaux', titre: 'Métaux précieux (classement)', items: metaux.map(normalize) },
    { key: 'mentions', titre: 'Mentions honorables', items: (reco.mentions_honorables || []).map(normalize) },
  ]
}

// Les 16 recommandations principales (hors mentions honorables).
export function mainAssets(reco) {
  return toSections(reco)
    .filter((s) => s.key !== 'mentions')
    .flatMap((s) => s.items)
}

// Les mentions honorables.
export function honorableMentions(reco) {
  return (reco?.mentions_honorables || []).map(normalize)
}

// Retrouve un actif par son ticker (pour la page d'analyse détaillée).
export function findAsset(reco, ticker) {
  return toSections(reco).flatMap((s) => s.items).find((a) => a.ticker === ticker) || null
}
