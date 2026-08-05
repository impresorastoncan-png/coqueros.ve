import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProveedoresTable from '@/components/crm/proveedores-table'

export const dynamic = 'force-dynamic'

export default async function ProveedoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/crm/login')

  const { data: proveedores } = await supabase.from('proveedores').select('*').order('nombre')

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-2 text-xs text-[#6E3F22] mb-5">
        <Link href="/crm/productos" className="hover:text-[#C0D1C6]">Productos</Link>
        <span>/</span>
        <span className="text-[#C0D1C6]">Proveedores</span>
      </div>

      <div className="mb-6">
        <h1 className="font-bebas text-3xl tracking-widest text-[#F5F5DC]">PROVEEDORES</h1>
        <p className="text-[#C0D1C6] text-sm mt-0.5">Contactos de proveedores de ingredientes e insumos.</p>
      </div>

      <ProveedoresTable proveedores={proveedores ?? []} />
    </div>
  )
}
