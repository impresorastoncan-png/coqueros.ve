'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { marcarPagada, deleteRuta } from '@/lib/actions/motorizado'
import type { RutaMotorizado } from '@/lib/types'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

interface Props {
  anio: number
  mes: number
  rutas: RutaMotorizado[]
  totales: { km: number; costo: number; pagado: number; pendiente: number }
}

type Filtro = 'todas' | 'pendientes' | 'pagadas'

export default function MotorizadoCliente({ anio, mes, rutas, totales }: Props) {
  const router = useRouter()
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [expandida, setExpandida] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtradas = rutas.filter(r => {
    if (filtro === 'pendientes') return r.estado === 'pendiente'
    if (filtro === 'pagadas')    return r.estado === 'pagada'
    return true
  })

  function navegarMes(delta: number) {
    let m = mes + delta, y = anio
    if (m > 12) { m = 1; y++ }
    if (m < 1)  { m = 12; y-- }
    router.push(`/crm/motorizado?anio=${y}&mes=${m}`)
  }

  function handlePagar(id: string) {
    if (!confirm('¿Marcar esta ruta como pagada? Se registrará el egreso en Caja.')) return
    startTransition(async () => {
      try {
        await marcarPagada(id)
        router.refresh()
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Error al marcar pagada')
      }
    })
  }

  function handleDelete(id: string, estado: string) {
    const msg = estado === 'pagada'
      ? '¿Borrar esta ruta? También se borrará el movimiento en Caja.'
      : '¿Borrar esta ruta pendiente?'
    if (!confirm(msg)) return
    startTransition(async () => {
      try {
        await deleteRuta(id)
        router.refresh()
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Error al borrar')
      }
    })
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-bebas text-2xl sm:text-3xl tracking-widest text-[#2a1a0e]">
            MOTORIZADO · {MESES[mes - 1].toUpperCase()} {anio}
          </h1>
          <p className="text-[#a8815a] text-sm mt-0.5">
            Rutas asignadas y cálculo de pago (km × tarifa). Las rutas se crean desde{' '}
            <Link href="/crm/ruta" className="text-[#6FB04A] hover:underline">Ruta</Link>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navegarMes(-1)} aria-label="Mes anterior" className="w-10 h-10 rounded border border-[#D4C9B0] text-[#6E3F22] hover:bg-black/5">←</button>
          <Link href="/crm/motorizado" className="text-xs uppercase tracking-wider px-3 py-2.5 rounded text-[#6E3F22] hover:bg-black/5">Hoy</Link>
          <button onClick={() => navegarMes(1)} aria-label="Mes siguiente" className="w-10 h-10 rounded border border-[#D4C9B0] text-[#6E3F22] hover:bg-black/5">→</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card label="Rutas del mes"  value={rutas.length.toString()}                color="#2a1a0e" />
        <Card label="Km totales"     value={`${totales.km.toFixed(1)} km`}          color="#6E3F22" />
        <Card label="Pendiente pago" value={`$${totales.pendiente.toFixed(2)}`}     color="#f59e0b" />
        <Card label="Pagado en mes"  value={`$${totales.pagado.toFixed(2)}`}        color="#4a7830" />
      </div>

      {/* Filtro */}
      <div className="flex bg-white border border-[#E8DFCE] rounded-lg p-1 gap-1 mb-4 w-fit">
        {(['todas','pendientes','pagadas'] as Filtro[]).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded text-xs font-semibold capitalize transition-colors ${filtro === f ? 'bg-[#6FB04A] text-white' : 'text-[#a8815a] hover:text-[#2a1a0e]'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtradas.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E8DFCE] rounded-lg p-12 text-center text-[#a8815a]">
          <div className="text-4xl mb-3">🏍️</div>
          <p className="text-sm">No hay rutas para mostrar en este período.</p>
          <p className="text-xs mt-2">
            Asigna una desde <Link href="/crm/ruta" className="text-[#6FB04A] hover:underline">Ruta</Link> tras optimizar el recorrido.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#E8DFCE] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF7F0] text-[10px] uppercase tracking-widest text-[#a8815a]">
              <tr>
                <th className="text-left px-4 py-3">Fecha</th>
                <th className="text-right px-4 py-3">Km</th>
                <th className="text-right px-4 py-3">Tarifa</th>
                <th className="text-right px-4 py-3">Costo</th>
                <th className="text-center px-4 py-3 hidden sm:table-cell">Paradas</th>
                <th className="text-center px-4 py-3">Estado</th>
                <th className="text-right px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(r => (
                <RutaRow
                  key={r.id}
                  ruta={r}
                  expandida={expandida === r.id}
                  onToggle={() => setExpandida(expandida === r.id ? null : r.id)}
                  onPagar={() => handlePagar(r.id)}
                  onDelete={() => handleDelete(r.id, r.estado)}
                  disabled={isPending}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function Card({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white border border-[#E8DFCE] rounded-lg p-4">
      <div className="text-[10px] uppercase tracking-widest text-[#a8815a]">{label}</div>
      <div className="text-xl font-bold mt-1" style={{ color }}>{value}</div>
    </div>
  )
}

function RutaRow({
  ruta, expandida, onToggle, onPagar, onDelete, disabled,
}: {
  ruta: RutaMotorizado
  expandida: boolean
  onToggle: () => void
  onPagar: () => void
  onDelete: () => void
  disabled: boolean
}) {
  const fecha = new Date(ruta.fecha + 'T00:00:00').toLocaleDateString('es-VE', {
    weekday: 'short', day: '2-digit', month: 'short',
  })
  const pagada = ruta.estado === 'pagada'
  const paradas = ruta.snapshot ?? []

  return (
    <>
      <tr className="border-t border-[#E8DFCE] hover:bg-[#FAF7F0]/50">
        <td className="px-4 py-3">
          <button onClick={onToggle} className="text-left">
            <div className="font-medium text-[#2a1a0e] capitalize">{fecha}</div>
            {ruta.motorizado_nombre && (
              <div className="text-[10px] text-[#a8815a]">{ruta.motorizado_nombre}</div>
            )}
          </button>
        </td>
        <td className="px-4 py-3 text-right text-[#2a1a0e]">{Number(ruta.km).toFixed(1)}</td>
        <td className="px-4 py-3 text-right text-[#a8815a] text-xs">${Number(ruta.tarifa_usd_km).toFixed(2)}/km</td>
        <td className="px-4 py-3 text-right font-bold text-[#2a1a0e]">${Number(ruta.costo).toFixed(2)}</td>
        <td className="px-4 py-3 text-center text-[#6E3F22] hidden sm:table-cell">{ruta.num_paradas}</td>
        <td className="px-4 py-3 text-center">
          {pagada ? (
            <span className="text-[10px] font-bold bg-[#6FB04A]/15 text-[#4a7830] border border-[#6FB04A]/30 px-2 py-0.5 rounded">
              ✓ Pagada
            </span>
          ) : (
            <span className="text-[10px] font-bold bg-[#f59e0b]/15 text-[#b45309] border border-[#f59e0b]/30 px-2 py-0.5 rounded">
              Pendiente
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-right whitespace-nowrap">
          {!pagada && (
            <button
              onClick={onPagar}
              disabled={disabled}
              className="text-xs px-2 py-1 rounded bg-[#6FB04A]/15 text-[#4a7830] border border-[#6FB04A]/30 hover:bg-[#6FB04A]/25 mr-1 disabled:opacity-40"
            >
              Marcar pagada
            </button>
          )}
          <button
            onClick={onDelete}
            disabled={disabled}
            className="text-xs px-2 py-1 rounded text-[#b91c1c] hover:bg-[#b91c1c]/10 disabled:opacity-40"
            title="Borrar"
          >
            🗑
          </button>
        </td>
      </tr>
      {expandida && (
        <tr className="bg-[#FAF7F0]/60">
          <td colSpan={7} className="px-4 py-3">
            {ruta.notas && (
              <div className="mb-2 text-xs text-[#6E3F22]"><strong>Notas:</strong> {ruta.notas}</div>
            )}
            {paradas.length > 0 ? (
              <ol className="list-decimal list-inside text-xs text-[#2a1a0e] space-y-0.5">
                {paradas.map(p => (
                  <li key={p.id}>
                    <span className="font-medium">{p.nombre}</span>
                    {p.zona && <span className="text-[#a8815a]"> · {p.zona}</span>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-[#a8815a]">Sin snapshot de paradas.</p>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
