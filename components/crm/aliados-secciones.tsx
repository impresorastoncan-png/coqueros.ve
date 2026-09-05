'use client'

import { useState } from 'react'
import Link from 'next/link'
import { StageBadge, TipoBadge } from './badge'
import type { Aliado } from '@/lib/types'

export interface GrupoProducto {
  key: string
  productoId: string | null
  nombre: string
  aliados: Aliado[]
}

interface Props {
  activos: GrupoProducto[]
  potenciales: GrupoProducto[]
}

export default function AliadosSecciones({ activos, potenciales }: Props) {
  const totalActivos = activos.reduce((s, g) => s + g.aliados.length, 0)
  const totalPotenc  = potenciales.reduce((s, g) => s + g.aliados.length, 0)

  return (
    <div className="space-y-8">
      <Seccion
        titulo="Activos"
        icono="✅"
        total={totalActivos}
        grupos={activos}
        badgeColor="#6FB04A"
        vacio="No hay aliados en etapa Activo o Nevera colocada con los filtros aplicados."
        mostrarStage={false}
      />
      <Seccion
        titulo="Potenciales"
        icono="🌱"
        total={totalPotenc}
        grupos={potenciales}
        badgeColor="#FDC829"
        vacio="No hay aliados potenciales con los filtros aplicados."
        mostrarStage
      />
    </div>
  )
}

function Seccion({
  titulo, icono, total, grupos, badgeColor, vacio, mostrarStage,
}: {
  titulo: string
  icono: string
  total: number
  grupos: GrupoProducto[]
  badgeColor: string
  vacio: string
  mostrarStage: boolean
}) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-3">
        <h2 className="font-bebas text-xl tracking-widest text-[#F5F5DC]">
          {icono} {titulo.toUpperCase()}
        </h2>
        <span
          className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
          style={{ color: badgeColor, borderColor: `${badgeColor}55`, borderWidth: 1, backgroundColor: `${badgeColor}15` }}
        >
          {total} {total === 1 ? 'aliado' : 'aliados'}
        </span>
      </div>

      {grupos.length === 0 ? (
        <div className="bg-[#2a1a0e] border border-dashed border-[#6E3F22]/40 rounded-lg p-6 text-center text-[#6E3F22] text-sm">
          {vacio}
        </div>
      ) : (
        <div className="space-y-3">
          {grupos.map(g => (
            <GrupoCard key={g.key} grupo={g} mostrarStage={mostrarStage} defaultOpen={g.aliados.length <= 10} />
          ))}
        </div>
      )}
    </section>
  )
}

function GrupoCard({
  grupo, mostrarStage, defaultOpen,
}: {
  grupo: GrupoProducto
  mostrarStage: boolean
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const sinDefinir = grupo.productoId === null

  return (
    <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#6FB04A]/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{sinDefinir ? '⚪' : '🥥'}</span>
          <div className="text-left">
            <div className={`text-sm font-semibold ${sinDefinir ? 'text-[#6E3F22]' : 'text-[#F5F5DC]'}`}>
              {grupo.nombre}
            </div>
            <div className="text-[11px] text-[#6E3F22] mt-0.5">
              {grupo.aliados.length} {grupo.aliados.length === 1 ? 'aliado' : 'aliados'}
            </div>
          </div>
        </div>
        <span className="text-[#6E3F22] text-lg leading-none">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="border-t border-[#6E3F22]/40 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#1a1007]">
              <tr>
                <th className="text-left px-4 py-2 text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest">Nombre</th>
                <th className="text-left px-4 py-2 text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest">Tipo</th>
                <th className="text-left px-4 py-2 text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest">Zona</th>
                {mostrarStage && (
                  <th className="text-left px-4 py-2 text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest">Etapa</th>
                )}
                <th className="text-center px-4 py-2 text-[10px] font-bold text-[#6E3F22] uppercase tracking-widest">Nevera</th>
              </tr>
            </thead>
            <tbody>
              {grupo.aliados.map(a => (
                <tr key={a.id} className="border-t border-[#6E3F22]/20 hover:bg-[#6FB04A]/5 transition-colors group">
                  <td className="px-4 py-2.5">
                    <Link href={`/crm/aliados/${a.id}`} className="font-semibold text-[#F5F5DC] group-hover:text-[#6FB04A] transition-colors">
                      {a.nombre}
                    </Link>
                    {a.direccion && <div className="text-xs text-[#6E3F22] mt-0.5 truncate max-w-[240px]">{a.direccion}</div>}
                  </td>
                  <td className="px-4 py-2.5"><TipoBadge tipo={a.tipo} /></td>
                  <td className="px-4 py-2.5 text-[#C0D1C6]">{a.zona ?? '—'}</td>
                  {mostrarStage && (
                    <td className="px-4 py-2.5">
                      {a.pipeline_stage
                        ? <StageBadge nombre={a.pipeline_stage.nombre} color={a.pipeline_stage.color} />
                        : <span className="text-[#6E3F22]">—</span>}
                    </td>
                  )}
                  <td className="px-4 py-2.5 text-center">{a.tiene_nevera ? '❄️' : <span className="text-[#6E3F22]">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
