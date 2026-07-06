// Liste ciblée des candidats analysés chaque semaine par l'IA.
// Modifiable librement : ajoute/retire des tickers ici.

// Actions (tickers américains reconnus par FMP).
// ⚠️ L'offre gratuite FMP ne couvre qu'une liste limitée de symboles :
// chaque ticker ci-dessous a été VÉRIFIÉ gratuit (statut 200). Avant d'en
// ajouter un, le tester (un 402 = réservé aux offres payantes).
// Vérifiées gratuites en réserve : SBUX, NKE, BAC, GS, CVX, INTC, CSCO, T.
export const STOCKS = [
  // Ancres défensives
  'KO', 'PEP', 'WMT', 'COST', 'JNJ', 'UNH', 'LMT', 'ABBV', 'PFE', 'VZ',
  // Convictions / croissance
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'V', 'AMD', 'TSLA', 'JPM', 'XOM', 'DIS',
]

// Cryptos avec leur "tier" (niveau de solidité) et leur identifiant CoinGecko.
export const CRYPTOS = [
  { symbol: 'BTC', id: 'bitcoin', tier: 1 },
  { symbol: 'ETH', id: 'ethereum', tier: 1 },
  { symbol: 'SOL', id: 'solana', tier: 2 },
  { symbol: 'XRP', id: 'ripple', tier: 2 },
  { symbol: 'BNB', id: 'binancecoin', tier: 2 },
  { symbol: 'LINK', id: 'chainlink', tier: 2 },
  { symbol: 'SUI', id: 'sui', tier: 3 },
  { symbol: 'ONDO', id: 'ondo-finance', tier: 3 },
  { symbol: 'RNDR', id: 'render-token', tier: 3 },
  { symbol: 'AVAX', id: 'avalanche-2', tier: 3 },
  { symbol: 'HYPE', id: 'hyperliquid', tier: 3 },
]

// Métaux précieux (cours au comptant, contrats à terme FMP — gratuits).
// Palladium et platine retirés : aucune source gratuite trouvée chez FMP.
export const METALS = [
  { nom: 'Or (Gold)', ticker: 'GCUSD' },
  { nom: 'Argent (Silver)', ticker: 'SIUSD' },
]
