// Lecture de l'historique des prix + analyse du timing d'achat.
// La table price_history (alimentée à chaque génération) garde, pour chaque
// actif, le prix ET le contexte de marché du moment : moyennes 50/200 jours,
// plus haut/bas 1 an (actions/métaux), variations 7 j/30 j (crypto).
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

// Instantané le plus proche de la date d'achat (fenêtre de ±10 jours),
// pour retrouver le contexte de marché du moment.
function nearestSnapshot(dateAchat, points) {
  const cible = new Date(`${dateAchat}T12:00:00Z`).getTime()
  let best = null
  for (const p of points || []) {
    const ecart = Math.abs(new Date(p.date).getTime() - cible)
    if (ecart <= 10 * JOUR_MS && (!best || ecart < best.ecart)) best = { ...p, ecart }
  }
  return best
}

// Verdict de timing pour un achat, basé sur le CONTEXTE au moment de l'achat :
// impulsion (prix bien au-dessus de sa moyenne → zone défavorable) ou
// consolidation (repli dans une tendance haussière → zone recherchée).
// Renvoie null si aucun instantané proche de la date d'achat.
export function analyseContexteAchat(prixAchat, dateAchat, type, points) {
  const s = nearestSnapshot(dateAchat, points)
  if (!s) return null

  // --- Actions et métaux : position vs moyennes 50/200 jours ---
  if (type !== 'crypto' && s.moyenne50 != null && s.moyenne50 > 0) {
    const e50 = (prixAchat - s.moyenne50) / s.moyenne50
    const e200 = s.moyenne200 > 0 ? (prixAchat - s.moyenne200) / s.moyenne200 : null
    const pos52 =
      s.haut52 != null && s.bas52 != null && s.haut52 > s.bas52
        ? (prixAchat - s.bas52) / (s.haut52 - s.bas52)
        : null

    const detailMoyennes =
      `Prix d'achat ${pct(e50 * 100)} vs moyenne 50 j` +
      (e200 != null ? `, ${pct(e200 * 100)} vs moyenne 200 j` : '')

    if (e50 >= 0.08) {
      return {
        emoji: '⚠️',
        titre: 'Acheté en pleine impulsion',
        texte:
          "Le prix venait de faire une grosse poussée et était nettement au-dessus de sa moyenne des 50 derniers jours. Après une telle impulsion, mieux vaut souvent attendre que le prix se calme (une « consolidation ») avant d'entrer.",
        details: detailMoyennes,
      }
    }
    if (e200 != null && e200 <= -0.12) {
      return {
        emoji: '🔪',
        titre: 'Acheté en pleine chute',
        texte:
          "Le prix était nettement sous sa tendance de fond (moyenne 200 jours). Acheter dans une chute est parfois une aubaine, mais c'est souvent « attraper un couteau qui tombe » — la baisse peut continuer.",
        details: detailMoyennes,
      }
    }
    if (e50 < 0 && (e200 == null || e200 >= 0)) {
      return {
        emoji: '🎯',
        titre: 'Acheté en consolidation',
        texte:
          "Très bon réflexe : le prix marquait une pause (sous sa moyenne 50 jours) alors que la tendance de fond restait haussière. C'est exactement la zone d'achat qu'on recherche.",
        details: detailMoyennes,
      }
    }
    if (pos52 != null && pos52 >= 0.95) {
      return {
        emoji: '😐',
        titre: 'Acheté au sommet annuel',
        texte:
          "Tendance saine, mais le prix touchait son plus haut niveau de l'année au moment de l'achat. Ça peut continuer de monter, mais la marge de sécurité était mince.",
        details: detailMoyennes,
      }
    }
    return {
      emoji: '👍',
      titre: "Zone d'achat correcte",
      texte:
        "Tendance haussière sans emballement excessif au moment de l'achat : le prix était proche de sa moyenne des 50 derniers jours, sans poussée récente démesurée.",
      details: detailMoyennes,
    }
  }

  // --- Crypto : variations récentes + distance au sommet historique ---
  if (s.var7j != null) {
    const detailVar =
      `${pct(s.var7j)} sur 7 j au moment de l'achat` +
      (s.var30j != null ? `, ${pct(s.var30j)} sur 30 j` : '') +
      (s.distAth != null ? `, ${pct(s.distAth)} vs sommet historique` : '')

    if (s.var7j >= 15 || (s.var30j != null && s.var30j >= 40 && s.var7j >= 5)) {
      return {
        emoji: '⚠️',
        titre: 'Acheté en pleine impulsion',
        texte:
          "La crypto venait de fortement monter. Acheter juste après une grosse poussée est la zone la plus risquée : mieux vaut attendre que le prix se stabilise (consolidation).",
        details: detailVar,
      }
    }
    if (s.var7j <= -20) {
      return {
        emoji: '🔪',
        titre: 'Acheté en pleine chute',
        texte:
          "La crypto venait de chuter brutalement. Parfois une aubaine, souvent un couteau qui tombe — sur les cryptos, les chutes peuvent aller très loin.",
        details: detailVar,
      }
    }
    if (s.var7j >= -10 && s.var7j <= 5) {
      const tendancePositive = s.var30j != null && s.var30j > 0
      return tendancePositive
        ? {
            emoji: '🎯',
            titre: 'Acheté en consolidation',
            texte:
              "Très bon réflexe : le prix se stabilisait après une progression — c'est la « consolidation » qu'on recherche plutôt que d'acheter en pleine euphorie.",
            details: detailVar,
          }
        : {
            emoji: '👍',
            titre: 'Acheté dans le calme',
            texte:
              "Pas d'emballement au moment de l'achat : le prix était stable, loin de l'euphorie. Zone d'entrée raisonnable.",
            details: detailVar,
          }
    }
    return {
      emoji: '😐',
      titre: 'Contexte mitigé',
      texte:
        "Le prix bougeait modérément au moment de l'achat, sans signal net d'impulsion ni de consolidation.",
      details: detailVar,
    }
  }

  return null
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
