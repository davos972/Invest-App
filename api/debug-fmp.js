// Outil de diagnostic temporaire : montre ce que FMP répond réellement.
// À ouvrir dans le navigateur : .../api/debug-fmp
// (Ne renvoie jamais la clé, seulement les statuts et le début des réponses.)
export default async function handler(req, res) {
  const key = process.env.FMP_API_KEY
  if (!key) return res.status(500).json({ error: 'FMP_API_KEY manquante côté serveur.' })

  const base = 'https://financialmodelingprep.com'
  const tests = {
    stable_quote_MSFT: `${base}/stable/quote?symbol=MSFT&apikey=${key}`,
    stable_quote_KO: `${base}/stable/quote?symbol=KO&apikey=${key}`,
    stable_quote_GLD: `${base}/stable/quote?symbol=GLD&apikey=${key}`,
    stable_quote_SLV: `${base}/stable/quote?symbol=SLV&apikey=${key}`,
    stable_quote_PALL: `${base}/stable/quote?symbol=PALL&apikey=${key}`,
    stable_quote_PPLT: `${base}/stable/quote?symbol=PPLT&apikey=${key}`,
  }

  const out = {}
  for (const [name, url] of Object.entries(tests)) {
    try {
      const r = await fetch(url)
      const text = await r.text()
      out[name] = { status: r.status, body: text.slice(0, 400) }
    } catch (e) {
      out[name] = { error: e?.message || 'erreur' }
    }
  }

  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json(out)
}
