'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { loadMapsLibrary } from '@/lib/google-maps'

export interface PuntoPresencia {
  id: string
  nombre: string
  tipo: string
  zona: string | null
  direccion: string | null
  lat: number
  lng: number
  tiene_nevera: boolean
  stage: string | null
  peso_ventas: number
}

type Modo = 'heatmap' | 'markers' | 'both'
type PesoTipo = 'uniforme' | 'ventas'

const CENTRO_CARACAS: google.maps.LatLngLiteral = { lat: 10.4917, lng: -66.8513 }

export default function PresenciaCliente({ puntos }: { puntos: PuntoPresencia[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const circlesRef = useRef<google.maps.Circle[]>([])
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])

  const [modo, setModo] = useState<Modo>('both')
  const [peso, setPeso] = useState<PesoTipo>('uniforme')
  const [zonaFiltro, setZonaFiltro] = useState('')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const zonas = useMemo(() => Array.from(new Set(puntos.map(p => p.zona).filter((z): z is string => !!z))).sort(), [puntos])

  const filtrados = useMemo(() => {
    if (!zonaFiltro) return puntos
    return puntos.filter(p => p.zona === zonaFiltro)
  }, [puntos, zonaFiltro])

  const stats = useMemo(() => {
    const totalVentas = filtrados.reduce((s, p) => s + p.peso_ventas, 0)
    const conNevera = filtrados.filter(p => p.tiene_nevera).length
    return { total: filtrados.length, totalVentas, conNevera }
  }, [filtrados])

  // Init map una vez
  useEffect(() => {
    let disposed = false
    async function boot() {
      try {
        await loadMapsLibrary('maps')
        await loadMapsLibrary('marker')
        if (disposed || !containerRef.current) return
        mapRef.current = new google.maps.Map(containerRef.current, {
          center: CENTRO_CARACAS,
          zoom: 13,
          mapId: 'COQUEROS_PRESENCIA_MAP',
          gestureHandling: 'greedy',
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_RIGHT,
            mapTypeIds: ['roadmap', 'hybrid'],
          },
        })
        setReady(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error cargando Google Maps')
      }
    }
    boot()
    return () => {
      disposed = true
      circlesRef.current.forEach(c => c.setMap(null))
      circlesRef.current = []
      markersRef.current.forEach(m => m.map = null)
      markersRef.current = []
    }
  }, [])

  // Redibujar cuando cambian filtros / modo / peso
  useEffect(() => {
    if (!ready || !mapRef.current) return

    circlesRef.current.forEach(c => c.setMap(null))
    circlesRef.current = []
    markersRef.current.forEach(m => m.map = null)
    markersRef.current = []

    if (filtrados.length === 0) return

    // Escala de peso para radio y opacidad
    const pesos = filtrados.map(p => peso === 'ventas' ? Math.max(20, p.peso_ventas) : (p.tiene_nevera ? 3 : 1.5))
    const maxPeso = Math.max(...pesos, 1)

    // Círculos de calor (semi-transparentes, se acumulan visualmente)
    if (modo === 'heatmap' || modo === 'both') {
      filtrados.forEach((p, i) => {
        const w = pesos[i]
        const norm = w / maxPeso
        // Radio en metros: entre 120 y 400 dependiendo del peso
        const radius = 120 + norm * 280
        // Color: gradiente amarillo → naranja → rojo según peso
        const color = norm > 0.7 ? '#ef4444' : norm > 0.4 ? '#FDC829' : '#6FB04A'
        const circle = new google.maps.Circle({
          center: { lat: p.lat, lng: p.lng },
          radius,
          fillColor: color,
          fillOpacity: 0.28,
          strokeWeight: 0,
          map: mapRef.current,
          clickable: false,
        })
        circlesRef.current.push(circle)
      })
    }

    // Markers precisos
    if (modo === 'markers' || modo === 'both') {
      const info = new google.maps.InfoWindow()
      filtrados.forEach(p => {
        const color = p.tiene_nevera ? '#006994' : '#6FB04A'
        const pin = document.createElement('div')
        pin.style.cssText = `
          width:24px;height:24px;border-radius:50%;
          background:${color};border:3px solid #fff;
          box-shadow:0 2px 6px rgba(0,0,0,.4);
          display:flex;align-items:center;justify-content:center;
          font-size:11px;color:#fff;
        `
        pin.textContent = p.tiene_nevera ? '❄' : '●'
        const marker = new google.maps.marker.AdvancedMarkerElement({
          map: mapRef.current,
          position: { lat: p.lat, lng: p.lng },
          content: pin,
          title: p.nombre,
        })
        marker.addListener('click', () => {
          info.setContent(`
            <div style="font-family:Inter,sans-serif;font-size:13px;min-width:180px;color:#1a1a1a">
              <div style="font-weight:700;margin-bottom:2px">${escapeHtml(p.nombre)}</div>
              <div style="color:#666;font-size:11px;margin-bottom:4px">${escapeHtml(p.tipo)}${p.zona ? ` · ${escapeHtml(p.zona)}` : ''}</div>
              ${p.tiene_nevera ? `<div style="color:#006994;font-size:11px;font-weight:600">❄ Nevera colocada</div>` : ''}
              ${p.peso_ventas > 0 ? `<div style="color:#6FB04A;font-size:11px;font-weight:600;margin-top:2px">💵 $${p.peso_ventas.toFixed(2)} este mes</div>` : ''}
              ${p.direccion ? `<div style="color:#888;font-size:10px;margin-top:4px">${escapeHtml(p.direccion)}</div>` : ''}
              <div style="margin-top:6px"><a href="/crm/aliados/${p.id}" style="color:#6FB04A;font-size:11px;font-weight:600;text-decoration:none">Ver ficha →</a></div>
            </div>
          `)
          info.open(mapRef.current, marker)
        })
        markersRef.current.push(marker)
      })
    }

    const bounds = new google.maps.LatLngBounds()
    filtrados.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }))
    mapRef.current.fitBounds(bounds, 60)
  }, [ready, filtrados, modo, peso])

  if (error) {
    return (
      <div className="bg-[#2a1a0e] border border-[#ef4444]/40 rounded-lg p-6">
        <p className="text-[#ef4444] text-sm font-semibold mb-2">No se pudo cargar Google Maps</p>
        <p className="text-[#C0D1C6] text-xs">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg p-3">
        <div className="flex bg-[#1a1007] border border-[#6E3F22]/40 rounded-lg p-1 gap-1">
          <ModoBtn active={modo === 'heatmap'} onClick={() => setModo('heatmap')}>🔥 Calor</ModoBtn>
          <ModoBtn active={modo === 'markers'} onClick={() => setModo('markers')}>📍 Puntos</ModoBtn>
          <ModoBtn active={modo === 'both'} onClick={() => setModo('both')}>Ambos</ModoBtn>
        </div>

        <select
          value={peso}
          onChange={e => setPeso(e.target.value as PesoTipo)}
          className="bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-1.5 text-[#F5F5DC] text-xs"
        >
          <option value="uniforme">Peso uniforme (nevera pesa +)</option>
          <option value="ventas">Peso por ventas del mes</option>
        </select>

        <select
          value={zonaFiltro}
          onChange={e => setZonaFiltro(e.target.value)}
          className="bg-[#1a1007] border border-[#6E3F22]/60 rounded px-3 py-1.5 text-[#F5F5DC] text-xs"
        >
          <option value="">Todas las zonas</option>
          {zonas.map(z => <option key={z} value={z}>{z}</option>)}
        </select>

        <div className="ml-auto flex gap-4 text-xs text-[#C0D1C6]">
          <span><span className="font-bold text-[#F5F5DC]">{stats.total}</span> puntos</span>
          <span><span className="font-bold text-[#006994]">{stats.conNevera}</span> con nevera</span>
          <span><span className="font-bold text-[#6FB04A]">${stats.totalVentas.toFixed(0)}</span> ventas mes</span>
        </div>
      </div>

      <div ref={containerRef} className="w-full rounded-lg" style={{ height: '65vh', minHeight: 450 }} />

      {puntos.length === 0 && (
        <div className="bg-[#2a1a0e] border border-[#6E3F22]/40 rounded-lg p-6 text-center text-sm text-[#6E3F22]">
          Todavía no hay aliados con presencia registrada (etapa "Nevera colocada" o "Activo") con coordenadas.
          <Link href="/crm/aliados" className="text-[#6FB04A] hover:underline ml-2">Ir a aliados →</Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-[#C0D1C6]">
        <LeyendaItem color="#006994" label="Nevera colocada" />
        <LeyendaItem color="#6FB04A" label="Aliado activo / calor bajo" />
        <LeyendaItem color="#FDC829" label="Calor medio" />
        <LeyendaItem color="#ef4444" label="Concentración alta" />
      </div>
    </div>
  )
}

function ModoBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
        active ? 'bg-[#6FB04A] text-white' : 'text-[#C0D1C6] hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function LeyendaItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 bg-[#2a1a0e] border border-[#6E3F22]/40 rounded px-3 py-2">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  )
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
