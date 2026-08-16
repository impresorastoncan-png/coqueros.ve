import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CajaCliente from '@/components/crm/caja-cliente'

export const dynamic = 'force-dynamic'

export default async function CajaPage({
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
  const mes  = params.mes  ? parseInt(params.mes,  10) : now.getMonth() + 1

  const inicioMes = `${anio}-${String(mes).padStart(2, '0')}-01`
  const finMes    = nextMonthISO(anio, mes)

  const [{ data: movimientosMes }, { data: totales }] = await Promise.all([
    supabase
      .from('caja_movimientos')
      .select('*')
      .gte('fecha', inicioMes)
      .lt('fecha', finMes)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false }),
    // Saldo global histórico (todos los movimientos)
    supabase
      .from('caja_movimientos')
      .select('tipo, monto'),
  ])

  const saldoTotal = (totales ?? []).reduce((s, m) => {
    const monto = Number(m.monto ?? 0)
    return s + (m.tipo === 'ingreso' ? monto : -monto)
  }, 0)

  const ingresosMes = (movimientosMes ?? [])
    .filter(m => m.tipo === 'ingreso')
    .reduce((s, m) => s + Number(m.monto ?? 0), 0)
  const egresosMes = (movimientosMes ?? [])
    .filter(m => m.tipo === 'egreso')
    .reduce((s, m) => s + Number(m.monto ?? 0), 0)
  const netoMes = ingresosMes - egresosMes

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <CajaCliente
        anio={anio}
        mes={mes}
        movimientos={(movimientosMes ?? []) as never}
        saldoTotal={saldoTotal}
        ingresosMes={ingresosMes}
        egresosMes={egresosMes}
        netoMes={netoMes}
      />
    </div>
  )
}

function nextMonthISO(anio: number, mes: number) {
  const y = mes === 12 ? anio + 1 : anio
  const m = mes === 12 ? 1 : mes + 1
  return `${y}-${String(m).padStart(2, '0')}-01`
}
