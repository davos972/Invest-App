// Sentiment social via StockTwits (« le Twitter de la bourse »).
// Chaque message peut être étiqueté Bullish (haussier) ou Bearish (baissier) par
// son auteur. On en tire, par actif : le volume de messages récents (niveau
// d'attention des particuliers) et le décompte haussiers/baissiers (le ton).
//
// SIGNAL SECONDAIRE : c'est de l'ambiance de foule, pas un fait. Non bloquant —
// toute erreur (réseau, limite de débit, symbole inconnu) => sentiment null pour
// cet actif, et la génération continue normalement.
import { mapPool } from './fmp-utils.js'

const ST = 'https://api.stocktwits.com/api/2/streams/symbol'
const CONCURRENCE = 8
const UA = 'invest-app/1.0 (personal research)'

// Sentiment d'un symbole StockTwits (ex. 'AAPL', 'BTC.X').
async function fetchOne(stSymbol) {
  try {
    const r = await fetch(`${ST}/${encodeURIComponent(stSymbol)}.json`, { headers: { 'User-Agent': UA } })
    if (!r.ok) return null
    const data = await r.json()
    const messages = Array.isArray(data?.messages) ? data.messages : []
    if (messages.length === 0) return null
    let haussiers = 0
    let baissiers = 0
    for (const m of messages) {
      const s = m?.entities?.sentiment?.basic
      if (s === 'Bullish') haussiers++
      else if (s === 'Bearish') baissiers++
    }
    return { messages_recents: messages.length, haussiers, baissiers }
  } catch {
    return null
  }
}

// Récupère le sentiment pour une liste d'actifs [{ ticker, stSymbol }].
// Renvoie une map ticker -> { messages_recents, haussiers, baissiers } (ou rien
// si indisponible). Parallélisé, borné, tolérant aux erreurs.
export async function fetchSentiment(items) {
  const results = await mapPool(items, CONCURRENCE, (it) => fetchOne(it.stSymbol))
  const map = {}
  items.forEach((it, i) => {
    if (results[i]) map[it.ticker] = results[i]
  })
  return map
}
