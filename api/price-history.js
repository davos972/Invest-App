// Enregistre un instantané des prix (actions + crypto + métaux) dans la table
// price_history, à chaque génération de recommandations. Les prix sont déjà
// récupérés pour l'analyse IA : aucune requête FMP supplémentaire.
// Non bloquant : si l'enregistrement échoue, la génération reste valable.
export async function savePriceSnapshot(supabase, marketData) {
  try {
    const rows = []
    for (const a of marketData?.actions || []) {
      if (a.prix_cad != null) rows.push({ ticker: a.ticker, nom: a.nom, type: 'action', prix_cad: a.prix_cad })
    }
    for (const c of marketData?.crypto || []) {
      if (c.prix_cad != null) rows.push({ ticker: c.ticker, nom: c.nom, type: 'crypto', prix_cad: c.prix_cad })
    }
    for (const m of marketData?.metaux || []) {
      if (m.prix_cad != null) rows.push({ ticker: m.ticker, nom: m.nom, type: 'metal', prix_cad: m.prix_cad })
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
