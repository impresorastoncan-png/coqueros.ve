import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { StageBadge, TipoBadge } from '@/components/crm/badge'
import AliadoForm from '@/components/crm/aliado-form'
import ContactosPanel from '@/components/crm/contacto-form'
import InteraccionesPanel from '@/components/crm/interaccion-form'

export const dynamic = 'force-dynamic'

export default async function AliadoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/crm/login')

  const [
    { data: aliado },
    { data: stages },
    { data: productos },
    { data: contactos },
    { data: interacciones },
  ] = await Promise.all([
    supabase
      .from('aliados')
      .select('*, pipeline_stage:pipeline_stages(id, nombre, color), producto_principal:productos(id, nombre, presentacion)')
      .eq('id', id)
      .single(),
    supabase.from('pipeline_stages').select('*').order('orden'),
    supabase.from('productos').select('*').eq('activo', true).order('nombre').order('presentacion'),
    supabase.from('contactos').select('*').eq('aliado_id', id).order('es_principal', { ascending: false }),
    supabase.from('interacciones').select('*').eq('aliado_id', id).order('fecha', { ascending: false }),
  ])

  if (!aliado) notFound()

  const ultimaInteraccion = interacciones?.[0]
  const proximoPaso = interacciones?.find(i => i.proximo_paso)?.proximo_paso

  return (
    <div className="p-6 lg:p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#6E3F22] mb-5">
        <Link href="/crm/aliados" className="hover:text-[#C0D1C6] transition-colors">Aliados</Link>
        <span>/</span>
        <span className="text-[#C0D1C6]">{aliado.nombre}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h1 className="font-bebas text-3xl tracking-widest text-[#F5F5DC]">{aliado.nombre}</h1>
            {aliado.tiene_nevera && <span className="text-xl" title="Nevera colocada">❄️</span>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <TipoBadge tipo={aliado.tipo} />
            {aliado.pipeline_stage && <StageBadge nombre={aliado.pipeline_stage.nombre} color={aliado.pipeline_stage.color} />}
            {aliado.zona && <span className="text-xs text-[#C0D1C6]">📍 {aliado.zona}</span>}
            {aliado.direccion && <span className="text-xs text-[#6E3F22]">{aliado.direccion}</span>}
            {aliado.pipeline_stage?.nombre === 'Activo' && aliado.producto_principal && (
              <span className="text-xs bg-[#6FB04A]/15 text-[#6FB04A] border border-[#6FB04A]/30 px-2 py-0.5 rounded">
                🥥 {aliado.producto_principal.nombre} · {aliado.producto_principal.presentacion}
              </span>
            )}
          </div>
        </div>
        <Link
          href="/crm/aliados"
          className="text-xs text-[#C0D1C6] hover:text-white border border-[#6E3F22]/40 px-3 py-1.5 rounded transition-colors shrink-0"
        >
          ← Volver
        </Link>
      </div>

      {/* Próximo paso destacado */}
      {proximoPaso && (
        <div className="mb-6 flex items-start gap-3 bg-[#FDC829]/10 border border-[#FDC829]/30 rounded-lg px-4 py-3">
          <span className="text-lg mt-0.5">→</span>
          <div>
            <div className="text-[10px] font-bold text-[#FDC829] uppercase tracking-wider mb-0.5">Próximo paso</div>
            <p className="text-sm text-[#FDC829]">{proximoPaso}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Columna izquierda: editar datos */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg p-5">
            <h2 className="font-bebas text-lg tracking-widest text-[#F5F5DC] mb-4">DATOS DEL ALIADO</h2>
            <AliadoForm aliado={aliado as never} stages={stages ?? []} productos={productos ?? []} />
          </div>

          {/* Stats rápidos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg p-4">
              <div className="text-[10px] font-bold text-[#6E3F22] uppercase tracking-wider mb-1">Interacciones</div>
              <div className="text-2xl font-bold text-[#6FB04A]">{interacciones?.length ?? 0}</div>
            </div>
            <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg p-4">
              <div className="text-[10px] font-bold text-[#6E3F22] uppercase tracking-wider mb-1">Última actividad</div>
              <div className="text-sm font-semibold text-[#C0D1C6]">
                {ultimaInteraccion
                  ? new Date(ultimaInteraccion.fecha).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })
                  : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha: contactos + interacciones */}
        <div className="xl:col-span-3 space-y-5">
          <ContactosPanel aliadoId={id} contactos={contactos ?? []} />
          <InteraccionesPanel aliadoId={id} interacciones={interacciones ?? []} />
        </div>
      </div>
    </div>
  )
}
