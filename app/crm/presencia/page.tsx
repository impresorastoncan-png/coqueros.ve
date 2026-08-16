import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PresenciaCliente from '@/components/crm/presencia-cliente'

export const dynamic = 'force-dynamic'

export default async function PresenciaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/crm/login')

  // Aliados con presencia (etapas donde el producto ya está en el punto)
  const stagesPresencia = ['Nevera colocada', 'Activo']

  const { data: stages } = await supabase
    .from('pipeline_stages')
    .select('id, nombre')
    .in('nombre', stagesPresencia)

  const stageIds = (stages ?? []).map(s => s.id)

  const { data: aliados } = await supabase
    .from('aliados')
    .select('id, nombre, tipo, zona, direccion, lat, lng, tiene_nevera, pipeline_stage:pipeline_stages(nombre, color)')
    .eq('activo', true)
    .in('pipeline_stage_id', stageIds)
    .not('lat', 'is', null)
    .not('lng', 'is', null)

  // Ventas del mes actual, agregadas por aliado para pesar el heatmap
  const now = new Date()
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const finMes = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10)

  const { data: ventasMes } = await supabase
    .from('ventas')
    .select('aliado_id, monto_total')
    .gte('fecha', inicioMes)
    .lt('fecha', finMes)
    .not('aliado_id', 'is', null)

  const ventasPorAliado = new Map<string, number>()
  ;(ventasMes ?? []).forEach(v => {
    if (!v.aliado_id) return
    ventasPorAliado.set(v.aliado_id, (ventasPorAliado.get(v.aliado_id) ?? 0) + Number(v.monto_total ?? 0))
  })

  const puntos = (aliados ?? []).map(a => ({
    id: a.id,
    nombre: a.nombre,
    tipo: a.tipo,
    zona: a.zona,
    direccion: a.direccion,
    lat: Number(a.lat),
    lng: Number(a.lng),
    tiene_nevera: a.tiene_nevera,
    stage: Array.isArray(a.pipeline_stage) ? a.pipeline_stage[0]?.nombre : (a.pipeline_stage as { nombre?: string } | null)?.nombre ?? null,
    peso_ventas: ventasPorAliado.get(a.id) ?? 0,
  }))

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-bebas text-3xl tracking-widest text-[#F5F5DC]">PRESENCIA COQUEROS</h1>
        <p className="text-[#C0D1C6] text-sm mt-0.5">Zonas de calor donde el mercado puede encontrar nuestros productos.</p>
      </div>

      <PresenciaCliente puntos={puntos} />
    </div>
  )
}
