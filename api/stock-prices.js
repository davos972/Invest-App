// Fonction serveur (Vercel) — prix des actions et métaux, convertis en CAD.
// La clé FMP est lue depuis une variable secrète (FMP_API_KEY) et n'est
// JAMAIS envoyée au navigateur : tout se passe ici, côté serveur.

// Un peu de marge pour les nouvelles tentatives en cas de rafale (429).
export const maxDuration = 30

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Récupère le prix (en USD) d'un symbole via l'adresse FMP « stable ».
// Réessaie en douceur sur 429 (blocage temporaire de rafale), pas sur un vrai refus.
async function fetchOneUsd(symbol, key, attempt = 0) {
  const url = `https://financialmodelingprep.com/stable/quote?symbol=${encodeURIComponent(symbol)}&apikey=${key}`
  try {
    const r = await fetch(url)
    if (r.status === 429 && attempt < 2) {
      await sleep(600 * (attempt + 1))
      return fetchOneUsd(symbol, key, attempt + 1)
    }
    if (!r.ok) return null
    const data = await r.json()
    const quote = Array.isArray(data) ? data[0] : null
    if (quote?.price != null) return { symbol: quote.symbol || symbol, price: quote.price }
  } catch {
    if (attempt < 2) {
      await sleep(400)
      return fetchOneUsd(symbol, key, attempt + 1)
    }
  }
  return null
}

// Récupère les cours par petits groupes plutôt que tous d'un coup, pour ne
// pas déclencher le blocage anti-rafale de l'offre gratuite FMP quand on
// ajoute beaucoup de placements en même temps (ex. depuis le Calculateur).
async function fetchManyUsd(symbols, key) {
  const TAILLE_GROUPE = 6
  const results = []
  for (let i = 0; i < symbols.length; i += TAILLE_GROUPE) {
    const groupe = symbols.slice(i, i + TAILLE_GROUPE)
    results.push(...(await Promise.all(groupe.map((s) => fetchOneUsd(s, key)))))
    if (i + TAILLE_GROUPE < symbols.length) await sleep(200)
  }
  return results
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

    const results = await fetchManyUsd(symbols, key)

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
