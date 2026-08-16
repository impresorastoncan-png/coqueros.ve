import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { computarProgresoTodas } from '@/lib/actions/objetivos'
import ObjetivosCliente from '@/components/crm/objetivos-cliente'
import type { Objetivo } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ObjetivosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/crm/login')

  const { data: objetivos } = await supabase
    .from('objetivos')
    .select('*')
    .order('prioridad', { ascending: true })
    .order('created_at', { ascending: false })

  const lista = (objetivos ?? []) as Objetivo[]
  const progreso = await computarProgresoTodas(lista)

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-bebas text-3xl tracking-widest text-[#F5F5DC]">OBJETIVOS</h1>
        <p className="text-[#C0D1C6] text-sm mt-0.5">Metas del negocio con progreso calculado desde ventas y aliados.</p>
      </div>

      <ObjetivosCliente objetivos={lista} progreso={progreso} />
    </div>
  )
}
