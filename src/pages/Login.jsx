import { useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

// Page de connexion / création de compte.
export default function Login() {
  const [mode, setMode] = useState('login') // 'login' ou 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage(null)
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage({
          type: 'ok',
          text: 'Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.',
        })
        setMode('login')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        // La redirection se fait automatiquement (l'app détecte la session).
      }
    } catch (err) {
      setMessage({ type: 'error', text: traduireErreur(err.message) })
    } finally {
      setBusy(false)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-center text-slate-300">
        La connexion à la base de données n'est pas encore configurée.
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-3xl">💰</div>
          <h1 className="mt-2 text-2xl font-bold">Investment Advisor</h1>
          <p className="mt-1 text-sm text-slate-400">
            {mode === 'login' ? 'Connecte-toi à ton compte.' : 'Crée ton compte.'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/50 p-5"
        >
          <label className="block">
            <span className="mb-1 block text-sm text-slate-400">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-emerald-400"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-slate-400">Mot de passe</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-emerald-400"
            />
          </label>

          {message && (
            <p
              className={`text-sm ${
                message.type === 'error' ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-emerald-500 px-4 py-2 font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {busy ? '…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login')
            setMessage(null)
          }}
          className="mt-4 w-full text-center text-sm text-emerald-400 hover:underline"
        >
          {mode === 'login'
            ? "Pas encore de compte ? En créer un"
            : 'Déjà un compte ? Se connecter'}
        </button>
      </div>
    </div>
  )
}

// Traduit quelques messages d'erreur fréquents de Supabase en français.
function traduireErreur(message) {
  if (/Invalid login credentials/i.test(message)) return 'Email ou mot de passe incorrect.'
  if (/already registered/i.test(message)) return 'Cet email a déjà un compte.'
  if (/Email not confirmed/i.test(message)) return "Confirme d'abord ton email (vérifie ta boîte mail)."
  return message
}
