import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PublicidadGaleria from '@/components/crm/publicidad-galeria'

export const dynamic = 'force-dynamic'

export default async function PublicidadPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; plataforma?: string; q?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/crm/login')

  const params = await searchParams

  let query = supabase.from('publicidad').select('*').eq('activo', true).order('fecha_creacion', { ascending: false })
  if (params.tipo)       query = query.eq('tipo', params.tipo)
  if (params.plataforma) query = query.eq('plataforma', params.plataforma)
  if (params.q)          query = query.ilike('titulo', `%${params.q}%`)

  const { data: assets } = await query

  // Public URL para cada asset con storage_path
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const assetsWithUrl = (assets ?? []).map(a => ({
    ...a,
    public_url: a.storage_path
      ? `${supabaseUrl}/storage/v1/object/public/publicidad/${a.storage_path}`
      : null,
  }))

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-bebas text-3xl tracking-widest text-[#F5F5DC]">PUBLICIDAD</h1>
        <p className="text-[#C0D1C6] text-sm mt-0.5">Banco de flyers, posts, gráficos y videos de marca.</p>
      </div>

      <PublicidadGaleria
        assets={assetsWithUrl as never}
        filtroTipo={params.tipo}
        filtroPlataforma={params.plataforma}
        filtroQ={params.q}
      />
    </div>
  )
}
