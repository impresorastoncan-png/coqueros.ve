import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

let configured = false

function ensureConfigured() {
  if (configured) return
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) throw new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no configurada')
  setOptions({ key: apiKey, v: 'weekly', region: 'VE', language: 'es' })
  configured = true
}

export async function loadMapsLibrary<T extends 'maps' | 'marker' | 'routes' | 'visualization' | 'places'>(name: T) {
  ensureConfigured()
  return importLibrary(name)
}
