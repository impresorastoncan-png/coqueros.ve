'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Proveedor } from '@/lib/types'
import { upsertProveedor } from '@/lib/actions/productos'

export default function ProveedoresTable({ proveedores }: { proveedores: Proveedor[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await upsertProveedor(fd)
      setEditing(null); setShowNew(false)
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
          {showNew ? 'Cancelar' : '+ Nuevo proveedor'}
        </button>
      </div>

      {showNew && (
        <div className="mb-4 bg-[#2a1a0e] border border-[#6FB04A]/40 rounded-lg p-4">
          <ProveedorForm onSubmit={handleSubmit} pending={pending} />
        </div>
      )}

      <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#6E3F22]/40 bg-[#1a1007]/50">
              <th className="text-left px-4 py-2 text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest">Nombre</th>
              <th className="text-left px-4 py-2 text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest">Contacto</th>
              <th className="text-left px-4 py-2 text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest">Teléfono</th>
              <th className="text-left px-4 py-2 text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest">Email</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {proveedores.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[#6E3F22] italic">Sin proveedores registrados aún.</td></tr>
            )}
            {proveedores.map(p => (
              editing === p.id ? (
                <tr key={p.id}>
                  <td colSpan={5} className="p-4 bg-[#1a1007]">
                    <ProveedorForm proveedor={p} onSubmit={handleSubmit} pending={pending} onCancel={() => setEditing(null)} />
                  </td>
                </tr>
              ) : (
                <tr key={p.id} className="border-b border-[#6E3F22]/20 hover:bg-[#6FB04A]/5">
                  <td className="px-4 py-2.5 font-semibold text-[#F5F5DC]">{p.nombre}</td>
                  <td className="px-4 py-2.5 text-[#C0D1C6]">{p.contacto ?? '—'}</td>
                  <td className="px-4 py-2.5 text-[#C0D1C6]">{p.telefono ?? '—'}</td>
                  <td className="px-4 py-2.5 text-[#C0D1C6]">{p.email ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => setEditing(p.id)} className="text-xs text-[#6FB04A] hover:underline">Editar</button>
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

function ProveedorForm({
  proveedor, onSubmit, pending, onCancel,
}: {
  proveedor?: Proveedor
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  pending: boolean
  onCancel?: () => void
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {proveedor && <input type="hidden" name="id" value={proveedor.id} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input name="nombre" defaultValue={proveedor?.nombre} required placeholder="Nombre / Empresa" className="bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]" />
        <input name="contacto" defaultValue={proveedor?.contacto ?? ''} placeholder="Persona de contacto" className="bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input name="telefono" defaultValue={proveedor?.telefono ?? ''} placeholder="Teléfono / WhatsApp" className="bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]" />
        <input name="email" type="email" defaultValue={proveedor?.email ?? ''} placeholder="Email" className="bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]" />
      </div>
      <input name="direccion" defaultValue={proveedor?.direccion ?? ''} placeholder="Dirección" className="w-full bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]" />
      <textarea name="notas" defaultValue={proveedor?.notas ?? ''} rows={2} placeholder="Notas" className="w-full bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]" />
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="bg-[#6FB04A] hover:bg-[#5d9a3d] text-white text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded disabled:opacity-60">
          {pending ? 'Guardando...' : 'Guardar'}
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="text-xs text-[#C0D1C6] px-4 py-2">Cancelar</button>}
      </div>
    </form>
  )
}
