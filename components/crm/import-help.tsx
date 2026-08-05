'use client'

import { useState } from 'react'

export default function ImportHelp() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        title="Ver formato de importación"
        className={`flex items-center justify-center w-8 h-8 rounded border text-xs font-bold transition-colors ${open ? 'bg-[#FDC829]/20 border-[#FDC829]/60 text-[#FDC829]' : 'border-[#6E3F22]/60 text-[#6E3F22] hover:border-[#C0D1C6]/60 hover:text-[#C0D1C6]'}`}
      >
        ?
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-[420px] bg-[#1a1007] border border-[#FDC829]/30 rounded-lg shadow-2xl shadow-black/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bebas tracking-widest text-[#FDC829] text-base">FORMATO DE IMPORTACIÓN EXCEL</h3>
            <button onClick={() => setOpen(false)} className="text-[#6E3F22] hover:text-[#C0D1C6] text-sm transition-colors">✕</button>
          </div>

          {/* Columnas */}
          <div className="mb-4">
            <p className="text-[10px] font-bold text-[#C0D1C6] uppercase tracking-widest mb-2">Columnas reconocidas</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#6E3F22]/30">
                  <th className="text-left text-[#6E3F22] font-semibold pb-1.5 pr-3">Columna</th>
                  <th className="text-left text-[#6E3F22] font-semibold pb-1.5 pr-3">Obligatoria</th>
                  <th className="text-left text-[#6E3F22] font-semibold pb-1.5">Valores aceptados</th>
                </tr>
              </thead>
              <tbody className="space-y-1">
                {[
                  { col: 'Nombre',    req: true,  vals: 'Texto libre' },
                  { col: 'Tipo',      req: false, vals: 'cafetería · restaurante · gimnasio · pilates-yoga · market · otro' },
                  { col: 'Zona',      req: false, vals: 'Chacao · Altamira · La Castellana · Los Palos Grandes · Las Mercedes · Otra' },
                  { col: 'Dirección', req: false, vals: 'Texto libre' },
                  { col: 'Nevera',    req: false, vals: 'Sí / No' },
                  { col: 'Notas',     req: false, vals: 'Texto libre' },
                ].map(row => (
                  <tr key={row.col} className="border-b border-[#6E3F22]/10">
                    <td className="py-2 pr-3 font-semibold text-[#F5F5DC]">{row.col}</td>
                    <td className="py-2 pr-3">
                      {row.req
                        ? <span className="text-[#6FB04A] font-bold">Sí</span>
                        : <span className="text-[#6E3F22]">No</span>}
                    </td>
                    <td className="py-2 text-[#C0D1C6] leading-relaxed">{row.vals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notas */}
          <div className="space-y-2 border-t border-[#6E3F22]/30 pt-4">
            <p className="text-[10px] font-bold text-[#C0D1C6] uppercase tracking-widest mb-2">Notas importantes</p>
            {[
              'El orden de las columnas no importa.',
              'Las columnas extra son ignoradas.',
              'Si Tipo no coincide con los valores válidos, se guarda como "otro".',
              'Los aliados importados quedan en etapa "Prospecto" por defecto.',
              'Se muestra una vista previa antes de confirmar la importación.',
              'Formatos soportados: .xlsx · .xls · .csv',
            ].map(note => (
              <div key={note} className="flex items-start gap-2">
                <span className="text-[#6FB04A] mt-0.5 shrink-0">·</span>
                <span className="text-xs text-[#C0D1C6] leading-relaxed">{note}</span>
              </div>
            ))}
          </div>

          {/* Ejemplo */}
          <div className="mt-4 border-t border-[#6E3F22]/30 pt-4">
            <p className="text-[10px] font-bold text-[#C0D1C6] uppercase tracking-widest mb-2">Ejemplo de fila</p>
            <div className="bg-[#2a1a0e] rounded px-3 py-2 font-mono text-[10px] text-[#6FB04A] overflow-x-auto whitespace-nowrap">
              Nombre | Tipo | Zona | Dirección | Nevera | Notas<br />
              Café Altamira | cafetería | Altamira | Av. Luis Roche | Sí | Pedir por Juan
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
