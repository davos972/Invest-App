import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabase.js'

// Ce fichier gère "qui est connecté" dans toute l'application.

const AuthContext = createContext({ session: null, loading: true })

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    // 1) On regarde s'il y a déjà une session ouverte.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    // 2) On reste à l'écoute des connexions / déconnexions.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, loading, user: session?.user ?? null }}>
      {children}
    </AuthContext.Provider>
  )
}

// Petit raccourci pour récupérer l'utilisateur connecté depuis n'importe où.
export function useAuth() {
  return useContext(AuthContext)
}
