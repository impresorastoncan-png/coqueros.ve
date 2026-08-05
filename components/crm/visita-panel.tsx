'use client'

import { useState, useTransition } from 'react'
import { marcarVisitado } from '@/lib/actions/ruta'
import type { Aliado } from '@/lib/types'

export default function VisitaPanel({
  aliado,
  onClose,
  onDone,
}: {
  aliado: Aliado
  onClose: () => void
  onDone: (aliadoId: string) => void
}) {
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({ resultado: '', proximo_paso: '', responsable: '' })
  const [error, setError] = useState<string | null>(null)

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })) }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        await marcarVisitado({ aliado_id: aliado.id, ...form })
        onDone(aliado.id)
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      {/* Panel — slide up desde abajo en móvil, centrado en desktop */}
      <div className="fixed bottom-0 left-0 right-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50">
        <div className="bg-[#1a1007] border-t sm:border border-[#6E3F22]/60 sm:rounded-xl w-full sm:max-w-md p-5 sm:p-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-[10px] font-bold text-[#6FB04A] uppercase tracking-widest mb-0.5">Registrar visita</div>
              <h2 className="font-bebas text-xl tracking-widest text-[#F5F5DC] leading-tight">{aliado.nombre}</h2>
              <div className="text-xs text-[#C0D1C6] mt-0.5">{aliado.zona ?? ''}{aliado.zona && aliado.tipo ? ' · ' : ''}{aliado.tipo}</div>
            </div>
            <button onClick={onClose} className="text-[#6E3F22] hover:text-[#C0D1C6] text-lg transition-colors mt-0.5">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-[#C0D1C6] uppercase tracking-widest mb-1.5">Resultado de la visita</label>
              <textarea
                value={form.resultado}
                onChange={e => set('resultado', e.target.value)}
                rows={3}
                placeholder="¿Cómo fue? ¿Interesado? ¿Pidió degustación? ¿Vendió?"
                className="w-full bg-[#2a1a0e] border border-[#6E3F22]/60 rounded-lg px-3 py-2.5 text-[#F5F5DC] text-sm placeholder-[#6E3F22] focus:outline-none focus:border-[#6FB04A] resize-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#C0D1C6] uppercase tracking-widest mb-1.5">Próximo paso</label>
              <input
                value={form.proximo_paso}
                onChange={e => set('proximo_paso', e.target.value)}
                placeholder="Ej. Llamar el jueves para confirmar pedido"
                className="w-full bg-[#2a1a0e] border border-[#6E3F22]/60 rounded-lg px-3 py-2.5 text-[#F5F5DC] text-sm placeholder-[#6E3F22] focus:outline-none focus:border-[#6FB04A] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#C0D1C6] uppercase tracking-widest mb-1.5">Tu nombre</label>
              <input
                value={form.responsable}
                onChange={e => set('responsable', e.target.value)}
                placeholder="¿Quién hizo la visita?"
                className="w-full bg-[#2a1a0e] border border-[#6E3F22]/60 rounded-lg px-3 py-2.5 text-[#F5F5DC] text-sm placeholder-[#6E3F22] focus:outline-none focus:border-[#6FB04A] transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-[#6FB04A] hover:bg-[#5d9a3d] disabled:opacity-60 text-white font-bold text-sm tracking-wider uppercase py-3 rounded-lg transition-colors"
            >
              {pending ? 'Guardando...' : '✓ Confirmar visita'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
