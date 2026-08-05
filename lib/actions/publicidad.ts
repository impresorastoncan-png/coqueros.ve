'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPublicidad(input: {
  titulo: string
  descripcion?: string | null
  tipo?: string | null
  plataforma?: string | null
  storage_path?: string | null
  url_externa?: string | null
  mime_type?: string | null
  tamano_bytes?: number | null
  tags?: string[]
  fecha_creacion?: string | null
  autor?: string | null
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('publicidad').insert({
    titulo:         input.titulo.trim(),
    descripcion:    input.descripcion ?? null,
    tipo:           input.tipo ?? null,
    plataforma:     input.plataforma ?? null,
    storage_path:   input.storage_path ?? null,
    url_externa:    input.url_externa ?? null,
    mime_type:      input.mime_type ?? null,
    tamano_bytes:   input.tamano_bytes ?? null,
    tags:           input.tags ?? [],
    fecha_creacion: input.fecha_creacion ?? null,
    autor:          input.autor ?? null,
  }).select('id').single()
  if (error) throw error
  revalidatePath('/crm/publicidad')
  return data.id as string
}

export async function deletePublicidad(id: string, storagePath: string | null) {
  const supabase = await createClient()

  if (storagePath) {
    await supabase.storage.from('publicidad').remove([storagePath])
  }

  const { error } = await supabase.from('publicidad').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/crm/publicidad')
}

export async function getPublicUrl(storagePath: string) {
  const supabase = await createClient()
  const { data } = supabase.storage.from('publicidad').getPublicUrl(storagePath)
  return data.publicUrl
}
