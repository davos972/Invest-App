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
  - Actions ancres défensives (KO, PEP, JNJ, LMT…) : peuvent atteindre High.
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
   - Métaux : classement des métaux fournis (bloc sécuritaire unique).
4. Attribuer un niveau de confiance (High / Medium / Low) en respectant strictement les plafonds.
5. Sélectionner 10 mentions honorables (mélange des trois types), moins prioritaires que les 16 principales. Vise bien 10 entrées DISTINCTES tant que le vivier de candidats le permet. RÈGLE STRICTE : un actif déjà choisi dans actions/crypto/métaux ci-dessus (étapes 3-4) ne peut PAS réapparaître dans les mentions honorables — chaque ticker n'apparaît qu'UNE SEULE FOIS dans tout le JSON de sortie, jamais deux.
6. Signaler un risque de concentration si la majorité des recommandations dépendent du même thème (ex. IA), dans le champ avertissement_global.

Pour chaque actif retenu : un résumé de thèse (2–4 phrases, langage simple) et des points de risque explicites (1–3 phrases, langage simple).

## RÈGLES DE SORTIE

- actions.securitaire et actions.risque : 3 entrées chacun (ou moins si les données ne permettent pas 3 choix sérieux).
- crypto.securitaire et crypto.risque : 3 entrées chacun (même règle).
- metaux : tous les métaux fournis (or, argent, palladium, platine), classés par rang (1 = plus attractif cette semaine).
- mentions_honorables : 10 entrées, types mélangés, tickers tous différents de ceux déjà utilisés dans actions/crypto/metaux.
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

CONTEXTE MACRO (météo générale des marchés cette semaine) :
${JSON.stringify(data.macro, null, 1)}
Comment le lire : le VIX est l'« indice de la peur » — bas (< 15) = marché
serein, appétit pour le risque ; élevé (> 25) = marché craintif, sois alors plus
prudent sur les actifs risqués et les petites capitalisations. Un taux 10 ans
élevé ou nettement au-dessus du taux 2 ans pèse sur les valorisations, surtout
les actions de croissance et la crypto ; si le taux 2 ans dépasse le 10 ans
(courbe inversée), c'est un signal de prudence. Les niveaux et variations du
S&P 500 et du Nasdaq indiquent le régime (hausse ou repli). Sers-toi de ce
contexte pour NUANCER la confiance et l'exposition au risque, sans en faire
l'élément central (l'analyse fondamentale reste prioritaire). N'invente aucune
autre donnée macro ; si un champ est absent (null), ignore-le sans le signaler.

DONNÉES ACTIONS (prix en CAD). Ces actions ont été PRÉSÉLECTIONNÉES par un
screener automatique selon deux profils (champ "profil_origine") : "securitaire"
(grande capitalisation, croissance solide, bonne rentabilité, faible dette) ou
"risque" (moyenne capitalisation en forte croissance, marges élevées). Toutes
ont déjà passé un filtre de qualité fondamentale — mais le screener NE DÉCIDE
PAS : c'est à toi de trancher sur la valorisation et de classer. Le
"profil_origine" est une indication d'origine, pas une obligation de catégorie.

Pour chaque action tu disposes : cours, variation du jour, moyennes 50/200 jours,
plus haut/bas 52 semaines, capitalisation, secteur, et les fondamentaux :
- "per" : ratio cours/bénéfice (P/E) — valorisation.
- "peg" : P/E rapporté à la croissance — proche de 1 = croissance à prix raisonnable.
- "bpa_cad" : bénéfice par action.
- "croissance_ca_pct" : croissance du chiffre d'affaires sur un an (%).
- "croissance_bpa_pct" : croissance du bénéfice par action sur un an (%).
- "marge_brute_pct" / "marge_nette_pct" : marges (rentabilité).
- "roe_pct" : rentabilité des capitaux propres (efficacité du capital).
- "dette_sur_capitaux_propres" : endettement (au-dessus de 1,5–2 = très endettée).

Base ton analyse GARP là-dessus : croissance (CA, BPA), qualité (marges, ROE),
solidité (dette), valorisation (P/E, PEG) et tendance (moyennes, taille). Si une
valeur vaut null, ignore-la et abaisse légèrement la confiance, sans drame :
${JSON.stringify(data.actions, null, 1)}

DONNÉES CRYPTO (prix et montants en CAD ; tier = niveau de solidité) :
${JSON.stringify(data.crypto, null, 1)}

DONNÉES MÉTAUX (or, argent, palladium, platine ; prix en CAD ; or/argent = cours
au comptant, palladium/platine = cours de leur ETF) :
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
