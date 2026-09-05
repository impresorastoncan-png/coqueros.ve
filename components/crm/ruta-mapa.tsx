'use client'

import { useEffect, useRef, useState } from 'react'
import { loadMapsLibrary } from '@/lib/google-maps'
import type { Aliado } from '@/lib/types'

const STAGE_COLORS: Record<string, string> = {
  'Prospecto': '#94a3b8',
  'Contactado': '#60a5fa',
  'Degustación': '#a78bfa',
  'Negociación': '#f59e0b',
  'Nevera colocada': '#6FB04A',
  'Activo': '#22c55e',
  'En pausa': '#f97316',
  'Perdido': '#ef4444',
}

const CENTRO_CARACAS: google.maps.LatLngLiteral = { lat: 10.4917, lng: -66.8513 }

export interface RutaOptimizada {
  orden: Aliado[]
  distanciaMetros: number
  duracionSegundos: number
  polyline: google.maps.LatLng[] | null
  origen: google.maps.LatLngLiteral
}

export default function RutaMapa({
  aliados,
  visitadosHoy,
  onVisitar,
  origen,
  rutaOptimizada,
}: {
  aliados: Aliado[]
  visitadosHoy: Set<string>
  onVisitar: (a: Aliado) => void
  origen: google.maps.LatLngLiteral | null
  rutaOptimizada: RutaOptimizada | null
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const originMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
  const infoRef = useRef<google.maps.InfoWindow | null>(null)
  const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  // Init map una sola vez
  useEffect(() => {
    let disposed = false
    async function boot() {
      try {
        await loadMapsLibrary('maps')
        await loadMapsLibrary('marker')
        if (disposed || !containerRef.current) return

        mapRef.current = new google.maps.Map(containerRef.current, {
          center: origen ?? CENTRO_CARACAS,
          zoom: 13,
          mapId: 'COQUEROS_MAP',
          gestureHandling: 'greedy',
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeControl: false,
        })
        infoRef.current = new google.maps.InfoWindow()
        rendererRef.current = new google.maps.DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: { strokeColor: '#6FB04A', strokeWeight: 4, strokeOpacity: 0.85 },
        })
        rendererRef.current.setMap(mapRef.current)
        setReady(true)
      } catch (e) {
        console.error(e)
        setError(e instanceof Error ? e.message : 'Error cargando Google Maps')
      }
    }
    boot()
    return () => {
      disposed = true
      markersRef.current.forEach(m => m.map = null)
      markersRef.current = []
      originMarkerRef.current && (originMarkerRef.current.map = null)
      rendererRef.current?.setMap(null)
    }
  }, [])

  // Actualizar marker de origen
  useEffect(() => {
    if (!ready || !mapRef.current) return
    if (originMarkerRef.current) { originMarkerRef.current.map = null; originMarkerRef.current = null }
    if (!origen) return
    const dot = document.createElement('div')
    dot.innerHTML = `<div style="width:22px;height:22px;border-radius:50%;background:#F5F5DC;border:3px solid #6E3F22;box-shadow:0 2px 8px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font-size:11px">🏠</div>`
    originMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
      map: mapRef.current,
      position: origen,
      content: dot,
      title: 'Origen',
      zIndex: 999,
    })
  }, [ready, origen])

  // Redibujar markers y opcionalmente numerar según ruta
  useEffect(() => {
    if (!ready || !mapRef.current) return
    markersRef.current.forEach(m => m.map = null)
    markersRef.current = []

    const conCoords = aliados.filter(a => a.lat && a.lng)

    // Índice según orden optimizado (si existe)
    const ordenMap = new Map<string, number>()
    if (rutaOptimizada) {
      rutaOptimizada.orden.forEach((a, i) => ordenMap.set(a.id, i + 1))
    }

    conCoords.forEach(aliado => {
      const stageName = aliado.pipeline_stage?.nombre ?? ''
      const color = visitadosHoy.has(aliado.id) ? '#22c55e' : (STAGE_COLORS[stageName] ?? '#6FB04A')
      const numero = ordenMap.get(aliado.id)

      const pin = document.createElement('div')
      pin.style.cssText = `
        display:flex;align-items:center;justify-content:center;
        width:32px;height:32px;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);background:${color};
        border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4);
        color:#fff;font-weight:700;font-size:12px;font-family:Inter,sans-serif;
      `
      const inner = document.createElement('div')
      inner.style.cssText = 'transform:rotate(45deg)'
      inner.textContent = numero ? String(numero) : ''
      pin.appendChild(inner)

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: { lat: aliado.lat!, lng: aliado.lng! },
        content: pin,
        title: aliado.nombre,
      })

      marker.addListener('click', () => {
        const contactoPrincipal = aliado.contactos?.find(c => c.es_principal) ?? aliado.contactos?.[0]
        const wa = contactoPrincipal?.telefono ? `https://wa.me/${contactoPrincipal.telefono.replace(/\D/g, '')}` : null
        const html = `
          <div style="font-family:Inter,sans-serif;font-size:13px;min-width:200px;color:#1a1a1a">
            <div style="font-weight:700;margin-bottom:4px">${escapeHtml(aliado.nombre)}</div>
            <div style="color:#666;font-size:11px;margin-bottom:8px">
              ${escapeHtml(aliado.tipo)}${aliado.zona ? ` · ${escapeHtml(aliado.zona)}` : ''}${aliado.tiene_nevera ? ' · ❄️' : ''}
            </div>
            ${aliado.pipeline_stage ? `<div style="color:${color};font-weight:600;font-size:11px;margin-bottom:8px">● ${escapeHtml(aliado.pipeline_stage.nombre)}</div>` : ''}
            ${visitadosHoy.has(aliado.id) ? `<div style="background:#dcfce7;color:#16a34a;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700;margin-bottom:8px;display:inline-block">✓ Visitado hoy</div>` : ''}
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
              ${wa ? `<a href="${wa}" target="_blank" rel="noopener" style="background:#25d366;color:#fff;border-radius:4px;padding:4px 10px;font-size:11px;font-weight:600;text-decoration:none">💬 WhatsApp</a>` : ''}
              ${!visitadosHoy.has(aliado.id) ? `<button id="visitar-${aliado.id}" style="background:#6FB04A;color:#fff;border:none;border-radius:4px;padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer">Marcar visitado</button>` : ''}
            </div>
          </div>
        `
        infoRef.current?.setContent(html)
        infoRef.current?.open(mapRef.current, marker)

        // Attach click después de que el DOM esté listo
        google.maps.event.addListenerOnce(infoRef.current!, 'domready', () => {
          const btn = document.getElementById(`visitar-${aliado.id}`)
          btn?.addEventListener('click', () => {
            onVisitar(aliado)
            infoRef.current?.close()
          })
        })
      })

      markersRef.current.push(marker)
    })

    // Fit bounds
    if (conCoords.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      conCoords.forEach(a => bounds.extend({ lat: a.lat!, lng: a.lng! }))
      if (origen) bounds.extend(origen)
      mapRef.current.fitBounds(bounds, 40)
    }
  }, [ready, aliados, visitadosHoy, onVisitar, rutaOptimizada, origen])

  // Renderizar ruta optimizada
  useEffect(() => {
    if (!ready || !mapRef.current || !rendererRef.current) return
    if (!rutaOptimizada || !origen) {
      rendererRef.current.set('directions', null)
      return
    }

    const paradas = rutaOptimizada.orden.filter(a => a.lat && a.lng)
    if (paradas.length === 0) return

    const svc = new google.maps.DirectionsService()
    svc.route({
      origin: origen,
      destination: origen, // vuelta al punto de partida
      waypoints: paradas.map(a => ({ location: { lat: a.lat!, lng: a.lng! }, stopover: true })),
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false, // ya viene optimizado
    }).then(result => {
      rendererRef.current?.setDirections(result)
    }).catch(err => {
      console.error('Directions error:', err)
    })
  }, [ready, rutaOptimizada, origen])

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-lg border border-[#ef4444]/40 p-6">
        <div className="text-center">
          <p className="text-[#b91c1c] text-sm font-semibold mb-2">No se pudo cargar Google Maps</p>
          <p className="text-[#6E3F22] text-xs">{error}</p>
          <p className="text-[#a8815a] text-xs mt-3">Verifica NEXT_PUBLIC_GOOGLE_MAPS_API_KEY y los permisos de la key.</p>
        </div>
      </div>
    )
  }

  return <div ref={containerRef} className="w-full h-full rounded-lg" style={{ minHeight: 400 }} />
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
