// Fonction serveur (Vercel) — génération AUTOMATIQUE du lundi matin.
// Appelée par le cron Vercel (voir vercel.json), sans utilisateur connecté :
//  - l'appel est authentifié par un secret (CRON_SECRET) que Vercel envoie
//    automatiquement dans l'en-tête Authorization ;
//  - l'écriture en base utilise la clé service_role (qui a tous les droits,
//    donc JAMAIS exposée au navigateur) et enregistre les recommandations
//    au nom du propriétaire de l'app (RECO_OWNER_USER_ID).
import { createClient } from '@supabase/supabase-js'
import { generateWeeklyRecommendations } from './generation-core.js'

// Laisse jusqu'à 60 s à l'analyse (limite du plan Vercel gratuit).
export const maxDuration = 60

export default async function handler(req, res) {
  // 1) Vérifier le secret du cron (refuse tout appel extérieur).
  const secret = process.env.CRON_SECRET
  if (!secret || (req.headers.authorization || '') !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Non autorisé.' })
  }

  // 2) Vérifier la configuration.
  const manquantes = [
    !process.env.ANTHROPIC_API_KEY && 'ANTHROPIC_API_KEY',
    !process.env.FMP_API_KEY && 'FMP_API_KEY',
    !process.env.SUPABASE_SERVICE_ROLE_KEY && 'SUPABASE_SERVICE_ROLE_KEY',
    !process.env.RECO_OWNER_USER_ID && 'RECO_OWNER_USER_ID',
  ].filter(Boolean)
  if (manquantes.length) {
    return res.status(500).json({ error: `Variable(s) manquante(s) : ${manquantes.join(', ')}` })
  }

  try {
    // 3) Générer (données de marché -> Claude -> JSON nettoyé).
    const recommendations = await generateWeeklyRecommendations()

    // 4) Enregistrer dans Supabase au nom du propriétaire.
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } },
    )
    const { error: insertErr } = await supabase.from('weekly_recommendations').insert({
      user_id: process.env.RECO_OWNER_USER_ID,
      data: recommendations,
      avertissement_global: recommendations.avertissement_global ?? null,
      generated_at: new Date().toISOString(),
    })
    if (insertErr) {
      return res.status(500).json({ error: `Sauvegarde échouée : ${insertErr.message}` })
    }

    return res.status(200).json({ ok: true, date: recommendations.date_generation })
  } catch (err) {
    return res.status(502).json({ error: err?.message || 'Erreur inattendue pendant la génération.' })
  }
}
