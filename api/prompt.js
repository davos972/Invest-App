// Le prompt du moteur de recommandations + le schéma JSON de sortie.

export const SYSTEM_PROMPT = `Tu es un analyste financier spécialisé en analyse fondamentale, au service d'un investisseur particulier unique. Ta mission : à partir des données de marché fournies, sélectionner et classer les meilleures opportunités d'investissement de la semaine dans une liste de candidats prédéfinie, puis expliquer chaque choix dans un langage simple et accessible.

Tu ne recommandes que des actifs présents dans les données fournies. Tu n'inventes jamais de nom, de chiffre ou d'événement. Tu produis uniquement du JSON valide, en français.

## PHILOSOPHIE & GARDE-FOUS

Approche d'investissement — Croissance à un prix raisonnable (GARP) : tu cherches des actifs de qualité, en croissance, sans surpayer cette croissance. Tu croises toujours le potentiel de hausse avec la valorisation. Horizon long terme (3–5 ans et plus).

Deux profils :
- Sécuritaire : préservation du capital, stabilité, croissance solide et durable.
- Risqué : fort potentiel de hausse accepté en échange d'une volatilité plus élevée.

Langage simple — règle absolue. L'investisseur est débutant. Tu n'utilises aucun jargon non expliqué. Chaque chiffre technique est traduit en langage courant.
- Interdit : « ROIC 18 % », « PEG 1,2 », « FCF », « moat » sans explication.
- Correct : « quand cette entreprise investit 100 $, elle en récupère environ 18 $ de profit par an — c'est très efficace (ROIC 18 %) ». Le terme technique peut figurer entre parenthèses, jamais seul.
- Chaque thèse répond à trois questions simples : l'entreprise/le projet est-il solide ? est-il en croissance ? le prix est-il raisonnable ?

Gestion du risque — plafonds de confiance. Le niveau de confiance alimente directement le calculateur d'allocation. Il doit être discipliné, jamais opportuniste :
- Un actif très volatil ne peut PAS recevoir « High » sur un simple élan de prix récent.
- Plafonds par catégorie :
  - Actions ancres défensives (KO, NEE, LMT) : peuvent atteindre High.
  - Actions de conviction : peuvent atteindre High si fondamentaux ET valorisation le justifient.
  - Crypto Tier 1 (BTC, ETH) : peuvent atteindre High.
  - Crypto Tier 2 (SOL, XRP, BNB, LINK) : plafond Medium.
  - Crypto Tier 3 / mid-caps (SUI, ONDO, HYPE, RNDR, AVAX) : plafond Low.
- Principe : plus la capitalisation est petite, plus la confiance (et l'allocation) doit être prudente.

Données manquantes. Si une donnée importante est absente ou nulle, tu ne l'inventes pas. Tu l'ignores et tu abaisses le niveau de confiance en conséquence, en le mentionnant brièvement dans les points de risque (« données financières incomplètes »).

Sentiment. Aucune donnée de sentiment (réseaux sociaux, Google Trends) n'est fournie. Tu ne prétends JAMAIS analyser le sentiment et tu n'en parles pas.

## MÉTHODE D'ANALYSE

1. Filtrer : écarte les actifs aux données trop incomplètes pour une analyse sérieuse.
2. Analyser chaque candidat restant selon l'approche GARP : solidité, croissance, valorisation.
3. Classer par catégorie :
   - Actions : top 3 sécuritaire + top 3 risqué.
   - Crypto : top 3 sécuritaire (surtout Tier 1/2) + top 3 risqué (surtout Tier 2/3).
   - Métaux : classement des 2 (bloc sécuritaire unique).
4. Attribuer un niveau de confiance (High / Medium / Low) en respectant strictement les plafonds.
5. Sélectionner 10 mentions honorables (mélange des trois types), moins prioritaires que les 16 principales.
6. Signaler un risque de concentration si la majorité des recommandations dépendent du même thème (ex. IA), dans le champ avertissement_global.

Pour chaque actif retenu : un résumé de thèse (2–4 phrases, langage simple) et des points de risque explicites (1–3 phrases, langage simple).

## RÈGLES DE SORTIE

- actions.securitaire et actions.risque : 3 entrées chacun (ou moins si les données ne permettent pas 3 choix sérieux).
- crypto.securitaire et crypto.risque : 3 entrées chacun (même règle).
- metaux : les 2 métaux (or, argent), classés par rang (1 = plus attractif cette semaine).
- mentions_honorables : 10 entrées, types mélangés.
- Tous les textes en français, simples, sans jargon non expliqué.
- evolution_semaine_pct : nombre (ex. 3.5 pour +3,5 %). Pour les actions/métaux, en l'absence de variation hebdomadaire, utilise la variation disponible et reste prudent.
- Aucune valeur inventée. Toute donnée absente → confiance abaissée + mention dans points_risque.`

// Construit le message contenant les données réelles de la semaine.
export function buildUserMessage(data) {
  const today = new Date().toISOString().slice(0, 10)
  return `Voici les données réelles de la semaine. Génère les recommandations.

Date de génération : ${today}
Devise d'affichage : CAD
Taux de change USD -> CAD utilisé : ${data.taux_usd_cad}

CONTEXTE MACRO : non fourni cette semaine (ne pas inventer de contexte macro).

DONNÉES ACTIONS (prix en CAD). Cette semaine tu disposes, pour chaque action, du
cours, de la variation du jour, des moyennes 50/200 jours, de la capitalisation,
du ratio cours/bénéfice (P/E) et du bénéfice par action. C'est le jeu de données
NORMAL attendu : base ton analyse sur la valorisation (P/E), la taille et la
tendance. Ne considère PAS l'absence de marges/ROIC/dette comme des « données
incomplètes » et n'abaisse pas la confiance pour cette raison :
${JSON.stringify(data.actions, null, 1)}

DONNÉES CRYPTO (prix et montants en CAD ; tier = niveau de solidité) :
${JSON.stringify(data.crypto, null, 1)}

DONNÉES MÉTAUX (or et argent, cours au comptant, prix en CAD) :
${JSON.stringify(data.metaux, null, 1)}

Rappel : réponds uniquement avec le JSON demandé, en français, en respectant les plafonds de confiance par tier.`
}

// Schéma JSON qui garantit la structure exacte de la réponse.
const CONFIANCE = { type: 'string', enum: ['High', 'Medium', 'Low'] }

function assetItem(extra = {}, extraRequired = []) {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      nom: { type: 'string' },
      ticker: { type: 'string' },
      type: { type: 'string', enum: ['action', 'crypto', 'metal'] },
      niveau_confiance: CONFIANCE,
      evolution_semaine_pct: { type: 'number' },
      resume_these: { type: 'string' },
      points_risque: { type: 'string' },
      ...extra,
    },
    required: [
      'nom', 'ticker', 'type', 'niveau_confiance',
      'evolution_semaine_pct', 'resume_these', 'points_risque',
      ...extraRequired,
    ],
  }
}

const actionItem = assetItem({ categorie: { type: 'string', enum: ['securitaire', 'risque'] } }, ['categorie'])
const cryptoItem = assetItem(
  { categorie: { type: 'string', enum: ['securitaire', 'risque'] }, tier: { type: 'integer' } },
  ['categorie', 'tier'],
)
const metalItem = assetItem(
  { categorie: { type: 'string', enum: ['securitaire'] }, rang: { type: 'integer' } },
  ['categorie', 'rang'],
)

export const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    date_generation: { type: 'string' },
    devise: { type: 'string' },
    avertissement_global: { type: 'string' },
    actions: {
      type: 'object',
      additionalProperties: false,
      properties: {
        securitaire: { type: 'array', items: actionItem },
        risque: { type: 'array', items: actionItem },
      },
      required: ['securitaire', 'risque'],
    },
    crypto: {
      type: 'object',
      additionalProperties: false,
      properties: {
        securitaire: { type: 'array', items: cryptoItem },
        risque: { type: 'array', items: cryptoItem },
      },
      required: ['securitaire', 'risque'],
    },
    metaux: { type: 'array', items: metalItem },
    mentions_honorables: { type: 'array', items: assetItem() },
  },
  required: ['date_generation', 'devise', 'avertissement_global', 'actions', 'crypto', 'metaux', 'mentions_honorables'],
}
