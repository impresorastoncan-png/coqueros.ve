import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InventarioCliente from '@/components/crm/inventario-cliente'

export const dynamic = 'force-dynamic'

export default async function InventarioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/crm/login')

  const [
    { data: ingredientes },
    { data: productoStock },
    { data: stockAliado },
    { data: aliados },
    { data: productos },
    { data: movimientos },
  ] = await Promise.all([
    supabase
      .from('ingredientes')
      .select('*, proveedor:proveedores(id, nombre)')
      .eq('activo', true)
      .order('nombre'),
    supabase
      .from('producto_stock')
      .select('*, producto:productos(id, nombre, presentacion, unidad_medida, costo)')
      .order('producto_id'),
    supabase
      .from('stock_aliado')
      .select('*, aliado:aliados(id, nombre, zona), producto:productos(id, nombre, presentacion, precio_final, precio_detal, precio_aliado, costo)')
      .gt('cantidad', 0)
      .order('aliado_id'),
    supabase
      .from('aliados')
      .select('id, nombre, zona, tiene_nevera')
      .eq('activo', true)
      .order('nombre'),
    supabase
      .from('productos')
      .select('id, nombre, presentacion, precio_final, precio_detal, precio_aliado, costo')
      .eq('activo', true)
      .order('nombre'),
    supabase
      .from('movimientos_stock')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(20),
  ])

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-bebas text-3xl tracking-widest text-[#F5F5DC]">INVENTARIO</h1>
        <p className="text-[#C0D1C6] text-sm mt-0.5">Materia prima, producto terminado y stock en aliados.</p>
      </div>

      <InventarioCliente
        ingredientes={(ingredientes ?? []) as never}
        productoStock={(productoStock ?? []) as never}
        stockAliado={(stockAliado ?? []) as never}
        aliados={(aliados ?? []) as never}
        productos={(productos ?? []) as never}
        movimientos={(movimientos ?? []) as never}
      />
    </div>
  )
}
