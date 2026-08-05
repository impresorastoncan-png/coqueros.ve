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
  descripcion: string | null
  costo: number | null
  precio_mayor: number | null
  precio_final: number | null
  precio_detal: number | null
  precio_aliado: number | null
  ganancia: number | null
  unidad_medida: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Proveedor {
  id: string
  nombre: string
  contacto: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  notas: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export type CategoriaIngrediente = 'materia-prima' | 'empaque' | 'etiqueta' | 'otro'

export interface Ingrediente {
  id: string
  nombre: string
  categoria: CategoriaIngrediente | null
  unidad: string | null
  costo_unitario: number | null
  proveedor_id: string | null
  notas: string | null
  activo: boolean
  created_at: string
  updated_at: string
  proveedor?: Proveedor | null
}

export interface ProductoIngrediente {
  id: string
  producto_id: string
  ingrediente_id: string
  cantidad: number
  notas: string | null
  created_at: string
  ingrediente?: Ingrediente
}

export type TipoNotaProducto = 'prueba' | 'ajuste' | 'proximo-paso' | 'incidente' | 'otro'

export interface ProductoNota {
  id: string
  producto_id: string
  tipo: TipoNotaProducto | null
  titulo: string
  contenido: string | null
  fecha: string
  autor: string | null
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

export type MetodoPago =
  | 'efectivo-usd'
  | 'efectivo-bs'
  | 'transferencia'
  | 'pago-movil'
  | 'zelle'
  | 'binance'
  | 'otro'

export interface Venta {
  id: string
  fecha: string
  aliado_id: string | null
  metodo_pago: MetodoPago | null
  notas: string | null
  monto_total: number
  costo_total: number
  ganancia: number
  created_at: string
  updated_at: string
  aliado?: { id: string; nombre: string } | null
  items?: VentaItem[]
}

export interface VentaItem {
  id: string
  venta_id: string
  producto_id: string | null
  descripcion: string | null
  cantidad: number
  precio_unit: number
  costo_unit: number
  subtotal: number
  subtotal_costo: number
  created_at: string
  producto?: Producto | null
}

export type TipoPublicidad = 'flyer' | 'post-ig' | 'post-wa' | 'story' | 'grafico' | 'video' | 'logo' | 'otro'
export type Plataforma = 'instagram' | 'whatsapp' | 'facebook' | 'tiktok' | 'impreso' | 'email' | 'web' | 'otro'

export interface Publicidad {
  id: string
  titulo: string
  descripcion: string | null
  tipo: TipoPublicidad | null
  plataforma: Plataforma | null
  storage_path: string | null
  url_externa: string | null
  mime_type: string | null
  tamano_bytes: number | null
  tags: string[]
  fecha_creacion: string
  autor: string | null
  activo: boolean
  created_at: string
  updated_at: string
}
