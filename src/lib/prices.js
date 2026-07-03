// Récupération des prix réels des actifs.
// - Crypto : via CoinGecko (gratuit, sans clé, prix directement en CAD).
// - Actions / métaux : via FMP (nécessite une clé) — branché plus tard.

// Correspondance entre nos tickers crypto et les identifiants CoinGecko.
// Doit rester alignée avec la liste CRYPTOS de api/candidates.js.
const COINGECKO_IDS = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  XRP: 'ripple',
  BNB: 'binancecoin',
  LINK: 'chainlink',
  SUI: 'sui',
  ONDO: 'ondo-finance',
  RNDR: 'render-token',
  AVAX: 'avalanche-2',
  HYPE: 'hyperliquid',
  // Anciens candidats gardés pour les données d'exemple (sampleAssets.js).
  INJ: 'injective-protocol',
  ADA: 'cardano',
  DOT: 'polkadot',
  MATIC: 'matic-network',
}

// Va chercher les prix en CAD pour une liste de tickers crypto.
// Renvoie un objet { TICKER: prix_en_cad }.
export async function fetchCryptoPrices(tickers) {
  // On ne garde que les cryptos qu'on sait identifier.
  const pairs = tickers
    .map((t) => [t, COINGECKO_IDS[String(t).toUpperCase()]])
    .filter(([, id]) => Boolean(id))

  if (pairs.length === 0) return {}

  const ids = pairs.map(([, id]) => id).join(',')
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=cad`

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`CoinGecko a répondu ${res.status}`)
    const data = await res.json()

    const prices = {}
    for (const [ticker, id] of pairs) {
      const cad = data[id]?.cad
      if (cad != null) prices[ticker] = cad
    }
    return prices
  } catch (err) {
    console.error('Récupération des prix crypto échouée :', err.message)
    return {}
  }
}

// Indique si un ticker correspond à une crypto qu'on sait récupérer.
export function isKnownCrypto(ticker) {
  return Boolean(COINGECKO_IDS[String(ticker).toUpperCase()])
}

// Va chercher les prix des actions / métaux en CAD, via notre programme
// serveur (qui utilise la clé FMP secrète). Renvoie { TICKER: prix_cad }.
export async function fetchStockPrices(tickers) {
  const list = tickers.filter(Boolean)
  if (list.length === 0) return {}
  try {
    const res = await fetch(`/api/stock-prices?tickers=${encodeURIComponent(list.join(','))}`)
    if (!res.ok) throw new Error(`/api/stock-prices a répondu ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Récupération des prix actions/métaux échouée :', err.message)
    return {}
  }
}
