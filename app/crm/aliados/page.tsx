import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ExportButton } from '@/components/crm/excel-buttons'
import ImportWrapper from './import-wrapper'
import ImportHelp from '@/components/crm/import-help'
import AliadosSecciones, { type GrupoProducto } from '@/components/crm/aliados-secciones'
import type { Aliado, Producto } from '@/lib/types'

export const dynamic = 'force-dynamic'

const STAGES_ACTIVAS = new Set(['Activo', 'Nevera colocada'])

export default async function AliadosPage({
  searchParams,
}: {
  searchParams: Promise<{ zona?: string; tipo?: string; q?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/crm/login')

  const params = await searchParams
  const { zona, tipo, q } = params

  let query = supabase
    .from('aliados')
    .select(`
      *,
      pipeline_stage:pipeline_stages(id, nombre, color),
      producto_principal:productos!producto_principal_id(id, nombre, presentacion),
      producto_interes:productos!producto_interes_id(id, nombre, presentacion)
    `)
    .eq('activo', true)
    .order('created_at', { ascending: false })

  if (zona) query = query.eq('zona', zona)
  if (tipo) query = query.eq('tipo', tipo)
  if (q) query = query.ilike('nombre', `%${q}%`)

  const [{ data: aliadosData }, { data: stages }] = await Promise.all([
    query,
    supabase.from('pipeline_stages').select('*').order('orden'),
  ])

  const aliados = (aliadosData ?? []) as Aliado[]
  const zonas = ['Chacao', 'Altamira', 'La Castellana', 'Los Palos Grandes', 'Las Mercedes', 'Otra']
  const tipos = ['cafetería', 'restaurante', 'gimnasio', 'pilates-yoga', 'market', 'otro']

  const activos     = aliados.filter(a => a.pipeline_stage && STAGES_ACTIVAS.has(a.pipeline_stage.nombre))
  const potenciales = aliados.filter(a => !a.pipeline_stage || !STAGES_ACTIVAS.has(a.pipeline_stage.nombre))

  const gruposActivos     = agruparPorProducto(activos,     a => a.producto_principal ?? null)
  const gruposPotenciales = agruparPorProducto(potenciales, a => a.producto_interes   ?? null)

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-bebas text-3xl tracking-widest text-[#2a1a0e]">ALIADOS</h1>
          <p className="text-[#6E3F22] text-sm mt-0.5">
            {activos.length} activos · {potenciales.length} potenciales
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <ImportWrapper stages={stages ?? []} />
            <ImportHelp />
          </div>
          <ExportButton aliados={aliados as never} />
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
        <button type="submit" className="bg-[#6FB04A]/20 hover:bg-[#6FB04A]/30 text-[#6FB04A] border border-[#6FB04A]/30 text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded transition-colors">
          Filtrar
        </button>
        {(zona || tipo || q) && (
          <Link href="/crm/aliados" className="text-[#6E3F22] hover:text-[#C0D1C6] text-xs py-2 transition-colors">
            Limpiar
          </Link>
        )}
      </form>

      {aliados.length === 0 ? (
        <div className="bg-white/40 backdrop-blur-sm border border-dashed border-[#D4C9B0] rounded-2xl p-12 text-center text-[#a8815a]">
          No hay aliados con los filtros aplicados.{' '}
          <Link href="/crm/aliados/nuevo" className="text-[#6FB04A] hover:underline">Crear el primero</Link>
        </div>
      ) : (
        <AliadosSecciones activos={gruposActivos} potenciales={gruposPotenciales} />
      )}
    </div>
  )
}

function agruparPorProducto(
  aliados: Aliado[],
  getProducto: (a: Aliado) => Pick<Producto, 'id' | 'nombre' | 'presentacion'> | null,
): GrupoProducto[] {
  const map = new Map<string, GrupoProducto>()
  const SIN_DEF = '__sin_definir__'

  for (const a of aliados) {
    const p = getProducto(a)
    const key = p?.id ?? SIN_DEF
    if (!map.has(key)) {
      map.set(key, {
        key,
        productoId: p?.id ?? null,
        nombre: p ? `${p.nombre} · ${p.presentacion}` : 'Sin producto definido',
        aliados: [],
      })
    }
    map.get(key)!.aliados.push(a)
  }

  const grupos = [...map.values()]
  grupos.sort((a, b) => {
    if (a.key === SIN_DEF) return 1
    if (b.key === SIN_DEF) return -1
    return b.aliados.length - a.aliados.length
  })
  return grupos
}
