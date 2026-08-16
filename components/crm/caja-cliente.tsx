'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createMovimiento, deleteMovimiento } from '@/lib/actions/caja'
import {
  CATEGORIAS_INGRESO,
  CATEGORIAS_EGRESO,
  LABEL_CATEGORIA_CAJA,
  type CajaMovimiento,
  type CajaTipo,
  type MetodoPago,
} from '@/lib/types'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: 'efectivo-usd',   label: 'Efectivo USD' },
  { value: 'efectivo-bs',    label: 'Efectivo Bs' },
  { value: 'transferencia',  label: 'Transferencia' },
  { value: 'pago-movil',     label: 'Pago móvil' },
  { value: 'zelle',          label: 'Zelle' },
  { value: 'binance',        label: 'Binance' },
  { value: 'otro',           label: 'Otro' },
]

interface Props {
  anio: number
  mes: number
  movimientos: CajaMovimiento[]
  saldoTotal: number
  ingresosMes: number
  egresosMes: number
  netoMes: number
}

type Filtro = 'todos' | 'ingresos' | 'egresos'

export default function CajaCliente({ anio, mes, movimientos, saldoTotal, ingresosMes, egresosMes, netoMes }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('')

  const filtradas = useMemo(() => {
    return movimientos.filter(m => {
      if (filtro === 'ingresos' && m.tipo !== 'ingreso') return false
      if (filtro === 'egresos' && m.tipo !== 'egreso') return false
      if (categoriaFiltro && m.categoria !== categoriaFiltro) return false
      return true
    })
  }, [movimientos, filtro, categoriaFiltro])

  const categoriasEnUso = useMemo(() => {
    return Array.from(new Set(movimientos.map(m => m.categoria))).sort()
  }, [movimientos])

  function navegarMes(delta: number) {
    let m = mes + delta, y = anio
    if (m > 12) { m = 1; y++ }
    if (m < 1)  { m = 12; y-- }
    router.push(`/crm/caja?anio=${y}&mes=${m}`)
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-bebas text-3xl tracking-widest text-[#F5F5DC]">
            CAJA · {MESES[mes - 1].toUpperCase()} {anio}
          </h1>
          <p className="text-[#C0D1C6] text-sm mt-0.5">Ingresos, egresos y saldo neto. Las ventas se registran automáticamente.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navegarMes(-1)} className="w-9 h-9 rounded border border-[#6E3F22]/60 text-[#C0D1C6] hover:bg-white/5 transition-colors">←</button>
          <Link href="/crm/caja" className="text-xs uppercase tracking-wider px-3 py-2 rounded text-[#C0D1C6] hover:bg-white/5">Hoy</Link>
          <button onClick={() => navegarMes(1)} className="w-9 h-9 rounded border border-[#6E3F22]/60 text-[#C0D1C6] hover:bg-white/5 transition-colors">→</button>
          <button
            onClick={() => setShowForm(true)}
            className="ml-2 bg-[#6FB04A] hover:bg-[#5d9a3d] text-white text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded transition-colors"
          >
            + Nuevo movimiento
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi title="SALDO ACTUAL" subtitle="histórico neto" value={saldoTotal} color={saldoTotal >= 0 ? '#6FB04A' : '#ef4444'} icon="💰" />
        <Kpi title="INGRESOS MES" subtitle="ventas + aportes" value={ingresosMes} color="#6FB04A" icon="⬆" />
        <Kpi title="EGRESOS MES" subtitle="restock + gastos" value={egresosMes} color="#ef4444" icon="⬇" />
        <Kpi title="GANANCIA NETA MES" subtitle="ingresos − egresos" value={netoMes} color={netoMes >= 0 ? '#FDC829' : '#ef4444'} icon="🎯" />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <FiltroBtn label="Todos"    active={filtro === 'todos'}    onClick={() => setFiltro('todos')} />
        <FiltroBtn label="Ingresos" active={filtro === 'ingresos'} onClick={() => setFiltro('ingresos')} tone="verde" />
        <FiltroBtn label="Egresos"  active={filtro === 'egresos'}  onClick={() => setFiltro('egresos')} tone="rojo" />
        {categoriasEnUso.length > 0 && (
          <select
            value={categoriaFiltro}
            onChange={e => setCategoriaFiltro(e.target.value)}
            className="text-xs bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-1.5 text-[#F5F5DC]"
          >
            <option value="">Todas las categorías</option>
            {categoriasEnUso.map(c => (
              <option key={c} value={c}>{LABEL_CATEGORIA_CAJA[c as keyof typeof LABEL_CATEGORIA_CAJA] ?? c}</option>
            ))}
          </select>
        )}
        <div className="ml-auto text-xs text-[#6E3F22]">{filtradas.length} movimientos</div>
      </div>

      {/* Tabla */}
      {filtradas.length === 0 ? (
        <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg p-12 text-center">
          <div className="text-4xl mb-3">💸</div>
          <p className="text-[#6E3F22] text-sm">Sin movimientos en este mes.</p>
        </div>
      ) : (
        <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#1a1007] text-[10px] uppercase tracking-widest text-[#C0D1C6]">
                <tr>
                  <th className="text-left px-4 py-3">Fecha</th>
                  <th className="text-left px-4 py-3">Tipo</th>
                  <th className="text-left px-4 py-3">Categoría</th>
                  <th className="text-right px-4 py-3">Monto</th>
                  <th className="text-left px-4 py-3">Método</th>
                  <th className="text-left px-4 py-3">Descripción</th>
                  <th className="text-right px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#6E3F22]/20">
                {filtradas.map(m => <MovimientoRow key={m.id} m={m} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && <NuevoMovimientoModal onClose={() => setShowForm(false)} />}
    </>
  )
}

// ─── Componentes internos ─────────────────────────────────────────────────────

function Kpi({ title, subtitle, value, color, icon }: { title: string; subtitle: string; value: number; color: string; icon: string }) {
  return (
    <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[#C0D1C6] uppercase tracking-wider">{title}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold" style={{ color }}>${value.toFixed(2)}</div>
      <div className="text-xs text-[#6E3F22] mt-1.5">{subtitle}</div>
    </div>
  )
}

function FiltroBtn({ label, active, onClick, tone = 'neutral' }: { label: string; active: boolean; onClick: () => void; tone?: 'neutral' | 'verde' | 'rojo' }) {
  const activeColors = tone === 'verde'
    ? 'border-[#6FB04A]/60 bg-[#6FB04A]/15 text-[#6FB04A]'
    : tone === 'rojo'
      ? 'border-[#ef4444]/60 bg-[#ef4444]/15 text-[#ef4444]'
      : 'border-[#F5F5DC]/40 bg-[#F5F5DC]/10 text-[#F5F5DC]'
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
        active ? activeColors : 'border-[#6E3F22]/40 text-[#C0D1C6] hover:border-[#6E3F22]/60'
      }`}
    >
      {label}
    </button>
  )
}

function MovimientoRow({ m }: { m: CajaMovimiento }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const esIngreso = m.tipo === 'ingreso'
  const esAuto = m.origen === 'venta-auto'
  const categoriaLabel = LABEL_CATEGORIA_CAJA[m.categoria as keyof typeof LABEL_CATEGORIA_CAJA] ?? m.categoria

  function onDelete() {
    if (!confirm('¿Borrar este movimiento?')) return
    startTransition(async () => {
      try {
        await deleteMovimiento(m.id)
        router.refresh()
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Error al borrar')
      }
    })
  }

  return (
    <tr>
      <td className="px-4 py-2.5 text-[#C0D1C6] text-xs whitespace-nowrap">
        {new Date(m.fecha + 'T00:00:00').toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}
      </td>
      <td className="px-4 py-2.5">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
          esIngreso
            ? 'bg-[#6FB04A]/15 text-[#6FB04A] border border-[#6FB04A]/30'
            : 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30'
        }`}>
          {esIngreso ? '↑ Ingreso' : '↓ Egreso'}
        </span>
      </td>
      <td className="px-4 py-2.5 text-[#F5F5DC] text-sm">{categoriaLabel}</td>
      <td className={`px-4 py-2.5 text-right font-bold ${esIngreso ? 'text-[#6FB04A]' : 'text-[#ef4444]'}`}>
        {esIngreso ? '+' : '−'}${Number(m.monto).toFixed(2)}
      </td>
      <td className="px-4 py-2.5 text-[#C0D1C6] text-xs capitalize">{m.metodo_pago?.replace('-', ' ') ?? '—'}</td>
      <td className="px-4 py-2.5 text-[#C0D1C6] text-xs">
        <div className="flex items-center gap-2">
          {esAuto && (
            <span className="text-[9px] font-bold bg-[#006994]/15 text-[#67c8f0] border border-[#006994]/30 px-1.5 py-0.5 rounded uppercase tracking-wider">auto</span>
          )}
          <span>{m.descripcion ?? '—'}</span>
        </div>
      </td>
      <td className="px-4 py-2.5 text-right">
        {esAuto ? (
          <span className="text-[10px] text-[#6E3F22]">venta</span>
        ) : (
          <button
            onClick={onDelete}
            disabled={pending}
            className="text-xs text-[#ef4444] hover:underline disabled:opacity-50"
          >
            Borrar
          </button>
        )}
      </td>
    </tr>
  )
}

function NuevoMovimientoModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [tipo, setTipo] = useState<CajaTipo>('egreso')
  const [categoria, setCategoria] = useState<string>('combustible')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo-usd')
  const [descripcion, setDescripcion] = useState('')

  const categoriasDisponibles = tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO

  function cambiarTipo(nuevoTipo: CajaTipo) {
    setTipo(nuevoTipo)
    // Ajusta categoría por defecto al primer valor válido del nuevo tipo
    const primeraCategoria = nuevoTipo === 'ingreso' ? CATEGORIAS_INGRESO[1] : CATEGORIAS_EGRESO[1]
    setCategoria(primeraCategoria)
  }

  function submit() {
    if (!monto || Number(monto) <= 0) return
    startTransition(async () => {
      try {
        await createMovimiento({
          fecha,
          tipo,
          categoria,
          monto: Number(monto),
          metodo_pago: metodoPago,
          descripcion: descripcion || null,
        })
        router.refresh()
        onClose()
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Error al guardar')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div className="bg-[#2a1a0e] border border-[#6E3F22]/60 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#6E3F22]/40">
          <h2 className="font-bebas text-lg tracking-widest text-[#F5F5DC]">Nuevo movimiento</h2>
          <button onClick={onClose} className="text-[#C0D1C6] hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Selector Ingreso/Egreso */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => cambiarTipo('ingreso')}
              className={`px-3 py-3 rounded border text-sm font-semibold transition-colors ${
                tipo === 'ingreso'
                  ? 'border-[#6FB04A]/60 bg-[#6FB04A]/20 text-[#6FB04A]'
                  : 'border-[#6E3F22]/40 text-[#C0D1C6] hover:border-[#6E3F22]/60'
              }`}
            >
              ↑ Ingreso
            </button>
            <button
              onClick={() => cambiarTipo('egreso')}
              className={`px-3 py-3 rounded border text-sm font-semibold transition-colors ${
                tipo === 'egreso'
                  ? 'border-[#ef4444]/60 bg-[#ef4444]/20 text-[#ef4444]'
                  : 'border-[#6E3F22]/40 text-[#C0D1C6] hover:border-[#6E3F22]/60'
              }`}
            >
              ↓ Egreso
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha">
              <input
                type="date" value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm"
              />
            </Field>
            <Field label="Monto (USD)">
              <input
                type="number" step="0.01" min="0.01" value={monto}
                onChange={e => setMonto(e.target.value)}
                className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm"
                placeholder="0.00"
                autoFocus
              />
            </Field>
          </div>

          <Field label="Categoría">
            <select
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm"
            >
              {categoriasDisponibles.map(c => (
                <option key={c} value={c}>{LABEL_CATEGORIA_CAJA[c]}</option>
              ))}
            </select>
          </Field>

          <Field label="Método de pago">
            <select
              value={metodoPago}
              onChange={e => setMetodoPago(e.target.value as MetodoPago)}
              className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm"
            >
              {METODOS_PAGO.map(mp => (
                <option key={mp.value} value={mp.value}>{mp.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Descripción (opcional)">
            <input
              type="text" value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm"
              placeholder="Ej: Gasolina ruta jueves"
            />
          </Field>

          <div className="flex gap-2 justify-end pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-[#C0D1C6] hover:text-white">Cancelar</button>
            <button
              onClick={submit}
              disabled={pending || !monto || Number(monto) <= 0}
              className="px-4 py-2 bg-[#6FB04A] hover:bg-[#5a9a3a] text-white rounded text-sm font-semibold disabled:opacity-50"
            >
              {pending ? 'Guardando...' : 'Guardar'}
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
