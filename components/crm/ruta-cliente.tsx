'use client'

import { useState, useMemo, useTransition } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import VisitaPanel from './visita-panel'
import { TipoBadge, StageBadge } from './badge'
import { loadMapsLibrary } from '@/lib/google-maps'
import { asignarRuta } from '@/lib/actions/motorizado'
import type { Aliado } from '@/lib/types'
import type { RutaOptimizada } from './ruta-mapa'

const RutaMapa = dynamic(() => import('./ruta-mapa'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-white rounded-lg border border-[#E8DFCE]">
      <p className="text-[#a8815a] text-sm">Cargando mapa...</p>
    </div>
  ),
})

const ZONAS = ['Chacao', 'Altamira', 'La Castellana', 'Los Palos Grandes', 'Las Mercedes', 'Otra']
const ORIGEN_DEFAULT = { lat: 10.4917, lng: -66.8513 } // Chacao

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

  const [origen, setOrigen] = useState<google.maps.LatLngLiteral>(ORIGEN_DEFAULT)
  const [rutaOptimizada, setRutaOptimizada] = useState<RutaOptimizada | null>(null)
  const [optimizando, startOptimizar] = useTransition()
  const [errorRuta, setErrorRuta] = useState<string | null>(null)
  const [modalMotorizado, setModalMotorizado] = useState(false)

  const filtrados = useMemo(() => {
    let list = aliados
    if (zonaFiltro) list = list.filter(a => a.zona === zonaFiltro)
    if (soloConNevera) list = list.filter(a => a.tiene_nevera)
    return list
  }, [aliados, zonaFiltro, soloConNevera])

  const sinVisitar = filtrados.filter(a => !visitadosHoy.has(a.id))
  const yaVisitados = filtrados.filter(a => visitadosHoy.has(a.id))

  const paradasCoords = sinVisitar.filter(a => a.lat && a.lng)
  const puedeOptimizar = paradasCoords.length >= 2

  function handleDone(aliadoId: string) {
    setVisitadosHoy(prev => new Set([...prev, aliadoId]))
    setRutaOptimizada(null) // invalidar ruta si cambia
  }

  function usarUbicacionActual() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => setOrigen({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => alert('No se pudo obtener ubicación: ' + err.message),
    )
  }

  function optimizar() {
    setErrorRuta(null)
    if (paradasCoords.length < 2) return
    startOptimizar(async () => {
      try {
        await loadMapsLibrary('routes')

        const svc = new google.maps.DirectionsService()
        const result = await svc.route({
          origin: origen,
          destination: origen,
          waypoints: paradasCoords.map(a => ({ location: { lat: a.lat!, lng: a.lng! }, stopover: true })),
          travelMode: google.maps.TravelMode.DRIVING,
          optimizeWaypoints: true,
        })

        const ordenIdx = result.routes[0].waypoint_order
        const ordenAliados = ordenIdx.map(i => paradasCoords[i])
        const totalMetros = result.routes[0].legs.reduce((s, l) => s + (l.distance?.value ?? 0), 0)
        const totalSeg = result.routes[0].legs.reduce((s, l) => s + (l.duration?.value ?? 0), 0)

        setRutaOptimizada({
          orden: ordenAliados,
          distanciaMetros: totalMetros,
          duracionSegundos: totalSeg,
          polyline: null,
          origen,
        })
        setVista('mapa')
      } catch (e) {
        setErrorRuta(e instanceof Error ? e.message : 'Error optimizando ruta')
      }
    })
  }

  function imprimir() {
    window.print()
  }

  return (
    <div className="flex flex-col h-full">

      {/* Toolbar */}
      <div className="print:hidden flex flex-wrap items-center gap-3 mb-4">
        <div className="flex bg-white border border-[#E8DFCE] rounded-lg p-1 gap-1">
          <button
            onClick={() => setVista('lista')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${vista === 'lista' ? 'bg-[#6FB04A] text-white' : 'text-[#a8815a] hover:text-white'}`}
          >
            ☰ Lista
          </button>
          <button
            onClick={() => setVista('mapa')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${vista === 'mapa' ? 'bg-[#6FB04A] text-white' : 'text-[#a8815a] hover:text-white'}`}
          >
            🗺 Mapa
          </button>
        </div>

        <select
          value={zonaFiltro}
          onChange={e => { setZonaFiltro(e.target.value); setRutaOptimizada(null) }}
          className="bg-white border border-[#D4C9B0] rounded-lg px-3 py-2 text-[#2a1a0e] text-sm focus:outline-none focus:border-[#6FB04A]"
        >
          <option value="">Todas las zonas</option>
          {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
        </select>

        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => { setSoloConNevera(v => !v); setRutaOptimizada(null) }}
            className={`w-9 h-5 rounded-full transition-colors flex items-center ${soloConNevera ? 'bg-[#006994]' : 'bg-[#6E3F22]/60'}`}
          >
            <div className={`w-3.5 h-3.5 bg-white rounded-full shadow transition-transform mx-0.5 ${soloConNevera ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
          <span className="text-xs text-[#a8815a]">Solo con nevera ❄️</span>
        </label>

        <div className="ml-auto flex gap-3 text-xs text-[#a8815a]">
          <span><span className="font-bold text-[#2a1a0e]">{sinVisitar.length}</span> pendientes</span>
          <span><span className="font-bold text-[#4a7830]">{yaVisitados.length}</span> visitados hoy</span>
        </div>
      </div>

      {/* Panel de planificación */}
      <div className="print:hidden bg-white border border-[#E8DFCE] rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <h3 className="font-bebas text-sm tracking-widest text-[#2a1a0e]">🧭 PLANIFICACIÓN DE RUTA</h3>
            <p className="text-xs text-[#a8815a] mt-0.5">Optimiza el orden de {paradasCoords.length} paradas pendientes</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={usarUbicacionActual}
              className="text-xs px-3 py-1.5 border border-[#E8DFCE] text-[#a8815a] hover:border-[#D4C9B0] rounded"
            >
              📍 Mi ubicación
            </button>
            <button
              onClick={optimizar}
              disabled={!puedeOptimizar || optimizando}
              className="text-xs px-3 py-1.5 bg-[#6FB04A] hover:bg-[#5a9a3a] text-white rounded disabled:opacity-50 font-semibold"
            >
              {optimizando ? '⏳ Calculando...' : '✨ Optimizar ruta'}
            </button>
            {rutaOptimizada && (
              <>
                <button
                  onClick={imprimir}
                  className="text-xs px-3 py-1.5 border border-[#FDC829]/40 bg-[#FDC829]/10 text-[#FDC829] hover:bg-[#FDC829]/20 rounded font-semibold"
                >
                  📄 Exportar PDF
                </button>
                <button
                  onClick={() => setModalMotorizado(true)}
                  className="text-xs px-3 py-1.5 border border-[#6E3F22]/40 bg-[#6E3F22]/10 text-[#6E3F22] hover:bg-[#6E3F22]/20 rounded font-semibold"
                >
                  🏍️ Asignar a motorizado
                </button>
              </>
            )}
          </div>
        </div>

        {errorRuta && (
          <p className="text-xs text-[#b91c1c] mb-2">{errorRuta}</p>
        )}

        {rutaOptimizada && (
          <div className="grid grid-cols-3 gap-3 text-center bg-[#FAF7F0] rounded p-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#a8815a]">Paradas</div>
              <div className="text-lg font-bold text-[#2a1a0e]">{rutaOptimizada.orden.length}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#a8815a]">Distancia total</div>
              <div className="text-lg font-bold text-[#4a7830]">{(rutaOptimizada.distanciaMetros / 1000).toFixed(1)} km</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#a8815a]">Tiempo estimado</div>
              <div className="text-lg font-bold text-[#FDC829]">{formatMinutos(rutaOptimizada.duracionSegundos)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Contenido */}
      {vista === 'mapa' ? (
        <div className="print:hidden flex-1 min-h-[500px] rounded-lg overflow-hidden">
          <RutaMapa
            aliados={filtrados}
            visitadosHoy={visitadosHoy}
            onVisitar={setAliadoVisita}
            origen={origen}
            rutaOptimizada={rutaOptimizada}
          />
          {filtrados.filter(a => !a.lat || !a.lng).length > 0 && (
            <p className="text-xs text-[#a8815a] mt-2">
              ⚠ {filtrados.filter(a => !a.lat || !a.lng).length} aliado(s) sin coordenadas no aparecen en el mapa.
              <Link href="/crm/aliados" className="text-[#a8815a] hover:underline ml-1">Agrégalas desde el detalle del aliado.</Link>
            </p>
          )}
        </div>
      ) : (
        <div className="print:hidden space-y-6">
          {rutaOptimizada && (
            <div>
              <h2 className="text-[10px] font-bold text-[#4a7830] uppercase tracking-widest mb-3">
                Ruta optimizada — orden sugerido
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {rutaOptimizada.orden.map((aliado, i) => (
                  <AliadoCard
                    key={aliado.id}
                    aliado={aliado}
                    visitado={visitadosHoy.has(aliado.id)}
                    numero={i + 1}
                    onVisitar={() => setAliadoVisita(aliado)}
                  />
                ))}
              </div>
            </div>
          )}

          {!rutaOptimizada && sinVisitar.length > 0 && (
            <div>
              <h2 className="text-[10px] font-bold text-[#a8815a] uppercase tracking-widest mb-3">
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

          {yaVisitados.length > 0 && (
            <div>
              <h2 className="text-[10px] font-bold text-[#4a7830] uppercase tracking-widest mb-3">
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
            <div className="text-center py-16 text-[#a8815a]">
              <div className="text-4xl mb-3">🗺️</div>
              <p className="text-sm">No hay aliados para los filtros seleccionados.</p>
            </div>
          )}
        </div>
      )}

      {/* Vista imprimible (solo se muestra al imprimir) */}
      {rutaOptimizada && <PrintableRuta ruta={rutaOptimizada} zona={zonaFiltro} />}

      {aliadoVisita && (
        <VisitaPanel
          aliado={aliadoVisita}
          onClose={() => setAliadoVisita(null)}
          onDone={handleDone}
        />
      )}

      {modalMotorizado && rutaOptimizada && (
        <AsignarMotorizadoModal
          ruta={rutaOptimizada}
          onClose={() => setModalMotorizado(false)}
        />
      )}
    </div>
  )
}

function formatMinutos(seg: number) {
  const m = Math.round(seg / 60)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const r = m % 60
  return `${h}h ${r}min`
}

function AliadoCard({
  aliado, visitado, numero, onVisitar,
}: {
  aliado: Aliado; visitado: boolean; numero?: number; onVisitar: () => void
}) {
  const contactoPrincipal = aliado.contactos?.find(c => c.es_principal) ?? aliado.contactos?.[0]
  const waLink = contactoPrincipal?.telefono
    ? `https://wa.me/${contactoPrincipal.telefono.replace(/\D/g, '')}`
    : null

  return (
    <div className={`bg-white border rounded-xl p-4 transition-colors ${visitado ? 'border-[#6FB04A]/40 opacity-70' : 'border-[#E8DFCE] hover:border-[#D4C9B0]'}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {numero != null && (
              <span className="w-6 h-6 rounded-full bg-[#6FB04A] text-white text-xs font-bold flex items-center justify-center">
                {numero}
              </span>
            )}
            {visitado && (
              <span className="text-[10px] font-bold bg-[#6FB04A]/20 text-[#4a7830] border border-[#6FB04A]/30 px-1.5 py-0.5 rounded">
                ✓ Visitado
              </span>
            )}
          </div>
          <Link href={`/crm/aliados/${aliado.id}`} className="font-semibold text-[#2a1a0e] hover:text-[#4a7830] transition-colors text-sm leading-tight block mt-1">
            {aliado.nombre}
          </Link>
          {aliado.direccion && (
            <p className="text-xs text-[#a8815a] mt-0.5 truncate">{aliado.direccion}</p>
          )}
        </div>
        {aliado.tiene_nevera && <span className="text-lg shrink-0" title="Nevera colocada">❄️</span>}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <TipoBadge tipo={aliado.tipo} />
        {aliado.zona && (
          <span className="text-[10px] text-[#a8815a] bg-[#6E3F22]/10 border border-[#E8DFCE]/60 px-1.5 py-0.5 rounded">
            📍 {aliado.zona}
          </span>
        )}
        {aliado.pipeline_stage && (
          <StageBadge nombre={aliado.pipeline_stage.nombre} color={aliado.pipeline_stage.color} />
        )}
      </div>

      {contactoPrincipal && (
        <div className="text-xs text-[#a8815a] mb-3 truncate">
          👤 {contactoPrincipal.nombre}{contactoPrincipal.cargo ? ` · ${contactoPrincipal.cargo}` : ''}
        </div>
      )}

      <div className="flex gap-2">
        {waLink && (
          <a
            href={waLink} target="_blank" rel="noopener"
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#25d366]/15 hover:bg-[#25d366]/25 border border-[#25d366]/30 text-[#25d366] text-xs font-semibold py-2 rounded-lg"
          >
            💬 WhatsApp
          </a>
        )}
        {!visitado && (
          <button
            onClick={onVisitar}
            className="flex-1 flex items-center justify-center gap-1 bg-[#6FB04A]/15 hover:bg-[#6FB04A]/25 border border-[#6FB04A]/30 text-[#4a7830] text-xs font-semibold py-2 rounded-lg"
          >
            ✓ Visitar
          </button>
        )}
        {visitado && (
          <button
            onClick={onVisitar}
            className="flex-1 flex items-center justify-center text-[10px] text-[#a8815a] hover:text-[#a8815a] py-2 rounded-lg border border-[#E8DFCE]/60"
          >
            + otra visita
          </button>
        )}
      </div>
    </div>
  )
}

function PrintableRuta({ ruta, zona }: { ruta: RutaOptimizada; zona: string }) {
  const fecha = new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <div className="hidden print:block print-page">
      <div className="print-header">
        <h1>Coqueros — Ruta del día</h1>
        <div className="print-meta">
          <div><strong>Fecha:</strong> {fecha}</div>
          {zona && <div><strong>Zona:</strong> {zona}</div>}
        </div>
      </div>

      <div className="print-summary">
        <div><span className="lbl">Paradas</span><span className="val">{ruta.orden.length}</span></div>
        <div><span className="lbl">Distancia total</span><span className="val">{(ruta.distanciaMetros / 1000).toFixed(1)} km</span></div>
        <div><span className="lbl">Tiempo estimado</span><span className="val">{formatMinutos(ruta.duracionSegundos)}</span></div>
      </div>

      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: 32 }}>#</th>
            <th>Aliado</th>
            <th>Dirección / zona</th>
            <th>Contacto</th>
            <th>Notas</th>
          </tr>
        </thead>
        <tbody>
          {ruta.orden.map((a, i) => {
            const c = a.contactos?.find(x => x.es_principal) ?? a.contactos?.[0]
            return (
              <tr key={a.id}>
                <td className="idx">{i + 1}</td>
                <td>
                  <strong>{a.nombre}</strong>
                  <div className="sub">{a.tipo}{a.tiene_nevera ? ' · Nevera colocada' : ''}</div>
                </td>
                <td>
                  {a.direccion ?? '—'}
                  {a.zona ? <div className="sub">Zona: {a.zona}</div> : null}
                </td>
                <td>
                  {c ? (
                    <>
                      <div>{c.nombre}{c.cargo ? ` (${c.cargo})` : ''}</div>
                      {c.telefono && <div className="sub">{c.telefono}</div>}
                    </>
                  ) : '—'}
                </td>
                <td className="notas">{a.notas ?? ''}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <p className="print-foot">
        Ruta optimizada por Google Maps · Coqueros CRM · impreso {new Date().toLocaleString('es-VE')}
      </p>
    </div>
  )
}

function AsignarMotorizadoModal({
  ruta, onClose,
}: {
  ruta: RutaOptimizada
  onClose: () => void
}) {
  const router = useRouter()
  const km = ruta.distanciaMetros / 1000
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [tarifa, setTarifa] = useState('0.22')
  const [nombre, setNombre] = useState('')
  const [notas, setNotas] = useState('')
  const [saving, startSaving] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const tarifaNum = parseFloat(tarifa) || 0
  const costo = km * tarifaNum

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startSaving(async () => {
      try {
        await asignarRuta({
          fecha,
          km: parseFloat(km.toFixed(2)),
          tarifa_usd_km: tarifaNum,
          num_paradas: ruta.orden.length,
          duracion_segundos: ruta.duracionSegundos,
          origen_lat: ruta.origen.lat,
          origen_lng: ruta.origen.lng,
          motorizado_nombre: nombre.trim() || null,
          notas: notas.trim() || null,
          snapshot: ruta.orden.map(a => ({
            id: a.id,
            nombre: a.nombre,
            zona: a.zona,
            direccion: a.direccion,
          })),
        })
        onClose()
        router.push('/crm/motorizado')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al asignar la ruta')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bebas text-xl tracking-widest text-[#2a1a0e]">🏍️ ASIGNAR A MOTORIZADO</h2>
          <button onClick={onClose} className="text-[#a8815a] hover:text-[#2a1a0e] text-2xl leading-none">×</button>
        </div>

        <div className="bg-[#FAF7F0] rounded p-3 mb-4 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#a8815a]">Distancia</div>
            <div className="font-bold text-[#4a7830]">{km.toFixed(1)} km</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#a8815a]">Paradas</div>
            <div className="font-bold text-[#2a1a0e]">{ruta.orden.length}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#a8815a]">Costo</div>
            <div className="font-bold text-[#2a1a0e]">${costo.toFixed(2)}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#6E3F22] mb-1">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              required
              className="w-full border border-[#D4C9B0] rounded px-3 py-2 text-sm text-[#2a1a0e] focus:outline-none focus:border-[#6FB04A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6E3F22] mb-1">Tarifa por km (USD)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={tarifa}
              onChange={e => setTarifa(e.target.value)}
              required
              className="w-full border border-[#D4C9B0] rounded px-3 py-2 text-sm text-[#2a1a0e] focus:outline-none focus:border-[#6FB04A]"
            />
            <p className="text-[10px] text-[#a8815a] mt-1">Precargado en $0.22. La tarifa queda registrada en la ruta.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6E3F22] mb-1">Motorizado (opcional)</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: José"
              className="w-full border border-[#D4C9B0] rounded px-3 py-2 text-sm text-[#2a1a0e] focus:outline-none focus:border-[#6FB04A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6E3F22] mb-1">Notas (opcional)</label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={2}
              className="w-full border border-[#D4C9B0] rounded px-3 py-2 text-sm text-[#2a1a0e] focus:outline-none focus:border-[#6FB04A]"
            />
          </div>

          {error && <p className="text-xs text-[#b91c1c]">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-2 rounded border border-[#D4C9B0] text-[#6E3F22] text-sm font-semibold hover:bg-black/5 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || tarifaNum <= 0}
              className="flex-1 py-2 rounded bg-[#6FB04A] hover:bg-[#5a9a3a] text-white text-sm font-semibold disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Asignar ruta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
