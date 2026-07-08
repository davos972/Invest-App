// TEMPORAIRE — outil de diagnostic StockTwits.
// Vérifie que StockTwits répond depuis Vercel et montre la forme des données
// (volume de messages, étiquettes Bullish/Bearish, échantillons). À RETIRER une
// fois le sentiment branché dans la génération.
export const maxDuration = 15

export default async function handler(req, res) {
  const symbol = String(req.query.symbol || 'AAPL').trim()
  const url = `https://api.stocktwits.com/api/2/streams/symbol/${encodeURIComponent(symbol)}.json`
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'invest-app/1.0 (personal research)' } })
    const http_status = r.status
    let data = null
    try {
      data = await r.json()
    } catch {
      const texte = await r.text().catch(() => '')
      return res.status(200).json({ symbol, http_status, note: 'réponse non-JSON', extrait: texte.slice(0, 300) })
    }

    const messages = Array.isArray(data?.messages) ? data.messages : []
    let bullish = 0
    let bearish = 0
    let neutres = 0
    const echantillons = []
    for (const m of messages) {
      const s = m?.entities?.sentiment?.basic ?? null
      if (s === 'Bullish') bullish++
      else if (s === 'Bearish') bearish++
      else neutres++
      if (echantillons.length < 3) {
        echantillons.push({ sentiment: s, body: (m?.body || '').slice(0, 120), created_at: m?.created_at })
      }
    }

    return res.status(200).json({
      symbol,
      http_status,
      nb_messages: messages.length,
      bullish,
      bearish,
      neutres,
      echantillons,
    })
  } catch (e) {
    return res.status(200).json({ symbol, erreur: e.message })
  }
}
