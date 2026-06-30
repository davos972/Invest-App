// Gestion du portefeuille, sauvegardé pour l'instant dans le navigateur
// (localStorage). En Phase 0/1, on remplacera ce fichier par Supabase
// sans toucher à l'apparence des pages.

const TX_KEY = 'portfolio_transactions'
const PRICES_KEY = 'portfolio_prices'

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || []
  } catch {
    return []
  }
}

// --- Transactions (chaque achat journalisé) ---

// Une transaction = { id, nom, ticker, type, quantite, prixAchat, date }
export function getTransactions() {
  return read(TX_KEY)
}

export function addTransaction(tx) {
  const list = getTransactions()
  const entry = { ...tx, id: crypto.randomUUID() }
  localStorage.setItem(TX_KEY, JSON.stringify([...list, entry]))
  return entry
}

export function deleteTransaction(id) {
  const list = getTransactions().filter((t) => t.id !== id)
  localStorage.setItem(TX_KEY, JSON.stringify(list))
}

// --- Prix actuels (saisis à la main en attendant les APIs de prix) ---

export function getPrices() {
  try {
    return JSON.parse(localStorage.getItem(PRICES_KEY)) || {}
  } catch {
    return {}
  }
}

export function setPrice(ticker, price) {
  const prices = getPrices()
  prices[ticker] = price
  localStorage.setItem(PRICES_KEY, JSON.stringify(prices))
}

// --- Calcul des positions détenues à partir des transactions ---

// Regroupe les transactions par placement et calcule, pour chacun :
// quantité totale, prix moyen d'achat, coût total, valeur actuelle, gain/perte.
export function buildHoldings(transactions, prices) {
  const groups = {}
  for (const t of transactions) {
    const key = t.ticker || t.nom
    if (!groups[key]) {
      groups[key] = {
        key,
        nom: t.nom,
        ticker: t.ticker,
        type: t.type,
        quantite: 0,
        coutTotal: 0,
        transactions: [],
      }
    }
    const g = groups[key]
    g.quantite += Number(t.quantite)
    g.coutTotal += Number(t.quantite) * Number(t.prixAchat)
    g.transactions.push(t)
  }

  const holdings = Object.values(groups).map((g) => {
    const prixMoyen = g.quantite > 0 ? g.coutTotal / g.quantite : 0
    const prixActuel = prices[g.ticker] != null ? Number(prices[g.ticker]) : prixMoyen
    const valeurActuelle = g.quantite * prixActuel
    const pnl = valeurActuelle - g.coutTotal
    const pnlPct = g.coutTotal > 0 ? (pnl / g.coutTotal) * 100 : 0
    return { ...g, prixMoyen, prixActuel, valeurActuelle, pnl, pnlPct }
  })

  return holdings
}

// Totaux du portefeuille (vue d'ensemble en haut de page).
export function buildSummary(holdings) {
  const coutTotal = holdings.reduce((s, h) => s + h.coutTotal, 0)
  const valeurActuelle = holdings.reduce((s, h) => s + h.valeurActuelle, 0)
  const pnl = valeurActuelle - coutTotal
  const pnlPct = coutTotal > 0 ? (pnl / coutTotal) * 100 : 0
  return { coutTotal, valeurActuelle, pnl, pnlPct }
}
