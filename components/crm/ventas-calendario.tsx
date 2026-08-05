'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Venta, Producto } from '@/lib/types'
import VentaFormModal from './venta-form-modal'
import { deleteVenta } from '@/lib/actions/ventas'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

interface Props {
  anio: number
  mes: number  // 1-12
  ventas: Venta[]
  productos: Producto[]
  aliados: { id: string; nombre: string }[]
}

export default function VentasCalendario({ anio, mes, ventas, productos, aliados }: Props) {
  const router = useRouter()
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [fechaForm, setFechaForm] = useState<string>('')

  // Agrupar ventas por día (YYYY-MM-DD)
  const ventasPorDia = useMemo(() => {
    const map = new Map<string, Venta[]>()
    ventas.forEach(v => {
      const key = v.fecha.slice(0, 10)
      const arr = map.get(key) ?? []
      arr.push(v)
      map.set(key, arr)
    })
    return map
  }, [ventas])

  // Totales del mes
  const totales = useMemo(() => {
    let monto = 0, costo = 0, cantidad = 0
    ventas.forEach(v => {
      monto += Number(v.monto_total ?? 0)
      costo += Number(v.costo_total ?? 0)
      cantidad++
    })
    return { monto, costo, ganancia: monto - costo, cantidad, ticket: cantidad ? monto / cantidad : 0 }
  }, [ventas])

  const grid = useMemo(() => buildMonthGrid(anio, mes), [anio, mes])
  const ventasDelDia = diaSeleccionado ? (ventasPorDia.get(diaSeleccionado) ?? []) : []

  function abrirNuevaVenta(fecha: string) {
    setFechaForm(fecha)
    setShowForm(true)
  }

  function navegarMes(delta: number) {
    let m = mes + delta, y = anio
    if (m > 12) { m = 1; y++ }
    if (m < 1)  { m = 12; y-- }
    router.push(`/crm/ventas?anio=${y}&mes=${m}`)
  }

  const hoyIso = new Date().toISOString().slice(0, 10)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Calendario */}
      <div className="lg:col-span-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-bebas text-3xl tracking-widest text-[#F5F5DC]">
              VENTAS · {MESES[mes - 1].toUpperCase()} {anio}
            </h1>
            <p className="text-[#C0D1C6] text-sm mt-0.5">Registra cada venta del mes con producto, cantidad y costo.</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => navegarMes(-1)} className="w-9 h-9 rounded border border-[#6E3F22]/60 text-[#C0D1C6] hover:bg-white/5 transition-colors">←</button>
            <Link href="/crm/ventas" className="text-xs uppercase tracking-wider px-3 py-2 rounded text-[#C0D1C6] hover:bg-white/5">Hoy</Link>
            <button onClick={() => navegarMes(1)} className="w-9 h-9 rounded border border-[#6E3F22]/60 text-[#C0D1C6] hover:bg-white/5 transition-colors">→</button>
          </div>
        </div>

        <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg overflow-hidden">
          {/* Header días */}
          <div className="grid grid-cols-7 border-b border-[#6E3F22]/40 bg-[#1a1007]/50">
            {DIAS.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest py-2">
                {d}
              </div>
            ))}
          </div>
          {/* Grid */}
          <div className="grid grid-cols-7">
            {grid.map((cell, idx) => {
              if (!cell) return <div key={idx} className="min-h-[92px] border-r border-b border-[#6E3F22]/20 bg-[#1a1007]/30" />
              const fechaIso = `${anio}-${String(mes).padStart(2, '0')}-${String(cell).padStart(2, '0')}`
              const ventasDia = ventasPorDia.get(fechaIso) ?? []
              const montoDia = ventasDia.reduce((a, v) => a + Number(v.monto_total ?? 0), 0)
              const esHoy = fechaIso === hoyIso
              const activo = fechaIso === diaSeleccionado

              return (
                <button
                  key={idx}
                  onClick={() => setDiaSeleccionado(fechaIso)}
                  className={`min-h-[92px] border-r border-b border-[#6E3F22]/20 p-2 text-left transition-colors relative group ${
                    activo ? 'bg-[#6FB04A]/15 ring-1 ring-inset ring-[#6FB04A]/50' : 'hover:bg-[#6FB04A]/5'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className={`text-xs font-bold ${esHoy ? 'text-[#FDC829]' : 'text-[#C0D1C6]'}`}>{cell}</span>
                    {ventasDia.length > 0 && (
                      <span className="text-[9px] bg-[#6FB04A]/25 text-[#6FB04A] px-1.5 py-0.5 rounded-full font-bold">
                        {ventasDia.length}
                      </span>
                    )}
                  </div>
                  {montoDia > 0 && (
                    <div className="text-[11px] text-[#6FB04A] font-bold">${montoDia.toFixed(0)}</div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Panel lateral */}
      <div className="lg:col-span-1 space-y-4">
        {/* Totales del mes */}
        <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg p-5">
          <h3 className="font-bebas text-lg tracking-widest text-[#F5F5DC] mb-4">TOTALES DEL MES</h3>
          <div className="space-y-3">
            <Kpi label="Ventas" value={`$${totales.monto.toFixed(2)}`} color="#6FB04A" />
            <Kpi label="Costo"  value={`$${totales.costo.toFixed(2)}`} color="#FDC829" />
            <div className="border-t border-[#6E3F22]/40 pt-3 mt-2">
              <Kpi label="Ganancia" value={`$${totales.ganancia.toFixed(2)}`} color="#6FB04A" big />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#6E3F22]/40">
              <div>
                <div className="text-[10px] font-bold text-[#6E3F22] uppercase tracking-wider">Transacciones</div>
                <div className="text-lg font-bold text-[#C0D1C6]">{totales.cantidad}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-[#6E3F22] uppercase tracking-wider">Ticket prom.</div>
                <div className="text-lg font-bold text-[#C0D1C6]">${totales.ticket.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Día seleccionado */}
        <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bebas text-lg tracking-widest text-[#F5F5DC]">
              {diaSeleccionado ? formatoFecha(diaSeleccionado) : 'Elige un día'}
            </h3>
            {diaSeleccionado && (
              <button
                onClick={() => abrirNuevaVenta(diaSeleccionado)}
                className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded bg-[#6FB04A] hover:bg-[#5d9a3d] text-white transition-colors"
              >
                + Venta
              </button>
            )}
          </div>
          {!diaSeleccionado && <p className="text-sm text-[#6E3F22] italic">Click en un día del calendario para ver o registrar ventas.</p>}
          {diaSeleccionado && ventasDelDia.length === 0 && <p className="text-sm text-[#6E3F22] italic">Sin ventas en este día.</p>}
          {diaSeleccionado && ventasDelDia.length > 0 && (
            <div className="space-y-2">
              {ventasDelDia.map(v => (
                <div key={v.id} className="bg-[#1a1007] border border-[#6E3F22]/40 rounded p-3 group">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-semibold text-[#F5F5DC]">
                      {v.aliado?.nombre ?? <span className="text-[#6E3F22] italic">Venta directa</span>}
                    </span>
                    <span className="text-sm font-bold text-[#6FB04A]">${Number(v.monto_total ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="space-y-0.5">
                    {(v.items ?? []).map(it => (
                      <div key={it.id} className="text-xs text-[#C0D1C6] flex justify-between gap-2">
                        <span className="truncate">
                          {it.cantidad} × {it.producto ? `${it.producto.nombre} ${it.producto.presentacion}` : (it.descripcion ?? '—')}
                        </span>
                        <span className="text-[#6E3F22] shrink-0">${Number(it.subtotal ?? 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#6E3F22]/30">
                    <span className="text-[10px] text-[#6E3F22] uppercase tracking-wider">
                      {v.metodo_pago ?? '—'} · costo ${Number(v.costo_total ?? 0).toFixed(2)}
                    </span>
                    <button
                      onClick={async () => {
                        if (!confirm('¿Eliminar esta venta?')) return
                        await deleteVenta(v.id)
                        router.refresh()
                      }}
                      className="text-red-400/60 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <VentaFormModal
          fecha={fechaForm}
          productos={productos}
          aliados={aliados}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); router.refresh() }}
        />
      )}
    </div>
  )
}

function Kpi({ label, value, color, big }: { label: string; value: string; color: string; big?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-[#6E3F22] uppercase tracking-wider mb-0.5">{label}</div>
      <div className={`${big ? 'text-2xl' : 'text-lg'} font-bold`} style={{ color }}>{value}</div>
    </div>
  )
}

function formatoFecha(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'short' })
}

function buildMonthGrid(anio: number, mes: number): (number | null)[] {
  const primerDia = new Date(anio, mes - 1, 1).getDay()  // 0=Dom
  const diasEnMes = new Date(anio, mes, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < primerDia; i++) cells.push(null)
  for (let d = 1; d <= diasEnMes; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}
