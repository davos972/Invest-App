// Lecture de l'historique des prix (table price_history, alimentée
// automatiquement à chaque génération de recommandations).
import { supabase, isSupabaseConfigured } from './supabase.js'

// Historique pour une liste de tickers.
// Renvoie { TICKER: [{ prix, date }, ...] } trié du plus ancien au plus récent.
export async function getPriceHistory(tickers) {
  const list = (tickers || []).filter(Boolean)
  if (!isSupabaseConfigured || list.length === 0) return {}

  const { data, error } = await supabase
    .from('price_history')
    .select('ticker, prix_cad, captured_at')
    .in('ticker', list)
    .order('captured_at', { ascending: true })

  if (error) {
    console.error("Lecture de l'historique des prix échouée :", error.message)
    return {}
  }

  const out = {}
  for (const row of data || []) {
    if (!out[row.ticker]) out[row.ticker] = []
    out[row.ticker].push({ prix: Number(row.prix_cad), date: row.captured_at })
  }
  return out
}

// Analyse le point d'entrée d'un achat par rapport à l'historique observé
// depuis la date d'achat. Renvoie null si l'historique est trop court.
export function analyseEntry(prixAchat, dateAchat, points) {
  const depuisAchat = (points || []).filter((p) => p.date.slice(0, 10) >= dateAchat)
  if (depuisAchat.length < 2) return null

  const valeurs = depuisAchat.map((p) => p.prix)
  const min = Math.min(...valeurs)
  const max = Math.max(...valeurs)
  if (!(max > min)) return null

  // 0 = acheté au plus bas observé, 1 = au plus haut observé.
  const score = Math.min(1, Math.max(0, (prixAchat - min) / (max - min)))

  let verdict
  if (score <= 0.25) verdict = { emoji: '🎯', texte: "Excellent point d'entrée — parmi les prix les plus bas observés depuis." }
  else if (score <= 0.5) verdict = { emoji: '👍', texte: "Bon point d'entrée — dans la moitié basse des prix observés depuis." }
  else if (score <= 0.75) verdict = { emoji: '😐', texte: "Point d'entrée moyen — le prix est souvent descendu sous ton prix d'achat." }
  else verdict = { emoji: '⚠️', texte: "Acheté dans le haut de la fourchette — le prix a presque toujours été plus bas depuis." }

  return { min, max, score, verdict, nbPoints: depuisAchat.length }
}
