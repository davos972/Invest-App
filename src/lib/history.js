// Lecture de l'historique des prix + analyse du contexte de marché.
// La table price_history (alimentée à chaque génération) garde, pour chaque
// actif, le prix ET le contexte du moment : moyennes 50/200 jours, plus
// haut/bas 1 an (actions/métaux), variations 7 j/30 j (crypto).
// Deux usages :
//  - juger le timing d'un ACHAT PASSÉ (contexte au moment de l'achat) ;
//  - juger le MOMENT PRÉSENT pour un actif recommandé (dernier relevé).
import { supabase, isSupabaseConfigured } from './supabase.js'

// Historique pour une liste de tickers.
// Renvoie { TICKER: [instantanés triés du plus ancien au plus récent] }.
export async function getPriceHistory(tickers) {
  const list = (tickers || []).filter(Boolean)
  if (!isSupabaseConfigured || list.length === 0) return {}

  const { data, error } = await supabase
    .from('price_history')
    .select(
      'ticker, prix_cad, moyenne_50j_cad, moyenne_200j_cad, haut_52s_cad, ' +
        'bas_52s_cad, variation_semaine_pct, variation_mois_pct, distance_ath_pct, captured_at',
    )
    .in('ticker', list)
    .order('captured_at', { ascending: true })

  if (error) {
    console.error("Lecture de l'historique des prix échouée :", error.message)
    return {}
  }

  const out = {}
  for (const row of data || []) {
    if (!out[row.ticker]) out[row.ticker] = []
    out[row.ticker].push({
      prix: Number(row.prix_cad),
      moyenne50: row.moyenne_50j_cad != null ? Number(row.moyenne_50j_cad) : null,
      moyenne200: row.moyenne_200j_cad != null ? Number(row.moyenne_200j_cad) : null,
      haut52: row.haut_52s_cad != null ? Number(row.haut_52s_cad) : null,
      bas52: row.bas_52s_cad != null ? Number(row.bas_52s_cad) : null,
      var7j: row.variation_semaine_pct != null ? Number(row.variation_semaine_pct) : null,
      var30j: row.variation_mois_pct != null ? Number(row.variation_mois_pct) : null,
      distAth: row.distance_ath_pct != null ? Number(row.distance_ath_pct) : null,
      date: row.captured_at,
    })
  }
  return out
}

const JOUR_MS = 24 * 60 * 60 * 1000
const pct = (n) => `${n > 0 ? '+' : ''}${n.toFixed(1)} %`

// ------------------------------------------------------------------
// Cœur de l'analyse : où se situe un prix par rapport au contexte
// d'un instantané ? Renvoie { code, details } ou null.
// Codes : impulsion / chute / consolidation / sommet_annuel / correct
//         (actions, métaux) — calme / mitige (crypto).
// ------------------------------------------------------------------
function evaluerContexte(prix, type, s, labelPrix = 'Prix') {
  // --- Actions et métaux : position vs moyennes 50/200 jours ---
  if (type !== 'crypto' && s.moyenne50 != null && s.moyenne50 > 0) {
    const e50 = (prix - s.moyenne50) / s.moyenne50
    const e200 = s.moyenne200 > 0 ? (prix - s.moyenne200) / s.moyenne200 : null
    const pos52 =
      s.haut52 != null && s.bas52 != null && s.haut52 > s.bas52
        ? (prix - s.bas52) / (s.haut52 - s.bas52)
        : null

    const details =
      `${labelPrix} ${pct(e50 * 100)} vs moyenne 50 j` +
      (e200 != null ? `, ${pct(e200 * 100)} vs moyenne 200 j` : '')

    if (e50 >= 0.08) return { code: 'impulsion', details }
    if (e200 != null && e200 <= -0.12) return { code: 'chute', details }
    if (e50 < 0 && (e200 == null || e200 >= 0)) return { code: 'consolidation', details }
    if (pos52 != null && pos52 >= 0.95) return { code: 'sommet_annuel', details }
    return { code: 'correct', details }
  }

  // --- Crypto : variations récentes + distance au sommet historique ---
  if (s.var7j != null) {
    const details =
      `${pct(s.var7j)} sur 7 j` +
      (s.var30j != null ? `, ${pct(s.var30j)} sur 30 j` : '') +
      (s.distAth != null ? `, ${pct(s.distAth)} vs sommet historique` : '')

    if (s.var7j >= 15 || (s.var30j != null && s.var30j >= 40 && s.var7j >= 5)) {
      return { code: 'impulsion', details }
    }
    if (s.var7j <= -20) return { code: 'chute', details }
    if (s.var7j >= -10 && s.var7j <= 5) {
      return s.var30j != null && s.var30j > 0
        ? { code: 'consolidation', details }
        : { code: 'calme', details }
    }
    return { code: 'mitige', details }
  }

  return null
}

// Textes par code — version « achat passé » (passé composé).
const VERDICTS_ACHAT = {
  impulsion: {
    emoji: '⚠️',
    titre: 'Acheté en pleine impulsion',
    texte:
      "Le prix venait de faire une grosse poussée et était nettement au-dessus de sa tendance récente. Après une telle impulsion, mieux vaut souvent attendre que le prix se calme (une « consolidation ») avant d'entrer.",
  },
  chute: {
    emoji: '🔪',
    titre: 'Acheté en pleine chute',
    texte:
      "Le prix chutait fortement au moment de l'achat. Acheter dans une chute est parfois une aubaine, mais c'est souvent « attraper un couteau qui tombe » — la baisse peut continuer.",
  },
  consolidation: {
    emoji: '🎯',
    titre: 'Acheté en consolidation',
    texte:
      "Très bon réflexe : le prix marquait une pause alors que la tendance de fond restait favorable. C'est exactement la zone d'achat qu'on recherche.",
  },
  sommet_annuel: {
    emoji: '😐',
    titre: 'Acheté au sommet annuel',
    texte:
      "Tendance saine, mais le prix touchait son plus haut niveau de l'année au moment de l'achat. Ça peut continuer de monter, mais la marge de sécurité était mince.",
  },
  correct: {
    emoji: '👍',
    titre: "Zone d'achat correcte",
    texte:
      "Tendance haussière sans emballement excessif au moment de l'achat : le prix était proche de sa moyenne récente, sans poussée démesurée.",
  },
  calme: {
    emoji: '👍',
    titre: 'Acheté dans le calme',
    texte:
      "Pas d'emballement au moment de l'achat : le prix était stable, loin de l'euphorie. Zone d'entrée raisonnable.",
  },
  mitige: {
    emoji: '😐',
    titre: 'Contexte mitigé',
    texte:
      "Le prix bougeait modérément au moment de l'achat, sans signal net d'impulsion ni de consolidation.",
  },
}

// Textes par code — version « moment présent » (pour les recommandations).
const VERDICTS_ACTUEL = {
  impulsion: {
    emoji: '⚠️',
    titre: 'En pleine impulsion',
    texte:
      "Le prix vient de faire une grosse poussée et se trouve nettement au-dessus de sa tendance récente. Moment défavorable pour entrer : mieux vaut attendre une consolidation.",
  },
  chute: {
    emoji: '🔪',
    titre: 'En pleine chute',
    texte:
      "Le prix est en forte baisse. Parfois une aubaine, souvent un couteau qui tombe — si tu veux entrer, la prudence s'impose (ou attends une stabilisation).",
  },
  consolidation: {
    emoji: '🎯',
    titre: 'En consolidation',
    texte:
      "Le prix marque une pause dans une tendance de fond favorable : c'est la zone d'entrée qu'on recherche.",
  },
  sommet_annuel: {
    emoji: '😐',
    titre: 'Au sommet annuel',
    texte:
      "Tendance saine, mais le prix touche son plus haut niveau de l'année : la marge de sécurité est mince pour entrer maintenant.",
  },
  correct: {
    emoji: '👍',
    titre: "Zone d'entrée correcte",
    texte:
      "Tendance haussière sans emballement : le prix est proche de sa moyenne récente. Entrer maintenant n'a rien d'aberrant.",
  },
  calme: {
    emoji: '👍',
    titre: 'Dans le calme',
    texte:
      "Pas d'emballement : le prix est stable, loin de l'euphorie. Zone d'entrée raisonnable.",
  },
  mitige: {
    emoji: '😐',
    titre: 'Signal mitigé',
    texte:
      "Le prix bouge modérément, sans signal net d'impulsion ni de consolidation. Pas de fenêtre évidente.",
  },
}

// Instantané le plus proche de la date d'achat (fenêtre de ±10 jours).
function nearestSnapshot(dateAchat, points) {
  const cible = new Date(`${dateAchat}T12:00:00Z`).getTime()
  let best = null
  for (const p of points || []) {
    const ecart = Math.abs(new Date(p.date).getTime() - cible)
    if (ecart <= 10 * JOUR_MS && (!best || ecart < best.ecart)) best = { ...p, ecart }
  }
  return best
}

// Verdict de timing pour un ACHAT PASSÉ (contexte au moment de l'achat).
// Renvoie { emoji, titre, texte, details } ou null si pas d'instantané proche.
export function analyseContexteAchat(prixAchat, dateAchat, type, points) {
  const s = nearestSnapshot(dateAchat, points)
  if (!s) return null
  const r = evaluerContexte(prixAchat, type, s, "Prix d'achat")
  if (!r) return null
  return { ...VERDICTS_ACHAT[r.code], details: r.details }
}

// Verdict pour le MOMENT PRÉSENT d'un actif (dernier relevé disponible).
// Renvoie { emoji, titre, texte, details, date } ou null si aucun relevé.
export function analyseContexteActuel(type, points) {
  const s = points && points.length ? points[points.length - 1] : null
  if (!s) return null
  const r = evaluerContexte(s.prix, type, s)
  if (!r) return null
  return { ...VERDICTS_ACTUEL[r.code], details: r.details, date: s.date.slice(0, 10) }
}

// Complément d'information : fourchette de prix observée DEPUIS l'achat.
// Renvoie null si moins de 2 relevés après la date d'achat.
export function analyseEntry(prixAchat, dateAchat, points) {
  const depuisAchat = (points || []).filter((p) => p.date.slice(0, 10) >= dateAchat)
  if (depuisAchat.length < 2) return null

  const valeurs = depuisAchat.map((p) => p.prix)
  const min = Math.min(...valeurs)
  const max = Math.max(...valeurs)
  if (!(max > min)) return null

  return { min, max, nbPoints: depuisAchat.length }
}
