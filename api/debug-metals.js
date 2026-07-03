// Outil de diagnostic temporaire : montre ce que Twelve Data répond réellement
// pour les métaux précieux (or, argent, platine, palladium).
// À ouvrir dans le navigateur : .../api/debug-metals
// (Ne renvoie jamais la clé, seulement le statut et le début de la réponse.)
export default async function handler(req, res) {
  const key = process.env.TWELVEDATA_API_KEY
  if (!key) return res.status(500).json({ error: 'TWELVEDATA_API_KEY manquante côté serveur.' })

  const url = `https://api.twelvedata.com/price?symbol=XAU/USD,XAG/USD,XPT/USD,XPD/USD&apikey=${key}`

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
