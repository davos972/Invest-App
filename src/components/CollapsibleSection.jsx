import { useState } from 'react'

// Section repliable (on clique sur le titre pour ouvrir / fermer).
// Sert à garder la page d'accueil lisible, surtout sur mobile.
export default function CollapsibleSection({ titre, count, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="mb-3 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="font-semibold">{titre}</span>
        <span className="flex items-center gap-2 text-slate-400">
          {count != null && <span className="text-xs">{count}</span>}
          <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
        </span>
      </button>
      {open && <div className="space-y-2 px-3 pb-3">{children}</div>}
    </section>
  )
}
