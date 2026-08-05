import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import IngredientesTable from '@/components/crm/ingredientes-table'

export const dynamic = 'force-dynamic'

export default async function IngredientesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/crm/login')

  const [{ data: ingredientes }, { data: proveedores }] = await Promise.all([
    supabase.from('ingredientes').select('*, proveedor:proveedores(id, nombre)').order('nombre'),
    supabase.from('proveedores').select('*').eq('activo', true).order('nombre'),
  ])

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-2 text-xs text-[#6E3F22] mb-5">
        <Link href="/crm/productos" className="hover:text-[#C0D1C6]">Productos</Link>
        <span>/</span>
        <span className="text-[#C0D1C6]">Ingredientes</span>
      </div>

      <div className="mb-6">
        <h1 className="font-bebas text-3xl tracking-widest text-[#F5F5DC]">INGREDIENTES E INSUMOS</h1>
        <p className="text-[#C0D1C6] text-sm mt-0.5">Materia prima, empaques, etiquetas y sus proveedores.</p>
      </div>

      <IngredientesTable ingredientes={ingredientes ?? []} proveedores={proveedores ?? []} />
    </div>
  )
}
