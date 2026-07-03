// Fonction serveur (Vercel) — prix des actions et métaux, convertis en CAD.
// La clé FMP est lue depuis une variable secrète (FMP_API_KEY) et n'est
// JAMAIS envoyée au navigateur : tout se passe ici, côté serveur.

// Récupère le prix (en USD) d'un symbole via l'adresse FMP « stable ».
// (L'ancienne adresse « /api/v3 » n'est plus supportée par FMP, retirée.)
async function fetchOneUsd(symbol, key) {
  const url = `https://financialmodelingprep.com/stable/quote?symbol=${encodeURIComponent(symbol)}&apikey=${key}`
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    const data = await r.json()
    const quote = Array.isArray(data) ? data[0] : null
    if (quote?.price != null) return { symbol: quote.symbol || symbol, price: quote.price }
  } catch {
    // on renvoie null : le prix de ce symbole ne sera pas disponible
  }
  return null
}

export default async function handler(req, res) {
  const key = process.env.FMP_API_KEY
  if (!key) {
    return res.status(500).json({ error: 'Clé FMP non configurée sur le serveur.' })
  }

  const symbols = String(req.query.tickers || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (symbols.length === 0) return res.status(200).json({})

  try {
    // Taux de conversion USD -> CAD (API gratuite, sans clé).
    let usdToCad = 1
    try {
      const fxRes = await fetch('https://open.er-api.com/v6/latest/USD')
      const fx = await fxRes.json()
      if (fx?.rates?.CAD) usdToCad = fx.rates.CAD
    } catch {
      // Si la conversion échoue, on renverra le prix en USD.
    }

    const results = await Promise.all(symbols.map((s) => fetchOneUsd(s, key)))

    const prices = {}
    for (const q of results) {
      if (q) prices[q.symbol] = q.price * usdToCad
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    return res.status(200).json(prices)
  } catch (err) {
    return res.status(502).json({ error: err.message })
  }
}
