// Boîte à outils FMP partagée entre market-data.js et screener.js.
// Regroupe les primitives d'accès (récupération JSON robuste, conversions,
// pool de concurrence) et les appels FMP de bas niveau (cours, ratios,
// croissance, screener). Tier Starter : 300 requêtes/minute.

const FMP = 'https://financialmodelingprep.com'

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Récupère du JSON sans jamais planter. Réessaie sur 429 (blocage temporaire de
// rafale) ou coupure réseau, pas sur un vrai refus (403/404).
export async function getJson(url, attempt = 0) {
  try {
    const r = await fetch(url)
    if (r.status === 429 && attempt < 2) {
      await sleep(1000 * (attempt + 1))
      return getJson(url, attempt + 1)
    }
    if (!r.ok) return null
    return await r.json()
  } catch {
    if (attempt < 2) {
      await sleep(500)
      return getJson(url, attempt + 1)
    }
    return null
  }
}

// Convertit un montant USD en CAD (2 décimales), null si absent.
export const cad = (v, rate) => (v != null && Number.isFinite(v) ? +(v * rate).toFixed(2) : null)
// Arrondit un ratio en gardant les valeurs absentes à null (jamais 0 par erreur).
export const num = (v, d = 2) => (v != null && Number.isFinite(v) ? +(+v).toFixed(d) : null)
// Convertit une fraction (0.27) en pourcentage arrondi (27), null si absent.
export const pct = (v, d = 1) => (v != null && Number.isFinite(v) ? +(v * 100).toFixed(d) : null)

// Exécute `fn` sur chaque élément avec un nombre borné d'appels en parallèle.
// Conserve l'ordre des résultats. Plus efficace que des groupes + pauses, tout
// en restant largement sous la limite FMP (300/min) pour nos volumes.
export async function mapPool(items, concurrency, fn) {
  const results = new Array(items.length)
  let i = 0
  async function worker() {
    while (i < items.length) {
      const idx = i++
      results[idx] = await fn(items[idx], idx)
    }
  }
  const n = Math.min(concurrency, items.length)
  await Promise.all(Array.from({ length: Math.max(n, 0) }, worker))
  return results
}

// Taux USD -> CAD (gratuit, sans clé).
export async function fetchUsdToCad() {
  const fx = await getJson('https://open.er-api.com/v6/latest/USD')
  return fx?.rates?.CAD || 1
}

// Cours d'un symbole (action ou métal). Ne renvoie PLUS le P/E ni le bénéfice
// par action depuis la réorganisation de l'API FMP (voir fetchRatiosTtm).
export async function fetchQuote(symbol, key) {
  const data = await getJson(`${FMP}/stable/quote?symbol=${encodeURIComponent(symbol)}&apikey=${key}`)
  return Array.isArray(data) && data[0] ? data[0] : null
}

// Ratios financiers TTM (P/E, marges, dette, PEG, valeurs par action…).
export async function fetchRatiosTtm(symbol, key) {
  const data = await getJson(`${FMP}/stable/ratios-ttm?symbol=${encodeURIComponent(symbol)}&apikey=${key}`)
  return Array.isArray(data) && data[0] ? data[0] : null
}

// Croissance financière (dernier exercice) : croissance du CA, des bénéfices…
export async function fetchGrowth(symbol, key) {
  const data = await getJson(`${FMP}/stable/financial-growth?symbol=${encodeURIComponent(symbol)}&limit=1&apikey=${key}`)
  return Array.isArray(data) && data[0] ? data[0] : null
}

// Taux du Trésor américain (courbe complète : month1…year30). On renvoie le
// relevé le plus récent. Sert au contexte macro (taux 2 ans / 10 ans).
export async function fetchTreasuryRates(key) {
  const data = await getJson(`${FMP}/stable/treasury-rates?apikey=${key}`)
  if (!Array.isArray(data) || data.length === 0) return null
  return data.reduce((a, b) => (a && a.date >= b.date ? a : b))
}

// Screener : présélection grossière (capitalisation, volume, bourse…).
// Renvoie une liste de sociétés (symbol, companyName, marketCap, sector,
// beta, volume…), SANS données de croissance ni de marge.
export async function fetchScreener(params, key) {
  const qs = new URLSearchParams({ ...params, apikey: key }).toString()
  const data = await getJson(`${FMP}/stable/company-screener?${qs}`)
  return Array.isArray(data) ? data : []
}
