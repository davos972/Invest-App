// Liste d'EXEMPLE de placements, juste pour pouvoir tester le calculateur
// avant que l'IA (Phase 2) ne génère les vraies recommandations.
// Rien de tout ceci n'est un conseil financier — ce sont des données fictives.

export const sampleMainAssets = [
  { id: 'aapl', nom: 'Apple', ticker: 'AAPL', type: 'action', categorie: 'securitaire', confiance: 'High', evolution: 1.8 },
  { id: 'msft', nom: 'Microsoft', ticker: 'MSFT', type: 'action', categorie: 'securitaire', confiance: 'High', evolution: 2.3 },
  { id: 'nvda', nom: 'Nvidia', ticker: 'NVDA', type: 'action', categorie: 'risque', confiance: 'Medium', evolution: 5.1 },
  { id: 'btc', nom: 'Bitcoin', ticker: 'BTC', type: 'crypto', categorie: 'securitaire', confiance: 'High', evolution: -1.2 },
  { id: 'eth', nom: 'Ethereum', ticker: 'ETH', type: 'crypto', categorie: 'risque', confiance: 'Medium', evolution: 3.7 },
  { id: 'gld', nom: 'Or (Gold)', ticker: 'GLD', type: 'metal', categorie: 'securitaire', confiance: 'High', evolution: 0.6 },
]

// Les "mentions honorables" : placements supplémentaires proposés quand
// l'utilisateur clique sur « Avoir plus d'indices ».
export const sampleHonorableMentions = [
  { id: 'sol', nom: 'Solana', ticker: 'SOL', type: 'crypto', categorie: 'risque', confiance: 'Low', evolution: 6.4 },
  { id: 'slv', nom: 'Argent (Silver)', ticker: 'SLV', type: 'metal', categorie: 'securitaire', confiance: 'Medium', evolution: 1.1 },
  { id: 'amd', nom: 'AMD', ticker: 'AMD', type: 'action', categorie: 'risque', confiance: 'Low', evolution: 4.2 },
  { id: 'ko', nom: 'Coca-Cola', ticker: 'KO', type: 'action', categorie: 'securitaire', confiance: 'Medium', evolution: 0.4 },
]
