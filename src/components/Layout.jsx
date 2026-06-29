import { NavLink, Outlet } from 'react-router-dom'

// Les 4 entrées du menu principal.
const navItems = [
  { to: '/', label: 'Accueil', icon: '🏠' },
  { to: '/calculateur', label: 'Calcul', icon: '🧮' },
  { to: '/portefeuille', label: 'Portefeuille', icon: '💼' },
  { to: '/reglages', label: 'Réglages', icon: '⚙️' },
]

// Style appliqué au lien actif (la page sur laquelle on se trouve).
function linkClass({ isActive }) {
  const base =
    'flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs transition-colors'
  return isActive
    ? `${base} text-emerald-400 bg-emerald-400/10`
    : `${base} text-slate-400 hover:text-slate-200`
}

// L'ossature commune à toutes les pages :
// - barre de navigation en bas sur mobile,
// - barre latérale à gauche sur ordinateur.
export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-5xl">
        {/* Menu latéral (ordinateur uniquement) */}
        <aside className="hidden md:flex md:w-56 md:flex-col md:gap-2 md:border-r md:border-slate-800 md:p-4">
          <div className="mb-4 px-3 py-2 text-lg font-semibold text-emerald-400">
            💰 Investment
          </div>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass} end={item.to === '/'}>
              <span className="flex flex-row items-center gap-3 self-start text-sm">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </span>
            </NavLink>
          ))}
        </aside>

        {/* Contenu de la page courante */}
        <main className="flex-1 px-4 pb-24 pt-6 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Menu du bas (mobile uniquement) */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 flex justify-around border-t border-slate-800 bg-slate-950/95 backdrop-blur md:hidden">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass} end={item.to === '/'}>
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
