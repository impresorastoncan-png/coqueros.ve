'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { RutaMotorizadoSnapshotItem } from '@/lib/types'

export async function asignarRuta(input: {
  fecha: string
  km: number
  tarifa_usd_km: number
  num_paradas: number
  duracion_segundos?: number | null
  origen_lat?: number | null
  origen_lng?: number | null
  motorizado_nombre?: string | null
  notas?: string | null
  snapshot?: RutaMotorizadoSnapshotItem[] | null
}) {
  if (input.km <= 0) throw new Error('Los kilómetros deben ser mayores a 0.')
  if (input.tarifa_usd_km < 0) throw new Error('La tarifa no puede ser negativa.')

  const supabase = await createClient()
  const { error } = await supabase.from('rutas_motorizado').insert({
    fecha: input.fecha,
    km: input.km,
    tarifa_usd_km: input.tarifa_usd_km,
    num_paradas: input.num_paradas,
    duracion_segundos: input.duracion_segundos ?? null,
    origen_lat: input.origen_lat ?? null,
    origen_lng: input.origen_lng ?? null,
    motorizado_nombre: input.motorizado_nombre ?? null,
    notas: input.notas ?? null,
    snapshot: input.snapshot ?? null,
    estado: 'pendiente',
  })
  if (error) throw error

  revalidatePath('/crm/motorizado')
  revalidatePath('/crm/ruta')
}

export async function marcarPagada(id: string) {
  const supabase = await createClient()

  const { data: ruta, error: eGet } = await supabase
    .from('rutas_motorizado')
    .select('id, fecha, km, costo, num_paradas, estado, caja_movimiento_id, motorizado_nombre')
    .eq('id', id)
    .single()
  if (eGet) throw eGet
  if (ruta.estado === 'pagada') throw new Error('La ruta ya está marcada como pagada.')
  if (Number(ruta.costo) <= 0) throw new Error('El costo de la ruta es 0; no se puede pagar.')

  const fechaCorta = new Date(ruta.fecha + 'T00:00:00').toLocaleDateString('es-VE', {
    day: '2-digit', month: '2-digit',
  })
  const kmStr = Number(ruta.km).toFixed(1)
  const nombre = ruta.motorizado_nombre ? ` (${ruta.motorizado_nombre})` : ''
  const descripcion = `Motorizado${nombre} · ${fechaCorta} · ${kmStr} km / ${ruta.num_paradas} paradas`

  const { data: mov, error: eMov } = await supabase
    .from('caja_movimientos')
    .insert({
      fecha: ruta.fecha,
      tipo: 'egreso',
      categoria: 'motorizado',
      monto: ruta.costo,
      descripcion,
      origen: 'manual',
    })
    .select('id')
    .single()
  if (eMov) throw eMov

  const { error: eUpd } = await supabase
    .from('rutas_motorizado')
    .update({
      estado: 'pagada',
      pagada_at: new Date().toISOString(),
      caja_movimiento_id: mov.id,
    })
    .eq('id', id)
  if (eUpd) throw eUpd

  revalidatePath('/crm/motorizado')
  revalidatePath('/crm/caja')
  revalidatePath('/crm/dashboard')
  revalidatePath('/crm/objetivos')
}

export async function deleteRuta(id: string) {
  const supabase = await createClient()

  const { data: ruta, error: eGet } = await supabase
    .from('rutas_motorizado')
    .select('id, estado, caja_movimiento_id')
    .eq('id', id)
    .single()
  if (eGet) throw eGet

  if (ruta.caja_movimiento_id) {
    await supabase.from('caja_movimientos').delete().eq('id', ruta.caja_movimiento_id)
  }

  const { error } = await supabase.from('rutas_motorizado').delete().eq('id', id)
  if (error) throw error

  revalidatePath('/crm/motorizado')
  revalidatePath('/crm/caja')
  revalidatePath('/crm/dashboard')
  revalidatePath('/crm/objetivos')
}
