import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProductoForm from '@/components/crm/producto-form'

export const dynamic = 'force-dynamic'

export default async function NuevoProductoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/crm/login')

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="font-bebas text-3xl tracking-widest text-[#F5F5DC]">NUEVO PRODUCTO</h1>
        <p className="text-[#C0D1C6] text-sm mt-0.5">Agrega un SKU al catálogo. Podrás añadir receta y bitácora después.</p>
      </div>
      <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg p-5">
        <ProductoForm />
      </div>
    </div>
  )
}
