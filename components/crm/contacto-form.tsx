'use client'

import { useState, useTransition } from 'react'
import { crearContacto, eliminarContacto } from '@/lib/actions/aliados'
import type { Contacto } from '@/lib/types'

export default function ContactosPanel({ aliadoId, contactos }: { aliadoId: string; contactos: Contacto[] }) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({ nombre: '', cargo: '', telefono: '', email: '', es_principal: false })

  function set(field: string, value: unknown) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await crearContacto({ aliado_id: aliadoId, ...form })
      setForm({ nombre: '', cargo: '', telefono: '', email: '', es_principal: false })
      setMostrarForm(false)
    })
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar este contacto?')) return
    startTransition(async () => { await eliminarContacto(id, aliadoId) })
  }

  return (
    <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bebas text-lg tracking-widest text-[#F5F5DC]">CONTACTOS</h3>
        <button
          onClick={() => setMostrarForm(v => !v)}
          className="text-xs font-semibold text-[#6FB04A] border border-[#6FB04A]/40 px-3 py-1.5 rounded hover:bg-[#6FB04A]/10 transition-colors"
        >
          + Agregar
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-2 mb-3">
        {contactos.length === 0 && !mostrarForm && (
          <p className="text-[#6E3F22] text-sm italic">Sin contactos registrados.</p>
        )}
        {contactos.map(c => (
          <div key={c.id} className="flex items-start justify-between gap-3 bg-[#1a1007] rounded-md px-3 py-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#F5F5DC]">{c.nombre}</span>
                {c.es_principal && <span className="text-[10px] bg-[#FDC829]/20 text-[#FDC829] border border-[#FDC829]/30 px-1.5 py-0.5 rounded font-bold">Principal</span>}
              </div>
              {c.cargo && <div className="text-xs text-[#C0D1C6] mt-0.5">{c.cargo}</div>}
              <div className="flex gap-3 mt-1 flex-wrap">
                {c.telefono && (
                  <a href={`https://wa.me/${c.telefono.replace(/\D/g,'')}`} target="_blank" rel="noopener"
                    className="text-xs text-[#6FB04A] hover:underline">
                    📱 {c.telefono}
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="text-xs text-[#C0D1C6] hover:underline">
                    ✉️ {c.email}
                  </a>
                )}
              </div>
            </div>
            <button onClick={() => handleDelete(c.id)} className="text-[#6E3F22] hover:text-red-400 text-xs mt-0.5 transition-colors shrink-0">✕</button>
          </div>
        ))}
      </div>

      {/* Form */}
      {mostrarForm && (
        <form onSubmit={handleAdd} className="space-y-3 border-t border-[#6E3F22]/30 pt-4 mt-3">
          <div className="grid grid-cols-2 gap-3">
            <input required value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Nombre *" className="input-crm" />
            <input value={form.cargo} onChange={e => set('cargo', e.target.value)} placeholder="Cargo" className="input-crm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="Teléfono / WhatsApp" className="input-crm" />
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="Email" className="input-crm" />
          </div>
          <label className="flex items-center gap-2 text-sm text-[#C0D1C6] cursor-pointer">
            <input type="checkbox" checked={form.es_principal} onChange={e => set('es_principal', e.target.checked)} className="accent-[#6FB04A]" />
            Contacto principal
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="text-xs font-semibold bg-[#6FB04A] hover:bg-[#5d9a3d] text-white px-4 py-1.5 rounded transition-colors disabled:opacity-60">
              {pending ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" onClick={() => setMostrarForm(false)} className="text-xs text-[#C0D1C6] hover:text-white px-3 py-1.5 rounded transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}
      <style>{`.input-crm { width:100%; background:#1a1007; border:1px solid rgba(110,63,34,0.6); border-radius:6px; padding:0.5rem 0.75rem; color:#F5F5DC; font-size:0.875rem; } .input-crm:focus { outline:none; border-color:#6FB04A; }`}</style>
    </div>
  )
}
