'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function marcarVisitado(data: {
  aliado_id: string
  resultado: string
  proximo_paso: string
  responsable: string
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('interacciones').insert({
    aliado_id: data.aliado_id,
    tipo: 'visita',
    fecha: new Date().toISOString(),
    resultado: data.resultado,
    proximo_paso: data.proximo_paso,
    responsable: data.responsable,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/crm/ruta')
  revalidatePath(`/crm/aliados/${data.aliado_id}`)
}

export async function guardarCoordenadas(aliadoId: string, lat: number, lng: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('aliados').update({ lat, lng }).eq('id', aliadoId)
  if (error) throw new Error(error.message)
  revalidatePath('/crm/ruta')
  revalidatePath(`/crm/aliados/${aliadoId}`)
}
