// Fonction serveur (Vercel) — génère les recommandations de la semaine.
// Enchaîne : données de marché réelles -> prompt -> Claude -> sauvegarde Supabase.
// Les clés (Claude, FMP) restent secrètes, côté serveur uniquement.
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { gatherMarketData } from './market-data.js'
import { SYSTEM_PROMPT, buildUserMessage, OUTPUT_SCHEMA } from './prompt.js'

// Laisse jusqu'à 60 s à l'analyse (limite du plan Vercel gratuit).
export const maxDuration = 60

// Filet de sécurité : retire des mentions honorables tout ticker déjà présent
// dans les listes principales (au cas où Claude ne respecterait pas la consigne).
function dedupeMentions(reco) {
  const dejaUtilises = new Set([
    ...(reco.actions?.securitaire || []),
    ...(reco.actions?.risque || []),
    ...(reco.crypto?.securitaire || []),
    ...(reco.crypto?.risque || []),
    ...(reco.metaux || []),
  ].map((a) => a.ticker))
  return {
    ...reco,
    mentions_honorables: (reco.mentions_honorables || []).filter((a) => !dejaUtilises.has(a.ticker)),
  }
}

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
    // 3) Récupérer les données de marché réelles.
    const marketData = await gatherMarketData(process.env.FMP_API_KEY)

    // 4) Demander l'analyse à Claude (sortie JSON garantie par le schéma).
    const anthropic = new Anthropic()
    const message = await anthropic.messages.create({
      model: req.body?.model || 'claude-opus-4-8',
      max_tokens: 12000,
      thinking: { type: 'adaptive' },
      output_config: {
        // "low" garde une bonne analyse tout en restant bien sous la limite de
        // 60 s de Vercel. On pourra remonter à "medium"/"high" plus tard.
        effort: 'low',
        format: { type: 'json_schema', schema: OUTPUT_SCHEMA },
      },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserMessage(marketData) }],
    })

    const textBlock = message.content.find((b) => b.type === 'text')
    if (!textBlock) {
      return res.status(502).json({ error: "L'IA n'a pas renvoyé de contenu exploitable." })
    }
    const recommendations = dedupeMentions(JSON.parse(textBlock.text))

    // 5) Enregistrer dans Supabase (au nom de l'utilisateur).
    const { error: insertErr } = await supabase.from('weekly_recommendations').insert({
      user_id: userId,
      data: recommendations,
      avertissement_global: recommendations.avertissement_global ?? null,
      generated_at: new Date().toISOString(),
    })
    if (insertErr) {
      return res.status(500).json({ error: `Sauvegarde échouée : ${insertErr.message}` })
    }

    return res.status(200).json({ ok: true, data: recommendations })
  } catch (err) {
    return res.status(502).json({ error: err?.message || 'Erreur inattendue pendant la génération.' })
  }
}
