// Liste ciblée des candidats analysés chaque semaine par l'IA.
// Modifiable librement : ajoute/retire des tickers ici.

// Actions (tickers américains reconnus par FMP).
// Depuis le passage au tier FMP Starter (juillet 2026), la liste blanche de
// l'offre gratuite ne s'applique plus : tous les symboles sont accessibles.
// Liste diversifiée par secteur, entreprises solides et connues.
export const STOCKS = [
  // Consommation de base
  'KO', 'PEP', 'PG', 'COST', 'WMT', 'MCD', 'CL',
  // Santé
  'JNJ', 'UNH', 'LLY', 'ABBV', 'MRK',
  // Tech / croissance
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'AVGO', 'AMD', 'ORCL', 'CRM', 'ASML',
  // Finance
  'V', 'MA', 'JPM', 'AXP',
  // Industrie / défense
  'LMT', 'CAT',
  // Énergie
  'XOM', 'CVX',
  // Services publics
  'NEE',
  // Auto / distribution
  'TSLA', 'HD',
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

// Métaux précieux. Or et argent = contrats à terme (cours au comptant).
// Palladium et platine sont revenus avec le tier FMP Starter, via leurs ETF
// (PALL / PPLT) : leur « prix » est donc un cours de part d'ETF en USD (converti
// en CAD), et non un cours à l'once — ça reste parfaitement comparable pour
// juger la tendance et le classement.
export const METALS = [
  { nom: 'Or (Gold)', ticker: 'GCUSD' },
  { nom: 'Argent (Silver)', ticker: 'SIUSD' },
  { nom: 'Palladium', ticker: 'PALL' },
  { nom: 'Platine (Platinum)', ticker: 'PPLT' },
]
