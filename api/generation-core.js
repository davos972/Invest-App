// Cœur de la génération des recommandations, partagé entre :
//  - /api/generate-recommendations (bouton manuel, utilisateur connecté)
//  - /api/cron-generate (réveil automatique du lundi, sans utilisateur)
// Enchaîne : données de marché réelles -> prompt -> Claude -> JSON nettoyé.
import Anthropic from '@anthropic-ai/sdk'
import { gatherMarketData } from './market-data.js'
import { SYSTEM_PROMPT, buildUserMessage, OUTPUT_SCHEMA } from './prompt.js'

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

// Réinjecte le sentiment social (StockTwits) dans chaque actif recommandé, par
// ticker, à partir des données de marché — pour qu'il soit stocké et affichable
// dans l'app (les métaux n'en ont pas).
function attachSentiment(reco, marketData) {
  const map = {}
  for (const a of marketData?.actions || []) if (a.sentiment_social) map[a.ticker] = a.sentiment_social
  for (const c of marketData?.crypto || []) if (c.sentiment_social) map[c.ticker] = c.sentiment_social
  const enrich = (arr) =>
    (arr || []).map((it) => (map[it.ticker] ? { ...it, sentiment_social: map[it.ticker] } : it))
  return {
    ...reco,
    actions: { securitaire: enrich(reco.actions?.securitaire), risque: enrich(reco.actions?.risque) },
    crypto: { securitaire: enrich(reco.crypto?.securitaire), risque: enrich(reco.crypto?.risque) },
    mentions_honorables: enrich(reco.mentions_honorables),
  }
}

// Génère les recommandations de la semaine.
// Renvoie { recommendations, marketData } : les recommandations prêtes à
// stocker, et les données de marché (réutilisées pour l'historique des prix).
export async function generateWeeklyRecommendations(model) {
  const marketData = await gatherMarketData(process.env.FMP_API_KEY)

  const anthropic = new Anthropic()
  const message = await anthropic.messages.create({
    model: model || 'claude-opus-4-8',
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
    throw new Error("L'IA n'a pas renvoyé de contenu exploitable.")
  }
  const reco = attachSentiment(dedupeMentions(JSON.parse(textBlock.text)), marketData)
  return { recommendations: reco, marketData }
}
