'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { AmbitoStock, OperacionStock } from '@/lib/types'

// ─── Materia prima ────────────────────────────────────────────────────────────

export async function ajustarStockIngrediente(input: {
  ingredienteId: string
  // Modo delta: suma/resta al stock actual (default, retrocompat).
  // Modo set:   fija el stock a un valor absoluto; el delta se calcula internamente.
  delta?: number
  modo?: 'delta' | 'set'
  valor?: number
  operacion: OperacionStock
  motivo?: string | null
}) {
  const supabase = await createClient()

  const { data: ing, error: e1 } = await supabase
    .from('ingredientes')
    .select('stock_actual')
    .eq('id', input.ingredienteId)
    .single()
  if (e1) throw e1

  const antes = Number(ing.stock_actual ?? 0)

  const modo = input.modo ?? 'delta'
  const delta = modo === 'set'
    ? Number(input.valor ?? antes) - antes
    : Number(input.delta ?? 0)
  const despues = antes + delta

  const { error: e2 } = await supabase
    .from('ingredientes')
    .update({ stock_actual: despues })
    .eq('id', input.ingredienteId)
  if (e2) throw e2

  const motivoFinal = modo === 'set'
    ? (input.motivo ?? `Fijado a ${despues} (conteo manual)`)
    : input.motivo ?? null

  const { error: e3 } = await supabase.from('movimientos_stock').insert({
    ambito: 'materia-prima' as AmbitoStock,
    operacion: modo === 'set' ? 'ajuste' : input.operacion,
    ingrediente_id: input.ingredienteId,
    cantidad: Math.abs(delta),
    cantidad_antes: antes,
    cantidad_despues: despues,
    motivo: motivoFinal,
  })
  if (e3) throw e3

  revalidatePath('/crm/inventario')
}

export async function updateMinimoIngrediente(id: string, minimo: number) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('ingredientes')
    .update({ stock_minimo: minimo })
    .eq('id', id)
  if (error) throw error
  revalidatePath('/crm/inventario')
}

// ─── Producto terminado ───────────────────────────────────────────────────────

export async function ajustarStockProducto(input: {
  productoId: string
  // Modo delta: suma/resta al stock actual (default, retrocompat).
  // Modo set:   fija el stock a un valor absoluto; el delta se calcula internamente.
  delta?: number
  modo?: 'delta' | 'set'
  valor?: number
  operacion: OperacionStock
  motivo?: string | null
}) {
  const supabase = await createClient()

  // Garantiza fila en producto_stock
  const { data: existing } = await supabase
    .from('producto_stock')
    .select('id, stock_actual')
    .eq('producto_id', input.productoId)
    .maybeSingle()

  const antes = Number(existing?.stock_actual ?? 0)

  const modo = input.modo ?? 'delta'
  const delta = modo === 'set'
    ? Number(input.valor ?? antes) - antes
    : Number(input.delta ?? 0)
  const despues = antes + delta

  if (existing) {
    const { error } = await supabase
      .from('producto_stock')
      .update({ stock_actual: despues })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('producto_stock')
      .insert({ producto_id: input.productoId, stock_actual: despues, stock_minimo: 0 })
    if (error) throw error
  }

  const motivoFinal = modo === 'set'
    ? (input.motivo ?? `Fijado a ${despues} (conteo manual)`)
    : input.motivo ?? null

  const { error: eMov } = await supabase.from('movimientos_stock').insert({
    ambito: 'producto' as AmbitoStock,
    operacion: modo === 'set' ? 'ajuste' : input.operacion,
    producto_id: input.productoId,
    cantidad: Math.abs(delta),
    cantidad_antes: antes,
    cantidad_despues: despues,
    motivo: motivoFinal,
  })
  if (eMov) throw eMov

  revalidatePath('/crm/inventario')
}

export async function updateMinimoProducto(id: string, minimo: number) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('producto_stock')
    .update({ stock_minimo: minimo })
    .eq('id', id)
  if (error) throw error
  revalidatePath('/crm/inventario')
}

// ─── Consignación (stock en aliado) ───────────────────────────────────────────

export async function trasladarAConsignacion(input: {
  aliadoId: string
  productoId: string
  cantidad: number
  motivo?: string | null
}) {
  const supabase = await createClient()

  // Descontar de bodega propia
  await ajustarStockProducto({
    productoId: input.productoId,
    delta: -input.cantidad,
    operacion: 'traslado',
    motivo: `Traslado a aliado ${input.aliadoId}${input.motivo ? ` — ${input.motivo}` : ''}`,
  })

  // Sumar en aliado
  const { data: existing } = await supabase
    .from('stock_aliado')
    .select('id, cantidad')
    .eq('aliado_id', input.aliadoId)
    .eq('producto_id', input.productoId)
    .maybeSingle()

  const antes = Number(existing?.cantidad ?? 0)
  const despues = antes + input.cantidad

  if (existing) {
    const { error } = await supabase
      .from('stock_aliado')
      .update({ cantidad: despues })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('stock_aliado')
      .insert({ aliado_id: input.aliadoId, producto_id: input.productoId, cantidad: despues })
    if (error) throw error
  }

  const { error: eMov } = await supabase.from('movimientos_stock').insert({
    ambito: 'consignacion' as AmbitoStock,
    operacion: 'restock',
    aliado_id: input.aliadoId,
    producto_id: input.productoId,
    cantidad: input.cantidad,
    cantidad_antes: antes,
    cantidad_despues: despues,
    motivo: input.motivo ?? null,
  })
  if (eMov) throw eMov

  revalidatePath('/crm/inventario')
}

// Reduce el stock del aliado. Si es venta, crea la venta correspondiente.
export async function reducirStockAliado(input: {
  aliadoId: string
  productoId: string
  cantidad: number
  esVenta: boolean
  precioUnit?: number | null
  costoUnit?: number | null
  metodoPago?: string | null
  motivo?: string | null
}) {
  const supabase = await createClient()

  const { data: existing, error: eGet } = await supabase
    .from('stock_aliado')
    .select('id, cantidad')
    .eq('aliado_id', input.aliadoId)
    .eq('producto_id', input.productoId)
    .maybeSingle()
  if (eGet) throw eGet
  if (!existing) throw new Error('El aliado no tiene stock de este producto.')

  const antes = Number(existing.cantidad)
  if (input.cantidad > antes) throw new Error(`Solo hay ${antes} unidades disponibles.`)

  const despues = antes - input.cantidad

  const { error: eUpd } = await supabase
    .from('stock_aliado')
    .update({ cantidad: despues })
    .eq('id', existing.id)
  if (eUpd) throw eUpd

  let ventaId: string | null = null

  if (input.esVenta) {
    // Trae precio/costo del producto para autofill
    const { data: producto } = await supabase
      .from('productos')
      .select('precio_final, precio_detal, precio_aliado, costo')
      .eq('id', input.productoId)
      .single()

    const precio = input.precioUnit ?? producto?.precio_final ?? producto?.precio_detal ?? 0
    const costo = input.costoUnit ?? producto?.costo ?? 0

    const { data: venta, error: eVenta } = await supabase
      .from('ventas')
      .insert({
        fecha: new Date().toISOString().slice(0, 10),
        aliado_id: input.aliadoId,
        metodo_pago: input.metodoPago ?? null,
        notas: 'Generada automáticamente desde /inventario',
      })
      .select('id')
      .single()
    if (eVenta) throw eVenta

    ventaId = venta.id

    const { error: eItem } = await supabase.from('venta_items').insert({
      venta_id: venta.id,
      producto_id: input.productoId,
      cantidad: input.cantidad,
      precio_unit: precio,
      costo_unit: costo,
    })
    if (eItem) throw eItem
  }

  const { error: eMov } = await supabase.from('movimientos_stock').insert({
    ambito: 'consignacion' as AmbitoStock,
    operacion: input.esVenta ? 'venta' : (input.motivo?.toLowerCase().includes('merma') ? 'merma' : 'ajuste'),
    aliado_id: input.aliadoId,
    producto_id: input.productoId,
    cantidad: input.cantidad,
    cantidad_antes: antes,
    cantidad_despues: despues,
    motivo: input.motivo ?? (input.esVenta ? 'Venta registrada' : null),
    venta_id: ventaId,
  })
  if (eMov) throw eMov

  revalidatePath('/crm/inventario')
  revalidatePath('/crm/ventas')

  return { ventaId }
}
