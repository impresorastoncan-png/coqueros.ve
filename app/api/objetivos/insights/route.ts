import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computarProgresoTodas, generarInsights, obtenerContextoNegocio } from '@/lib/actions/objetivos'
import type { Objetivo } from '@/lib/types'

export const runtime = 'nodejs'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'no-auth' }, { status: 401 })

  const { data } = await supabase
    .from('objetivos')
    .select('*')
    .eq('estado', 'activo')

  const objetivos = (data ?? []) as Objetivo[]
  if (objetivos.length === 0) {
    return NextResponse.json({ insights: 'Aún no tienes objetivos activos. Crea al menos uno para recibir recomendaciones.' })
  }

  const [progreso, contexto] = await Promise.all([
    computarProgresoTodas(objetivos),
    obtenerContextoNegocio(),
  ])

  try {
    const insights = await generarInsights({
      objetivos: objetivos.map(o => ({
        titulo: o.titulo,
        descripcion: o.descripcion,
        metrica: o.metrica,
        target: Number(o.target_valor),
        actual: progreso[o.id] ?? 0,
        progreso_pct: (progreso[o.id] ?? 0) / Number(o.target_valor) * 100,
        prioridad: o.prioridad,
      })),
      contexto,
    })
    return NextResponse.json({ insights })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
