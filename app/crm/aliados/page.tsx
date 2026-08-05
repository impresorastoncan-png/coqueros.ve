import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { StageBadge, TipoBadge } from '@/components/crm/badge'
import { ExportButton } from '@/components/crm/excel-buttons'
import ImportWrapper from './import-wrapper'
import ImportHelp from '@/components/crm/import-help'

export const dynamic = 'force-dynamic'

export default async function AliadosPage({
  searchParams,
}: {
  searchParams: Promise<{ zona?: string; tipo?: string; stage?: string; q?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/crm/login')

  const params = await searchParams
  const { zona, tipo, stage, q } = params

  let query = supabase
    .from('aliados')
    .select('*, pipeline_stage:pipeline_stages(id, nombre, color)')
    .eq('activo', true)
    .order('created_at', { ascending: false })

  if (zona) query = query.eq('zona', zona)
  if (tipo) query = query.eq('tipo', tipo)
  if (stage) query = query.eq('pipeline_stage_id', stage)
  if (q) query = query.ilike('nombre', `%${q}%`)

  const [{ data: aliados }, { data: stages }] = await Promise.all([
    query,
    supabase.from('pipeline_stages').select('*').order('orden'),
  ])

  const zonas = ['Chacao', 'Altamira', 'La Castellana', 'Los Palos Grandes', 'Las Mercedes', 'Otra']
  const tipos = ['cafetería', 'restaurante', 'gimnasio', 'pilates-yoga', 'market', 'otro']

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-bebas text-3xl tracking-widest text-[#F5F5DC]">ALIADOS</h1>
          <p className="text-[#C0D1C6] text-sm mt-0.5">{aliados?.length ?? 0} aliados encontrados</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <ImportWrapper stages={stages ?? []} />
            <ImportHelp />
          </div>
          <ExportButton aliados={(aliados ?? []) as never} />
          <Link
            href="/crm/aliados/nuevo"
            className="flex items-center gap-2 bg-[#6FB04A] hover:bg-[#5d9a3d] text-white text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded transition-colors"
          >
            + Nuevo aliado
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap gap-3 mb-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre..."
          className="bg-[#2a1a0e] border border-[#6E3F22]/60 rounded-md px-3 py-2 text-[#F5F5DC] text-sm placeholder-[#6E3F22] focus:outline-none focus:border-[#6FB04A] w-48 transition-colors"
        />
        <select name="zona" defaultValue={zona ?? ''} className="bg-[#2a1a0e] border border-[#6E3F22]/60 rounded-md px-3 py-2 text-[#F5F5DC] text-sm focus:outline-none focus:border-[#6FB04A] transition-colors">
          <option value="">Todas las zonas</option>
          {zonas.map(z => <option key={z} value={z}>{z}</option>)}
        </select>
        <select name="tipo" defaultValue={tipo ?? ''} className="bg-[#2a1a0e] border border-[#6E3F22]/60 rounded-md px-3 py-2 text-[#F5F5DC] text-sm focus:outline-none focus:border-[#6FB04A] transition-colors">
          <option value="">Todos los tipos</option>
          {tipos.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
        </select>
        <select name="stage" defaultValue={stage ?? ''} className="bg-[#2a1a0e] border border-[#6E3F22]/60 rounded-md px-3 py-2 text-[#F5F5DC] text-sm focus:outline-none focus:border-[#6FB04A] transition-colors">
          <option value="">Todas las etapas</option>
          {(stages ?? []).map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
        <button type="submit" className="bg-[#6FB04A]/20 hover:bg-[#6FB04A]/30 text-[#6FB04A] border border-[#6FB04A]/30 text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded transition-colors">
          Filtrar
        </button>
        {(zona || tipo || stage || q) && (
          <Link href="/crm/aliados" className="text-[#6E3F22] hover:text-[#C0D1C6] text-xs py-2 transition-colors">
            Limpiar
          </Link>
        )}
      </form>

      {/* Tabla */}
      <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#6E3F22]/40">
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest">Nombre</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest">Tipo</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest">Zona</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest">Etapa</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest">Nevera</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest">Creado</th>
              </tr>
            </thead>
            <tbody>
              {(aliados ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[#6E3F22] italic text-sm">
                    No hay aliados registrados.{' '}
                    <Link href="/crm/aliados/nuevo" className="text-[#6FB04A] hover:underline">Crear el primero</Link>
                  </td>
                </tr>
              )}
              {(aliados ?? []).map(aliado => (
                <tr key={aliado.id} className="border-b border-[#6E3F22]/20 hover:bg-[#6FB04A]/5 transition-colors group">
                  <td className="px-4 py-3">
                    <Link href={`/crm/aliados/${aliado.id}`} className="font-semibold text-[#F5F5DC] group-hover:text-[#6FB04A] transition-colors">
                      {aliado.nombre}
                    </Link>
                    {aliado.direccion && <div className="text-xs text-[#6E3F22] mt-0.5 truncate max-w-[200px]">{aliado.direccion}</div>}
                  </td>
                  <td className="px-4 py-3"><TipoBadge tipo={aliado.tipo} /></td>
                  <td className="px-4 py-3 text-[#C0D1C6]">{aliado.zona ?? '—'}</td>
                  <td className="px-4 py-3">
                    {aliado.pipeline_stage
                      ? <StageBadge nombre={aliado.pipeline_stage.nombre} color={aliado.pipeline_stage.color} />
                      : <span className="text-[#6E3F22]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">{aliado.tiene_nevera ? '❄️' : <span className="text-[#6E3F22]">—</span>}</td>
                  <td className="px-4 py-3 text-[#6E3F22] text-xs">{new Date(aliado.created_at).toLocaleDateString('es-VE')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
