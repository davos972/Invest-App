// Petits outils d'affichage réutilisés dans toute l'application.

// Affiche un nombre en dollars canadiens, ex : 1234.5 -> "1 234,50 $".
export function formatCAD(amount) {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount || 0)
}

// Affiche une variation en pourcentage avec son signe, ex : 3.2 -> "+3,2 %".
export function formatPercent(value) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${new Intl.NumberFormat('fr-CA', {
    maximumFractionDigits: 1,
  }).format(value || 0)} %`
}
