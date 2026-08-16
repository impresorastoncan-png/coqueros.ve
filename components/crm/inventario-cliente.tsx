'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ajustarStockIngrediente,
  ajustarStockProducto,
  trasladarAConsignacion,
  reducirStockAliado,
  updateMinimoIngrediente,
  updateMinimoProducto,
} from '@/lib/actions/inventario'
import type { Ingrediente, ProductoStock, StockAliado, MovimientoStock, OperacionStock } from '@/lib/types'

type Producto = { id: string; nombre: string; presentacion: string; precio_final: number | null; precio_detal: number | null; precio_aliado: number | null; costo: number | null }
type AliadoLite = { id: string; nombre: string; zona: string | null; tiene_nevera: boolean }

type Tab = 'materia' | 'producto' | 'clientes' | 'movimientos'

export default function InventarioCliente({
  ingredientes,
  productoStock,
  stockAliado,
  aliados,
  productos,
  movimientos,
}: {
  ingredientes: Ingrediente[]
  productoStock: ProductoStock[]
  stockAliado: StockAliado[]
  aliados: AliadoLite[]
  productos: Producto[]
  movimientos: MovimientoStock[]
}) {
  const [tab, setTab] = useState<Tab>('materia')

  const stats = useMemo(() => {
    const bajos = ingredientes.filter(i => i.stock_actual < i.stock_minimo && i.stock_minimo > 0).length
    const bajosProducto = productoStock.filter(p => p.stock_actual < p.stock_minimo && p.stock_minimo > 0).length
    const totalMateria = ingredientes.reduce((s, i) => s + Number(i.stock_actual ?? 0) * Number(i.costo_unitario ?? 0), 0)
    const totalProducto = productoStock.reduce((s, p) => s + Number(p.stock_actual ?? 0) * Number(p.producto?.costo ?? 0), 0)
    const totalClientes = stockAliado.reduce((s, sa) => s + Number(sa.cantidad ?? 0) * Number(sa.producto?.costo ?? 0), 0)
    const totalUnidadesClientes = stockAliado.reduce((s, sa) => s + Number(sa.cantidad ?? 0), 0)
    return { bajos, bajosProducto, totalMateria, totalProducto, totalClientes, totalUnidadesClientes }
  }, [ingredientes, productoStock, stockAliado])

  return (
    <div>
      {/* 3 KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KpiCard
          title="MATERIA PRIMA"
          subtitle={`${ingredientes.length} insumos`}
          value={`$${stats.totalMateria.toFixed(2)}`}
          badge={stats.bajos > 0 ? `${stats.bajos} bajo mínimo` : null}
          color="#FDC829"
          icon="🥥"
          active={tab === 'materia'}
          onClick={() => setTab('materia')}
        />
        <KpiCard
          title="PRODUCTO TERMINADO"
          subtitle={`${productoStock.filter(p => p.stock_actual > 0).length} SKUs en bodega`}
          value={`$${stats.totalProducto.toFixed(2)}`}
          badge={stats.bajosProducto > 0 ? `${stats.bajosProducto} bajo mínimo` : null}
          color="#6FB04A"
          icon="📦"
          active={tab === 'producto'}
          onClick={() => setTab('producto')}
        />
        <KpiCard
          title="EN CLIENTES"
          subtitle={`${new Set(stockAliado.map(s => s.aliado_id)).size} aliados · ${stats.totalUnidadesClientes.toFixed(0)} uds`}
          value={`$${stats.totalClientes.toFixed(2)}`}
          badge={null}
          color="#006994"
          icon="❄️"
          active={tab === 'clientes'}
          onClick={() => setTab('clientes')}
        />
      </div>

      {/* Tab movimientos */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => setTab('movimientos')}
          className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
            tab === 'movimientos'
              ? 'border-[#6FB04A]/60 bg-[#6FB04A]/15 text-[#6FB04A]'
              : 'border-[#6E3F22]/40 text-[#C0D1C6] hover:border-[#6E3F22]/60'
          }`}
        >
          📜 Últimos movimientos
        </button>
      </div>

      {tab === 'materia' && (
        <MateriaPrimaTable ingredientes={ingredientes} />
      )}

      {tab === 'producto' && (
        <ProductoTerminadoTable productoStock={productoStock} aliados={aliados} />
      )}

      {tab === 'clientes' && (
        <StockClientesTable stockAliado={stockAliado} />
      )}

      {tab === 'movimientos' && (
        <MovimientosTable movimientos={movimientos} ingredientes={ingredientes} productos={productos} aliados={aliados} />
      )}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  title, subtitle, value, badge, color, icon, active, onClick,
}: {
  title: string; subtitle: string; value: string; badge: string | null; color: string; icon: string; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left bg-[#2a1a0e] border rounded-lg p-5 transition-colors ${
        active ? 'border-[#F5F5DC]/40' : 'border-[#6E3F22]/40 hover:border-[#6E3F22]/60'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[#C0D1C6] uppercase tracking-wider">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold" style={{ color }}>{value}</div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-xs text-[#6E3F22]">{subtitle}</span>
        {badge && (
          <span className="text-[10px] font-bold bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 px-1.5 py-0.5 rounded">
            ⚠ {badge}
          </span>
        )}
      </div>
    </button>
  )
}

// ─── Materia prima ────────────────────────────────────────────────────────────

function MateriaPrimaTable({ ingredientes }: { ingredientes: Ingrediente[] }) {
  const [ajusteFor, setAjusteFor] = useState<Ingrediente | null>(null)

  if (ingredientes.length === 0) {
    return <EmptyState msg="No hay insumos registrados." href="/crm/productos/ingredientes" cta="Ir a catálogo de ingredientes" />
  }

  return (
    <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#1a1007] text-[10px] uppercase tracking-widest text-[#C0D1C6]">
            <tr>
              <th className="text-left px-4 py-3">Ingrediente</th>
              <th className="text-left px-4 py-3">Categoría</th>
              <th className="text-right px-4 py-3">Stock</th>
              <th className="text-right px-4 py-3">Mínimo</th>
              <th className="text-right px-4 py-3">Valor</th>
              <th className="text-left px-4 py-3">Proveedor</th>
              <th className="text-right px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#6E3F22]/20">
            {ingredientes.map(ing => {
              const bajo = ing.stock_actual < ing.stock_minimo && ing.stock_minimo > 0
              const valor = Number(ing.stock_actual ?? 0) * Number(ing.costo_unitario ?? 0)
              return (
                <tr key={ing.id} className={bajo ? 'bg-[#ef4444]/5' : ''}>
                  <td className="px-4 py-3 text-[#F5F5DC] font-medium">{ing.nombre}</td>
                  <td className="px-4 py-3 text-[#C0D1C6] text-xs capitalize">{ing.categoria ?? '—'}</td>
                  <td className={`px-4 py-3 text-right font-bold ${bajo ? 'text-[#ef4444]' : 'text-[#F5F5DC]'}`}>
                    {Number(ing.stock_actual).toFixed(2)} <span className="text-[#6E3F22] font-normal text-xs">{ing.unidad ?? ''}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-[#C0D1C6] text-xs">{Number(ing.stock_minimo).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-[#6FB04A] text-xs">${valor.toFixed(2)}</td>
                  <td className="px-4 py-3 text-[#C0D1C6] text-xs">{ing.proveedor?.nombre ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setAjusteFor(ing)}
                      className="text-xs bg-[#6FB04A]/15 hover:bg-[#6FB04A]/25 border border-[#6FB04A]/30 text-[#6FB04A] px-3 py-1 rounded"
                    >
                      Ajustar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {ajusteFor && (
        <AjusteMateriaModal ingrediente={ajusteFor} onClose={() => setAjusteFor(null)} />
      )}
    </div>
  )
}

type OperacionUI = OperacionStock | 'set'

function AjusteMateriaModal({ ingrediente, onClose }: { ingrediente: Ingrediente; onClose: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [operacion, setOperacion] = useState<OperacionUI>('entrada')
  const [cantidad, setCantidad] = useState('')
  const [minimo, setMinimo] = useState(String(ingrediente.stock_minimo ?? 0))
  const [motivo, setMotivo] = useState('')

  const antes = Number(ingrediente.stock_actual ?? 0)
  const isSet = operacion === 'set'
  const isSalida = operacion === 'salida' || operacion === 'merma'
  const cantidadNum = Number(cantidad) || 0
  const despues = isSet ? cantidadNum : antes + (isSalida ? -1 : 1) * cantidadNum
  const delta = despues - antes

  function submit() {
    if (!cantidad || (isSet ? Number(cantidad) < 0 : Number(cantidad) <= 0)) return
    startTransition(async () => {
      if (isSet) {
        await ajustarStockIngrediente({
          ingredienteId: ingrediente.id,
          modo: 'set',
          valor: cantidadNum,
          operacion: 'ajuste',
          motivo: motivo || null,
        })
      } else {
        await ajustarStockIngrediente({
          ingredienteId: ingrediente.id,
          delta,
          operacion: operacion as OperacionStock,
          motivo: motivo || null,
        })
      }
      if (Number(minimo) !== Number(ingrediente.stock_minimo)) {
        await updateMinimoIngrediente(ingrediente.id, Number(minimo))
      }
      router.refresh()
      onClose()
    })
  }

  return (
    <Modal onClose={onClose} title={`Ajustar stock — ${ingrediente.nombre}`}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Operación">
            <select
              value={operacion}
              onChange={e => setOperacion(e.target.value as OperacionUI)}
              className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm"
            >
              <option value="entrada">Entrada (compra/producción)</option>
              <option value="salida">Salida (uso en producción)</option>
              <option value="merma">Merma / desperdicio</option>
              <option value="ajuste">Ajuste manual</option>
              <option value="set">= Fijar a valor exacto</option>
            </select>
          </Field>
          <Field label={isSet ? `Nuevo stock (${ingrediente.unidad ?? 'unidad'})` : `Cantidad (${ingrediente.unidad ?? 'unidad'})`}>
            <input
              type="number" step="0.01" min={isSet ? 0 : undefined} value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm"
              placeholder="0.00"
            />
          </Field>
        </div>

        <div className="bg-[#1a1007] border border-[#6E3F22]/40 rounded p-3 text-xs text-[#C0D1C6]">
          Stock antes: <span className="text-[#F5F5DC] font-bold">{antes.toFixed(2)}</span>
          {' → '}
          Después: <span className={`font-bold ${delta < 0 ? 'text-[#ef4444]' : 'text-[#6FB04A]'}`}>
            {despues.toFixed(2)}
          </span>
          {isSet && cantidad && (
            <span className="ml-2 text-[10px] text-[#6E3F22]">(Δ {delta >= 0 ? '+' : ''}{delta.toFixed(2)})</span>
          )}
        </div>

        <Field label="Stock mínimo (alerta bajo esto)">
          <input
            type="number" step="0.01" value={minimo}
            onChange={e => setMinimo(e.target.value)}
            className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm"
          />
        </Field>

        <Field label="Motivo (opcional)">
          <input
            type="text" value={motivo}
            onChange={e => setMotivo(e.target.value)}
            className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm"
            placeholder="Ej: Compra a proveedor X"
          />
        </Field>

        <div className="flex gap-2 justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#C0D1C6] hover:text-white">Cancelar</button>
          <button
            onClick={submit}
            disabled={pending || cantidad === '' || (isSet ? Number(cantidad) < 0 : Number(cantidad) <= 0)}
            className="px-4 py-2 bg-[#6FB04A] hover:bg-[#5a9a3a] text-white rounded text-sm font-semibold disabled:opacity-50"
          >
            {pending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Producto terminado ───────────────────────────────────────────────────────

function ProductoTerminadoTable({ productoStock, aliados }: { productoStock: ProductoStock[]; aliados: AliadoLite[] }) {
  const [ajusteFor, setAjusteFor] = useState<ProductoStock | null>(null)
  const [trasladoFor, setTrasladoFor] = useState<ProductoStock | null>(null)

  const grupos = useMemo(() => {
    const m = new Map<string, ProductoStock[]>()
    productoStock.forEach(ps => {
      const key = ps.producto?.nombre ?? '—'
      const arr = m.get(key) ?? []
      arr.push(ps)
      m.set(key, arr)
    })
    // Ordena presentaciones dentro de cada grupo alfabéticamente
    m.forEach(arr => arr.sort((a, b) => (a.producto?.presentacion ?? '').localeCompare(b.producto?.presentacion ?? '')))
    return Array.from(m.entries())
  }, [productoStock])

  if (productoStock.length === 0) {
    return <EmptyState msg="Sin productos registrados." href="/crm/productos" cta="Ir a productos" />
  }

  return (
    <div className="space-y-4">
      {grupos.map(([nombre, items]) => {
        const totalUds = items.reduce((s, i) => s + Number(i.stock_actual ?? 0), 0)
        const totalValor = items.reduce((s, i) => s + Number(i.stock_actual ?? 0) * Number(i.producto?.costo ?? 0), 0)
        const emoji = nombre.includes('Agua') ? '💧'
          : nombre.includes('Leche') ? '🥛'
            : nombre.includes('Coquitos') ? '❄️'
              : '🥥'
        return (
          <div key={nombre} className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-[#1a1007] border-b border-[#6E3F22]/40">
              <div className="flex items-center gap-3">
                <span className="text-lg">{emoji}</span>
                <h2 className="font-bebas text-lg tracking-widest text-[#F5F5DC]">{nombre.toUpperCase()}</h2>
              </div>
              <div className="flex gap-4 text-xs">
                <span className="text-[#C0D1C6]">{totalUds.toFixed(0)} uds</span>
                <span className="text-[#6FB04A] font-bold">${totalValor.toFixed(2)}</span>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-widest text-[#6E3F22] border-b border-[#6E3F22]/30">
                <tr>
                  <th className="text-left px-4 py-2 font-bold">Presentación</th>
                  <th className="text-right px-4 py-2 font-bold">Stock</th>
                  <th className="text-right px-4 py-2 font-bold">Mínimo</th>
                  <th className="text-right px-4 py-2 font-bold">Valor</th>
                  <th className="text-right px-4 py-2 font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#6E3F22]/20">
                {items.map(ps => {
                  const p = ps.producto
                  const bajo = ps.stock_actual < ps.stock_minimo && ps.stock_minimo > 0
                  const valor = Number(ps.stock_actual ?? 0) * Number(p?.costo ?? 0)
                  return (
                    <tr key={ps.id} className={bajo ? 'bg-[#ef4444]/5' : ''}>
                      <td className="px-4 py-3 text-[#F5F5DC] font-medium">{p?.presentacion ?? '—'}</td>
                      <td className={`px-4 py-3 text-right font-bold ${bajo ? 'text-[#ef4444]' : 'text-[#F5F5DC]'}`}>
                        {Number(ps.stock_actual).toFixed(0)}
                      </td>
                      <td className="px-4 py-3 text-right text-[#C0D1C6] text-xs">{Number(ps.stock_minimo).toFixed(0)}</td>
                      <td className="px-4 py-3 text-right text-[#6FB04A] text-xs">${valor.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setAjusteFor(ps)}
                            className="text-xs bg-[#6FB04A]/15 hover:bg-[#6FB04A]/25 border border-[#6FB04A]/30 text-[#6FB04A] px-3 py-1 rounded"
                          >
                            Ajustar
                          </button>
                          <button
                            onClick={() => setTrasladoFor(ps)}
                            disabled={ps.stock_actual <= 0}
                            className="text-xs bg-[#006994]/15 hover:bg-[#006994]/25 border border-[#006994]/30 text-[#67c8f0] px-3 py-1 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            → Aliado
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })}

      {ajusteFor && (
        <AjusteProductoModal productoStock={ajusteFor} onClose={() => setAjusteFor(null)} />
      )}
      {trasladoFor && (
        <TrasladoModal productoStock={trasladoFor} aliados={aliados} onClose={() => setTrasladoFor(null)} />
      )}
    </div>
  )
}

function AjusteProductoModal({ productoStock, onClose }: { productoStock: ProductoStock; onClose: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [operacion, setOperacion] = useState<OperacionUI>('entrada')
  const [cantidad, setCantidad] = useState('')
  const [minimo, setMinimo] = useState(String(productoStock.stock_minimo ?? 0))
  const [motivo, setMotivo] = useState('')

  const antes = Number(productoStock.stock_actual ?? 0)
  const isSet = operacion === 'set'
  const isSalida = operacion === 'salida' || operacion === 'merma'
  const cantidadNum = Number(cantidad) || 0
  const despues = isSet ? cantidadNum : antes + (isSalida ? -1 : 1) * cantidadNum
  const delta = despues - antes
  const p = productoStock.producto

  function submit() {
    if (cantidad === '' || (isSet ? Number(cantidad) < 0 : Number(cantidad) <= 0)) return
    startTransition(async () => {
      if (isSet) {
        await ajustarStockProducto({
          productoId: productoStock.producto_id,
          modo: 'set',
          valor: cantidadNum,
          operacion: 'ajuste',
          motivo: motivo || null,
        })
      } else {
        await ajustarStockProducto({
          productoId: productoStock.producto_id,
          delta,
          operacion: operacion as OperacionStock,
          motivo: motivo || null,
        })
      }
      if (Number(minimo) !== Number(productoStock.stock_minimo)) {
        await updateMinimoProducto(productoStock.id, Number(minimo))
      }
      router.refresh()
      onClose()
    })
  }

  return (
    <Modal onClose={onClose} title={`Ajustar — ${p?.nombre} ${p?.presentacion}`}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Operación">
            <select
              value={operacion}
              onChange={e => setOperacion(e.target.value as OperacionUI)}
              className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm"
            >
              <option value="entrada">Entrada (producción)</option>
              <option value="salida">Salida directa</option>
              <option value="merma">Merma / desperdicio</option>
              <option value="ajuste">Ajuste manual</option>
              <option value="set">= Fijar a valor exacto</option>
            </select>
          </Field>
          <Field label={isSet ? 'Nuevo stock (uds)' : 'Cantidad (uds)'}>
            <input
              type="number" step="1" min={isSet ? 0 : undefined} value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm"
              placeholder="0"
            />
          </Field>
        </div>

        <div className="bg-[#1a1007] border border-[#6E3F22]/40 rounded p-3 text-xs text-[#C0D1C6]">
          Stock antes: <span className="text-[#F5F5DC] font-bold">{antes.toFixed(0)}</span>
          {' → '}
          Después: <span className={`font-bold ${delta < 0 ? 'text-[#ef4444]' : 'text-[#6FB04A]'}`}>
            {despues.toFixed(0)}
          </span>
          {isSet && cantidad && (
            <span className="ml-2 text-[10px] text-[#6E3F22]">(Δ {delta >= 0 ? '+' : ''}{delta.toFixed(0)})</span>
          )}
        </div>

        <Field label="Stock mínimo">
          <input
            type="number" step="1" value={minimo}
            onChange={e => setMinimo(e.target.value)}
            className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm"
          />
        </Field>

        <Field label="Motivo (opcional)">
          <input
            type="text" value={motivo}
            onChange={e => setMotivo(e.target.value)}
            className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm"
          />
        </Field>

        <div className="flex gap-2 justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#C0D1C6] hover:text-white">Cancelar</button>
          <button
            onClick={submit}
            disabled={pending || cantidad === '' || (isSet ? Number(cantidad) < 0 : Number(cantidad) <= 0)}
            className="px-4 py-2 bg-[#6FB04A] hover:bg-[#5a9a3a] text-white rounded text-sm font-semibold disabled:opacity-50"
          >
            {pending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function TrasladoModal({ productoStock, aliados, onClose }: { productoStock: ProductoStock; aliados: AliadoLite[]; onClose: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [aliadoId, setAliadoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')
  const p = productoStock.producto
  const disponible = Number(productoStock.stock_actual)

  function submit() {
    if (!aliadoId || !cantidad || Number(cantidad) <= 0) return
    if (Number(cantidad) > disponible) return
    startTransition(async () => {
      await trasladarAConsignacion({
        aliadoId,
        productoId: productoStock.producto_id,
        cantidad: Number(cantidad),
        motivo: motivo || null,
      })
      router.refresh()
      onClose()
    })
  }

  return (
    <Modal onClose={onClose} title={`Enviar a aliado — ${p?.nombre} ${p?.presentacion}`}>
      <div className="space-y-4">
        <div className="text-xs text-[#C0D1C6]">
          Disponible en bodega: <span className="font-bold text-[#F5F5DC]">{disponible} uds</span>
        </div>

        <Field label="Aliado destino">
          <select
            value={aliadoId}
            onChange={e => setAliadoId(e.target.value)}
            className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm"
          >
            <option value="">— Elegir aliado —</option>
            {aliados.map(a => (
              <option key={a.id} value={a.id}>
                {a.nombre}{a.tiene_nevera ? ' ❄' : ''}{a.zona ? ` · ${a.zona}` : ''}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Cantidad">
          <input
            type="number" step="1" min="1" max={disponible} value={cantidad}
            onChange={e => setCantidad(e.target.value)}
            className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm"
            placeholder="0"
          />
        </Field>

        <Field label="Notas (opcional)">
          <input
            type="text" value={motivo}
            onChange={e => setMotivo(e.target.value)}
            className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm"
            placeholder="Ej: Restock semanal"
          />
        </Field>

        <div className="flex gap-2 justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#C0D1C6] hover:text-white">Cancelar</button>
          <button
            onClick={submit}
            disabled={pending || !aliadoId || !cantidad || Number(cantidad) <= 0 || Number(cantidad) > disponible}
            className="px-4 py-2 bg-[#006994] hover:bg-[#00577a] text-white rounded text-sm font-semibold disabled:opacity-50"
          >
            {pending ? 'Enviando...' : 'Trasladar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Stock en clientes ────────────────────────────────────────────────────────

function StockClientesTable({ stockAliado }: { stockAliado: StockAliado[] }) {
  const [reducirFor, setReducirFor] = useState<StockAliado | null>(null)

  // Agrupar por aliado
  const porAliado = useMemo(() => {
    const grupos = new Map<string, { aliado: StockAliado['aliado']; items: StockAliado[] }>()
    stockAliado.forEach(s => {
      const key = s.aliado_id
      if (!grupos.has(key)) grupos.set(key, { aliado: s.aliado, items: [] })
      grupos.get(key)!.items.push(s)
    })
    return Array.from(grupos.values())
  }, [stockAliado])

  if (porAliado.length === 0) {
    return <EmptyState msg="Ningún aliado tiene stock consignado todavía." />
  }

  return (
    <div className="space-y-4">
      {porAliado.map(({ aliado, items }) => {
        const totalUds = items.reduce((s, i) => s + Number(i.cantidad), 0)
        const totalValor = items.reduce((s, i) => s + Number(i.cantidad) * Number(i.producto?.precio_final ?? i.producto?.precio_detal ?? 0), 0)
        return (
          <div key={aliado?.id} className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[#1a1007] border-b border-[#6E3F22]/40">
              <div className="flex items-center gap-3">
                <Link href={`/crm/aliados/${aliado?.id}`} className="font-semibold text-[#F5F5DC] hover:text-[#6FB04A]">
                  {aliado?.nombre}
                </Link>
                {aliado?.zona && (
                  <span className="text-[10px] text-[#6E3F22] bg-[#6E3F22]/10 border border-[#6E3F22]/20 px-1.5 py-0.5 rounded">
                    📍 {aliado.zona}
                  </span>
                )}
              </div>
              <div className="flex gap-4 text-xs">
                <span className="text-[#C0D1C6]">{totalUds.toFixed(0)} uds</span>
                <span className="text-[#6FB04A] font-bold">${totalValor.toFixed(2)}</span>
              </div>
            </div>

            <table className="w-full text-sm">
              <tbody className="divide-y divide-[#6E3F22]/20">
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-2.5 text-[#F5F5DC]">
                      {item.producto?.nombre}{' '}
                      <span className="text-[#6E3F22] text-xs">{item.producto?.presentacion}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-[#F5F5DC]">
                      {Number(item.cantidad).toFixed(0)} uds
                    </td>
                    <td className="px-4 py-2.5 text-right text-[#6FB04A] text-xs">
                      ${(Number(item.cantidad) * Number(item.producto?.precio_final ?? item.producto?.precio_detal ?? 0)).toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-right w-32">
                      <button
                        onClick={() => setReducirFor(item)}
                        className="text-xs bg-[#FDC829]/15 hover:bg-[#FDC829]/25 border border-[#FDC829]/30 text-[#FDC829] px-3 py-1 rounded"
                      >
                        Reducir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}

      {reducirFor && (
        <ReducirClienteModal item={reducirFor} onClose={() => setReducirFor(null)} />
      )}
    </div>
  )
}

function ReducirClienteModal({ item, onClose }: { item: StockAliado; onClose: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [cantidad, setCantidad] = useState('')
  const [esVenta, setEsVenta] = useState<boolean | null>(null)
  const [metodoPago, setMetodoPago] = useState('efectivo-usd')
  const [precioUnit, setPrecioUnit] = useState(String(item.producto?.precio_final ?? item.producto?.precio_detal ?? ''))
  const [motivo, setMotivo] = useState('')

  const disponible = Number(item.cantidad)
  const p = item.producto

  function submit() {
    if (!cantidad || Number(cantidad) <= 0 || Number(cantidad) > disponible || esVenta === null) return
    startTransition(async () => {
      await reducirStockAliado({
        aliadoId: item.aliado_id,
        productoId: item.producto_id,
        cantidad: Number(cantidad),
        esVenta,
        precioUnit: esVenta ? Number(precioUnit) : null,
        costoUnit: esVenta ? Number(p?.costo ?? 0) : null,
        metodoPago: esVenta ? metodoPago : null,
        motivo: !esVenta ? (motivo || 'Ajuste manual') : null,
      })
      router.refresh()
      onClose()
    })
  }

  return (
    <Modal onClose={onClose} title={`Reducir stock — ${p?.nombre} ${p?.presentacion}`}>
      <div className="space-y-4">
        <div className="text-xs text-[#C0D1C6]">
          Aliado: <span className="text-[#F5F5DC] font-bold">{item.aliado?.nombre}</span>
          {' · '}Stock actual: <span className="text-[#F5F5DC] font-bold">{disponible} uds</span>
        </div>

        <Field label="Cantidad a reducir">
          <input
            type="number" step="1" min="1" max={disponible} value={cantidad}
            onChange={e => setCantidad(e.target.value)}
            className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm"
            placeholder="0"
            autoFocus
          />
        </Field>

        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#C0D1C6] mb-2">¿Es una venta?</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setEsVenta(true)}
              className={`px-3 py-3 rounded border text-sm font-semibold transition-colors ${
                esVenta === true
                  ? 'border-[#6FB04A]/60 bg-[#6FB04A]/20 text-[#6FB04A]'
                  : 'border-[#6E3F22]/40 text-[#C0D1C6] hover:border-[#6E3F22]/60'
              }`}
            >
              ✓ Sí, venta
              <div className="text-[10px] text-[#6E3F22] font-normal mt-0.5">Se registra en Ventas</div>
            </button>
            <button
              onClick={() => setEsVenta(false)}
              className={`px-3 py-3 rounded border text-sm font-semibold transition-colors ${
                esVenta === false
                  ? 'border-[#FDC829]/60 bg-[#FDC829]/20 text-[#FDC829]'
                  : 'border-[#6E3F22]/40 text-[#C0D1C6] hover:border-[#6E3F22]/60'
              }`}
            >
              ✗ No, ajuste
              <div className="text-[10px] text-[#6E3F22] font-normal mt-0.5">Merma, devolución, etc.</div>
            </button>
          </div>
        </div>

        {esVenta === true && (
          <div className="bg-[#6FB04A]/10 border border-[#6FB04A]/30 rounded p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Precio unitario ($)">
                <input
                  type="number" step="0.01" value={precioUnit}
                  onChange={e => setPrecioUnit(e.target.value)}
                  className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm"
                />
              </Field>
              <Field label="Método de pago">
                <select
                  value={metodoPago}
                  onChange={e => setMetodoPago(e.target.value)}
                  className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm"
                >
                  <option value="efectivo-usd">Efectivo USD</option>
                  <option value="efectivo-bs">Efectivo Bs</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="pago-movil">Pago móvil</option>
                  <option value="zelle">Zelle</option>
                  <option value="binance">Binance</option>
                  <option value="otro">Otro</option>
                </select>
              </Field>
            </div>
            {cantidad && Number(cantidad) > 0 && (
              <div className="text-xs text-[#C0D1C6]">
                Venta total: <span className="text-[#6FB04A] font-bold">${(Number(cantidad) * Number(precioUnit || 0)).toFixed(2)}</span>
                {' · '}Ganancia: <span className="text-[#6FB04A] font-bold">${(Number(cantidad) * (Number(precioUnit || 0) - Number(p?.costo ?? 0))).toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {esVenta === false && (
          <Field label="Motivo del ajuste">
            <select
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-[#F5F5DC] text-sm"
            >
              <option value="">— Elegir motivo —</option>
              <option value="Merma / vencimiento">Merma / vencimiento</option>
              <option value="Devolución del aliado">Devolución del aliado</option>
              <option value="Traslado a otra ubicación">Traslado a otra ubicación</option>
              <option value="Ajuste de conteo">Ajuste de conteo</option>
              <option value="Otro">Otro</option>
            </select>
          </Field>
        )}

        <div className="flex gap-2 justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#C0D1C6] hover:text-white">Cancelar</button>
          <button
            onClick={submit}
            disabled={
              pending || esVenta === null || !cantidad || Number(cantidad) <= 0 || Number(cantidad) > disponible ||
              (esVenta === false && !motivo)
            }
            className="px-4 py-2 bg-[#6FB04A] hover:bg-[#5a9a3a] text-white rounded text-sm font-semibold disabled:opacity-50"
          >
            {pending ? 'Guardando...' : (esVenta ? 'Registrar venta' : 'Ajustar')}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Movimientos ──────────────────────────────────────────────────────────────

function MovimientosTable({
  movimientos, ingredientes, productos, aliados,
}: {
  movimientos: MovimientoStock[]
  ingredientes: Ingrediente[]
  productos: Producto[]
  aliados: AliadoLite[]
}) {
  const nomIng = useMemo(() => Object.fromEntries(ingredientes.map(i => [i.id, i.nombre])), [ingredientes])
  const nomProd = useMemo(() => Object.fromEntries(productos.map(p => [p.id, `${p.nombre} ${p.presentacion}`])), [productos])
  const nomAli = useMemo(() => Object.fromEntries(aliados.map(a => [a.id, a.nombre])), [aliados])

  if (movimientos.length === 0) {
    return <EmptyState msg="Aún no hay movimientos registrados." />
  }

  return (
    <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[#1a1007] text-[10px] uppercase tracking-widest text-[#C0D1C6]">
          <tr>
            <th className="text-left px-4 py-3">Fecha</th>
            <th className="text-left px-4 py-3">Ámbito</th>
            <th className="text-left px-4 py-3">Operación</th>
            <th className="text-left px-4 py-3">Ítem</th>
            <th className="text-left px-4 py-3">Aliado</th>
            <th className="text-right px-4 py-3">Cantidad</th>
            <th className="text-right px-4 py-3">Antes → Después</th>
            <th className="text-left px-4 py-3">Motivo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#6E3F22]/20">
          {movimientos.map(m => {
            const item = m.ingrediente_id
              ? nomIng[m.ingrediente_id]
              : m.producto_id
                ? nomProd[m.producto_id]
                : '—'
            const opColor = m.operacion === 'venta' ? 'text-[#6FB04A]'
              : m.operacion === 'merma' ? 'text-[#ef4444]'
                : m.operacion === 'entrada' || m.operacion === 'restock' ? 'text-[#6FB04A]'
                  : 'text-[#C0D1C6]'
            return (
              <tr key={m.id}>
                <td className="px-4 py-2.5 text-[#C0D1C6] text-xs whitespace-nowrap">
                  {new Date(m.fecha).toLocaleString('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-2.5 text-[#C0D1C6] text-xs capitalize">{m.ambito.replace('-', ' ')}</td>
                <td className={`px-4 py-2.5 text-xs font-bold capitalize ${opColor}`}>{m.operacion}</td>
                <td className="px-4 py-2.5 text-[#F5F5DC] text-sm">{item ?? '—'}</td>
                <td className="px-4 py-2.5 text-[#C0D1C6] text-xs">{m.aliado_id ? nomAli[m.aliado_id] ?? '—' : '—'}</td>
                <td className="px-4 py-2.5 text-right text-[#F5F5DC] font-bold">{Number(m.cantidad).toFixed(2)}</td>
                <td className="px-4 py-2.5 text-right text-[#6E3F22] text-xs">
                  {Number(m.cantidad_antes ?? 0).toFixed(0)} → {Number(m.cantidad_despues ?? 0).toFixed(0)}
                </td>
                <td className="px-4 py-2.5 text-[#C0D1C6] text-xs">{m.motivo ?? '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

function EmptyState({ msg, href, cta }: { msg: string; href?: string; cta?: string }) {
  return (
    <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg p-12 text-center">
      <div className="text-4xl mb-3">📭</div>
      <p className="text-[#6E3F22] text-sm mb-3">{msg}</p>
      {href && cta && (
        <Link href={href} className="text-xs text-[#6FB04A] hover:underline">{cta} →</Link>
      )}
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

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div className="bg-[#2a1a0e] border border-[#6E3F22]/60 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#6E3F22]/40">
          <h2 className="font-bebas text-lg tracking-widest text-[#F5F5DC]">{title}</h2>
          <button onClick={onClose} className="text-[#C0D1C6] hover:text-white text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
