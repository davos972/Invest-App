// Enregistre un instantané des prix ET du contexte de marché (moyennes 50/200
// jours, plus haut/bas 52 semaines, variations récentes) dans price_history,
// à chaque génération de recommandations. Les données sont déjà récupérées
// pour l'analyse IA : aucune requête FMP supplémentaire.
// Ce contexte permet de juger a posteriori le TIMING d'un achat : impulsion
// (prix bien au-dessus de sa moyenne) ou consolidation (repli dans une
// tendance haussière).
// Non bloquant : si l'enregistrement échoue, la génération reste valable.
export async function savePriceSnapshot(supabase, marketData) {
  try {
    const rows = []
    for (const a of marketData?.actions || []) {
      if (a.prix_cad != null) {
        rows.push({
          ticker: a.ticker,
          nom: a.nom,
          type: 'action',
          prix_cad: a.prix_cad,
          moyenne_50j_cad: a.moyenne_50j_cad ?? null,
          moyenne_200j_cad: a.moyenne_200j_cad ?? null,
          haut_52s_cad: a.haut_52s_cad ?? null,
          bas_52s_cad: a.bas_52s_cad ?? null,
        })
      }
    }
    for (const c of marketData?.crypto || []) {
      if (c.prix_cad != null) {
        rows.push({
          ticker: c.ticker,
          nom: c.nom,
          type: 'crypto',
          prix_cad: c.prix_cad,
          variation_semaine_pct: c.variation_semaine_pct ?? null,
          variation_mois_pct: c.variation_mois_pct ?? null,
          distance_ath_pct: c.distance_ath_pct ?? null,
        })
      }
    }
    for (const m of marketData?.metaux || []) {
      if (m.prix_cad != null) {
        rows.push({
          ticker: m.ticker,
          nom: m.nom,
          type: 'metal',
          prix_cad: m.prix_cad,
          moyenne_50j_cad: m.moyenne_50j_cad ?? null,
          moyenne_200j_cad: m.moyenne_200j_cad ?? null,
          haut_52s_cad: m.haut_52s_cad ?? null,
          bas_52s_cad: m.bas_52s_cad ?? null,
        })
      }
    }
    if (rows.length === 0) return 0

    const { error } = await supabase.from('price_history').insert(rows)
    if (error) {
      console.error('Instantané des prix non enregistré :', error.message)
      return 0
    }
    return rows.length
  } catch (e) {
    console.error('Instantané des prix non enregistré :', e?.message)
    return 0
  }
}
