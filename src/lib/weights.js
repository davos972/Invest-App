// Gestion de la pondération du calculateur (Logique B).
// Chaque niveau de confiance vaut un certain nombre de "points".
// Ces points décident de la part d'argent attribuée à chaque placement.

const STORAGE_KEY = 'calculator_weights'

// Valeurs par défaut prévues dans le document : High = 5, Medium = 3, Low = 2.
export const DEFAULT_WEIGHTS = { High: 5, Medium: 3, Low: 2 }

// Lit la pondération sauvegardée dans le navigateur (ou les valeurs par défaut).
export function getWeights() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return { ...DEFAULT_WEIGHTS, ...JSON.parse(saved) }
  } catch {
    // En cas de problème de lecture, on retombe sur les valeurs par défaut.
  }
  return { ...DEFAULT_WEIGHTS }
}

// Enregistre la pondération choisie par l'utilisateur dans le navigateur.
export function saveWeights(weights) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(weights))
}
