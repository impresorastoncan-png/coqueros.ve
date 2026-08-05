'use client'

import { useState, useTransition } from 'react'
import { crearInteraccion } from '@/lib/actions/aliados'
import type { Interaccion, TipoInteraccion } from '@/lib/types'

const TIPOS: TipoInteraccion[] = ['visita', 'llamada', 'whatsapp', 'email', 'degustación', 'otro']
const TIPO_ICONS: Record<TipoInteraccion, string> = {
  visita: '🚶', llamada: '📞', whatsapp: '💬', email: '✉️', degustación: '🥤', otro: '📝',
}

export default function InteraccionesPanel({ aliadoId, interacciones }: { aliadoId: string; interacciones: Interaccion[] }) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [pending, startTransition] = useTransition()
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ tipo: 'visita' as TipoInteraccion, fecha: today, resultado: '', proximo_paso: '', responsable: '' })

  function set(field: string, value: unknown) { setForm(f => ({ ...f, [field]: value })) }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await crearInteraccion({ aliado_id: aliadoId, ...form })
      setForm({ tipo: 'visita', fecha: today, resultado: '', proximo_paso: '', responsable: '' })
      setMostrarForm(false)
    })
  }

  const sorted = [...interacciones].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

  return (
    <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bebas text-lg tracking-widest text-[#F5F5DC]">HISTORIAL DE INTERACCIONES</h3>
        <button onClick={() => setMostrarForm(v => !v)} className="text-xs font-semibold text-[#6FB04A] border border-[#6FB04A]/40 px-3 py-1.5 rounded hover:bg-[#6FB04A]/10 transition-colors">
          + Registrar
        </button>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <form onSubmit={handleAdd} className="space-y-3 bg-[#1a1007] rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-[#C0D1C6] uppercase tracking-wider mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className="w-full bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-2.5 py-2 text-[#F5F5DC] text-sm focus:outline-none focus:border-[#6FB04A]">
                {TIPOS.map(t => <option key={t} value={t}>{TIPO_ICONS[t]} {t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#C0D1C6] uppercase tracking-wider mb-1">Fecha</label>
              <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} className="w-full bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-2.5 py-2 text-[#F5F5DC] text-sm focus:outline-none focus:border-[#6FB04A]" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#C0D1C6] uppercase tracking-wider mb-1">Resultado</label>
            <textarea value={form.resultado} onChange={e => set('resultado', e.target.value)} rows={2} placeholder="¿Qué pasó? ¿Interesado? ¿Pidió tiempo?" className="w-full bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-2.5 py-2 text-[#F5F5DC] text-sm focus:outline-none focus:border-[#6FB04A] resize-none placeholder-[#6E3F22]" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#C0D1C6] uppercase tracking-wider mb-1">Próximo paso</label>
            <input value={form.proximo_paso} onChange={e => set('proximo_paso', e.target.value)} placeholder="Ej. Llamar el lunes para confirmar degustación" className="w-full bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-2.5 py-2 text-[#F5F5DC] text-sm focus:outline-none focus:border-[#6FB04A] placeholder-[#6E3F22]" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#C0D1C6] uppercase tracking-wider mb-1">Responsable</label>
            <input value={form.responsable} onChange={e => set('responsable', e.target.value)} placeholder="Tu nombre" className="w-full bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-2.5 py-2 text-[#F5F5DC] text-sm focus:outline-none focus:border-[#6FB04A] placeholder-[#6E3F22]" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={pending} className="text-xs font-semibold bg-[#6FB04A] hover:bg-[#5d9a3d] text-white px-4 py-1.5 rounded transition-colors disabled:opacity-60">
              {pending ? 'Guardando...' : 'Registrar'}
            </button>
            <button type="button" onClick={() => setMostrarForm(false)} className="text-xs text-[#C0D1C6] hover:text-white px-3 py-1.5 rounded transition-colors">Cancelar</button>
          </div>
        </form>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        {sorted.length === 0 && <p className="text-[#6E3F22] text-sm italic">Sin interacciones registradas.</p>}
        {sorted.map(i => (
          <div key={i.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-[#1a1007] border border-[#6E3F22]/60 flex items-center justify-center text-base shrink-0">
                {TIPO_ICONS[i.tipo as TipoInteraccion] ?? '📝'}
              </div>
              <div className="w-px flex-1 bg-[#6E3F22]/20 mt-1" />
            </div>
            <div className="pb-3 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-[#F5F5DC] capitalize">{i.tipo}</span>
                <span className="text-[10px] text-[#6E3F22]">{new Date(i.fecha).toLocaleDateString('es-VE', { day:'2-digit', month:'short', year:'numeric' })}</span>
                {i.responsable && <span className="text-[10px] text-[#C0D1C6]">· {i.responsable}</span>}
              </div>
              {i.resultado && <p className="text-sm text-[#C0D1C6] leading-relaxed">{i.resultado}</p>}
              {i.proximo_paso && (
                <div className="mt-1.5 flex items-start gap-1.5 bg-[#FDC829]/10 border border-[#FDC829]/20 rounded px-2.5 py-1.5">
                  <span className="text-xs">→</span>
                  <span className="text-xs text-[#FDC829]">{i.proximo_paso}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
