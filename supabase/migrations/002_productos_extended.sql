-- ============================================================
-- COQUEROS CRM — Extensión de Productos
-- Añade: proveedores, ingredientes, recetas y bitácora de producción
-- ============================================================

-- Ampliar productos con campos de negocio adicionales
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS descripcion   text,
  ADD COLUMN IF NOT EXISTS precio_detal  numeric(10,2),
  ADD COLUMN IF NOT EXISTS precio_aliado numeric(10,2),
  ADD COLUMN IF NOT EXISTS unidad_medida text,
  ADD COLUMN IF NOT EXISTS updated_at    timestamptz DEFAULT now();

CREATE TRIGGER productos_updated_at
  BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Proveedores de ingredientes
CREATE TABLE proveedores (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text NOT NULL,
  contacto    text,
  telefono    text,
  email       text,
  direccion   text,
  notas       text,
  activo      boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TRIGGER proveedores_updated_at
  BEFORE UPDATE ON proveedores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Catálogo de ingredientes/insumos (incluye empaques)
CREATE TABLE ingredientes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre         text NOT NULL,
  categoria      text CHECK (categoria IN ('materia-prima','empaque','etiqueta','otro')),
  unidad         text,                          -- kg, L, unidad, etc
  costo_unitario numeric(10,4),
  proveedor_id   uuid REFERENCES proveedores(id) ON DELETE SET NULL,
  notas          text,
  activo         boolean DEFAULT true,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE TRIGGER ingredientes_updated_at
  BEFORE UPDATE ON ingredientes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Receta: relación producto ↔ ingredientes con cantidad
CREATE TABLE producto_ingredientes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id  uuid NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  ingrediente_id uuid NOT NULL REFERENCES ingredientes(id) ON DELETE RESTRICT,
  cantidad     numeric(10,4) NOT NULL,
  notas        text,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (producto_id, ingrediente_id)
);

-- Bitácora de producción: notas cronológicas por producto
CREATE TABLE producto_notas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id uuid NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  tipo        text CHECK (tipo IN ('prueba','ajuste','proximo-paso','incidente','otro')),
  titulo      text NOT NULL,
  contenido   text,
  fecha       timestamptz DEFAULT now(),
  autor       text,
  created_at  timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE proveedores            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredientes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto_ingredientes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto_notas         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON proveedores            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON ingredientes           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON producto_ingredientes  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON producto_notas         FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ampliar política de productos: authenticated puede escribir (antes solo leer)
DROP POLICY IF EXISTS "auth_read" ON productos;
CREATE POLICY "auth_all" ON productos FOR ALL TO authenticated USING (true) WITH CHECK (true);
