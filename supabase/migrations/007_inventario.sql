-- ============================================================
-- COQUEROS CRM — Módulo de Inventario
-- 3 niveles de stock:
--  1. Materia prima (ingredientes/insumos)  → columnas nuevas en `ingredientes`
--  2. Producto terminado (bodega propia)    → tabla `producto_stock`
--  3. Producto en consignación (por aliado) → tabla `stock_aliado`
-- Historial unificado en `movimientos_stock`.
-- ============================================================

-- 1) Materia prima: añadir campos de stock al catálogo existente
ALTER TABLE ingredientes
  ADD COLUMN IF NOT EXISTS stock_actual numeric(12,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_minimo numeric(12,4) DEFAULT 0;

-- 2) Producto terminado en bodega propia
CREATE TABLE IF NOT EXISTS producto_stock (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id  uuid NOT NULL UNIQUE REFERENCES productos(id) ON DELETE CASCADE,
  stock_actual numeric(12,2) DEFAULT 0,
  stock_minimo numeric(12,2) DEFAULT 0,
  updated_at   timestamptz DEFAULT now()
);

CREATE TRIGGER producto_stock_updated_at
  BEFORE UPDATE ON producto_stock
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 3) Stock en nevera de aliado (consignación)
CREATE TABLE IF NOT EXISTS stock_aliado (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aliado_id   uuid NOT NULL REFERENCES aliados(id) ON DELETE CASCADE,
  producto_id uuid NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad    numeric(12,2) DEFAULT 0,
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (aliado_id, producto_id)
);

CREATE TRIGGER stock_aliado_updated_at
  BEFORE UPDATE ON stock_aliado
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS stock_aliado_aliado_idx  ON stock_aliado (aliado_id);
CREATE INDEX IF NOT EXISTS stock_aliado_producto_idx ON stock_aliado (producto_id);

-- 4) Historial unificado de movimientos de stock
CREATE TABLE IF NOT EXISTS movimientos_stock (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambito           text NOT NULL CHECK (ambito IN ('materia-prima','producto','consignacion')),
  operacion        text NOT NULL CHECK (operacion IN ('entrada','salida','ajuste','venta','merma','traslado','restock')),
  ingrediente_id   uuid REFERENCES ingredientes(id) ON DELETE SET NULL,
  producto_id      uuid REFERENCES productos(id) ON DELETE SET NULL,
  aliado_id        uuid REFERENCES aliados(id) ON DELETE SET NULL,
  cantidad         numeric(12,4) NOT NULL,
  cantidad_antes   numeric(12,4),
  cantidad_despues numeric(12,4),
  motivo           text,
  venta_id         uuid REFERENCES ventas(id) ON DELETE SET NULL,
  autor            text,
  fecha            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS movimientos_stock_fecha_idx    ON movimientos_stock (fecha DESC);
CREATE INDEX IF NOT EXISTS movimientos_stock_producto_idx ON movimientos_stock (producto_id);
CREATE INDEX IF NOT EXISTS movimientos_stock_aliado_idx   ON movimientos_stock (aliado_id);

-- Sembrar producto_stock para cada producto activo con 0 unidades
INSERT INTO producto_stock (producto_id, stock_actual, stock_minimo)
SELECT id, 0, 0 FROM productos
WHERE NOT EXISTS (SELECT 1 FROM producto_stock ps WHERE ps.producto_id = productos.id);

-- RLS
ALTER TABLE producto_stock     ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_aliado       ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_stock  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON producto_stock     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON stock_aliado       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON movimientos_stock  FOR ALL TO authenticated USING (true) WITH CHECK (true);
