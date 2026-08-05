import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import KanbanBoard from '@/components/crm/kanban-board'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/crm/login')

  const [{ data: stages }, { data: aliados }] = await Promise.all([
    supabase.from('pipeline_stages').select('*').order('orden'),
    supabase.from('aliados').select('*, pipeline_stage:pipeline_stages(id, nombre, color)').eq('activo', true),
  ])

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-bebas text-3xl tracking-widest text-[#F5F5DC]">PIPELINE</h1>
        <p className="text-[#C0D1C6] text-sm mt-0.5">Arrastra los aliados entre etapas para actualizar su estado.</p>
      </div>
      <KanbanBoard initialAliados={(aliados ?? []) as never} stages={stages ?? []} />
    </div>
  )
}
