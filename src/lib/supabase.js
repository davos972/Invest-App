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
