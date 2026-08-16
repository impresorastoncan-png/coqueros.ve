'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { crearObjetivo, actualizarEstadoObjetivo, eliminarObjetivo } from '@/lib/actions/objetivos'
import type { Objetivo, MetricaObjetivo, CategoriaObjetivo, PrioridadObjetivo } from '@/lib/types'

const METRICAS: { value: MetricaObjetivo; label: string; formato: 'money' | 'count'; ventana: string }[] = [
  { value: 'ganancia_mensual',     label: 'Ganancia neta del mes',       formato: 'money', ventana: 'Mes en curso' },
  { value: 'ganancia_semanal',     label: 'Ganancia neta de la semana',  formato: 'money', ventana: 'Semana en curso' },
  { value: 'ganancia_acumulada',   label: 'Ganancia acumulada (ahorro)', formato: 'money', ventana: 'Desde la creación del objetivo' },
  { value: 'ventas_mensual',       label: 'Facturación del mes',         formato: 'money', ventana: 'Mes en curso' },
  { value: 'ventas_semanal',       label: 'Facturación de la semana',    formato: 'money', ventana: 'Semana en curso' },
  { value: 'aliados_activos',      label: 'Aliados activos',             formato: 'count', ventana: 'Actual' },
  { value: 'neveras_colocadas',    label: 'Neveras colocadas',           formato: 'count', ventana: 'Actual' },
  { value: 'unidades_vendidas_mes',label: 'Transacciones del mes',       formato: 'count', ventana: 'Mes en curso' },
]

export default function ObjetivosCliente({
  objetivos, progreso,
}: {
  objetivos: Objetivo[]
  progreso: Record<string, number>
}) {
  const [showForm, setShowForm] = useState(false)
  const [insights, setInsights] = useState<string | null>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [insightsError, setInsightsError] = useState<string | null>(null)

  const activos = objetivos.filter(o => o.estado === 'activo')
  const cumplidos = objetivos.filter(o => o.estado === 'cumplido')
  const otros = objetivos.filter(o => o.estado === 'pausado' || o.estado === 'cancelado')

  async function pedirInsights() {
    setLoadingInsights(true)
    setInsightsError(null)
    setInsights(null)
    try {
      const res = await fetch('/api/objetivos/insights', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Error')
      setInsights(data.insights)
    } catch (err) {
      setInsightsError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoadingInsights(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3 text-xs text-[#C0D1C6]">
          <span><span className="font-bold text-[#F5F5DC]">{activos.length}</span> activos</span>
          <span><span className="font-bold text-[#6FB04A]">{cumplidos.length}</span> cumplidos</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={pedirInsights}
            disabled={loadingInsights || activos.length === 0}
            className="px-4 py-2 bg-gradient-to-r from-[#a78bfa]/25 to-[#67c8f0]/25 border border-[#a78bfa]/40 hover:from-[#a78bfa]/35 hover:to-[#67c8f0]/35 text-[#F5F5DC] rounded text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            {loadingInsights ? '⏳ Analizando...' : '✨ Consultar IA'}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#6FB04A] hover:bg-[#5a9a3a] text-white rounded text-sm font-semibold"
          >
            + Nuevo objetivo
          </button>
        </div>
      </div>

      {/* Insights */}
      {(insights || insightsError) && (
        <div className="bg-gradient-to-br from-[#a78bfa]/10 to-[#67c8f0]/10 border border-[#a78bfa]/30 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bebas text-lg tracking-widest text-[#F5F5DC]">✨ ANÁLISIS DE IA</h3>
            <button onClick={() => { setInsights(null); setInsightsError(null) }} className="text-[#C0D1C6] hover:text-white text-lg leading-none">×</button>
          </div>
          {insightsError && (
            <p className="text-[#ef4444] text-sm">Error: {insightsError}</p>
          )}
          {insights && (
            <div className="text-[#F5F5DC] text-sm whitespace-pre-wrap leading-relaxed">
              {insights}
            </div>
          )}
        </div>
      )}

      {/* Activos */}
      {activos.length > 0 && (
        <section>
          <h2 className="text-[10px] font-bold text-[#C0D1C6] uppercase tracking-widest mb-3">Activos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activos.map(o => (
              <ObjetivoCard key={o.id} objetivo={o} valorActual={progreso[o.id] ?? 0} />
            ))}
          </div>
        </section>
      )}

      {cumplidos.length > 0 && (
        <section>
          <h2 className="text-[10px] font-bold text-[#6FB04A] uppercase tracking-widest mb-3">✓ Cumplidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cumplidos.map(o => (
              <ObjetivoCard key={o.id} objetivo={o} valorActual={progreso[o.id] ?? 0} />
            ))}
          </div>
        </section>
      )}

      {otros.length > 0 && (
        <section>
          <h2 className="text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest mb-3">Otros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otros.map(o => (
              <ObjetivoCard key={o.id} objetivo={o} valorActual={progreso[o.id] ?? 0} />
            ))}
          </div>
        </section>
      )}

      {activos.length === 0 && cumplidos.length === 0 && otros.length === 0 && (
        <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg p-12 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-[#6E3F22] text-sm">Aún no tienes objetivos. Crea el primero para arrancar.</p>
        </div>
      )}

      {showForm && <NuevoObjetivoForm onClose={() => setShowForm(false)} />}
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function ObjetivoCard({ objetivo, valorActual }: { objetivo: Objetivo; valorActual: number }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const meta = Number(objetivo.target_valor)
  const pct = meta > 0 ? Math.min(100, (valorActual / meta) * 100) : 0
  const metricaInfo = METRICAS.find(m => m.value === objetivo.metrica)
  const formato = metricaInfo?.formato ?? 'count'
  const fmt = (v: number) => formato === 'money' ? `$${v.toFixed(2)}` : v.toFixed(0)
  const color = objetivo.color ?? '#FDC829'
  const cumplido = pct >= 100

  const prioColor = objetivo.prioridad === 'alta' ? '#ef4444' : objetivo.prioridad === 'media' ? '#FDC829' : '#94a3b8'

  function toggleCumplido() {
    startTransition(async () => {
      await actualizarEstadoObjetivo(objetivo.id, objetivo.estado === 'cumplido' ? 'activo' : 'cumplido')
      router.refresh()
    })
  }

  function pausar() {
    startTransition(async () => {
      await actualizarEstadoObjetivo(objetivo.id, objetivo.estado === 'pausado' ? 'activo' : 'pausado')
      router.refresh()
    })
  }

  function eliminar() {
    if (!confirm(`¿Eliminar objetivo "${objetivo.titulo}"?`)) return
    startTransition(async () => {
      await eliminarObjetivo(objetivo.id)
      router.refresh()
    })
  }

  return (
    <div className={`bg-[#2a1a0e] border rounded-lg p-5 ${cumplido ? 'border-[#6FB04A]/60' : 'border-[#6E3F22]/40'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="text-2xl shrink-0">{objetivo.icono ?? '🎯'}</div>
          <div className="min-w-0">
            <h3 className="font-semibold text-[#F5F5DC] text-sm leading-tight">{objetivo.titulo}</h3>
            {objetivo.descripcion && (
              <p className="text-[11px] text-[#C0D1C6] mt-1 line-clamp-2">{objetivo.descripcion}</p>
            )}
          </div>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-widest border rounded px-1.5 py-0.5 shrink-0" style={{ color: prioColor, borderColor: `${prioColor}66` }}>
          {objetivo.prioridad}
        </span>
      </div>

      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-2xl font-bold" style={{ color }}>{fmt(valorActual)}</span>
        <span className="text-xs text-[#6E3F22]">/ meta {fmt(meta)}</span>
      </div>

      <div className="h-2 bg-[#1a1007] rounded-full overflow-hidden mb-1">
        <div
          className="h-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: cumplido ? '#6FB04A' : color, opacity: cumplido ? 1 : 0.85 }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px]">
        <span className={`font-bold ${cumplido ? 'text-[#6FB04A]' : 'text-[#C0D1C6]'}`}>
          {pct.toFixed(0)}% {cumplido && '✓ CUMPLIDO'}
        </span>
        <span className="text-[#6E3F22]">{metricaInfo?.ventana}</span>
      </div>

      <div className="flex gap-1.5 mt-4">
        <button
          onClick={toggleCumplido}
          disabled={pending}
          className={`text-[10px] px-2 py-1 rounded border transition-colors ${
            objetivo.estado === 'cumplido'
              ? 'border-[#6E3F22]/40 text-[#C0D1C6] hover:border-[#6E3F22]/60'
              : 'border-[#6FB04A]/40 bg-[#6FB04A]/10 text-[#6FB04A] hover:bg-[#6FB04A]/20'
          }`}
        >
          {objetivo.estado === 'cumplido' ? 'Reabrir' : 'Marcar cumplido'}
        </button>
        <button
          onClick={pausar}
          disabled={pending}
          className="text-[10px] px-2 py-1 rounded border border-[#6E3F22]/40 text-[#C0D1C6] hover:border-[#6E3F22]/60"
        >
          {objetivo.estado === 'pausado' ? 'Reactivar' : 'Pausar'}
        </button>
        <button
          onClick={eliminar}
          disabled={pending}
          className="text-[10px] px-2 py-1 rounded border border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444]/10 ml-auto"
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}

// ─── Nuevo Objetivo ───────────────────────────────────────────────────────────

const PLANTILLAS = [
  { titulo: '$1.000 de ganancia mensual', metrica: 'ganancia_mensual' as MetricaObjetivo, target: 1000, categoria: 'financiero' as CategoriaObjetivo, icono: '💰', color: '#6FB04A', prioridad: 'alta' as PrioridadObjetivo, descripcion: 'Ganancia neta del mes calendario (monto vendido menos costo).' },
  { titulo: 'Comprar neverita adicional ($150)', metrica: 'ganancia_acumulada' as MetricaObjetivo, target: 150, categoria: 'operativo' as CategoriaObjetivo, icono: '❄️', color: '#006994', prioridad: 'alta' as PrioridadObjetivo, descripcion: 'Ahorro para colocar otra nevera. Cuenta desde la creación del objetivo.' },
  { titulo: '10 alianzas activas', metrica: 'aliados_activos' as MetricaObjetivo, target: 10, categoria: 'comercial' as CategoriaObjetivo, icono: '🤝', color: '#FDC829', prioridad: 'alta' as PrioridadObjetivo, descripcion: 'Aliados con etapa "Activo" en el pipeline.' },
  { titulo: '$150 de utilidad semanal', metrica: 'ganancia_semanal' as MetricaObjetivo, target: 150, categoria: 'personal' as CategoriaObjetivo, icono: '👤', color: '#a78bfa', prioridad: 'media' as PrioridadObjetivo, descripcion: 'Umbral para contratar primer empleado.' },
  { titulo: '3 neveras colocadas', metrica: 'neveras_colocadas' as MetricaObjetivo, target: 3, categoria: 'operativo' as CategoriaObjetivo, icono: '🧊', color: '#67c8f0', prioridad: 'media' as PrioridadObjetivo, descripcion: 'Neveras propias colocadas en aliados activos.' },
]

function NuevoObjetivoForm({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [metrica, setMetrica] = useState<MetricaObjetivo>('ganancia_mensual')
  const [target, setTarget] = useState('')
  const [prioridad, setPrioridad] = useState<PrioridadObjetivo>('media')
  const [categoria, setCategoria] = useState<CategoriaObjetivo>('financiero')
  const [icono, setIcono] = useState('🎯')
  const [color, setColor] = useState('#FDC829')

  function aplicarPlantilla(p: typeof PLANTILLAS[number]) {
    setTitulo(p.titulo)
    setDescripcion(p.descripcion)
    setMetrica(p.metrica)
    setTarget(String(p.target))
    setCategoria(p.categoria)
    setPrioridad(p.prioridad)
    setIcono(p.icono)
    setColor(p.color)
  }

  function submit() {
    if (!titulo || !target || Number(target) <= 0) return
    startTransition(async () => {
      await crearObjetivo({
        titulo,
        descripcion: descripcion || null,
        categoria,
        metrica,
        target_valor: Number(target),
        prioridad,
        icono,
        color,
      })
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div className="bg-[#2a1a0e] border border-[#6E3F22]/60 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#6E3F22]/40">
          <h2 className="font-bebas text-lg tracking-widest text-[#F5F5DC]">Nuevo objetivo</h2>
          <button onClick={onClose} className="text-[#C0D1C6] hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#C0D1C6] mb-2">Plantillas rápidas</div>
            <div className="flex flex-wrap gap-2">
              {PLANTILLAS.map(p => (
                <button
                  key={p.titulo}
                  onClick={() => aplicarPlantilla(p)}
                  className="text-xs px-3 py-1.5 rounded border border-[#6E3F22]/40 text-[#C0D1C6] hover:border-[#F5F5DC]/40 hover:text-white"
                >
                  {p.icono} {p.titulo}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[#6E3F22]/20 pt-4 space-y-4">
            <Field label="Título">
              <input
                value={titulo} onChange={e => setTitulo(e.target.value)}
                className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm"
                placeholder="Ej: $1500 ganancia mensual"
              />
            </Field>

            <Field label="Descripción (opcional)">
              <textarea
                value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2}
                className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Métrica">
                <select
                  value={metrica} onChange={e => setMetrica(e.target.value as MetricaObjetivo)}
                  className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm"
                >
                  {METRICAS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Meta">
                <input
                  type="number" step="0.01" value={target} onChange={e => setTarget(e.target.value)}
                  className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm"
                  placeholder="0"
                />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Categoría">
                <select value={categoria} onChange={e => setCategoria(e.target.value as CategoriaObjetivo)}
                  className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm">
                  <option value="financiero">Financiero</option>
                  <option value="comercial">Comercial</option>
                  <option value="operativo">Operativo</option>
                  <option value="personal">Personal</option>
                </select>
              </Field>
              <Field label="Prioridad">
                <select value={prioridad} onChange={e => setPrioridad(e.target.value as PrioridadObjetivo)}
                  className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm">
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </Field>
              <Field label="Ícono">
                <input value={icono} onChange={e => setIcono(e.target.value)} maxLength={2}
                  className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm text-center" />
              </Field>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-[#C0D1C6] hover:text-white">Cancelar</button>
            <button
              onClick={submit}
              disabled={pending || !titulo || !target || Number(target) <= 0}
              className="px-4 py-2 bg-[#6FB04A] hover:bg-[#5a9a3a] text-white rounded text-sm font-semibold disabled:opacity-50"
            >
              {pending ? 'Guardando...' : 'Crear objetivo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-[#C0D1C6] mb-1 block">{label}</span>
      {children}
    </label>
  )
}
