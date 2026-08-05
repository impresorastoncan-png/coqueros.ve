'use client'

import { useRef, useTransition } from 'react'
import * as XLSX from 'xlsx'
import type { Aliado } from '@/lib/types'

const ZONAS_MAP: Record<string, string> = {
  'chacao': 'Chacao', 'altamira': 'Altamira', 'la castellana': 'La Castellana',
  'los palos grandes': 'Los Palos Grandes', 'las mercedes': 'Las Mercedes',
}
const TIPOS_VALIDOS = ['cafetería', 'restaurante', 'gimnasio', 'pilates-yoga', 'market', 'otro']

function normalizar(val: unknown): string {
  return String(val ?? '').trim()
}

export function ExportButton({ aliados }: { aliados: Aliado[] }) {
  function handleExport() {
    const rows = aliados.map(a => ({
      'Nombre': a.nombre,
      'Tipo': a.tipo,
      'Zona': a.zona ?? '',
      'Dirección': a.direccion ?? '',
      'Etapa': a.pipeline_stage?.nombre ?? '',
      'Nevera': a.tiene_nevera ? 'Sí' : 'No',
      'Notas': a.notas ?? '',
      'Creado': new Date(a.created_at).toLocaleDateString('es-VE'),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Aliados')
    XLSX.writeFile(wb, `coqueros-aliados-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 text-xs font-semibold text-[#C0D1C6] border border-[#6E3F22]/60 hover:border-[#6FB04A]/60 hover:text-[#6FB04A] px-3 py-2 rounded transition-colors"
    >
      ⬇ Exportar Excel
    </button>
  )
}

export function ImportButton({ stages, onImport }: {
  stages: { id: string; nombre: string }[]
  onImport: (rows: object[]) => Promise<void>
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: '' })

      const defaultStageId = stages.find(s => s.nombre === 'Prospecto')?.id ?? stages[0]?.id ?? ''

      const parsed = raw.map(row => {
        const nombre = normalizar(row['Nombre'] ?? row['nombre'] ?? row['NOMBRE'])
        const tipoRaw = normalizar(row['Tipo'] ?? row['tipo'] ?? row['TIPO']).toLowerCase()
        const tipo = TIPOS_VALIDOS.includes(tipoRaw) ? tipoRaw : 'otro'
        const zonaRaw = normalizar(row['Zona'] ?? row['zona'] ?? row['ZONA']).toLowerCase()
        const zona = ZONAS_MAP[zonaRaw] ?? normalizar(row['Zona'] ?? row['zona'] ?? '')
        const direccion = normalizar(row['Dirección'] ?? row['Direccion'] ?? row['direccion'] ?? '')
        const notas = normalizar(row['Notas'] ?? row['notas'] ?? '')
        const neveraRaw = normalizar(row['Nevera'] ?? row['nevera'] ?? '').toLowerCase()
        const tiene_nevera = neveraRaw === 'sí' || neveraRaw === 'si' || neveraRaw === 'true' || neveraRaw === '1'
        const pipeline_stage_id = defaultStageId
        return { nombre, tipo, zona, direccion, notas, tiene_nevera, pipeline_stage_id }
      }).filter(r => r.nombre)

      if (parsed.length === 0) { alert('No se encontraron filas válidas. Asegúrate de tener columna "Nombre".'); return }

      const preview = parsed.slice(0, 3).map(r => r.nombre).join(', ')
      const ok = confirm(`Se importarán ${parsed.length} aliados.\nPrimeros: ${preview}\n\n¿Confirmar?`)
      if (!ok) return

      startTransition(() => onImport(parsed))
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  return (
    <>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={pending}
        className="flex items-center gap-2 text-xs font-semibold text-[#C0D1C6] border border-[#6E3F22]/60 hover:border-[#FDC829]/60 hover:text-[#FDC829] px-3 py-2 rounded transition-colors disabled:opacity-60"
      >
        {pending ? '⏳ Importando...' : '⬆ Importar Excel'}
      </button>
    </>
  )
}
