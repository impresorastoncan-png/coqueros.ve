'use client'

import { useState, useTransition } from 'react'
import type { Producto } from '@/lib/types'
import { createVenta } from '@/lib/actions/ventas'

const METODOS = [
  { v: 'efectivo-usd',   label: 'Efectivo USD' },
  { v: 'efectivo-bs',    label: 'Efectivo Bs' },
  { v: 'transferencia',  label: 'Transferencia' },
  { v: 'pago-movil',     label: 'Pago Móvil' },
  { v: 'zelle',          label: 'Zelle' },
  { v: 'binance',        label: 'Binance' },
  { v: 'otro',           label: 'Otro' },
]

interface Linea {
  producto_id: string  // '' = manual
  descripcion: string
  cantidad: number
  precio_unit: number
  costo_unit: number
}

interface Props {
  fecha: string
  productos: Producto[]
  aliados: { id: string; nombre: string }[]
  onClose: () => void
  onSaved: () => void
}

export default function VentaFormModal({ fecha, productos, aliados, onClose, onSaved }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [aliadoId, setAliadoId] = useState('')
  const [metodoPago, setMetodoPago] = useState('efectivo-usd')
  const [notas, setNotas] = useState('')
  const [lineas, setLineas] = useState<Linea[]>([nuevaLinea()])

  function nuevaLinea(): Linea {
    return { producto_id: '', descripcion: '', cantidad: 1, precio_unit: 0, costo_unit: 0 }
  }

  function actualizarLinea(idx: number, patch: Partial<Linea>) {
    setLineas(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l))
  }

  function elegirProducto(idx: number, productoId: string) {
    if (!productoId) {
      actualizarLinea(idx, { producto_id: '', precio_unit: 0, costo_unit: 0 })
      return
    }
    const p = productos.find(x => x.id === productoId)
    if (!p) return
    // Precio por defecto: aliado si hay aliado seleccionado, sino final
    const precio = aliadoId ? (p.precio_aliado ?? p.precio_final ?? 0) : (p.precio_final ?? 0)
    actualizarLinea(idx, {
      producto_id: productoId,
      descripcion: `${p.nombre} ${p.presentacion}`,
      precio_unit: Number(precio),
      costo_unit:  Number(p.costo ?? 0),
    })
  }

  const totalMonto = lineas.reduce((a, l) => a + (Number(l.cantidad) * Number(l.precio_unit)), 0)
  const totalCosto = lineas.reduce((a, l) => a + (Number(l.cantidad) * Number(l.costo_unit)), 0)
  const ganancia   = totalMonto - totalCosto

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const items = lineas
      .filter(l => l.cantidad > 0 && (l.producto_id || l.descripcion.trim()))
      .map(l => ({
        producto_id: l.producto_id || null,
        descripcion: l.producto_id ? null : l.descripcion.trim(),
        cantidad:    Number(l.cantidad),
        precio_unit: Number(l.precio_unit),
        costo_unit:  Number(l.costo_unit),
      }))

    if (items.length === 0) {
      setError('Agrega al menos una línea con cantidad y producto o descripción.')
      return
    }

    startTransition(async () => {
      try {
        await createVenta({
          fecha,
          aliado_id:   aliadoId || null,
          metodo_pago: metodoPago,
          notas:       notas.trim() || null,
          items,
        })
        onSaved()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#2a1a0e] border border-[#6E3F22]/60 rounded-lg w-full max-w-2xl my-8 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#6E3F22]/40">
          <div>
            <h2 className="font-bebas text-xl tracking-widest text-[#F5F5DC]">NUEVA VENTA</h2>
            <p className="text-xs text-[#C0D1C6] mt-0.5">
              {new Date(fecha + 'T00:00:00').toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button onClick={onClose} className="text-[#C0D1C6] hover:text-white text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-[10px] font-bold text-[#6E3F22] uppercase tracking-wider mb-1">Aliado (opcional)</span>
              <select value={aliadoId} onChange={e => setAliadoId(e.target.value)} className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]">
                <option value="">— Venta directa —</option>
                {aliados.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-[10px] font-bold text-[#6E3F22] uppercase tracking-wider mb-1">Método de pago</span>
              <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)} className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]">
                {METODOS.map(m => <option key={m.v} value={m.v}>{m.label}</option>)}
              </select>
            </label>
          </div>

          {/* Líneas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-[#6E3F22] uppercase tracking-wider">Líneas de venta</span>
              <button
                type="button"
                onClick={() => setLineas(p => [...p, nuevaLinea()])}
                className="text-xs text-[#6FB04A] hover:underline"
              >
                + Otra línea
              </button>
            </div>
            <div className="space-y-2">
              {lineas.map((l, idx) => (
                <div key={idx} className="bg-[#1a1007] border border-[#6E3F22]/40 rounded p-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={l.producto_id}
                      onChange={e => elegirProducto(idx, e.target.value)}
                      className="flex-1 bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-2 py-1.5 text-xs text-[#F5F5DC]"
                    >
                      <option value="">— Manual (sin catálogo) —</option>
                      {productos.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} {p.presentacion} {p.costo != null ? `· c$${p.costo}` : ''}
                        </option>
                      ))}
                    </select>
                    {lineas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setLineas(p => p.filter((_, i) => i !== idx))}
                        className="text-red-400/60 hover:text-red-400 text-lg leading-none px-1"
                        aria-label="Eliminar línea"
                      >×</button>
                    )}
                  </div>
                  {!l.producto_id && (
                    <input
                      value={l.descripcion}
                      onChange={e => actualizarLinea(idx, { descripcion: e.target.value })}
                      placeholder="Descripción libre (ej: gasto delivery)"
                      className="w-full bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-2 py-1.5 text-xs text-[#F5F5DC]"
                    />
                  )}
                  <div className="grid grid-cols-4 gap-2">
                    <NumField label="Cant." value={l.cantidad} onChange={v => actualizarLinea(idx, { cantidad: v })} />
                    <NumField label="P. unit" value={l.precio_unit} onChange={v => actualizarLinea(idx, { precio_unit: v })} step={0.01} />
                    <NumField label="Costo u." value={l.costo_unit} onChange={v => actualizarLinea(idx, { costo_unit: v })} step={0.01} />
                    <div>
                      <div className="text-[9px] font-bold text-[#6E3F22] uppercase tracking-wider mb-0.5">Subtotal</div>
                      <div className="text-sm text-[#6FB04A] font-semibold py-1.5">${(l.cantidad * l.precio_unit).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div className="bg-[#1a1007] border border-[#6E3F22]/40 rounded p-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] font-bold text-[#6E3F22] uppercase tracking-wider">Total venta</div>
              <div className="text-lg font-bold text-[#F5F5DC]">${totalMonto.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#6E3F22] uppercase tracking-wider">Costo total</div>
              <div className="text-lg font-bold text-[#FDC829]">${totalCosto.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#6E3F22] uppercase tracking-wider">Ganancia</div>
              <div className="text-lg font-bold text-[#6FB04A]">${ganancia.toFixed(2)}</div>
            </div>
          </div>

          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            rows={2}
            placeholder="Notas (opcional)"
            className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]"
          />

          {error && <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded px-3 py-2">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="text-sm text-[#C0D1C6] px-4 py-2 hover:text-white">Cancelar</button>
            <button
              type="submit"
              disabled={pending}
              className="bg-[#6FB04A] hover:bg-[#5d9a3d] disabled:opacity-60 text-white text-sm font-semibold uppercase tracking-wider px-5 py-2 rounded transition-colors"
            >
              {pending ? 'Guardando...' : 'Registrar venta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function NumField({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="block">
      <span className="block text-[9px] font-bold text-[#6E3F22] uppercase tracking-wider mb-0.5">{label}</span>
      <input
        type="number"
        step={step}
        min={0}
        value={value}
        onChange={e => onChange(Number(e.target.value) || 0)}
        className="w-full bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-2 py-1.5 text-xs text-[#F5F5DC]"
      />
    </label>
  )
}
