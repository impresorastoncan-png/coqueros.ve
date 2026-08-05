import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AliadoForm from '@/components/crm/aliado-form'

export const dynamic = 'force-dynamic'

export default async function NuevoAliadoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/crm/login')

  const { data: stages } = await supabase.from('pipeline_stages').select('*').order('orden')

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-bebas text-3xl tracking-widest text-[#F5F5DC]">NUEVO ALIADO</h1>
        <p className="text-[#C0D1C6] text-sm mt-0.5">Registra un nuevo aliado comercial B2B.</p>
      </div>
      <AliadoForm stages={stages ?? []} />
    </div>
  )
}
