'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Producto } from '@/lib/types'
import { createProducto, updateProducto } from '@/lib/actions/productos'

export default function ProductoForm({ producto }: { producto?: Producto }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        if (producto) {
          await updateProducto(producto.id, fd)
        } else {
          const id = await createProducto(fd)
          router.push(`/crm/productos/${id}`)
          return
        }
        router.refresh()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nombre" name="nombre" defaultValue={producto?.nombre} required />
        <Field label="Presentación" name="presentacion" defaultValue={producto?.presentacion} required />
      </div>

      <Field
        label="Descripción"
        name="descripcion"
        defaultValue={producto?.descripcion ?? ''}
        textarea
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Field label="Costo ($)" name="costo" type="number" step="0.01" defaultValue={producto?.costo ?? ''} />
        <Field label="P. Aliado" name="precio_aliado" type="number" step="0.01" defaultValue={producto?.precio_aliado ?? ''} />
        <Field label="P. Mayor" name="precio_mayor" type="number" step="0.01" defaultValue={producto?.precio_mayor ?? ''} />
        <Field label="P. Detal" name="precio_detal" type="number" step="0.01" defaultValue={producto?.precio_detal ?? ''} />
        <Field label="P. Final" name="precio_final" type="number" step="0.01" defaultValue={producto?.precio_final ?? ''} />
        <Field label="Ganancia" name="ganancia" type="number" step="0.01" defaultValue={producto?.ganancia ?? ''} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Unidad de medida" name="unidad_medida" defaultValue={producto?.unidad_medida ?? ''} />
        <label className="flex items-center gap-2 mt-6">
          <input type="checkbox" name="activo" defaultChecked={producto?.activo ?? true} className="rounded" />
          <span className="text-sm text-[#C0D1C6]">Producto activo</span>
        </label>
      </div>

      {error && <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded px-3 py-2">{error}</p>}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-[#6FB04A] hover:bg-[#5d9a3d] disabled:opacity-60 text-white text-sm font-semibold uppercase tracking-wider px-5 py-2.5 rounded transition-colors"
        >
          {pending ? 'Guardando...' : producto ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </div>
    </form>
  )
}

function Field({
  label, name, type = 'text', step, defaultValue, required, textarea,
}: {
  label: string; name: string; type?: string; step?: string;
  defaultValue?: string | number | null; required?: boolean; textarea?: boolean;
}) {
  const cls = 'w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded-md px-3 py-2 text-[#F5F5DC] text-sm placeholder-[#6E3F22] focus:outline-none focus:border-[#6FB04A] transition-colors'
  return (
    <label className="block">
      <span className="block text-[10px] font-bold text-[#6E3F22] uppercase tracking-wider mb-1">{label}</span>
      {textarea
        ? <textarea name={name} defaultValue={defaultValue ?? ''} rows={3} required={required} className={cls} />
        : <input type={type} step={step} name={name} defaultValue={defaultValue ?? ''} required={required} className={cls} />}
    </label>
  )
}
