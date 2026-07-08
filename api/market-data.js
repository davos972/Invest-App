// Récupération des données de marché réelles pour l'analyse IA.
// On interroge FMP symbole par symbole (~39 appels par génération). Avec le tier
// Starter (300 appels/minute), c'est très confortable pour un usage hebdomadaire.
// Ce montage a fait ses preuves : on le garde tel quel plutôt que de repasser à
// la requête groupée, pour ne pas réintroduire de risque inutilement.
import { STOCKS, CRYPTOS, METALS } from './candidates.js'

const FMP = 'https://financialmodelingprep.com'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Récupère du JSON sans jamais planter. Réessaie sur 429 (blocage temporaire)
// ou coupure réseau, pas sur un vrai refus (403/404).
async function getJson(url, attempt = 0) {
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

const cad = (v, rate) => (v != null && Number.isFinite(v) ? +(v * rate).toFixed(2) : null)

// Taux USD -> CAD (gratuit, sans clé).
async function fetchUsdToCad() {
  const fx = await getJson('https://open.er-api.com/v6/latest/USD')
  return fx?.rates?.CAD || 1
}

// Cours d'un symbole (action ou métal), interrogé individuellement.
async function fetchOneQuote(symbol, key) {
  const data = await getJson(`${FMP}/stable/quote?symbol=${encodeURIComponent(symbol)}&apikey=${key}`)
  return Array.isArray(data) && data[0] ? data[0] : null
}

// Tous les cours (actions + métaux), un appel par symbole — par petits
// groupes plutôt que tous d'un coup, pour rester bien lisse vis-à-vis de la
// limite FMP (300/min sur Starter). Simple et robuste.
async function fetchQuotesIndividually(symbols, key) {
  const TAILLE_GROUPE = 6
  const quotes = []
  for (let i = 0; i < symbols.length; i += TAILLE_GROUPE) {
    const groupe = symbols.slice(i, i + TAILLE_GROUPE)
    quotes.push(...(await Promise.all(groupe.map((s) => fetchOneQuote(s, key)))))
    if (i + TAILLE_GROUPE < symbols.length) await sleep(250)
  }
  return quotes.filter(Boolean)
}

function quoteChange(q) {
  return q.changePercentage ?? q.changesPercentage ?? null
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

// Rassemble toutes les données de marché (peu d'appels FMP).
export async function gatherMarketData(fmpKey) {
  const rate = await fetchUsdToCad()
  const cryptoPromise = fetchCryptos()

  const allSymbols = [...STOCKS, ...METALS.map((m) => m.ticker)]
  const quotes = await fetchQuotesIndividually(allSymbols, fmpKey)
  const bySymbol = Object.fromEntries(quotes.map((q) => [q.symbol, q]))

  const actions = STOCKS.map((symbol) => {
    const q = bySymbol[symbol]
    if (!q) return null
    return {
      nom: q.name || symbol,
      ticker: symbol,
      prix_cad: cad(q.price, rate),
      variation_jour_pct: quoteChange(q),
      moyenne_50j_cad: cad(q.priceAvg50, rate),
      moyenne_200j_cad: cad(q.priceAvg200, rate),
      haut_52s_cad: cad(q.yearHigh, rate),
      bas_52s_cad: cad(q.yearLow, rate),
      market_cap_usd: q.marketCap ?? null,
      per: q.pe ?? null,
      bpa_usd: q.eps ?? null,
    }
  }).filter(Boolean)

  const metaux = METALS.map((m) => {
    const q = bySymbol[m.ticker]
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

  const crypto = await cryptoPromise

  return {
    taux_usd_cad: +rate.toFixed(4),
    actions,
    crypto,
    metaux,
  }
}
