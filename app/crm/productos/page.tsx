import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ProductosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/crm/login')

  const { data: productos } = await supabase
    .from('productos')
    .select('*')
    .order('nombre')
    .order('presentacion')

  const grupos = new Map<string, typeof productos>()
  ;(productos ?? []).forEach(p => {
    const g = grupos.get(p.nombre) ?? []
    g.push(p)
    grupos.set(p.nombre, g)
  })

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-bebas text-3xl tracking-widest text-[#F5F5DC]">PRODUCTOS</h1>
          <p className="text-[#C0D1C6] text-sm mt-0.5">Catálogo, precios, recetas y bitácora de producción.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/crm/productos/ingredientes"
            className="text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded border border-[#6E3F22]/60 text-[#C0D1C6] hover:bg-white/5 transition-colors"
          >
            Ingredientes
          </Link>
          <Link
            href="/crm/productos/proveedores"
            className="text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded border border-[#6E3F22]/60 text-[#C0D1C6] hover:bg-white/5 transition-colors"
          >
            Proveedores
          </Link>
          <Link
            href="/crm/productos/nuevo"
            className="bg-[#6FB04A] hover:bg-[#5d9a3d] text-white text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded transition-colors"
          >
            + Nuevo producto
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {[...grupos.entries()].map(([nombre, items]) => (
          <div key={nombre} className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-[#6E3F22]/40 flex items-center gap-3">
              <span className="text-lg">
                {nombre.includes('Agua') ? '💧' : nombre.includes('Leche') ? '🥛' : '🥥'}
              </span>
              <h2 className="font-bebas text-xl tracking-widest text-[#F5F5DC]">{nombre.toUpperCase()}</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#6E3F22]/40 bg-[#1a1007]/50">
                  <th className="text-left px-4 py-2 text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest">Presentación</th>
                  <th className="text-right px-4 py-2 text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest">Costo</th>
                  <th className="text-right px-4 py-2 text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest">P. Aliado</th>
                  <th className="text-right px-4 py-2 text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest">P. Mayor</th>
                  <th className="text-right px-4 py-2 text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest">P. Final</th>
                  <th className="text-right px-4 py-2 text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest">Ganancia</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {(items ?? []).map(p => (
                  <tr key={p.id} className="border-b border-[#6E3F22]/20 hover:bg-[#6FB04A]/5 transition-colors group">
                    <td className="px-4 py-2.5 font-semibold text-[#F5F5DC]">{p.presentacion}</td>
                    <td className="px-4 py-2.5 text-right text-[#C0D1C6]">{fmt(p.costo)}</td>
                    <td className="px-4 py-2.5 text-right text-[#C0D1C6]">{fmt(p.precio_aliado)}</td>
                    <td className="px-4 py-2.5 text-right text-[#C0D1C6]">{fmt(p.precio_mayor)}</td>
                    <td className="px-4 py-2.5 text-right text-[#FDC829] font-semibold">{fmt(p.precio_final)}</td>
                    <td className="px-4 py-2.5 text-right text-[#6FB04A] font-semibold">{fmt(p.ganancia)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/crm/productos/${p.id}`} className="text-xs text-[#6FB04A] hover:underline">
                        Ficha →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  )
}

function fmt(n: number | null) {
  if (n == null) return <span className="text-[#6E3F22]">—</span>
  return `$${n.toFixed(2)}`
}
