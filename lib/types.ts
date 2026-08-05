export type Rol = 'admin' | 'vendedor' | 'motorizado'

export type TipoAliado =
  | 'cafetería'
  | 'restaurante'
  | 'gimnasio'
  | 'pilates-yoga'
  | 'market'
  | 'otro'

export type TipoInteraccion =
  | 'visita'
  | 'llamada'
  | 'whatsapp'
  | 'email'
  | 'degustación'
  | 'otro'

export interface PipelineStage {
  id: string
  nombre: string
  orden: number
  color: string | null
  created_at: string
}

export interface Producto {
  id: string
  nombre: string
  presentacion: string
  costo: number | null
  precio_mayor: number | null
  precio_final: number | null
  ganancia: number | null
  activo: boolean
  created_at: string
}

export interface Aliado {
  id: string
  nombre: string
  tipo: TipoAliado
  zona: string | null
  direccion: string | null
  lat: number | null
  lng: number | null
  pipeline_stage_id: string | null
  tiene_nevera: boolean
  notas: string | null
  activo: boolean
  created_at: string
  updated_at: string
  pipeline_stage?: PipelineStage
  contactos?: Contacto[]
}

export interface Contacto {
  id: string
  aliado_id: string
  nombre: string
  cargo: string | null
  telefono: string | null
  email: string | null
  es_principal: boolean
  created_at: string
}

export interface Interaccion {
  id: string
  aliado_id: string
  tipo: TipoInteraccion
  fecha: string
  resultado: string | null
  proximo_paso: string | null
  responsable: string | null
  created_at: string
}

export interface Usuario {
  id: string
  nombre: string | null
  rol: Rol
  activo: boolean
  created_at: string
}
