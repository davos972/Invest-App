// Récupération des données de marché réelles pour l'analyse IA.
// Tout se passe côté serveur (les clés restent secrètes).
import { STOCKS, CRYPTOS, METALS } from './candidates.js'

const FMP = 'https://financialmodelingprep.com/stable'

// Petit utilitaire : récupère du JSON sans jamais planter.
async function getJson(url) {
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    return await r.json()
  } catch {
    return null
  }
}

// Exécute une tâche sur une liste, avec un nombre limité d'appels en parallèle
// (pour ne pas saturer l'API FMP).
async function mapPool(items, limit, fn) {
  const out = new Array(items.length)
  let index = 0
  async function worker() {
    while (index < items.length) {
      const i = index++
      out[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}

const first = (arr) => (Array.isArray(arr) && arr.length ? arr[0] : null)
const pct = (v) => (v != null && Number.isFinite(v) ? +(v * 100).toFixed(1) : null)
const cad = (v, rate) => (v != null && Number.isFinite(v) ? +(v * rate).toFixed(2) : null)

// Taux USD -> CAD (gratuit, sans clé).
async function fetchUsdToCad() {
  const fx = await getJson('https://open.er-api.com/v6/latest/USD')
  return fx?.rates?.CAD || 1
}

// Fondamentaux d'une action (best effort : les champs absents restent nuls,
// le prompt gère l'absence en abaissant la confiance).
async function fetchStock(symbol, key, rate) {
  const [quoteArr, ratiosArr, kmArr] = await Promise.all([
    getJson(`${FMP}/quote?symbol=${symbol}&apikey=${key}`),
    getJson(`${FMP}/ratios-ttm?symbol=${symbol}&apikey=${key}`),
    getJson(`${FMP}/key-metrics-ttm?symbol=${symbol}&apikey=${key}`),
  ])
  const q = first(quoteArr)
  const r = first(ratiosArr) || {}
  const km = first(kmArr) || {}
  if (!q) return null

  return {
    nom: q.name || symbol,
    ticker: symbol,
    prix_cad: cad(q.price, rate),
    variation_jour_pct: q.changePercentage ?? q.changesPercentage ?? null,
    moyenne_50j_cad: cad(q.priceAvg50, rate),
    moyenne_200j_cad: cad(q.priceAvg200, rate),
    market_cap_usd: q.marketCap ?? null,
    per: q.pe ?? r.priceToEarningsRatioTTM ?? null,
    peg: r.priceToEarningsGrowthRatioTTM ?? r.pegRatioTTM ?? null,
    marge_nette_pct: pct(r.netProfitMarginTTM),
    marge_operationnelle_pct: pct(r.operatingProfitMarginTTM),
    roe_pct: pct(r.returnOnEquityTTM),
    roic_pct: pct(km.returnOnInvestedCapitalTTM ?? r.returnOnInvestedCapitalTTM),
    dette_sur_ebitda: r.netDebtToEBITDATTM ?? km.netDebtToEBITDATTM ?? null,
    fcf_par_action: km.freeCashFlowPerShareTTM ?? null,
  }
}

// Cours d'un métal (ETF) en CAD.
async function fetchMetal(metal, key, rate) {
  const q = first(await getJson(`${FMP}/quote?symbol=${metal.ticker}&apikey=${key}`))
  if (!q) return { ...metal, prix_cad: null, variation_jour_pct: null }
  return {
    nom: metal.nom,
    ticker: metal.ticker,
    prix_cad: cad(q.price, rate),
    variation_jour_pct: q.changePercentage ?? q.changesPercentage ?? null,
    variation_annee_pct:
      q.yearHigh && q.price ? null : null, // YTD non fourni par ce point d'accès
  }
}

// Données crypto (CoinGecko, directement en CAD, en un seul appel).
async function fetchCryptos() {
  const ids = CRYPTOS.map((c) => c.id).join(',')
  const url =
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=cad&ids=${ids}` +
    `&price_change_percentage=7d,30d&per_page=250&page=1`
  const rows = (await getJson(url)) || []
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]))

  return CRYPTOS.map((c) => {
    const r = byId[c.id]
    if (!r) return { nom: c.symbol, ticker: c.symbol, tier: c.tier, prix_cad: null }
    return {
      nom: r.name,
      ticker: c.symbol,
      tier: c.tier,
      prix_cad: r.current_price ?? null,
      variation_semaine_pct: r.price_change_percentage_7d_in_currency ?? null,
      variation_mois_pct: r.price_change_percentage_30d_in_currency ?? null,
      market_cap_cad: r.market_cap ?? null,
      rang: r.market_cap_rank ?? null,
      volume_24h_cad: r.total_volume ?? null,
      ratio_volume_market_cap:
        r.total_volume && r.market_cap ? +(r.total_volume / r.market_cap).toFixed(3) : null,
      offre_circulante: r.circulating_supply ?? null,
      offre_totale: r.total_supply ?? null,
      ath_cad: r.ath ?? null,
      distance_ath_pct: r.ath_change_percentage ?? null,
    }
  })
}

// Rassemble toutes les données de marché.
export async function gatherMarketData(fmpKey) {
  const rate = await fetchUsdToCad()
  const [actions, metaux, crypto] = await Promise.all([
    mapPool(STOCKS, 6, (s) => fetchStock(s, fmpKey, rate)),
    mapPool(METALS, 4, (m) => fetchMetal(m, fmpKey, rate)),
    fetchCryptos(),
  ])
  return {
    taux_usd_cad: +rate.toFixed(4),
    actions: actions.filter(Boolean),
    crypto,
    metaux,
  }
}
