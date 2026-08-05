import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VentasCalendario from '@/components/crm/ventas-calendario'

export const dynamic = 'force-dynamic'

export default async function VentasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; anio?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/crm/login')

  const params = await searchParams
  const now = new Date()
  const anio = params.anio ? parseInt(params.anio, 10) : now.getFullYear()
  const mes  = params.mes  ? parseInt(params.mes,  10) : now.getMonth() + 1  // 1-12

  const inicioMes = `${anio}-${String(mes).padStart(2, '0')}-01`
  const finMes    = nextMonthISO(anio, mes)

  const [{ data: ventas }, { data: productos }, { data: aliados }] = await Promise.all([
    supabase
      .from('ventas')
      .select('*, aliado:aliados(id, nombre), items:venta_items(*, producto:productos(id, nombre, presentacion))')
      .gte('fecha', inicioMes)
      .lt('fecha', finMes)
      .order('fecha'),
    supabase.from('productos').select('*').eq('activo', true).order('nombre'),
    supabase.from('aliados').select('id, nombre').eq('activo', true).order('nombre'),
  ])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <VentasCalendario
        anio={anio}
        mes={mes}
        ventas={(ventas ?? []) as never}
        productos={productos ?? []}
        aliados={aliados ?? []}
      />
    </div>
  )
}

function nextMonthISO(anio: number, mes: number) {
  const y = mes === 12 ? anio + 1 : anio
  const m = mes === 12 ? 1 : mes + 1
  return `${y}-${String(m).padStart(2, '0')}-01`
}
