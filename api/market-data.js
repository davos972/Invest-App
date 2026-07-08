// Récupération des données de marché réelles pour l'analyse IA.
// - Actions : sélectionnées dynamiquement par le screener (voir screener.js).
// - Métaux : cours FMP des 4 actifs suivis (or/argent au comptant, palladium/
//   platine via ETF).
// - Crypto : CoinGecko, directement en CAD, en un seul appel.
// Tier FMP Starter (300 req/min) : les volumes d'appels restent très confortables.
import { CRYPTOS, METALS } from './candidates.js'
import { getJson, cad, fetchUsdToCad, fetchQuote, fetchTreasuryRates, mapPool } from './fmp-utils.js'
import { screenStockCandidates } from './screener.js'
import { fetchSentiment } from './sentiment.js'

function quoteChange(q) {
  return q.changePercentage ?? q.changesPercentage ?? null
}

// Indices de marché suivis pour le contexte macro.
const INDICES = [
  { symbol: '^GSPC', cle: 'sp500' },
  { symbol: '^IXIC', cle: 'nasdaq' },
  { symbol: '^VIX', cle: 'vix' },
]

// Tableau de bord macro : indices (S&P 500, Nasdaq), VIX (indice de la peur) et
// taux du Trésor (2 ans / 10 ans). Météo générale des marchés de la semaine.
async function fetchMacro(fmpKey) {
  const [quotes, tr] = await Promise.all([
    mapPool(INDICES, 3, (idx) => fetchQuote(idx.symbol, fmpKey)),
    fetchTreasuryRates(fmpKey),
  ])
  const q = Object.fromEntries(INDICES.map((idx, i) => [idx.cle, quotes[i]]))
  const indice = (x) => (x ? { niveau: x.price ?? null, variation_jour_pct: quoteChange(x) } : null)
  return {
    sp500: indice(q.sp500),
    nasdaq: indice(q.nasdaq),
    vix: q.vix?.price ?? null,
    taux_2ans_pct: tr?.year2 ?? null,
    taux_10ans_pct: tr?.year10 ?? null,
    date_taux: tr?.date ?? null,
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

// Cours des 4 métaux suivis (or, argent, palladium, platine).
async function fetchMetals(fmpKey, rate) {
  const quotes = await mapPool(METALS, 6, (m) => fetchQuote(m.ticker, fmpKey))
  return METALS.map((m, i) => {
    const q = quotes[i]
    return {
      nom: m.nom,
      ticker: m.ticker,
      prix_cad: q ? cad(q.price, rate) : null,
      variation_jour_pct: q ? quoteChange(q) : null,
      moyenne_50j_cad: q ? cad(q.priceAvg50, rate) : null,
      moyenne_200j_cad: q ? cad(q.priceAvg200, rate) : null,
      haut_52s_cad: q ? cad(q.yearHigh, rate) : null,
      bas_52s_cad: q ? cad(q.yearLow, rate) : null,
    }
  })
}

// Rassemble toutes les données de marché. Actions, crypto et métaux sont
// récupérés en parallèle pour tenir la limite de 60 s de Vercel.
export async function gatherMarketData(fmpKey) {
  const rate = await fetchUsdToCad()
  const [actions, metaux, crypto, macro] = await Promise.all([
    screenStockCandidates(fmpKey, rate),
    fetchMetals(fmpKey, rate),
    fetchCryptos(),
    fetchMacro(fmpKey),
  ])

  // Sentiment social StockTwits (signal secondaire, non bloquant). Actions par
  // leur ticker ; cryptos avec le suffixe StockTwits « .X ». Pas de sentiment
  // pour les métaux (bruit sur les ETF). On l'attache à chaque actif.
  const items = [
    ...actions.map((a) => ({ ticker: a.ticker, stSymbol: a.ticker })),
    ...crypto.map((c) => ({ ticker: c.ticker, stSymbol: `${c.ticker}.X` })),
  ]
  const sentiment = await fetchSentiment(items)
  for (const a of actions) a.sentiment_social = sentiment[a.ticker] ?? null
  for (const c of crypto) c.sentiment_social = sentiment[c.ticker] ?? null

  return {
    taux_usd_cad: +rate.toFixed(4),
    macro,
    actions,
    crypto,
    metaux,
  }
}
