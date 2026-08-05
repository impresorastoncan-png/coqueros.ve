'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Aliado } from '@/lib/types'

// Fix leaflet default icon paths broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function makeIcon(color: string) {
  return L.divIcon({
    html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  })
}

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

function FitBounds({ aliados }: { aliados: Aliado[] }) {
  const map = useMap()
  useEffect(() => {
    const pts = aliados.filter(a => a.lat && a.lng).map(a => [a.lat!, a.lng!] as [number, number])
    if (pts.length > 0) map.fitBounds(pts, { padding: [40, 40] })
  }, [aliados, map])
  return null
}

export default function RutaMapa({
  aliados,
  visitadosHoy,
  onVisitar,
}: {
  aliados: Aliado[]
  visitadosHoy: Set<string>
  onVisitar: (a: Aliado) => void
}) {
  const conCoords = aliados.filter(a => a.lat && a.lng)
  // Centro Caracas este
  const center: [number, number] = [10.4917, -66.8513]

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100%', width: '100%', borderRadius: '8px' }}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <FitBounds aliados={conCoords} />
      {conCoords.map(aliado => {
        const stageName = aliado.pipeline_stage?.nombre ?? ''
        const color = visitadosHoy.has(aliado.id) ? '#22c55e' : (STAGE_COLORS[stageName] ?? '#6FB04A')
        const contactoPrincipal = aliado.contactos?.find(c => c.es_principal) ?? aliado.contactos?.[0]
        const waLink = contactoPrincipal?.telefono
          ? `https://wa.me/${contactoPrincipal.telefono.replace(/\D/g, '')}`
          : null

        return (
          <Marker
            key={aliado.id}
            position={[aliado.lat!, aliado.lng!]}
            icon={makeIcon(color)}
          >
            <Popup minWidth={200}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
                <div style={{ fontWeight: 700, marginBottom: 4, color: '#1a1a1a' }}>{aliado.nombre}</div>
                <div style={{ color: '#666', fontSize: 11, marginBottom: 8 }}>
                  {aliado.tipo} · {aliado.zona ?? ''}
                  {aliado.tiene_nevera ? ' · ❄️' : ''}
                </div>
                {aliado.pipeline_stage && (
                  <div style={{ fontSize: 11, color: color, fontWeight: 600, marginBottom: 8 }}>
                    ● {aliado.pipeline_stage.nombre}
                  </div>
                )}
                {visitadosHoy.has(aliado.id) && (
                  <div style={{ background: '#dcfce7', color: '#16a34a', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, marginBottom: 8, display: 'inline-block' }}>
                    ✓ Visitado hoy
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {waLink && (
                    <a href={waLink} target="_blank" rel="noopener"
                      style={{ background: '#25d366', color: '#fff', borderRadius: 4, padding: '4px 10px', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
                      💬 WhatsApp
                    </a>
                  )}
                  {!visitadosHoy.has(aliado.id) && (
                    <button
                      onClick={() => onVisitar(aliado)}
                      style={{ background: '#6FB04A', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      Marcar visitado
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
