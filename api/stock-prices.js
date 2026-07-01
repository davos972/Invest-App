// Fonction serveur (Vercel) — prix des actions et métaux, convertis en CAD.
// La clé FMP est lue depuis une variable secrète (FMP_API_KEY) et n'est
// JAMAIS envoyée au navigateur : tout se passe ici, côté serveur.

export default async function handler(req, res) {
  const key = process.env.FMP_API_KEY
  if (!key) {
    return res.status(500).json({ error: 'Clé FMP non configurée sur le serveur.' })
  }

  const tickers = String(req.query.tickers || '').trim()
  if (!tickers) return res.status(200).json({})

  try {
    // 1) Prix en USD via FMP.
    const fmpUrl = `https://financialmodelingprep.com/api/v3/quote/${encodeURIComponent(tickers)}?apikey=${key}`
    const fmpRes = await fetch(fmpUrl)
    if (!fmpRes.ok) throw new Error(`FMP a répondu ${fmpRes.status}`)
    const quotes = await fmpRes.json()

    // 2) Taux de conversion USD -> CAD (API gratuite, sans clé).
    let usdToCad = 1
    try {
      const fxRes = await fetch('https://open.er-api.com/v6/latest/USD')
      const fx = await fxRes.json()
      if (fx?.rates?.CAD) usdToCad = fx.rates.CAD
    } catch {
      // Si la conversion échoue, on renvoie au moins le prix en USD.
    }

    const prices = {}
    for (const q of Array.isArray(quotes) ? quotes : []) {
      if (q?.symbol && q?.price != null) {
        prices[q.symbol] = q.price * usdToCad
      }
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    return res.status(200).json(prices)
  } catch (err) {
    return res.status(502).json({ error: err.message })
  }
}
