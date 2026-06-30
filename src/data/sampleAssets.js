// Données d'EXEMPLE (fictives) pour pouvoir construire et tester l'app avant
// que l'IA (Phase 2) ne génère les vraies recommandations.
// Rien ici n'est un conseil financier.

// Un actif complet, tel que l'IA en produira un plus tard.
function asset(a) {
  return {
    these: '',
    risques: '',
    macro: '',
    metriques: [],
    ...a,
  }
}

export const actionsSecuritaire = [
  asset({
    id: 'aapl', nom: 'Apple', ticker: 'AAPL', type: 'action', categorie: 'securitaire', confiance: 'High', evolution: 1.8,
    these: "Géant technologique à la trésorerie massive et aux revenus récurrents (services). Croissance stable, marque dominante.",
    risques: "Dépendance à l'iPhone ; pression réglementaire sur l'App Store.",
    macro: "Consommation résiliente malgré des taux élevés.",
    metriques: ['PER ~29', 'Marge nette ~25 %', 'Dividende ~0,5 %'],
  }),
  asset({
    id: 'msft', nom: 'Microsoft', ticker: 'MSFT', type: 'action', categorie: 'securitaire', confiance: 'High', evolution: 2.3,
    these: "Leader du cloud (Azure) et de la productivité (Office). Forte exposition à l'IA via sa participation dans OpenAI.",
    risques: "Valorisation élevée ; concurrence cloud (AWS, Google).",
    macro: "Dépenses des entreprises en cloud toujours soutenues.",
    metriques: ['PER ~35', 'Croissance Azure ~30 %'],
  }),
  asset({
    id: 'cost', nom: 'Costco', ticker: 'COST', type: 'action', categorie: 'securitaire', confiance: 'Medium', evolution: 0.9,
    these: "Distributeur défensif au modèle d'abonnement très fidélisant. Croissance lente mais régulière.",
    risques: "Valorisation tendue pour un distributeur ; sensible à la consommation.",
    macro: "Recherche de valeur par les ménages en période d'inflation.",
    metriques: ['PER ~50', 'Renouvellement abonnés ~90 %'],
  }),
]

export const actionsRisque = [
  asset({
    id: 'nvda', nom: 'Nvidia', ticker: 'NVDA', type: 'action', categorie: 'risque', confiance: 'Medium', evolution: 5.1,
    these: "Quasi-monopole des puces pour l'IA. Croissance explosive des centres de données.",
    risques: "Cyclicité des semi-conducteurs ; valorisation extrême ; dépendance à quelques gros clients.",
    macro: "Vague d'investissement mondiale dans l'IA.",
    metriques: ['PER ~45', 'Croissance CA >100 % a/a'],
  }),
  asset({
    id: 'amd', nom: 'AMD', ticker: 'AMD', type: 'action', categorie: 'risque', confiance: 'Low', evolution: 4.2,
    these: "Challenger crédible de Nvidia et Intel ; pari sur les parts de marché en IA et serveurs.",
    risques: "Exécution incertaine face à Nvidia ; marges sous pression.",
    macro: "Demande forte mais concurrence intense.",
    metriques: ['PER ~40', 'Part de marché GPU en hausse'],
  }),
  asset({
    id: 'pltr', nom: 'Palantir', ticker: 'PLTR', type: 'action', categorie: 'risque', confiance: 'Low', evolution: 7.8,
    these: "Logiciels d'analyse de données pour gouvernements et entreprises ; forte dynamique commerciale IA.",
    risques: "Valorisation très élevée ; dépendance aux contrats publics.",
    macro: "Adoption croissante de l'IA en entreprise.",
    metriques: ['Croissance clients commerciaux ~50 %'],
  }),
]

export const cryptoSecuritaire = [
  asset({
    id: 'btc', nom: 'Bitcoin', ticker: 'BTC', type: 'crypto', categorie: 'securitaire', confiance: 'High', evolution: -1.2,
    these: "La crypto de référence, la plus liquide et la plus institutionnalisée (ETF au comptant). « Or numérique ».",
    risques: "Forte volatilité ; risque réglementaire ; corrélation aux actifs risqués.",
    macro: "Flux entrants via les ETF ; cycle post-halving.",
    metriques: ['Dominance ~55 %', 'Offre plafonnée à 21 M'],
  }),
  asset({
    id: 'eth', nom: 'Ethereum', ticker: 'ETH', type: 'crypto', categorie: 'securitaire', confiance: 'High', evolution: 3.7,
    these: "Plateforme de référence pour les applications décentralisées et les contrats intelligents.",
    risques: "Concurrence d'autres blockchains ; complexité technique.",
    macro: "Croissance de l'écosystème DeFi et des stablecoins.",
    metriques: ['2e capitalisation', 'Émission nette faible'],
  }),
  asset({
    id: 'sol', nom: 'Solana', ticker: 'SOL', type: 'crypto', categorie: 'securitaire', confiance: 'Medium', evolution: 2.1,
    these: "Blockchain rapide et peu coûteuse, écosystème en forte croissance.",
    risques: "Historique de pannes réseau ; concurrence d'Ethereum.",
    macro: "Adoption croissante des applications grand public.",
    metriques: ['Transactions/s élevées', 'Frais très bas'],
  }),
]

export const cryptoRisque = [
  asset({
    id: 'link', nom: 'Chainlink', ticker: 'LINK', type: 'crypto', categorie: 'risque', confiance: 'Medium', evolution: 4.4,
    these: "Infrastructure d'oracles connectant les blockchains aux données du monde réel.",
    risques: "Dépendance à l'adoption DeFi ; concurrence.",
    macro: "Tokenisation des actifs réels en plein essor.",
    metriques: ['Standard de marché des oracles'],
  }),
  asset({
    id: 'rndr', nom: 'Render', ticker: 'RNDR', type: 'crypto', categorie: 'risque', confiance: 'Low', evolution: 9.2,
    these: "Réseau décentralisé de calcul graphique (GPU), surfant sur la demande IA.",
    risques: "Petite capitalisation ; très volatil ; projet jeune.",
    macro: "Pénurie de puissance de calcul GPU.",
    metriques: ['Micro-cap', 'Lié au narratif IA'],
  }),
  asset({
    id: 'inj', nom: 'Injective', ticker: 'INJ', type: 'crypto', categorie: 'risque', confiance: 'Low', evolution: 11.5,
    these: "Blockchain spécialisée dans la finance décentralisée et le trading.",
    risques: "Très spéculatif ; liquidité limitée ; forte volatilité.",
    macro: "Intérêt pour la DeFi de nouvelle génération.",
    metriques: ['Micro-cap', 'Écosystème en construction'],
  }),
]

// Métaux précieux : bloc unique, classement des 4 (pas de séparation sûr/risqué).
export const metaux = [
  asset({
    id: 'gld', nom: 'Or (Gold)', ticker: 'GLD', type: 'metal', categorie: 'securitaire', confiance: 'High', evolution: 0.6,
    these: "Valeur refuge historique, demande des banques centrales soutenue.",
    risques: "Ne génère aucun rendement ; sensible aux taux réels.",
    macro: "Incertitude géopolitique et achats des banques centrales.",
    metriques: ['ETF GLD', 'Refuge anti-inflation'],
  }),
  asset({
    id: 'slv', nom: 'Argent (Silver)', ticker: 'SLV', type: 'metal', categorie: 'securitaire', confiance: 'Medium', evolution: 1.1,
    these: "À la fois métal précieux et métal industriel (panneaux solaires, électronique).",
    risques: "Plus volatil que l'or ; sensible au cycle industriel.",
    macro: "Demande industrielle liée à la transition énergétique.",
    metriques: ['ETF SLV', 'Double usage'],
  }),
  asset({
    id: 'pall', nom: 'Palladium', ticker: 'PALL', type: 'metal', categorie: 'securitaire', confiance: 'Low', evolution: -2.3,
    these: "Métal industriel clé pour les pots catalytiques des véhicules thermiques.",
    risques: "Déclin du thermique au profit de l'électrique ; offre concentrée.",
    macro: "Transition vers les véhicules électriques défavorable.",
    metriques: ['ETF PALL', 'Usage automobile'],
  }),
  asset({
    id: 'plat', nom: 'Platine (Platinum)', ticker: 'PPLT', type: 'metal', categorie: 'securitaire', confiance: 'Low', evolution: 0.2,
    these: "Métal industriel et précieux, usages dans l'hydrogène et l'automobile.",
    risques: "Demande dépendante de l'industrie ; offre minière concentrée.",
    macro: "Espoirs liés à l'économie de l'hydrogène.",
    metriques: ['ETF PPLT', 'Pari sur l\'hydrogène'],
  }),
]

export const mentionsHonorables = [
  asset({ id: 'googl', nom: 'Alphabet', ticker: 'GOOGL', type: 'action', categorie: 'securitaire', confiance: 'Medium', evolution: 1.4, these: "Domination de la recherche et forte position en IA (Gemini).", risques: "Risque antitrust.", macro: "Publicité numérique solide." }),
  asset({ id: 'ko', nom: 'Coca-Cola', ticker: 'KO', type: 'action', categorie: 'securitaire', confiance: 'Medium', evolution: 0.4, these: "Valeur défensive, dividende régulier (aristocrate).", risques: "Croissance lente.", macro: "Refuge en cas de récession." }),
  asset({ id: 'asml', nom: 'ASML', ticker: 'ASML', type: 'action', categorie: 'securitaire', confiance: 'Medium', evolution: 2.0, these: "Monopole des machines de lithographie EUV pour les puces.", risques: "Cyclicité ; tensions géopolitiques.", macro: "Chaîne d'approvisionnement des semi-conducteurs." }),
  asset({ id: 'avgo', nom: 'Broadcom', ticker: 'AVGO', type: 'action', categorie: 'risque', confiance: 'Medium', evolution: 3.1, these: "Acteur clé des puces réseau et de l'infrastructure IA.", risques: "Endettement lié aux acquisitions.", macro: "Demande IA forte." }),
  asset({ id: 'ada', nom: 'Cardano', ticker: 'ADA', type: 'crypto', categorie: 'risque', confiance: 'Low', evolution: 5.6, these: "Blockchain axée sur la recherche académique.", risques: "Développement lent ; adoption à prouver.", macro: "Intérêt spéculatif." }),
  asset({ id: 'dot', nom: 'Polkadot', ticker: 'DOT', type: 'crypto', categorie: 'risque', confiance: 'Low', evolution: 4.0, these: "Protocole d'interopérabilité entre blockchains.", risques: "Complexité ; concurrence.", macro: "Besoin de connecter les blockchains." }),
  asset({ id: 'matic', nom: 'Polygon', ticker: 'MATIC', type: 'crypto', categorie: 'risque', confiance: 'Low', evolution: 6.8, these: "Solution de mise à l'échelle pour Ethereum.", risques: "Concurrence des autres couches 2.", macro: "Congestion d'Ethereum." }),
  asset({ id: 'jpm', nom: 'JPMorgan', ticker: 'JPM', type: 'action', categorie: 'securitaire', confiance: 'Medium', evolution: 0.8, these: "Banque la mieux gérée, bénéficie des taux élevés.", risques: "Sensible au cycle économique.", macro: "Marges d'intérêt favorables." }),
  asset({ id: 'unh', nom: 'UnitedHealth', ticker: 'UNH', type: 'action', categorie: 'securitaire', confiance: 'Low', evolution: -0.5, these: "Leader de l'assurance santé américaine.", risques: "Risque politique/réglementaire.", macro: "Dépenses de santé en hausse." }),
  asset({ id: 'xrp', nom: 'XRP', ticker: 'XRP', type: 'crypto', categorie: 'risque', confiance: 'Low', evolution: 8.3, these: "Crypto orientée paiements transfrontaliers.", risques: "Incertitude réglementaire (litiges passés).", macro: "Adoption par des institutions financières." }),
]

// Listes "à plat" réutilisées par le calculateur.
export const sampleMainAssets = [
  ...actionsSecuritaire,
  ...actionsRisque,
  ...cryptoSecuritaire,
  ...cryptoRisque,
  ...metaux,
]

export const sampleHonorableMentions = mentionsHonorables

// Sections affichées sur la page d'accueil (dans l'ordre du document).
export const homeSections = [
  { key: 'actions-sec', titre: 'Actions — Sécuritaire', items: actionsSecuritaire },
  { key: 'actions-risk', titre: 'Actions — Risqué', items: actionsRisque },
  { key: 'crypto-sec', titre: 'Crypto — Sécuritaire', items: cryptoSecuritaire },
  { key: 'crypto-risk', titre: 'Crypto — Risqué', items: cryptoRisque },
  { key: 'metaux', titre: 'Métaux précieux (classement)', items: metaux },
  { key: 'mentions', titre: 'Mentions honorables', items: mentionsHonorables },
]

// Retrouve un actif par son identifiant (pour la page d'analyse détaillée).
const allAssets = [...sampleMainAssets, ...mentionsHonorables]
export function getAssetById(id) {
  return allAssets.find((a) => a.id === id) || null
}
