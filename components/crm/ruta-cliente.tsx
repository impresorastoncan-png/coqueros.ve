'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import VisitaPanel from './visita-panel'
import { TipoBadge, StageBadge } from './badge'
import type { Aliado } from '@/lib/types'

const RutaMapa = dynamic(() => import('./ruta-mapa'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-[#2a1a0e] rounded-lg border border-[#6E3F22]/40">
      <p className="text-[#6E3F22] text-sm">Cargando mapa...</p>
    </div>
  ),
})

const ZONAS = ['Chacao', 'Altamira', 'La Castellana', 'Los Palos Grandes', 'Las Mercedes', 'Otra']

export default function RutaCliente({
  aliados,
  visitadosHoyInit,
}: {
  aliados: Aliado[]
  visitadosHoyInit: string[]
}) {
  const [vista, setVista] = useState<'lista' | 'mapa'>('lista')
  const [zonaFiltro, setZonaFiltro] = useState('')
  const [soloConNevera, setSoloConNevera] = useState(false)
  const [visitadosHoy, setVisitadosHoy] = useState<Set<string>>(new Set(visitadosHoyInit))
  const [aliadoVisita, setAliadoVisita] = useState<Aliado | null>(null)

  const filtrados = useMemo(() => {
    let list = aliados
    if (zonaFiltro) list = list.filter(a => a.zona === zonaFiltro)
    if (soloConNevera) list = list.filter(a => a.tiene_nevera)
    return list
  }, [aliados, zonaFiltro, soloConNevera])

  const sinVisitar = filtrados.filter(a => !visitadosHoy.has(a.id))
  const yaVisitados = filtrados.filter(a => visitadosHoy.has(a.id))

  function handleDone(aliadoId: string) {
    setVisitadosHoy(prev => new Set([...prev, aliadoId]))
  }

  return (
    <div className="flex flex-col h-full">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Toggle lista/mapa */}
        <div className="flex bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg p-1 gap-1">
          <button
            onClick={() => setVista('lista')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${vista === 'lista' ? 'bg-[#6FB04A] text-white' : 'text-[#C0D1C6] hover:text-white'}`}
          >
            ☰ Lista
          </button>
          <button
            onClick={() => setVista('mapa')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${vista === 'mapa' ? 'bg-[#6FB04A] text-white' : 'text-[#C0D1C6] hover:text-white'}`}
          >
            🗺 Mapa
          </button>
        </div>

        {/* Filtro zona */}
        <select
          value={zonaFiltro}
          onChange={e => setZonaFiltro(e.target.value)}
          className="bg-[#2a1a0e] border border-[#6E3F22]/60 rounded-lg px-3 py-2 text-[#F5F5DC] text-sm focus:outline-none focus:border-[#6FB04A] transition-colors"
        >
          <option value="">Todas las zonas</option>
          {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
        </select>

        {/* Toggle nevera */}
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => setSoloConNevera(v => !v)}
            className={`w-9 h-5 rounded-full transition-colors flex items-center ${soloConNevera ? 'bg-[#006994]' : 'bg-[#6E3F22]/60'}`}
          >
            <div className={`w-3.5 h-3.5 bg-white rounded-full shadow transition-transform mx-0.5 ${soloConNevera ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
          <span className="text-xs text-[#C0D1C6]">Solo con nevera ❄️</span>
        </label>

        {/* Contador */}
        <div className="ml-auto flex gap-3 text-xs text-[#C0D1C6]">
          <span><span className="font-bold text-[#F5F5DC]">{sinVisitar.length}</span> pendientes</span>
          <span><span className="font-bold text-[#6FB04A]">{yaVisitados.length}</span> visitados hoy</span>
        </div>
      </div>

      {/* Contenido */}
      {vista === 'mapa' ? (
        <div className="flex-1 min-h-[500px] rounded-lg overflow-hidden">
          <RutaMapa
            aliados={filtrados}
            visitadosHoy={visitadosHoy}
            onVisitar={setAliadoVisita}
          />
          {filtrados.filter(a => !a.lat || !a.lng).length > 0 && (
            <p className="text-xs text-[#6E3F22] mt-2">
              ⚠ {filtrados.filter(a => !a.lat || !a.lng).length} aliado(s) sin coordenadas no aparecen en el mapa.
              <Link href="/crm/aliados" className="text-[#C0D1C6] hover:underline ml-1">Agrégalas desde el detalle del aliado.</Link>
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pendientes */}
          {sinVisitar.length > 0 && (
            <div>
              <h2 className="text-[10px] font-bold text-[#C0D1C6] uppercase tracking-widest mb-3">
                Pendientes — {sinVisitar.length}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {sinVisitar.map(aliado => (
                  <AliadoCard
                    key={aliado.id}
                    aliado={aliado}
                    visitado={false}
                    onVisitar={() => setAliadoVisita(aliado)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Visitados */}
          {yaVisitados.length > 0 && (
            <div>
              <h2 className="text-[10px] font-bold text-[#6FB04A] uppercase tracking-widest mb-3">
                ✓ Visitados hoy — {yaVisitados.length}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {yaVisitados.map(aliado => (
                  <AliadoCard
                    key={aliado.id}
                    aliado={aliado}
                    visitado={true}
                    onVisitar={() => setAliadoVisita(aliado)}
                  />
                ))}
              </div>
            </div>
          )}

          {filtrados.length === 0 && (
            <div className="text-center py-16 text-[#6E3F22]">
              <div className="text-4xl mb-3">🗺️</div>
              <p className="text-sm">No hay aliados para los filtros seleccionados.</p>
            </div>
          )}
        </div>
      )}

      {/* Panel registrar visita */}
      {aliadoVisita && (
        <VisitaPanel
          aliado={aliadoVisita}
          onClose={() => setAliadoVisita(null)}
          onDone={handleDone}
        />
      )}
    </div>
  )
}

function AliadoCard({ aliado, visitado, onVisitar }: { aliado: Aliado; visitado: boolean; onVisitar: () => void }) {
  const contactoPrincipal = aliado.contactos?.find(c => c.es_principal) ?? aliado.contactos?.[0]
  const waLink = contactoPrincipal?.telefono
    ? `https://wa.me/${contactoPrincipal.telefono.replace(/\D/g, '')}`
    : null

  return (
    <div className={`bg-[#2a1a0e] border rounded-xl p-4 transition-colors ${visitado ? 'border-[#6FB04A]/40 opacity-70' : 'border-[#6E3F22]/40 hover:border-[#6E3F22]/60'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {visitado && (
              <span className="text-[10px] font-bold bg-[#6FB04A]/20 text-[#6FB04A] border border-[#6FB04A]/30 px-1.5 py-0.5 rounded">
                ✓ Visitado
              </span>
            )}
          </div>
          <Link href={`/crm/aliados/${aliado.id}`} className="font-semibold text-[#F5F5DC] hover:text-[#6FB04A] transition-colors text-sm leading-tight block mt-1">
            {aliado.nombre}
          </Link>
          {aliado.direccion && (
            <p className="text-xs text-[#6E3F22] mt-0.5 truncate">{aliado.direccion}</p>
          )}
        </div>
        {aliado.tiene_nevera && <span className="text-lg shrink-0" title="Nevera colocada">❄️</span>}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <TipoBadge tipo={aliado.tipo} />
        {aliado.zona && (
          <span className="text-[10px] text-[#6E3F22] bg-[#6E3F22]/10 border border-[#6E3F22]/20 px-1.5 py-0.5 rounded">
            📍 {aliado.zona}
          </span>
        )}
        {aliado.pipeline_stage && (
          <StageBadge nombre={aliado.pipeline_stage.nombre} color={aliado.pipeline_stage.color} />
        )}
      </div>

      {/* Contacto */}
      {contactoPrincipal && (
        <div className="text-xs text-[#C0D1C6] mb-3 truncate">
          👤 {contactoPrincipal.nombre}{contactoPrincipal.cargo ? ` · ${contactoPrincipal.cargo}` : ''}
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-2">
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener"
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#25d366]/15 hover:bg-[#25d366]/25 border border-[#25d366]/30 text-[#25d366] text-xs font-semibold py-2 rounded-lg transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </a>
        )}
        {!visitado && (
          <button
            onClick={onVisitar}
            className="flex-1 flex items-center justify-center gap-1 bg-[#6FB04A]/15 hover:bg-[#6FB04A]/25 border border-[#6FB04A]/30 text-[#6FB04A] text-xs font-semibold py-2 rounded-lg transition-colors"
          >
            ✓ Visitar
          </button>
        )}
        {visitado && (
          <button
            onClick={onVisitar}
            className="flex-1 flex items-center justify-center text-[10px] text-[#6E3F22] hover:text-[#C0D1C6] py-2 rounded-lg transition-colors border border-[#6E3F22]/20"
          >
            + otra visita
          </button>
        )}
      </div>
    </div>
  )
}
