// Outil d'audit temporaire : vérifie que CHAQUE actif de l'app reçoit bien
// un prix depuis sa vraie source (FMP pour actions/métaux, CoinGecko pour
// les cryptos, open.er-api.com pour le taux USD→CAD).
// À ouvrir dans le navigateur : .../api/debug-prices
// (Ne renvoie jamais de clé, seulement des ✓ / ✗ par actif.)
import { STOCKS, CRYPTOS, METALS } from './candidates.js'
import { gatherMarketData } from './market-data.js'

export const maxDuration = 60

export default async function handler(req, res) {
  const key = process.env.FMP_API_KEY
  if (!key) return res.status(500).json({ error: 'FMP_API_KEY manquante côté serveur.' })

  // 1) Le chemin de la GÉNÉRATION IA (FMP individuel + CoinGecko markets + FX).
  const data = await gatherMarketData(key)

  const actions = {}
  const recus = Object.fromEntries(data.actions.map((a) => [a.ticker, a.prix_cad]))
  for (const s of STOCKS) {
    actions[s] = recus[s] != null ? `✓ ${recus[s]} CAD` : '✗ PRIX MANQUANT'
  }

  const metaux = {}
  for (const m of data.metaux) {
    metaux[m.ticker] = m.prix_cad != null ? `✓ ${m.prix_cad} CAD (${m.nom})` : `✗ PRIX MANQUANT (${m.nom})`
  }

  const cryptoGeneration = {}
  for (const c of data.crypto) {
    cryptoGeneration[c.ticker] = c.prix_cad != null ? `✓ ${c.prix_cad} CAD` : '✗ PRIX MANQUANT'
  }

  // 2) Le chemin du PORTEFEUILLE / CALCULATEUR pour les cryptos
  //    (endpoint CoinGecko "simple/price", le même que le navigateur).
  const cryptoPortefeuille = {}
  try {
    const ids = CRYPTOS.map((c) => c.id).join(',')
    const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=cad`)
    const json = await r.json()
    for (const c of CRYPTOS) {
      const cad = json?.[c.id]?.cad
      cryptoPortefeuille[c.symbol] = cad != null ? `✓ ${cad} CAD` : `✗ PRIX MANQUANT (id CoinGecko : ${c.id})`
    }
  } catch (e) {
    cryptoPortefeuille.erreur = e?.message || 'appel CoinGecko simple/price échoué'
  }

  const manquants =
    Object.values(actions).filter((v) => v.startsWith('✗')).length +
    Object.values(metaux).filter((v) => v.startsWith('✗')).length +
    Object.values(cryptoGeneration).filter((v) => v.startsWith('✗')).length +
    Object.values(cryptoPortefeuille).filter((v) => String(v).startsWith('✗')).length

  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({
    bilan: manquants === 0 ? '✓ TOUT EST OK — aucun prix manquant' : `✗ ${manquants} prix manquant(s), voir détail`,
    taux_usd_cad: data.taux_usd_cad,
    actions,
    metaux,
    crypto_generation_ia: cryptoGeneration,
    crypto_portefeuille_calculateur: cryptoPortefeuille,
  })
}
