// Récupération des prix réels des actifs.
// - Crypto : via CoinGecko (gratuit, sans clé, prix directement en CAD).
// - Actions / métaux : via FMP (nécessite une clé) — branché plus tard.

// Correspondance entre nos tickers crypto et les identifiants CoinGecko.
const COINGECKO_IDS = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  LINK: 'chainlink',
  RNDR: 'render-token',
  INJ: 'injective-protocol',
  ADA: 'cardano',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  XRP: 'ripple',
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
