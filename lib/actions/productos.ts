'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProducto(id: string, formData: FormData) {
  const supabase = await createClient()

  const payload = {
    nombre:        String(formData.get('nombre') ?? '').trim(),
    presentacion:  String(formData.get('presentacion') ?? '').trim(),
    descripcion:   toStringOrNull(formData.get('descripcion')),
    costo:         toNumberOrNull(formData.get('costo')),
    precio_mayor:  toNumberOrNull(formData.get('precio_mayor')),
    precio_final:  toNumberOrNull(formData.get('precio_final')),
    precio_detal:  toNumberOrNull(formData.get('precio_detal')),
    precio_aliado: toNumberOrNull(formData.get('precio_aliado')),
    ganancia:      toNumberOrNull(formData.get('ganancia')),
    unidad_medida: toStringOrNull(formData.get('unidad_medida')),
    activo:        formData.get('activo') === 'on',
  }

  const { error } = await supabase.from('productos').update(payload).eq('id', id)
  if (error) throw error
  revalidatePath(`/crm/productos/${id}`)
  revalidatePath('/crm/productos')
}

export async function createProducto(formData: FormData) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('productos').insert({
    nombre:        String(formData.get('nombre') ?? '').trim(),
    presentacion:  String(formData.get('presentacion') ?? '').trim(),
    descripcion:   toStringOrNull(formData.get('descripcion')),
    costo:         toNumberOrNull(formData.get('costo')),
    precio_mayor:  toNumberOrNull(formData.get('precio_mayor')),
    precio_final:  toNumberOrNull(formData.get('precio_final')),
    precio_detal:  toNumberOrNull(formData.get('precio_detal')),
    precio_aliado: toNumberOrNull(formData.get('precio_aliado')),
    ganancia:      toNumberOrNull(formData.get('ganancia')),
    unidad_medida: toStringOrNull(formData.get('unidad_medida')),
    activo:        true,
  }).select('id').single()
  if (error) throw error
  revalidatePath('/crm/productos')
  return data.id as string
}

export async function addNota(productoId: string, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('producto_notas').insert({
    producto_id: productoId,
    tipo:        toStringOrNull(formData.get('tipo')),
    titulo:      String(formData.get('titulo') ?? '').trim(),
    contenido:   toStringOrNull(formData.get('contenido')),
    autor:       toStringOrNull(formData.get('autor')),
  })
  if (error) throw error
  revalidatePath(`/crm/productos/${productoId}`)
}

export async function deleteNota(id: string, productoId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('producto_notas').delete().eq('id', id)
  if (error) throw error
  revalidatePath(`/crm/productos/${productoId}`)
}

export async function addReceta(productoId: string, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('producto_ingredientes').insert({
    producto_id:    productoId,
    ingrediente_id: String(formData.get('ingrediente_id')),
    cantidad:       Number(formData.get('cantidad')),
    notas:          toStringOrNull(formData.get('notas')),
  })
  if (error) throw error
  revalidatePath(`/crm/productos/${productoId}`)
}

export async function deleteReceta(id: string, productoId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('producto_ingredientes').delete().eq('id', id)
  if (error) throw error
  revalidatePath(`/crm/productos/${productoId}`)
}

export async function upsertIngrediente(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string | null

  const payload = {
    nombre:         String(formData.get('nombre') ?? '').trim(),
    categoria:      toStringOrNull(formData.get('categoria')),
    unidad:         toStringOrNull(formData.get('unidad')),
    costo_unitario: toNumberOrNull(formData.get('costo_unitario')),
    proveedor_id:   toStringOrNull(formData.get('proveedor_id')),
    notas:          toStringOrNull(formData.get('notas')),
    activo:         true,
  }

  if (id) {
    const { error } = await supabase.from('ingredientes').update(payload).eq('id', id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('ingredientes').insert(payload)
    if (error) throw error
  }
  revalidatePath('/crm/productos/ingredientes')
}

export async function upsertProveedor(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string | null

  const payload = {
    nombre:    String(formData.get('nombre') ?? '').trim(),
    contacto:  toStringOrNull(formData.get('contacto')),
    telefono:  toStringOrNull(formData.get('telefono')),
    email:     toStringOrNull(formData.get('email')),
    direccion: toStringOrNull(formData.get('direccion')),
    notas:     toStringOrNull(formData.get('notas')),
    activo:    true,
  }

  if (id) {
    const { error } = await supabase.from('proveedores').update(payload).eq('id', id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('proveedores').insert(payload)
    if (error) throw error
  }
  revalidatePath('/crm/productos/proveedores')
}

function toStringOrNull(v: FormDataEntryValue | null): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s === '' ? null : s
}

function toNumberOrNull(v: FormDataEntryValue | null): number | null {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
