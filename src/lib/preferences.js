// Préférences d'affichage et de comportement de l'application.
// Stockées dans le navigateur pour l'instant (comme les autres réglages).

const STORAGE_KEY = 'app_preferences'

export const DEFAULT_PREFERENCES = {
  equilibre: 50, // part visée en "sécuritaire" (%) — le reste en "risqué"
  devise: 'CAD',
  sectionsOuvertes: true, // sections de l'accueil dépliées par défaut ?
  generationAuto: false, // génération des recommandations auto (lundi) ou manuelle
}

export function getPreferences() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) }
  } catch {
    // valeurs par défaut en cas de problème
  }
  return { ...DEFAULT_PREFERENCES }
}

export function savePreferences(prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}
