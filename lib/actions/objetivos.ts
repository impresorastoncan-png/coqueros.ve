'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CategoriaObjetivo, MetricaObjetivo, PrioridadObjetivo, EstadoObjetivo } from '@/lib/types'

export interface ProgresoObjetivo {
  metrica: MetricaObjetivo
  valorActual: number
  ventana: string
}

// Calcula el valor actual para cada métrica soportada.
// Devuelve un mapa por métrica para minimizar queries.
export async function computarProgresoTodas(objetivos: {
  id: string
  metrica: MetricaObjetivo
  valor_inicial: number
  created_at: string
}[]): Promise<Record<string, number>> {
  const supabase = await createClient()
  const now = new Date()

  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1)
  const finMes = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const day = now.getDay()  // 0 = domingo
  const diffLunes = day === 0 ? -6 : 1 - day
  const inicioSemana = new Date(now)
  inicioSemana.setDate(now.getDate() + diffLunes)
  inicioSemana.setHours(0, 0, 0, 0)
  const finSemana = new Date(inicioSemana)
  finSemana.setDate(inicioSemana.getDate() + 7)

  const necesita = new Set(objetivos.map(o => o.metrica))
  const result: Record<string, number> = {}

  // Ventas del mes: solo bruto (para métricas ventas_mensual, unidades_vendidas_mes)
  const ventasMes = necesita.has('ventas_mensual') || necesita.has('unidades_vendidas_mes')
    ? (await supabase
        .from('ventas')
        .select('monto_total')
        .gte('fecha', inicioMes.toISOString().slice(0, 10))
        .lt('fecha', finMes.toISOString().slice(0, 10))).data ?? []
    : []

  const ventasSemana = necesita.has('ventas_semanal')
    ? (await supabase
        .from('ventas')
        .select('monto_total')
        .gte('fecha', inicioSemana.toISOString().slice(0, 10))
        .lt('fecha', finSemana.toISOString().slice(0, 10))).data ?? []
    : []

  // Ganancia = caja neta (ingresos − egresos). Los movimientos auto de venta ya
  // replican monto_total (ingreso) y costo_total (egreso), así que el neto por
  // rango equivale a la ganancia de ventas MENOS los gastos manuales del período.
  const cajaMes = necesita.has('ganancia_mensual')
    ? (await supabase
        .from('caja_movimientos')
        .select('tipo, monto')
        .gte('fecha', inicioMes.toISOString().slice(0, 10))
        .lt('fecha', finMes.toISOString().slice(0, 10))).data ?? []
    : []

  const cajaSemana = necesita.has('ganancia_semanal')
    ? (await supabase
        .from('caja_movimientos')
        .select('tipo, monto')
        .gte('fecha', inicioSemana.toISOString().slice(0, 10))
        .lt('fecha', finSemana.toISOString().slice(0, 10))).data ?? []
    : []

  let stageActivoId: string | null = null
  if (necesita.has('aliados_activos')) {
    const { data } = await supabase.from('pipeline_stages').select('id').eq('nombre', 'Activo').maybeSingle()
    stageActivoId = data?.id ?? null
  }
  const aliadosActivos = necesita.has('aliados_activos') && stageActivoId
    ? ((await supabase.from('aliados').select('*', { count: 'exact', head: true }).eq('activo', true).eq('pipeline_stage_id', stageActivoId)).count ?? 0)
    : 0

  const conNevera = necesita.has('neveras_colocadas')
    ? ((await supabase.from('aliados').select('*', { count: 'exact', head: true }).eq('activo', true).eq('tiene_nevera', true)).count ?? 0)
    : 0

  // ganancia_acumulada: neto de caja desde created_at del objetivo
  const gananciaAcumuladaDesde: Record<string, number> = {}
  for (const obj of objetivos) {
    if (obj.metrica === 'ganancia_acumulada') {
      const { data } = await supabase
        .from('caja_movimientos')
        .select('tipo, monto')
        .gte('fecha', obj.created_at.slice(0, 10))
      const neto = (data ?? []).reduce((s, m) => {
        const monto = Number(m.monto ?? 0)
        return s + (m.tipo === 'ingreso' ? monto : -monto)
      }, 0)
      gananciaAcumuladaDesde[obj.id] = neto
    }
  }

  const sumBruto = (rows: { monto_total?: number }[]) =>
    rows.reduce((s, r) => s + Number(r.monto_total ?? 0), 0)

  const netoCaja = (rows: { tipo: string; monto: number }[]) =>
    rows.reduce((s, m) => s + (m.tipo === 'ingreso' ? Number(m.monto ?? 0) : -Number(m.monto ?? 0)), 0)

  for (const obj of objetivos) {
    switch (obj.metrica) {
      case 'ganancia_mensual':   result[obj.id] = netoCaja(cajaMes); break
      case 'ganancia_semanal':   result[obj.id] = netoCaja(cajaSemana); break
      case 'ventas_mensual':     result[obj.id] = sumBruto(ventasMes); break
      case 'ventas_semanal':     result[obj.id] = sumBruto(ventasSemana); break
      case 'aliados_activos':    result[obj.id] = aliadosActivos; break
      case 'neveras_colocadas':  result[obj.id] = conNevera; break
      case 'unidades_vendidas_mes': result[obj.id] = ventasMes.length; break
      case 'ganancia_acumulada': result[obj.id] = (gananciaAcumuladaDesde[obj.id] ?? 0) + Number(obj.valor_inicial ?? 0); break
      default: result[obj.id] = 0
    }
  }

  return result
}

export async function crearObjetivo(input: {
  titulo: string
  descripcion?: string | null
  categoria?: CategoriaObjetivo | null
  metrica: MetricaObjetivo
  target_valor: number
  target_fecha?: string | null
  prioridad?: PrioridadObjetivo
  icono?: string | null
  color?: string | null
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('objetivos').insert({
    titulo: input.titulo,
    descripcion: input.descripcion ?? null,
    categoria: input.categoria ?? null,
    metrica: input.metrica,
    target_valor: input.target_valor,
    target_fecha: input.target_fecha ?? null,
    prioridad: input.prioridad ?? 'media',
    icono: input.icono ?? '🎯',
    color: input.color ?? '#FDC829',
  })
  if (error) throw error
  revalidatePath('/crm/objetivos')
}

export async function actualizarEstadoObjetivo(id: string, estado: EstadoObjetivo) {
  const supabase = await createClient()
  const { error } = await supabase.from('objetivos').update({ estado }).eq('id', id)
  if (error) throw error
  revalidatePath('/crm/objetivos')
}

export async function eliminarObjetivo(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('objetivos').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/crm/objetivos')
}

// ─── Gemini insights ──────────────────────────────────────────────────────────

interface InsightPayload {
  objetivos: {
    titulo: string
    descripcion: string | null
    metrica: MetricaObjetivo
    target: number
    actual: number
    progreso_pct: number
    prioridad: PrioridadObjetivo
  }[]
  contexto: {
    ganancia_mensual_actual: number
    ganancia_semanal_actual: number
    ticket_promedio: number | null
    aliados_activos: number
    total_aliados: number
    neveras: number
    ventas_totales_mes: number
    productos_top: { nombre: string; unidades: number }[]
  }
}

export async function generarInsights(payload: InsightPayload): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY no configurada')

  const prompt = buildPrompt(payload)

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1200,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini error (${res.status}): ${err.slice(0, 300)}`)
  }

  const data = await res.json()
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '(sin respuesta)'
  return text.trim()
}

function buildPrompt(p: InsightPayload): string {
  const objetivosStr = p.objetivos
    .map(o => `- ${o.titulo} (${o.metrica}): meta ${o.target}, actual ${o.actual.toFixed(2)}, progreso ${o.progreso_pct.toFixed(0)}%. Prioridad: ${o.prioridad}.${o.descripcion ? ` Nota: ${o.descripcion}` : ''}`)
    .join('\n')

  const productosTop = p.contexto.productos_top.length
    ? p.contexto.productos_top.map(pt => `${pt.nombre} (${pt.unidades} uds)`).join(', ')
    : 'sin datos'

  return `Eres un asesor de negocios para "Coqueros", una marca artesanal venezolana de bebidas de coco (jugo, leche, agua, coquitos de hielo) que opera en Caracas con modelo B2B por consignación (nevera en el punto del aliado). Base cerca de Chacao, Altamira, La Castellana, Los Palos Grandes, Las Mercedes. Todos los precios en USD.

DATOS DEL NEGOCIO — mes actual:
- Ganancia mensual: $${p.contexto.ganancia_mensual_actual.toFixed(2)}
- Ganancia semana en curso: $${p.contexto.ganancia_semanal_actual.toFixed(2)}
- Ventas totales del mes: $${p.contexto.ventas_totales_mes.toFixed(2)}
- Ticket promedio: ${p.contexto.ticket_promedio != null ? `$${p.contexto.ticket_promedio.toFixed(2)}` : 'sin datos'}
- Aliados activos: ${p.contexto.aliados_activos} de ${p.contexto.total_aliados} totales
- Neveras colocadas: ${p.contexto.neveras}
- Productos top del mes: ${productosTop}

OBJETIVOS DEFINIDOS:
${objetivosStr || '(sin objetivos)'}

Tu tarea:
1. Evalúa qué tan cerca o lejos está cada objetivo de cumplirse.
2. Identifica el objetivo más apalancable (el que dado el estado actual daría más impulso al resto).
3. Sugiere 3 acciones concretas y realistas para las próximas 2 semanas, en tono directo y venezolano. Cada acción debe ser específica (qué hacer, con quién, cuánto).
4. Si detectas riesgos (concentración en un solo aliado, categoría estancada, ticket muy bajo, etc.), márcalos como "⚠ Alerta".
5. Termina con una frase corta motivadora.

Formato de respuesta: markdown corto, sin encabezados grandes. Usa emojis con moderación. Máximo 300 palabras.`
}

// Obtiene el contexto de negocio actual para pasar a Gemini.
export async function obtenerContextoNegocio() {
  const supabase = await createClient()
  const now = new Date()
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1)
  const finMes = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const day = now.getDay()
  const diffLunes = day === 0 ? -6 : 1 - day
  const inicioSemana = new Date(now)
  inicioSemana.setDate(now.getDate() + diffLunes)
  inicioSemana.setHours(0, 0, 0, 0)
  const finSemana = new Date(inicioSemana)
  finSemana.setDate(inicioSemana.getDate() + 7)

  const [
    { data: ventasMes },
    { data: cajaMes },
    { data: cajaSem },
    { data: stageActivo },
    { count: totalAliados },
    { count: conNevera },
    { data: itemsMes },
  ] = await Promise.all([
    supabase.from('ventas').select('monto_total').gte('fecha', inicioMes.toISOString().slice(0, 10)).lt('fecha', finMes.toISOString().slice(0, 10)),
    supabase.from('caja_movimientos').select('tipo, monto').gte('fecha', inicioMes.toISOString().slice(0, 10)).lt('fecha', finMes.toISOString().slice(0, 10)),
    supabase.from('caja_movimientos').select('tipo, monto').gte('fecha', inicioSemana.toISOString().slice(0, 10)).lt('fecha', finSemana.toISOString().slice(0, 10)),
    supabase.from('pipeline_stages').select('id').eq('nombre', 'Activo').maybeSingle(),
    supabase.from('aliados').select('*', { count: 'exact', head: true }).eq('activo', true),
    supabase.from('aliados').select('*', { count: 'exact', head: true }).eq('activo', true).eq('tiene_nevera', true),
    supabase
      .from('venta_items')
      .select('cantidad, producto:productos(nombre, presentacion), venta:ventas!inner(fecha)')
      .gte('venta.fecha', inicioMes.toISOString().slice(0, 10))
      .lt('venta.fecha', finMes.toISOString().slice(0, 10)),
  ])

  const aliadosActivos = stageActivo
    ? ((await supabase.from('aliados').select('*', { count: 'exact', head: true }).eq('activo', true).eq('pipeline_stage_id', stageActivo.id)).count ?? 0)
    : 0

  const netoCaja = (rows: { tipo: string; monto: number }[] | null) =>
    (rows ?? []).reduce((s, m) => s + (m.tipo === 'ingreso' ? Number(m.monto ?? 0) : -Number(m.monto ?? 0)), 0)

  const gananciaMes = netoCaja(cajaMes)
  const gananciaSem = netoCaja(cajaSem)
  const ventasTotal = (ventasMes ?? []).reduce((s, v) => s + Number(v.monto_total ?? 0), 0)
  const ticket = (ventasMes?.length ?? 0) > 0 ? ventasTotal / ventasMes!.length : null

  const productoAgg = new Map<string, number>()
  ;(itemsMes ?? []).forEach(it => {
    const prod = Array.isArray(it.producto) ? it.producto[0] : it.producto
    if (!prod) return
    const nombre = `${prod.nombre} ${prod.presentacion}`
    productoAgg.set(nombre, (productoAgg.get(nombre) ?? 0) + Number(it.cantidad))
  })
  const productos_top = Array.from(productoAgg.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nombre, unidades]) => ({ nombre, unidades }))

  return {
    ganancia_mensual_actual: gananciaMes,
    ganancia_semanal_actual: gananciaSem,
    ticket_promedio: ticket,
    aliados_activos: aliadosActivos,
    total_aliados: totalAliados ?? 0,
    neveras: conNevera ?? 0,
    ventas_totales_mes: ventasTotal,
    productos_top,
  }
}
