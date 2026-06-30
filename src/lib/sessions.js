// Sauvegarde des sessions de calcul d'allocation.
// Cloud (Supabase) si configuré, sinon repli sur le navigateur.
import { supabase, isSupabaseConfigured } from './supabase.js'

const KEY = 'calculator_sessions'

export async function saveSession(montant, data) {
  if (!isSupabaseConfigured) {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]')
    list.push({ id: crypto.randomUUID(), montant, data, created_at: new Date().toISOString() })
    localStorage.setItem(KEY, JSON.stringify(list))
    return
  }

  const { data: userData } = await supabase.auth.getUser()
  const { error } = await supabase.from('calculator_sessions').insert({
    user_id: userData?.user?.id ?? null,
    montant,
    data,
  })
  if (error) console.error('Enregistrement du calcul échoué :', error.message)
}
