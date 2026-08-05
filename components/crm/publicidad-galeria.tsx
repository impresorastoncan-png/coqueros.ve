'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Publicidad } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { createPublicidad, deletePublicidad } from '@/lib/actions/publicidad'

type Asset = Publicidad & { public_url: string | null }

const TIPOS = [
  { v: 'flyer',   label: 'Flyer',       icon: '📄' },
  { v: 'post-ig', label: 'Post IG',     icon: '📸' },
  { v: 'post-wa', label: 'Post WA',     icon: '💬' },
  { v: 'story',   label: 'Story',       icon: '⚡' },
  { v: 'grafico', label: 'Gráfico',     icon: '🎨' },
  { v: 'video',   label: 'Video',       icon: '🎬' },
  { v: 'logo',    label: 'Logo',        icon: '🏷️' },
  { v: 'otro',    label: 'Otro',        icon: '📎' },
]

const PLATAFORMAS = [
  { v: 'instagram', label: 'Instagram' },
  { v: 'whatsapp',  label: 'WhatsApp' },
  { v: 'facebook',  label: 'Facebook' },
  { v: 'tiktok',    label: 'TikTok' },
  { v: 'impreso',   label: 'Impreso' },
  { v: 'email',     label: 'Email' },
  { v: 'web',       label: 'Web' },
  { v: 'otro',      label: 'Otro' },
]

interface Props {
  assets: Asset[]
  filtroTipo?: string
  filtroPlataforma?: string
  filtroQ?: string
}

export default function PublicidadGaleria({ assets, filtroTipo, filtroPlataforma, filtroQ }: Props) {
  const router = useRouter()
  const [showUpload, setShowUpload] = useState(false)
  const [preview, setPreview] = useState<Asset | null>(null)

  return (
    <>
      {/* Filtros + acción */}
      <form method="GET" className="flex flex-wrap gap-2 mb-4 items-end">
        <input
          name="q"
          defaultValue={filtroQ}
          placeholder="Buscar por título..."
          className="bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC] w-48"
        />
        <select name="tipo" defaultValue={filtroTipo ?? ''} className="bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]">
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t.v} value={t.v}>{t.icon} {t.label}</option>)}
        </select>
        <select name="plataforma" defaultValue={filtroPlataforma ?? ''} className="bg-[#2a1a0e] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]">
          <option value="">Todas las plataformas</option>
          {PLATAFORMAS.map(p => <option key={p.v} value={p.v}>{p.label}</option>)}
        </select>
        <button type="submit" className="bg-[#6FB04A]/20 hover:bg-[#6FB04A]/30 text-[#6FB04A] border border-[#6FB04A]/30 text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded">
          Filtrar
        </button>
        {(filtroTipo || filtroPlataforma || filtroQ) && (
          <Link href="/crm/publicidad" className="text-xs text-[#6E3F22] hover:text-[#C0D1C6] py-2">Limpiar</Link>
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="bg-[#6FB04A] hover:bg-[#5d9a3d] text-white text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded"
        >
          + Subir asset
        </button>
      </form>

      {assets.length === 0 ? (
        <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg p-12 text-center">
          <p className="text-[#6E3F22] italic">No hay publicidad guardada aún. Sube el primer flyer o gráfico.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {assets.map(a => (
            <button
              key={a.id}
              onClick={() => setPreview(a)}
              className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg overflow-hidden text-left hover:border-[#6FB04A]/60 transition-colors group"
            >
              <div className="aspect-square bg-[#1a1007] flex items-center justify-center overflow-hidden relative">
                {a.public_url && a.mime_type?.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.public_url} alt={a.titulo} className="w-full h-full object-cover" />
                ) : a.public_url && a.mime_type?.startsWith('video/') ? (
                  <div className="text-4xl">🎬</div>
                ) : a.public_url ? (
                  <div className="text-4xl">📄</div>
                ) : (
                  <div className="text-3xl text-[#6E3F22]">🔗</div>
                )}
                {a.tipo && (
                  <span className="absolute top-2 left-2 text-[9px] uppercase tracking-wider bg-black/60 backdrop-blur-sm text-[#F5F5DC] px-1.5 py-0.5 rounded">
                    {TIPOS.find(t => t.v === a.tipo)?.icon} {TIPOS.find(t => t.v === a.tipo)?.label}
                  </span>
                )}
              </div>
              <div className="p-3">
                <div className="text-sm font-semibold text-[#F5F5DC] truncate group-hover:text-[#6FB04A] transition-colors">{a.titulo}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-[#6E3F22] uppercase tracking-wider">{a.plataforma ?? '—'}</span>
                  <span className="text-[10px] text-[#6E3F22]">
                    {new Date(a.fecha_creacion).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSaved={() => { setShowUpload(false); router.refresh() }} />}
      {preview && <PreviewModal asset={preview} onClose={() => setPreview(null)} onDeleted={() => { setPreview(null); router.refresh() }} />}
    </>
  )
}

function UploadModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [urlExterna, setUrlExterna] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const fd = new FormData(e.currentTarget)
    const titulo = String(fd.get('titulo') ?? '').trim()
    if (!titulo) { setError('El título es requerido.'); return }
    if (!file && !urlExterna.trim()) { setError('Sube un archivo o pega una URL externa.'); return }

    startTransition(async () => {
      try {
        let storagePath: string | null = null
        let mimeType: string | null = null
        let tamano: number | null = null

        if (file) {
          const supabase = createClient()
          const ext = file.name.split('.').pop() ?? 'bin'
          const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
          const { error: uErr } = await supabase.storage.from('publicidad').upload(key, file, {
            cacheControl: '3600',
            contentType: file.type,
          })
          if (uErr) throw uErr
          storagePath = key
          mimeType    = file.type
          tamano      = file.size
        }

        const tags = String(fd.get('tags') ?? '').split(',').map(t => t.trim()).filter(Boolean)

        await createPublicidad({
          titulo,
          descripcion:    String(fd.get('descripcion') ?? '').trim() || null,
          tipo:           String(fd.get('tipo') ?? '') || null,
          plataforma:     String(fd.get('plataforma') ?? '') || null,
          storage_path:   storagePath,
          url_externa:    urlExterna.trim() || null,
          mime_type:      mimeType,
          tamano_bytes:   tamano,
          tags,
          fecha_creacion: String(fd.get('fecha_creacion') ?? '') || null,
          autor:          String(fd.get('autor') ?? '').trim() || null,
        })
        onSaved()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al subir')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#2a1a0e] border border-[#6E3F22]/60 rounded-lg w-full max-w-lg my-8 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#6E3F22]/40">
          <h2 className="font-bebas text-xl tracking-widest text-[#F5F5DC]">SUBIR ASSET</h2>
          <button onClick={onClose} className="text-[#C0D1C6] hover:text-white text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <Field label="Título" name="titulo" required />
          <Field label="Descripción" name="descripcion" textarea />

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-[10px] font-bold text-[#6E3F22] uppercase tracking-wider mb-1">Tipo</span>
              <select name="tipo" className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]">
                <option value="">—</option>
                {TIPOS.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-[10px] font-bold text-[#6E3F22] uppercase tracking-wider mb-1">Plataforma</span>
              <select name="plataforma" className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]">
                <option value="">—</option>
                {PLATAFORMAS.map(p => <option key={p.v} value={p.v}>{p.label}</option>)}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha" name="fecha_creacion" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            <Field label="Autor" name="autor" />
          </div>

          <Field label="Tags (separados por coma)" name="tags" placeholder="promo, nevera, febrero" />

          <div className="border-t border-[#6E3F22]/40 pt-3 space-y-2">
            <label className="block">
              <span className="block text-[10px] font-bold text-[#6E3F22] uppercase tracking-wider mb-1">Archivo</span>
              <input
                type="file"
                accept="image/*,video/*,application/pdf"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-xs text-[#C0D1C6] file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-[#6FB04A]/20 file:text-[#6FB04A] file:text-xs file:font-semibold file:uppercase"
              />
              <span className="block text-[10px] text-[#6E3F22] mt-1">Máx 50 MB · imagen, video mp4/mov, PDF</span>
            </label>

            <div className="text-center text-[10px] text-[#6E3F22] uppercase tracking-wider">o</div>

            <label className="block">
              <span className="block text-[10px] font-bold text-[#6E3F22] uppercase tracking-wider mb-1">URL externa</span>
              <input
                type="url"
                value={urlExterna}
                onChange={e => setUrlExterna(e.target.value)}
                placeholder="https://instagram.com/p/..."
                className="w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]"
              />
            </label>
          </div>

          {error && <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded px-3 py-2">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="text-sm text-[#C0D1C6] px-4 py-2 hover:text-white">Cancelar</button>
            <button type="submit" disabled={pending} className="bg-[#6FB04A] hover:bg-[#5d9a3d] disabled:opacity-60 text-white text-sm font-semibold uppercase tracking-wider px-5 py-2 rounded">
              {pending ? 'Subiendo...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PreviewModal({ asset, onClose, onDeleted }: { asset: Asset; onClose: () => void; onDeleted: () => void }) {
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`¿Eliminar "${asset.titulo}"? También se borra el archivo.`)) return
    startTransition(async () => {
      await deletePublicidad(asset.id, asset.storage_path)
      onDeleted()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#2a1a0e] border border-[#6E3F22]/60 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#6E3F22]/40">
          <div>
            <h2 className="font-bebas text-xl tracking-widest text-[#F5F5DC]">{asset.titulo.toUpperCase()}</h2>
            <div className="text-xs text-[#C0D1C6]">{new Date(asset.fecha_creacion).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
          </div>
          <button onClick={onClose} className="text-[#C0D1C6] hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-[#1a1007] rounded overflow-hidden flex items-center justify-center min-h-[200px]">
            {asset.public_url && asset.mime_type?.startsWith('image/') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={asset.public_url} alt={asset.titulo} className="max-w-full max-h-[60vh] object-contain" />
            ) : asset.public_url && asset.mime_type?.startsWith('video/') ? (
              <video src={asset.public_url} controls className="max-w-full max-h-[60vh]" />
            ) : asset.public_url ? (
              <a href={asset.public_url} target="_blank" rel="noopener" className="text-[#6FB04A] hover:underline p-8">Abrir archivo →</a>
            ) : asset.url_externa ? (
              <a href={asset.url_externa} target="_blank" rel="noopener" className="text-[#6FB04A] hover:underline p-8">{asset.url_externa}</a>
            ) : <span className="text-[#6E3F22] italic p-8">Sin archivo</span>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <Meta label="Tipo" value={asset.tipo} />
            <Meta label="Plataforma" value={asset.plataforma} />
            <Meta label="Autor" value={asset.autor} />
            {asset.tamano_bytes && <Meta label="Tamaño" value={`${(asset.tamano_bytes / 1024).toFixed(0)} KB`} />}
            {asset.mime_type && <Meta label="MIME" value={asset.mime_type} />}
          </div>

          {asset.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {asset.tags.map(t => (
                <span key={t} className="text-[10px] bg-[#6FB04A]/15 text-[#6FB04A] border border-[#6FB04A]/30 px-2 py-0.5 rounded">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {asset.descripcion && (
            <p className="text-sm text-[#C0D1C6] whitespace-pre-wrap">{asset.descripcion}</p>
          )}

          <div className="flex justify-between pt-3 border-t border-[#6E3F22]/40">
            {asset.public_url && (
              <a href={asset.public_url} download={asset.titulo} className="text-xs text-[#6FB04A] hover:underline">Descargar</a>
            )}
            <button
              onClick={handleDelete}
              disabled={pending}
              className="text-xs text-red-400 hover:text-red-300 disabled:opacity-60 ml-auto"
            >
              {pending ? 'Eliminando...' : 'Eliminar asset'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label, name, type = 'text', defaultValue, placeholder, required, textarea,
}: {
  label: string; name: string; type?: string; defaultValue?: string; placeholder?: string; required?: boolean; textarea?: boolean;
}) {
  const cls = 'w-full bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-2 text-sm text-[#F5F5DC]'
  return (
    <label className="block">
      <span className="block text-[10px] font-bold text-[#6E3F22] uppercase tracking-wider mb-1">{label}</span>
      {textarea
        ? <textarea name={name} defaultValue={defaultValue} rows={2} placeholder={placeholder} required={required} className={cls} />
        : <input type={type} name={name} defaultValue={defaultValue} placeholder={placeholder} required={required} className={cls} />}
    </label>
  )
}

function Meta({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div>
      <div className="text-[10px] font-bold text-[#6E3F22] uppercase tracking-wider">{label}</div>
      <div className="text-[#C0D1C6] capitalize">{value}</div>
    </div>
  )
}
