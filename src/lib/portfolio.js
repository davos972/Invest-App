// Accès aux données du portefeuille.
// Deux modes :
//  - Supabase (cloud, multi-appareils) dès que les clés sont configurées,
//  - sinon repli sur le navigateur (localStorage) pour ne rien casser.
import { supabase, isSupabaseConfigured } from './supabase.js'

const TX_KEY = 'portfolio_transactions'
const PRICES_KEY = 'portfolio_prices'

// Identifiant de l'utilisateur connecté (nécessaire pour les écritures Supabase).
async function currentUserId() {
  const { data } = await supabase.auth.getUser()
  return data?.user?.id ?? null
}

// --- Lecture / écriture du navigateur (mode repli) ---

function readLocal(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || (key === PRICES_KEY ? {} : [])
  } catch {
    return key === PRICES_KEY ? {} : []
  }
}

// --- Transactions (chaque achat journalisé) ---

export async function getTransactions() {
  if (!isSupabaseConfigured) return readLocal(TX_KEY)

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: true })

  if (error) {
    console.error('Lecture des transactions échouée :', error.message)
    return []
  }
  // On ramène les données au format utilisé par l'application.
  return data.map((t) => ({
    id: t.id,
    nom: t.nom,
    ticker: t.ticker,
    type: t.type,
    quantite: Number(t.quantite),
    prixAchat: Number(t.prix_achat),
    date: t.date,
  }))
}

export async function addTransaction(tx) {
  if (!isSupabaseConfigured) {
    const list = readLocal(TX_KEY)
    const entry = { ...tx, id: crypto.randomUUID() }
    localStorage.setItem(TX_KEY, JSON.stringify([...list, entry]))
    return entry
  }

  const user_id = await currentUserId()
  const { error } = await supabase.from('transactions').insert({
    user_id,
    nom: tx.nom,
    ticker: tx.ticker,
    type: tx.type,
    quantite: tx.quantite,
    prix_achat: tx.prixAchat,
    date: tx.date,
  })
  if (error) console.error('Ajout de transaction échoué :', error.message)
}

export async function deleteTransaction(id) {
  if (!isSupabaseConfigured) {
    const list = readLocal(TX_KEY).filter((t) => t.id !== id)
    localStorage.setItem(TX_KEY, JSON.stringify(list))
    return
  }
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) console.error('Suppression de transaction échouée :', error.message)
}

// --- Prix actuels (table "portfolio") ---

export async function getPrices() {
  if (!isSupabaseConfigured) return readLocal(PRICES_KEY)

  const { data, error } = await supabase.from('portfolio').select('ticker, prix_actuel')
  if (error) {
    console.error('Lecture des prix échouée :', error.message)
    return {}
  }
  const prices = {}
  for (const row of data) {
    if (row.prix_actuel != null) prices[row.ticker] = Number(row.prix_actuel)
  }
  return prices
}

export async function setPrice(ticker, price, extra = {}) {
  if (!isSupabaseConfigured) {
    const prices = readLocal(PRICES_KEY)
    prices[ticker] = price
    localStorage.setItem(PRICES_KEY, JSON.stringify(prices))
    return
  }

  const user_id = await currentUserId()
  const { error } = await supabase
    .from('portfolio')
    .upsert(
      { user_id, ticker, nom: extra.nom, type: extra.type, prix_actuel: price, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,ticker' },
    )
  if (error) console.error('Enregistrement du prix échoué :', error.message)
}

// --- Calcul des positions détenues (fonctions pures, inchangées) ---

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

  return Object.values(groups).map((g) => {
    const prixMoyen = g.quantite > 0 ? g.coutTotal / g.quantite : 0
    const prixActuel = prices[g.ticker] != null ? Number(prices[g.ticker]) : prixMoyen
    const valeurActuelle = g.quantite * prixActuel
    const pnl = valeurActuelle - g.coutTotal
    const pnlPct = g.coutTotal > 0 ? (pnl / g.coutTotal) * 100 : 0
    return { ...g, prixMoyen, prixActuel, valeurActuelle, pnl, pnlPct }
  })
}

// Totaux du portefeuille (vue d'ensemble en haut de page).
export function buildSummary(holdings) {
  const coutTotal = holdings.reduce((s, h) => s + h.coutTotal, 0)
  const valeurActuelle = holdings.reduce((s, h) => s + h.valeurActuelle, 0)
  const pnl = valeurActuelle - coutTotal
  const pnlPct = coutTotal > 0 ? (pnl / coutTotal) * 100 : 0
  return { coutTotal, valeurActuelle, pnl, pnlPct }
}
