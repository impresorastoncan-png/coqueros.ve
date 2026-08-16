'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CajaTipo, MetodoPago } from '@/lib/types'

export async function createMovimiento(input: {
  fecha: string
  tipo: CajaTipo
  categoria: string
  monto: number
  metodo_pago?: MetodoPago | null
  descripcion?: string | null
}) {
  if (input.monto <= 0) throw new Error('El monto debe ser mayor a 0.')

  const supabase = await createClient()
  const { error } = await supabase.from('caja_movimientos').insert({
    fecha: input.fecha,
    tipo: input.tipo,
    categoria: input.categoria,
    monto: input.monto,
    metodo_pago: input.metodo_pago ?? null,
    descripcion: input.descripcion ?? null,
    origen: 'manual',
  })
  if (error) throw error

  revalidatePath('/crm/caja')
  revalidatePath('/crm/objetivos')
  revalidatePath('/crm/dashboard')
}

export async function deleteMovimiento(id: string) {
  const supabase = await createClient()

  const { data: mov, error: eGet } = await supabase
    .from('caja_movimientos')
    .select('id, origen')
    .eq('id', id)
    .single()
  if (eGet) throw eGet
  if (mov.origen !== 'manual') {
    throw new Error('Los movimientos automáticos de ventas no se pueden borrar aquí. Borra la venta en /crm/ventas.')
  }

  const { error } = await supabase.from('caja_movimientos').delete().eq('id', id)
  if (error) throw error

  revalidatePath('/crm/caja')
  revalidatePath('/crm/objetivos')
  revalidatePath('/crm/dashboard')
}
