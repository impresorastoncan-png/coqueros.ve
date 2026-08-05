'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { crearAliado, actualizarAliado } from '@/lib/actions/aliados'
import type { Aliado, PipelineStage } from '@/lib/types'

const TIPOS = ['cafetería', 'restaurante', 'gimnasio', 'pilates-yoga', 'market', 'otro'] as const
const ZONAS = ['Chacao', 'Altamira', 'La Castellana', 'Los Palos Grandes', 'Las Mercedes', 'Otra']

export default function AliadoForm({
  aliado,
  stages,
}: {
  aliado?: Aliado
  stages: PipelineStage[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    nombre: aliado?.nombre ?? '',
    tipo: aliado?.tipo ?? 'cafetería',
    zona: aliado?.zona ?? '',
    direccion: aliado?.direccion ?? '',
    pipeline_stage_id: aliado?.pipeline_stage_id ?? (stages[0]?.id ?? ''),
    tiene_nevera: aliado?.tiene_nevera ?? false,
    notas: aliado?.notas ?? '',
    lat: aliado?.lat?.toString() ?? '',
    lng: aliado?.lng?.toString() ?? '',
  })

  function set(field: string, value: unknown) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const payload = {
          ...form,
          lat: form.lat ? parseFloat(form.lat) : null,
          lng: form.lng ? parseFloat(form.lng) : null,
        }
        if (aliado) {
          await actualizarAliado(aliado.id, payload as Parameters<typeof actualizarAliado>[1])
          router.push(`/crm/aliados/${aliado.id}`)
        } else {
          await crearAliado(payload as Parameters<typeof crearAliado>[0])
          router.push('/crm/aliados')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {/* Nombre */}
      <div>
        <label className="block text-xs font-semibold text-[#C0D1C6] uppercase tracking-wider mb-1.5">Nombre del local *</label>
        <input
          required
          value={form.nombre}
          onChange={e => set('nombre', e.target.value)}
          placeholder="Ej. Café Altamira"
          className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded-md px-3 py-2.5 text-[#F5F5DC] text-sm placeholder-[#6E3F22] focus:outline-none focus:border-[#6FB04A] transition-colors"
        />
      </div>

      {/* Tipo + Zona */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#C0D1C6] uppercase tracking-wider mb-1.5">Tipo *</label>
          <select
            required
            value={form.tipo}
            onChange={e => set('tipo', e.target.value)}
            className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded-md px-3 py-2.5 text-[#F5F5DC] text-sm focus:outline-none focus:border-[#6FB04A] transition-colors"
          >
            {TIPOS.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#C0D1C6] uppercase tracking-wider mb-1.5">Zona *</label>
          <select
            value={form.zona}
            onChange={e => set('zona', e.target.value)}
            className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded-md px-3 py-2.5 text-[#F5F5DC] text-sm focus:outline-none focus:border-[#6FB04A] transition-colors"
          >
            <option value="">Seleccionar zona</option>
            {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
      </div>

      {/* Dirección */}
      <div>
        <label className="block text-xs font-semibold text-[#C0D1C6] uppercase tracking-wider mb-1.5">Dirección</label>
        <input
          value={form.direccion}
          onChange={e => set('direccion', e.target.value)}
          placeholder="Ej. Av. Altamira Sur, CC Líder, Local 12"
          className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded-md px-3 py-2.5 text-[#F5F5DC] text-sm placeholder-[#6E3F22] focus:outline-none focus:border-[#6FB04A] transition-colors"
        />
      </div>

      {/* Coordenadas para el mapa */}
      <div>
        <label className="block text-xs font-semibold text-[#C0D1C6] uppercase tracking-wider mb-1.5">
          Coordenadas GPS <span className="text-[#6E3F22] normal-case font-normal">(para el mapa de ruta)</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input
            value={form.lat}
            onChange={e => set('lat', e.target.value)}
            placeholder="Latitud  ej. 10.4917"
            className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded-md px-3 py-2.5 text-[#F5F5DC] text-sm placeholder-[#6E3F22] focus:outline-none focus:border-[#6FB04A] transition-colors font-mono"
          />
          <input
            value={form.lng}
            onChange={e => set('lng', e.target.value)}
            placeholder="Longitud ej. -66.8513"
            className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded-md px-3 py-2.5 text-[#F5F5DC] text-sm placeholder-[#6E3F22] focus:outline-none focus:border-[#6FB04A] transition-colors font-mono"
          />
        </div>
        <p className="text-[10px] text-[#6E3F22] mt-1">
          Abre Google Maps, haz clic derecho sobre el local y copia las coordenadas.
        </p>
      </div>

      {/* Stage + Nevera */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#C0D1C6] uppercase tracking-wider mb-1.5">Etapa del pipeline</label>
          <select
            value={form.pipeline_stage_id}
            onChange={e => set('pipeline_stage_id', e.target.value)}
            className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded-md px-3 py-2.5 text-[#F5F5DC] text-sm focus:outline-none focus:border-[#6FB04A] transition-colors"
          >
            {stages.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set('tiene_nevera', !form.tiene_nevera)}
              className={`w-10 h-6 rounded-full transition-colors flex items-center ${form.tiene_nevera ? 'bg-[#6FB04A]' : 'bg-[#6E3F22]/60'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${form.tiene_nevera ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm text-[#C0D1C6]">Nevera colocada</span>
          </label>
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className="block text-xs font-semibold text-[#C0D1C6] uppercase tracking-wider mb-1.5">Notas internas</label>
        <textarea
          value={form.notas}
          onChange={e => set('notas', e.target.value)}
          rows={3}
          placeholder="Horarios de entrega, persona de contacto preferida, observaciones..."
          className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded-md px-3 py-2.5 text-[#F5F5DC] text-sm placeholder-[#6E3F22] focus:outline-none focus:border-[#6FB04A] transition-colors resize-none"
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-[#6FB04A] hover:bg-[#5d9a3d] disabled:opacity-60 text-white font-semibold text-sm tracking-wider uppercase px-6 py-2.5 rounded-md transition-colors"
        >
          {pending ? 'Guardando...' : aliado ? 'Guardar cambios' : 'Crear aliado'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-[#C0D1C6] hover:text-white border border-[#6E3F22]/60 hover:border-[#6E3F22] text-sm font-medium px-6 py-2.5 rounded-md transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
