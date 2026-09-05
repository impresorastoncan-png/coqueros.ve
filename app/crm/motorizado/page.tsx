import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MotorizadoCliente from '@/components/crm/motorizado-cliente'
import type { RutaMotorizado } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function MotorizadoPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string; mes?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/crm/login')

  const sp = await searchParams
  const hoy = new Date()
  const anio = sp.anio ? parseInt(sp.anio) : hoy.getFullYear()
  const mes = sp.mes ? parseInt(sp.mes) : hoy.getMonth() + 1

  const desde = `${anio}-${String(mes).padStart(2, '0')}-01`
  const hasta = new Date(anio, mes, 1).toISOString().slice(0, 10)

  const { data: rutas } = await supabase
    .from('rutas_motorizado')
    .select('*')
    .gte('fecha', desde)
    .lt('fecha', hasta)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })

  const lista = (rutas ?? []) as RutaMotorizado[]

  const totalKm      = lista.reduce((s, r) => s + Number(r.km), 0)
  const totalCosto   = lista.reduce((s, r) => s + Number(r.costo), 0)
  const totalPagado  = lista.filter(r => r.estado === 'pagada').reduce((s, r) => s + Number(r.costo), 0)
  const totalPendiente = totalCosto - totalPagado

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <MotorizadoCliente
        anio={anio}
        mes={mes}
        rutas={lista}
        totales={{ km: totalKm, costo: totalCosto, pagado: totalPagado, pendiente: totalPendiente }}
      />
    </div>
  )
}
