'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ItemInput {
  producto_id?: string | null
  descripcion?: string | null
  cantidad: number
  precio_unit: number
  costo_unit: number
}

export async function createVenta(input: {
  fecha: string
  aliado_id?: string | null
  metodo_pago?: string | null
  notas?: string | null
  items: ItemInput[]
}) {
  const supabase = await createClient()

  const { data: venta, error: vErr } = await supabase
    .from('ventas')
    .insert({
      fecha:       input.fecha,
      aliado_id:   input.aliado_id ?? null,
      metodo_pago: input.metodo_pago ?? null,
      notas:       input.notas ?? null,
    })
    .select('id')
    .single()

  if (vErr) throw vErr

  const rows = input.items.map(it => ({
    venta_id:    venta.id,
    producto_id: it.producto_id ?? null,
    descripcion: it.descripcion ?? null,
    cantidad:    it.cantidad,
    precio_unit: it.precio_unit,
    costo_unit:  it.costo_unit,
  }))

  if (rows.length > 0) {
    const { error: iErr } = await supabase.from('venta_items').insert(rows)
    if (iErr) throw iErr
  }

  revalidatePath('/crm/ventas')
  return venta.id as string
}

export async function deleteVenta(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('ventas').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/crm/ventas')
}
