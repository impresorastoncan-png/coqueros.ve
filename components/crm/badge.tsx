export function StageBadge({ nombre, color }: { nombre: string; color?: string | null }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
      style={{
        backgroundColor: color ? color + '22' : '#6FB04A22',
        color: color ?? '#6FB04A',
        border: `1px solid ${color ?? '#6FB04A'}44`,
      }}
    >
      {nombre}
    </span>
  )
}

export function TipoBadge({ tipo }: { tipo: string }) {
  const map: Record<string, string> = {
    'cafetería': '#FDC829',
    'restaurante': '#f97316',
    'gimnasio': '#6FB04A',
    'pilates-yoga': '#a78bfa',
    'market': '#006994',
    'otro': '#94a3b8',
  }
  const color = map[tipo] ?? '#94a3b8'
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize"
      style={{ backgroundColor: color + '22', color, border: `1px solid ${color}44` }}
    >
      {tipo}
    </span>
  )
}
