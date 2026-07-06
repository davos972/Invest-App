// Fonction serveur (Vercel) — génère les recommandations de la semaine
// à la demande (bouton « Générer » de l'app, utilisateur connecté).
// Le cœur de la génération est partagé avec le cron du lundi
// (voir api/generation-core.js).
import { createClient } from '@supabase/supabase-js'
import { generateWeeklyRecommendations } from './generation-core.js'
import { savePriceSnapshot } from './price-history.js'

// Laisse jusqu'à 60 s à l'analyse (limite du plan Vercel gratuit).
export const maxDuration = 60

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée (POST attendu).' })
  }

  // 1) Vérifier la présence des clés.
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Clé Claude (ANTHROPIC_API_KEY) non configurée sur le serveur.' })
  }
  if (!process.env.FMP_API_KEY) {
    return res.status(500).json({ error: 'Clé FMP non configurée sur le serveur.' })
  }

  // 2) Identifier l'utilisateur connecté (jeton envoyé par le frontend).
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) {
    return res.status(401).json({ error: 'Non connecté (jeton manquant).' })
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } },
  )

  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData?.user) {
    return res.status(401).json({ error: 'Session invalide.' })
  }
  const userId = userData.user.id

  try {
    // 3) Générer (données de marché -> Claude -> JSON nettoyé).
    const { recommendations, marketData } = await generateWeeklyRecommendations(req.body?.model)

    // 4) Enregistrer dans Supabase (au nom de l'utilisateur).
    const { error: insertErr } = await supabase.from('weekly_recommendations').insert({
      user_id: userId,
      data: recommendations,
      avertissement_global: recommendations.avertissement_global ?? null,
      generated_at: new Date().toISOString(),
    })
    if (insertErr) {
      return res.status(500).json({ error: `Sauvegarde échouée : ${insertErr.message}` })
    }

    // 5) Mémoriser les prix du jour (pour l'analyse de performance). Non bloquant.
    await savePriceSnapshot(supabase, marketData)

    return res.status(200).json({ ok: true, data: recommendations })
  } catch (err) {
    return res.status(502).json({ error: err?.message || 'Erreur inattendue pendant la génération.' })
  }
}
