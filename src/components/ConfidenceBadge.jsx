// Petite étiquette colorée qui montre le niveau de confiance d'un placement.
const styles = {
  High: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  Medium: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  Low: 'bg-slate-400/15 text-slate-300 border-slate-400/30',
}

const labels = { High: 'Élevée', Medium: 'Moyenne', Low: 'Faible' }

export default function ConfidenceBadge({ level }) {
  const style = styles[level] || styles.Low
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${style}`}>
      Confiance : {labels[level] || level}
    </span>
  )
}
