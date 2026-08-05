import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RutaCliente from '@/components/crm/ruta-cliente'

export const dynamic = 'force-dynamic'

export default async function RutaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/crm/login')

  const hoyInicio = new Date()
  hoyInicio.setHours(0, 0, 0, 0)

  const [{ data: aliados }, { data: visitasHoy }] = await Promise.all([
    supabase
      .from('aliados')
      .select('*, pipeline_stage:pipeline_stages(id, nombre, color), contactos(*)')
      .eq('activo', true)
      .not('pipeline_stage_id', 'is', null)
      .order('zona', { ascending: true })
      .order('nombre', { ascending: true }),
    supabase
      .from('interacciones')
      .select('aliado_id')
      .eq('tipo', 'visita')
      .gte('fecha', hoyInicio.toISOString()),
  ])

  const visitadosHoyIds = [...new Set((visitasHoy ?? []).map(v => v.aliado_id))]

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col min-h-screen">
      {/* Header */}
      <div className="mb-5">
        <h1 className="font-bebas text-3xl tracking-widest text-[#F5F5DC]">RUTA DE HOY</h1>
        <p className="text-[#C0D1C6] text-sm mt-0.5">
          {new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <RutaCliente
        aliados={(aliados ?? []) as never}
        visitadosHoyInit={visitadosHoyIds}
      />
    </div>
  )
}
