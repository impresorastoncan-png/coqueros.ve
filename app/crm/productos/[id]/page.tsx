import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import ProductoForm from '@/components/crm/producto-form'
import RecetaPanel from '@/components/crm/receta-panel'
import BitacoraPanel from '@/components/crm/bitacora-panel'

export const dynamic = 'force-dynamic'

export default async function ProductoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/crm/login')

  const [
    { data: producto },
    { data: receta },
    { data: notas },
    { data: ingredientes },
  ] = await Promise.all([
    supabase.from('productos').select('*').eq('id', id).single(),
    supabase
      .from('producto_ingredientes')
      .select('*, ingrediente:ingredientes(*)')
      .eq('producto_id', id)
      .order('created_at'),
    supabase.from('producto_notas').select('*').eq('producto_id', id).order('fecha', { ascending: false }),
    supabase.from('ingredientes').select('*').eq('activo', true).order('nombre'),
  ])

  if (!producto) notFound()

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-2 text-xs text-[#6E3F22] mb-5">
        <Link href="/crm/productos" className="hover:text-[#C0D1C6] transition-colors">Productos</Link>
        <span>/</span>
        <span className="text-[#C0D1C6]">{producto.nombre} · {producto.presentacion}</span>
      </div>

      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bebas text-3xl tracking-widest text-[#F5F5DC]">
            {producto.nombre.toUpperCase()} <span className="text-[#FDC829]">· {producto.presentacion}</span>
          </h1>
          {producto.descripcion && <p className="text-[#C0D1C6] text-sm mt-1 max-w-2xl">{producto.descripcion}</p>}
        </div>
        <Link href="/crm/productos" className="text-xs text-[#C0D1C6] hover:text-white border border-[#6E3F22]/40 px-3 py-1.5 rounded">
          ← Volver
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg p-5">
            <h2 className="font-bebas text-lg tracking-widest text-[#F5F5DC] mb-4">DATOS Y PRECIOS</h2>
            <ProductoForm producto={producto} />
          </div>
        </div>

        <div className="xl:col-span-3 space-y-6">
          <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg p-5">
            <RecetaPanel productoId={id} receta={receta ?? []} ingredientes={ingredientes ?? []} />
          </div>
          <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg p-5">
            <BitacoraPanel productoId={id} notas={notas ?? []} />
          </div>
        </div>
      </div>
    </div>
  )
}
