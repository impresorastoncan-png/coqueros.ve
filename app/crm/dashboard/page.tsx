import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/crm/login')

  const [
    { count: totalAliados },
    { count: conNevera },
    { data: porStage },
    { data: ultimasInteracciones },
  ] = await Promise.all([
    supabase.from('aliados').select('*', { count: 'exact', head: true }).eq('activo', true),
    supabase.from('aliados').select('*', { count: 'exact', head: true }).eq('tiene_nevera', true).eq('activo', true),
    supabase.from('aliados').select('pipeline_stage_id, pipeline_stages(nombre, color)').eq('activo', true),
    supabase.from('interacciones').select('*, aliados(nombre)').order('fecha', { ascending: false }).limit(5),
  ])

  // Contar por stage
  const stageCounts: Record<string, { nombre: string; color: string | null; count: number }> = {}
  ;(porStage ?? []).forEach(a => {
    const ps = (Array.isArray(a.pipeline_stages) ? a.pipeline_stages[0] : a.pipeline_stages) as { nombre: string; color: string | null } | null
    if (!ps || !a.pipeline_stage_id) return
    if (!stageCounts[a.pipeline_stage_id]) stageCounts[a.pipeline_stage_id] = { ...ps, count: 0 }
    stageCounts[a.pipeline_stage_id].count++
  })

  const stageList = Object.values(stageCounts).sort((a, b) => b.count - a.count).slice(0, 5)

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-bebas text-3xl tracking-widest text-[#F5F5DC]">DASHBOARD</h1>
        <p className="text-[#C0D1C6] text-sm mt-0.5">Resumen de la operación comercial de Coqueros.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Aliados activos',   value: totalAliados ?? 0, icon: '🤝', color: '#6FB04A', href: '/crm/aliados' },
          { label: 'Neveras colocadas', value: conNevera ?? 0,   icon: '❄️', color: '#006994', href: '/crm/aliados?nevera=true' },
          { label: 'En pipeline',       value: totalAliados ?? 0, icon: '📋', color: '#FDC829', href: '/crm/pipeline' },
          { label: 'Interacciones hoy', value: (ultimasInteracciones ?? []).filter(i => new Date(i.fecha).toDateString() === new Date().toDateString()).length, icon: '🗺️', color: '#C0D1C6', href: '/crm/aliados' },
        ].map(card => (
          <Link key={card.label} href={card.href} className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg p-5 hover:border-[#6E3F22]/60 transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#C0D1C6] uppercase tracking-wider group-hover:text-white transition-colors">{card.label}</span>
              <span className="text-xl">{card.icon}</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: card.color }}>{card.value}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por etapa */}
        <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bebas text-lg tracking-widest text-[#F5F5DC]">POR ETAPA</h2>
            <Link href="/crm/pipeline" className="text-xs text-[#6FB04A] hover:underline">Ver kanban →</Link>
          </div>
          {stageList.length === 0 && <p className="text-[#6E3F22] text-sm italic">Sin datos aún.</p>}
          <div className="space-y-3">
            {stageList.map(s => (
              <div key={s.nombre} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color ?? '#6FB04A' }} />
                <span className="text-sm text-[#C0D1C6] flex-1">{s.nombre}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 rounded-full" style={{ width: `${Math.max(8, (s.count / (totalAliados || 1)) * 80)}px`, backgroundColor: s.color ?? '#6FB04A', opacity: 0.7 }} />
                  <span className="text-sm font-bold" style={{ color: s.color ?? '#6FB04A' }}>{s.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Últimas interacciones */}
        <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bebas text-lg tracking-widest text-[#F5F5DC]">ÚLTIMA ACTIVIDAD</h2>
            <Link href="/crm/aliados" className="text-xs text-[#6FB04A] hover:underline">Ver aliados →</Link>
          </div>
          {(ultimasInteracciones ?? []).length === 0 && <p className="text-[#6E3F22] text-sm italic">Sin interacciones registradas.</p>}
          <div className="space-y-3">
            {(ultimasInteracciones ?? []).map(i => {
              const aliado = i.aliados as { nombre: string } | null
              return (
                <div key={i.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1a1007] border border-[#6E3F22]/40 flex items-center justify-center text-sm shrink-0">
                    {i.tipo === 'visita' ? '🚶' : i.tipo === 'llamada' ? '📞' : i.tipo === 'whatsapp' ? '💬' : i.tipo === 'email' ? '✉️' : i.tipo === 'degustación' ? '🥤' : '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#F5F5DC] truncate">{aliado?.nombre ?? '—'}</div>
                    <div className="text-xs text-[#C0D1C6] capitalize">{i.tipo} · {new Date(i.fecha).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}</div>
                    {i.proximo_paso && <div className="text-xs text-[#FDC829] mt-0.5 truncate">→ {i.proximo_paso}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
