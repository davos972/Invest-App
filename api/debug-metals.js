// Outil de diagnostic temporaire : montre ce que l'API de métaux répond réellement.
// À ouvrir dans le navigateur : .../api/debug-metals
// (Ne renvoie jamais la clé, seulement le statut et le début de la réponse.)
export default async function handler(req, res) {
  const key = process.env.METALS_API_KEY
  if (!key) return res.status(500).json({ error: 'METALS_API_KEY manquante côté serveur.' })

  const url = `https://api.metals-api.com/v1/latest?access_key=${key}&base=USD&symbols=XAU,XAG,XPD,XPT`

  try {
    const r = await fetch(url)
    const text = await r.text()
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ status: r.status, body: text.slice(0, 800) })
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ error: e?.message || 'erreur' })
  }
}
