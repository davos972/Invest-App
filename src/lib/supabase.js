import { createClient } from '@supabase/supabase-js'

// Connexion à Supabase (la base de données + la connexion sécurisée).
// Les deux valeurs ci-dessous viennent de TES réglages Supabase. On ne les
// écrit jamais en dur dans le code : elles sont rangées dans des "variables
// d'environnement" (fichier .env en local, et réglages Vercel en ligne).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Tant que les clés ne sont pas configurées, on prévient clairement dans la
// console plutôt que de planter l'application.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase n'est pas encore configuré : ajoute VITE_SUPABASE_URL et " +
      'VITE_SUPABASE_ANON_KEY dans le fichier .env (local) et dans Vercel.',
  )
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// L'adresse du serveur Supabase, utile pour l'afficher dans un message d'erreur.
export const supabaseHost = supabaseUrl || null

// Reconnaît les pannes de RÉSEAU (le navigateur n'a pas pu joindre le serveur)
// et non les erreurs métier (mauvais mot de passe, email non confirmé…).
// Le navigateur dit "Failed to fetch" (Chrome), "NetworkError…" (Firefox) ou
// "Load failed" (Safari) : trois façons de dire la même chose.
export function estUneErreurReseau(message) {
  if (!message) return false
  return /failed to fetch|networkerror|load failed|network request failed/i.test(message)
}

// Petit test : est-ce que le serveur Supabase répond ?
// On utilise le mode "no-cors" car on ne veut PAS lire la réponse, seulement
// savoir si la machine au bout du fil décroche. Si l'adresse n'existe plus ou
// si le projet est en pause, l'appel échoue et on le sait.
async function serveurRepond(timeoutMs = 8000) {
  if (!supabaseUrl) return false
  const controleur = new AbortController()
  const minuterie = setTimeout(() => controleur.abort(), timeoutMs)
  try {
    await fetch(`${supabaseUrl}/auth/v1/health`, {
      mode: 'no-cors',
      cache: 'no-store',
      signal: controleur.signal,
    })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(minuterie)
  }
}

// Cherche POURQUOI la connexion a échoué et renvoie une explication en français.
// Trois cas possibles : pas d'internet du tout, serveur Supabase injoignable
// (cas le plus fréquent : projet mis en pause), ou serveur joignable mais
// l'appel a quand même échoué (réseau capricieux, VPN, Wi-Fi filtré…).
export async function diagnostiquerReseau() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      cause: 'hors-ligne',
      text:
        "Ton appareil n'a pas de connexion internet. Vérifie le Wi-Fi ou les " +
        'données mobiles, puis réessaie.',
    }
  }

  if (await serveurRepond()) {
    return {
      cause: 'reseau-instable',
      text:
        "Le serveur répond, mais la demande de connexion n'est pas passée. " +
        'Réessaie dans quelques secondes. Si ça continue, essaie un autre ' +
        'réseau (données mobiles au lieu du Wi-Fi, ou sans VPN).',
    }
  }

  return {
    cause: 'serveur-injoignable',
    text:
      "Impossible de joindre le serveur de connexion (la base de données). " +
      'La cause la plus fréquente : le projet Supabase a été mis en pause ' +
      "après une période sans activité. Ouvre supabase.com, va sur ton projet " +
      'et clique sur « Restore » (ou « Resume ») pour le réveiller — cela ' +
      'prend une à deux minutes, puis la connexion remarchera.',
  }
}
