-- ============================================================
-- COQUEROS CRM — Módulo de Ventas
-- Encabezado por transacción + líneas por producto
-- ============================================================

CREATE TABLE ventas (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha          date NOT NULL,
  aliado_id      uuid REFERENCES aliados(id) ON DELETE SET NULL,
  metodo_pago    text CHECK (metodo_pago IN ('efectivo-usd','efectivo-bs','transferencia','pago-movil','zelle','binance','otro')),
  notas          text,
  monto_total    numeric(10,2) DEFAULT 0,
  costo_total    numeric(10,2) DEFAULT 0,
  ganancia       numeric(10,2) GENERATED ALWAYS AS (COALESCE(monto_total,0) - COALESCE(costo_total,0)) STORED,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE TRIGGER ventas_updated_at
  BEFORE UPDATE ON ventas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX ventas_fecha_idx ON ventas (fecha);
CREATE INDEX ventas_aliado_idx ON ventas (aliado_id);

CREATE TABLE venta_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id       uuid NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id    uuid REFERENCES productos(id) ON DELETE SET NULL,
  descripcion    text,                              -- para ventas sin producto del catálogo
  cantidad       numeric(10,2) NOT NULL DEFAULT 1,
  precio_unit    numeric(10,2) NOT NULL DEFAULT 0,
  costo_unit     numeric(10,2) DEFAULT 0,
  subtotal       numeric(10,2) GENERATED ALWAYS AS (cantidad * precio_unit) STORED,
  subtotal_costo numeric(10,2) GENERATED ALWAYS AS (cantidad * COALESCE(costo_unit,0)) STORED,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX venta_items_venta_idx ON venta_items (venta_id);

-- Función: recalcular totales del encabezado desde sus líneas
CREATE OR REPLACE FUNCTION recalc_venta_totales(v_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE ventas
  SET monto_total = COALESCE((SELECT SUM(subtotal)       FROM venta_items WHERE venta_id = v_id), 0),
      costo_total = COALESCE((SELECT SUM(subtotal_costo) FROM venta_items WHERE venta_id = v_id), 0)
  WHERE id = v_id;
END;
$$;

CREATE OR REPLACE FUNCTION trg_recalc_venta_totales()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalc_venta_totales(OLD.venta_id);
    RETURN OLD;
  ELSE
    PERFORM recalc_venta_totales(NEW.venta_id);
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER venta_items_recalc
  AFTER INSERT OR UPDATE OR DELETE ON venta_items
  FOR EACH ROW EXECUTE FUNCTION trg_recalc_venta_totales();

-- RLS
ALTER TABLE ventas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_items  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON ventas       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON venta_items  FOR ALL TO authenticated USING (true) WITH CHECK (true);
