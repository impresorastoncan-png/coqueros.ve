'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { TipoAliado, TipoInteraccion } from '@/lib/types'

export async function crearAliado(data: {
  nombre: string
  tipo: TipoAliado
  zona: string
  direccion: string
  pipeline_stage_id: string
  tiene_nevera: boolean
  notas: string
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('aliados').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/crm/aliados')
  revalidatePath('/crm/pipeline')
}

export async function actualizarAliado(id: string, data: Partial<{
  nombre: string
  tipo: TipoAliado
  zona: string
  direccion: string
  pipeline_stage_id: string
  tiene_nevera: boolean
  notas: string
  activo: boolean
}>) {
  const supabase = await createClient()
  const { error } = await supabase.from('aliados').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/crm/aliados')
  revalidatePath('/crm/pipeline')
  revalidatePath(`/crm/aliados/${id}`)
}

export async function moverStage(aliadoId: string, stageId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('aliados').update({ pipeline_stage_id: stageId }).eq('id', aliadoId)
  if (error) throw new Error(error.message)
  revalidatePath('/crm/pipeline')
  revalidatePath('/crm/aliados')
}

export async function crearContacto(data: {
  aliado_id: string
  nombre: string
  cargo: string
  telefono: string
  email: string
  es_principal: boolean
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('contactos').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath(`/crm/aliados/${data.aliado_id}`)
}

export async function eliminarContacto(id: string, aliadoId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('contactos').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/crm/aliados/${aliadoId}`)
}

export async function crearInteraccion(data: {
  aliado_id: string
  tipo: TipoInteraccion
  fecha: string
  resultado: string
  proximo_paso: string
  responsable: string
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('interacciones').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath(`/crm/aliados/${data.aliado_id}`)
}
