'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Ingrediente, ProductoIngrediente } from '@/lib/types'
import { addReceta, deleteReceta } from '@/lib/actions/productos'

interface Props {
  productoId: string
  receta: ProductoIngrediente[]
  ingredientes: Ingrediente[]
}

export default function RecetaPanel({ productoId, receta, ingredientes }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)

  const costoTotal = receta.reduce((acc, r) => {
    const c = r.ingrediente?.costo_unitario ?? 0
    return acc + (c * Number(r.cantidad))
  }, 0)

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await addReceta(productoId, fd)
      setShowForm(false)
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar este ingrediente de la receta?')) return
    startTransition(async () => {
      await deleteReceta(id, productoId)
      router.refresh()
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bebas text-lg tracking-widest text-[#F5F5DC]">RECETA</h3>
          <p className="text-xs text-[#C0D1C6] mt-0.5">Costo estimado por unidad: <span className="text-[#6FB04A] font-semibold">${costoTotal.toFixed(4)}</span></p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded bg-[#6FB04A]/20 text-[#6FB04A] border border-[#6FB04A]/30 hover:bg-[#6FB04A]/30 transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Ingrediente'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-4 bg-[#1a1007] border border-[#6E3F22]/40 rounded p-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select name="ingrediente_id" required className="col-span-2 bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]">
              <option value="">Elige un ingrediente...</option>
              {ingredientes.map(i => (
                <option key={i.id} value={i.id}>
                  {i.nombre} {i.unidad ? `(${i.unidad})` : ''} {i.costo_unitario != null ? `— $${i.costo_unitario}/${i.unidad ?? 'u'}` : ''}
                </option>
              ))}
            </select>
            <input name="cantidad" type="number" step="0.0001" required placeholder="Cantidad" className="bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]" />
          </div>
          <input name="notas" placeholder="Notas (opcional)" className="w-full bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]" />
          <button type="submit" disabled={pending} className="bg-[#6FB04A] hover:bg-[#5d9a3d] text-white text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded transition-colors disabled:opacity-60">
            {pending ? 'Agregando...' : 'Agregar'}
          </button>
        </form>
      )}

      {receta.length === 0 ? (
        <p className="text-sm text-[#6E3F22] italic py-4">Sin ingredientes registrados. Agrega el primero para calcular el costo.</p>
      ) : (
        <div className="space-y-1.5">
          {receta.map(r => {
            const ing = r.ingrediente
            const subtotal = (ing?.costo_unitario ?? 0) * Number(r.cantidad)
            return (
              <div key={r.id} className="flex items-center gap-3 bg-[#1a1007] border border-[#6E3F22]/40 rounded px-3 py-2 group">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#F5F5DC] truncate">{ing?.nombre ?? '—'}</div>
                  {r.notas && <div className="text-xs text-[#6E3F22] truncate">{r.notas}</div>}
                </div>
                <div className="text-right">
                  <div className="text-sm text-[#C0D1C6]">{r.cantidad} {ing?.unidad ?? ''}</div>
                  <div className="text-xs text-[#6FB04A]">${subtotal.toFixed(4)}</div>
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-red-400/60 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none"
                  aria-label="Eliminar"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
