'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ProductoNota } from '@/lib/types'
import { addNota, deleteNota } from '@/lib/actions/productos'

const TIPOS: Array<{ v: string; label: string; icon: string; color: string }> = [
  { v: 'prueba',       label: 'Prueba',        icon: '🧪', color: '#a78bfa' },
  { v: 'ajuste',       label: 'Ajuste',        icon: '⚙️', color: '#60a5fa' },
  { v: 'proximo-paso', label: 'Próximo paso',  icon: '→',  color: '#FDC829' },
  { v: 'incidente',    label: 'Incidente',     icon: '⚠️', color: '#ef4444' },
  { v: 'otro',         label: 'Otro',          icon: '📝', color: '#94a3b8' },
]

export default function BitacoraPanel({ productoId, notas }: { productoId: string; notas: ProductoNota[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await addNota(productoId, fd)
      setShowForm(false)
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta nota?')) return
    startTransition(async () => {
      await deleteNota(id, productoId)
      router.refresh()
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bebas text-lg tracking-widest text-[#F5F5DC]">BITÁCORA</h3>
        <button
          onClick={() => setShowForm(v => !v)}
          className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded bg-[#6FB04A]/20 text-[#6FB04A] border border-[#6FB04A]/30 hover:bg-[#6FB04A]/30 transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Nota'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-4 bg-[#1a1007] border border-[#6E3F22]/40 rounded p-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select name="tipo" className="bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]">
              <option value="">Tipo</option>
              {TIPOS.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
            </select>
            <input name="titulo" required placeholder="Título" className="col-span-2 bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]" />
          </div>
          <textarea name="contenido" rows={3} placeholder="Detalle..." className="w-full bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]" />
          <input name="autor" placeholder="Autor (opcional)" className="w-full bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]" />
          <button type="submit" disabled={pending} className="bg-[#6FB04A] hover:bg-[#5d9a3d] text-white text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded transition-colors disabled:opacity-60">
            {pending ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      )}

      {notas.length === 0 ? (
        <p className="text-sm text-[#6E3F22] italic py-4">Sin notas todavía. Registra pruebas, ajustes o próximos pasos.</p>
      ) : (
        <div className="space-y-2">
          {notas.map(n => {
            const tipo = TIPOS.find(t => t.v === n.tipo)
            return (
              <div key={n.id} className="bg-[#1a1007] border border-[#6E3F22]/40 rounded p-3 group">
                <div className="flex items-start gap-3">
                  <span className="text-lg leading-none mt-0.5" style={{ color: tipo?.color }}>{tipo?.icon ?? '📝'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-[#F5F5DC] text-sm">{n.titulo}</span>
                      {tipo && <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: `${tipo.color}22`, color: tipo.color, border: `1px solid ${tipo.color}44` }}>{tipo.label}</span>}
                    </div>
                    {n.contenido && <p className="text-sm text-[#C0D1C6] whitespace-pre-wrap">{n.contenido}</p>}
                    <div className="text-[10px] text-[#6E3F22] mt-1">
                      {new Date(n.fecha).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {n.autor && <> · {n.autor}</>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(n.id)} className="text-red-400/60 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none">×</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
