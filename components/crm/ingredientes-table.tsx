'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Ingrediente, Proveedor } from '@/lib/types'
import { upsertIngrediente } from '@/lib/actions/productos'

interface Props {
  ingredientes: (Ingrediente & { proveedor: { id: string; nombre: string } | null })[]
  proveedores: Proveedor[]
}

const CATEGORIAS = ['materia-prima', 'empaque', 'etiqueta', 'otro']

export default function IngredientesTable({ ingredientes, proveedores }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await upsertIngrediente(fd)
      setEditing(null)
      setShowNew(false)
      router.refresh()
    })
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => { setShowNew(v => !v); setEditing(null) }}
          className="bg-[#6FB04A] hover:bg-[#5d9a3d] text-white text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded transition-colors"
        >
          {showNew ? 'Cancelar' : '+ Nuevo ingrediente'}
        </button>
      </div>

      {showNew && (
        <div className="mb-4 bg-[#2a1a0e] border border-[#6FB04A]/40 rounded-lg p-4">
          <IngredienteForm proveedores={proveedores} onSubmit={handleSubmit} pending={pending} />
        </div>
      )}

      <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#6E3F22]/40 bg-[#1a1007]/50">
              <th className="text-left px-4 py-2 text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest">Nombre</th>
              <th className="text-left px-4 py-2 text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest">Categoría</th>
              <th className="text-left px-4 py-2 text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest">Unidad</th>
              <th className="text-right px-4 py-2 text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest">Costo</th>
              <th className="text-left px-4 py-2 text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest">Proveedor</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {ingredientes.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[#6E3F22] italic">Sin ingredientes registrados aún.</td></tr>
            )}
            {ingredientes.map(ing => (
              editing === ing.id ? (
                <tr key={ing.id}>
                  <td colSpan={6} className="p-4 bg-[#1a1007]">
                    <IngredienteForm ingrediente={ing} proveedores={proveedores} onSubmit={handleSubmit} pending={pending} onCancel={() => setEditing(null)} />
                  </td>
                </tr>
              ) : (
                <tr key={ing.id} className="border-b border-[#6E3F22]/20 hover:bg-[#6FB04A]/5 group">
                  <td className="px-4 py-2.5 font-semibold text-[#F5F5DC]">{ing.nombre}</td>
                  <td className="px-4 py-2.5 text-[#C0D1C6] capitalize">{ing.categoria ?? '—'}</td>
                  <td className="px-4 py-2.5 text-[#C0D1C6]">{ing.unidad ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right text-[#C0D1C6]">{ing.costo_unitario != null ? `$${ing.costo_unitario}` : '—'}</td>
                  <td className="px-4 py-2.5 text-[#C0D1C6]">{ing.proveedor?.nombre ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => setEditing(ing.id)} className="text-xs text-[#6FB04A] hover:underline">Editar</button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function IngredienteForm({
  ingrediente, proveedores, onSubmit, pending, onCancel,
}: {
  ingrediente?: Ingrediente
  proveedores: Proveedor[]
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  pending: boolean
  onCancel?: () => void
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {ingrediente && <input type="hidden" name="id" value={ingrediente.id} />}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input name="nombre" defaultValue={ingrediente?.nombre} required placeholder="Nombre" className="col-span-2 bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]" />
        <select name="categoria" defaultValue={ingrediente?.categoria ?? ''} className="bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]">
          <option value="">Categoría</option>
          {CATEGORIAS.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
        <input name="unidad" defaultValue={ingrediente?.unidad ?? ''} placeholder="Unidad (kg, L...)" className="bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input name="costo_unitario" type="number" step="0.0001" defaultValue={ingrediente?.costo_unitario ?? ''} placeholder="Costo por unidad" className="bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]" />
        <select name="proveedor_id" defaultValue={ingrediente?.proveedor_id ?? ''} className="col-span-2 bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]">
          <option value="">Sin proveedor</option>
          {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>
      <textarea name="notas" defaultValue={ingrediente?.notas ?? ''} rows={2} placeholder="Notas" className="w-full bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]" />
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="bg-[#6FB04A] hover:bg-[#5d9a3d] text-white text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded disabled:opacity-60">
          {pending ? 'Guardando...' : 'Guardar'}
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="text-xs text-[#C0D1C6] px-4 py-2">Cancelar</button>}
      </div>
    </form>
  )
}
