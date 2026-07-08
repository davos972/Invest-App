// Screening dynamique des actions candidates.
//
// PRINCIPE : le screener PRÉSÉLECTIONNE grossièrement (capitalisation + volume,
// les seuls filtres que FMP sait appliquer). Ensuite, pour CHAQUE candidat, on
// va chercher ses fondamentaux complets (croissance, marges, dette, ROE), et on
// REJETTE tout candidat dont un fondamental clé manque ou est insuffisant
// (garde-fou anti-bruit). Seuls les survivants entrent dans le prompt d'analyse.
// Le screener ne décide pas : il présélectionne, c'est le prompt qui tranche
// sur la valorisation.
//
// Les croissances/marges NE SONT PAS des filtres du screener FMP : elles sont
// donc appliquées ici, en code, après récupération des fondamentaux — c'est
// exactement le garde-fou de qualité minimal.

import { STOCKS } from './candidates.js'
import {
  cad, num, pct, mapPool,
  fetchQuote, fetchRatiosTtm, fetchGrowth, fetchScreener,
} from './fmp-utils.js'

// Nombre d'appels FMP en parallèle. Large sous 300/min pour nos volumes.
const CONCURRENCE = 10
// Candidats analysés à fond par profil. Plafonné pour tenir la limite 60 s de
// Vercel (~20/profil × 2 profils × 2 appels fondamentaux = ~80 appels).
const PLAFOND_PAR_PROFIL = 20
// Bourses ciblées (actions américaines cotées).
const EXCHANGES = ['NASDAQ', 'NYSE']
// En dessous de ce nombre de survivants, on retombe sur la liste statique
// éprouvée : on ne veut JAMAIS partir avec une liste d'actions quasi vide.
// Bas volontairement, pour privilégier la découverte dynamique (le repli n'est
// qu'un filet de sécurité en cas d'échec réseau ou de screen anormalement strict).
const MIN_SURVIVANTS = 4

// Les deux profils de présélection.
// - `screener` : filtres grossiers envoyés à FMP (capitalisation, volume).
// - `requis`   : fondamentaux qui DOIVENT être présents, sinon rejet.
// - `passe`    : garde-fou fondamental (seuils de croissance/marge/dette…).
// Modifiable librement : ce sont les deux profils fournis par l'utilisateur.
const PROFILS = {
  securitaire: {
    label: 'securitaire',
    screener: { marketCapMoreThan: 10_000_000_000, volumeMoreThan: 1_000_000 },
    requis: ['croissance_ca', 'marge_nette', 'roe', 'dette_capitaux'],
    passe: (f) =>
      f.croissance_ca > 0.08 && f.marge_nette > 0.10 && f.roe > 0.12 && f.dette_capitaux < 1.5,
  },
  risque: {
    label: 'risque',
    screener: { marketCapMoreThan: 2_000_000_000, marketCapLowerThan: 8_000_000_000, volumeMoreThan: 300_000 },
    requis: ['croissance_ca', 'marge_brute', 'croissance_bpa'],
    passe: (f) =>
      f.croissance_ca > 0.30 && f.marge_brute > 0.40 && f.croissance_bpa > 0.20,
  },
}

// Présélection FMP pour un profil : interroge chaque bourse, dédoublonne,
// trie par volume décroissant (liquidité), plafonne.
async function preselection(profil, key) {
  const base = {
    ...profil.screener,
    isEtf: false,
    isFund: false,
    isActivelyTrading: true,
    limit: 100,
  }
  const listes = await Promise.all(
    EXCHANGES.map((exchange) => fetchScreener({ ...base, exchange }, key)),
  )
  const parSymbole = new Map()
  for (const c of listes.flat()) {
    if (c?.symbol && !parSymbole.has(c.symbol)) parSymbole.set(c.symbol, c)
  }
  return [...parSymbole.values()]
    .sort((a, b) => (b.volume || 0) - (a.volume || 0))
    .slice(0, PLAFOND_PAR_PROFIL)
}

// Récupère et normalise les fondamentaux d'un candidat (2 appels FMP).
async function fondamentaux(candidat, key) {
  const [r, g] = await Promise.all([
    fetchRatiosTtm(candidat.symbol, key),
    fetchGrowth(candidat.symbol, key),
  ])
  // ROE = bénéfice par action ÷ capitaux propres par action (les nombres
  // d'actions se simplifient). Null si capitaux propres <= 0 (rachats massifs) :
  // ROE alors non fiable -> le candidat sera rejeté par le garde-fou.
  const equityPS = r?.shareholdersEquityPerShareTTM
  const niPS = r?.netIncomePerShareTTM
  const roe = equityPS != null && niPS != null && equityPS > 0 ? niPS / equityPS : null
  return {
    symbol: candidat.symbol,
    nom: candidat.companyName || candidat.symbol,
    secteur: candidat.sector || null,
    market_cap_usd: candidat.marketCap ?? null,
    // Fondamentaux bruts (fractions) évalués par le garde-fou.
    croissance_ca: g?.revenueGrowth ?? null,
    croissance_bpa: g?.epsgrowth ?? null,
    marge_brute: r?.grossProfitMarginTTM ?? null,
    marge_nette: r?.netProfitMarginTTM ?? null,
    dette_capitaux: r?.debtToEquityRatioTTM ?? null,
    roe,
    // Valorisation transmise au prompt.
    per: r?.priceToEarningsRatioTTM ?? null,
    bpa_usd: r?.netIncomePerShareTTM ?? null,
    peg: r?.priceToEarningsGrowthRatioTTM ?? null,
  }
}

// Garde-fou : tout fondamental requis manquant => rejet ; puis seuils du profil.
function retenu(profil, f) {
  for (const champ of profil.requis) {
    if (f[champ] == null || !Number.isFinite(f[champ])) return false
  }
  return profil.passe(f)
}

// Assemble l'objet « action » injecté dans le prompt (fondamentaux + cours).
function construireAction(s, q, rate) {
  if (!q) return null
  return {
    nom: q.name || s.nom,
    ticker: s.symbol,
    secteur: s.secteur,
    profil_origine: s.profil_origine ?? null,
    prix_cad: cad(q.price, rate),
    variation_jour_pct: q.changePercentage ?? q.changesPercentage ?? null,
    moyenne_50j_cad: cad(q.priceAvg50, rate),
    moyenne_200j_cad: cad(q.priceAvg200, rate),
    haut_52s_cad: cad(q.yearHigh, rate),
    bas_52s_cad: cad(q.yearLow, rate),
    market_cap_usd: s.market_cap_usd,
    per: num(s.per, 1),
    bpa_cad: cad(s.bpa_usd, rate),
    marge_brute_pct: pct(s.marge_brute),
    marge_nette_pct: pct(s.marge_nette),
    roe_pct: pct(s.roe),
    croissance_ca_pct: pct(s.croissance_ca),
    croissance_bpa_pct: pct(s.croissance_bpa),
    dette_sur_capitaux_propres: num(s.dette_capitaux, 2),
    peg: num(s.peg, 2),
  }
}

// Filet de sécurité : construit les actions depuis la liste statique éprouvée
// (cours + ratios, sans garde-fou), en complétant les éventuels survivants déjà
// trouvés. Garantit qu'on ne parte jamais sans actions à analyser.
async function fallbackStatique(key, rate, survivants = []) {
  const dejaVu = new Set(survivants.map((s) => s.symbol))
  const aFaire = STOCKS.filter((t) => !dejaVu.has(t))
  const bruts = await mapPool(aFaire, CONCURRENCE, async (symbol) => {
    const [q, r] = await Promise.all([fetchQuote(symbol, key), fetchRatiosTtm(symbol, key)])
    if (!q) return null
    return {
      nom: q.name || symbol,
      ticker: symbol,
      secteur: null,
      profil_origine: null,
      prix_cad: cad(q.price, rate),
      variation_jour_pct: q.changePercentage ?? q.changesPercentage ?? null,
      moyenne_50j_cad: cad(q.priceAvg50, rate),
      moyenne_200j_cad: cad(q.priceAvg200, rate),
      haut_52s_cad: cad(q.yearHigh, rate),
      bas_52s_cad: cad(q.yearLow, rate),
      market_cap_usd: q.marketCap ?? null,
      per: num(r?.priceToEarningsRatioTTM, 1),
      bpa_cad: cad(r?.netIncomePerShareTTM, rate),
      marge_brute_pct: pct(r?.grossProfitMarginTTM),
      marge_nette_pct: pct(r?.netProfitMarginTTM),
      roe_pct: null,
      croissance_ca_pct: null,
      croissance_bpa_pct: null,
      dette_sur_capitaux_propres: num(r?.debtToEquityRatioTTM, 2),
      peg: num(r?.priceToEarningsGrowthRatioTTM, 2),
    }
  })
  const quotes = await mapPool(survivants, CONCURRENCE, (s) => fetchQuote(s.symbol, key))
  const surv = survivants.map((s, i) => construireAction(s, quotes[i], rate))
  return [...surv, ...bruts].filter(Boolean)
}

// Point d'entrée : renvoie la liste des actions candidates (fondamentaux jugés)
// prête à injecter dans le prompt. En cas d'échec ou de trop peu de survivants,
// repli automatique sur la liste statique.
export async function screenStockCandidates(key, rate) {
  try {
    const survivants = []
    const dejaVu = new Set()
    for (const profil of Object.values(PROFILS)) {
      const candidats = await preselection(profil, key)
      const fonds = await mapPool(candidats, CONCURRENCE, (c) => fondamentaux(c, key))
      for (const f of fonds) {
        if (!f || dejaVu.has(f.symbol)) continue
        if (retenu(profil, f)) {
          dejaVu.add(f.symbol)
          survivants.push({ ...f, profil_origine: profil.label })
        }
      }
    }

    if (survivants.length < MIN_SURVIVANTS) {
      console.warn(`Screening : seulement ${survivants.length} survivant(s), repli statique.`)
      return await fallbackStatique(key, rate, survivants)
    }

    // Cours (prix, moyennes, 52 sem.) pour les survivants uniquement.
    const quotes = await mapPool(survivants, CONCURRENCE, (s) => fetchQuote(s.symbol, key))
    return survivants.map((s, i) => construireAction(s, quotes[i], rate)).filter(Boolean)
  } catch (e) {
    console.error('Screening dynamique en échec, repli statique :', e?.message)
    return await fallbackStatique(key, rate, [])
  }
}
