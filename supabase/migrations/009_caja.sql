-- ============================================================
-- COQUEROS CRM — Módulo de Caja (contabilidad simple)
-- Registro unificado de ingresos y egresos. Cada venta genera
-- automáticamente 2 movimientos (ingreso monto_total + egreso
-- costo_total con concepto 'fondo restock'). Movimientos
-- manuales adicionales cubren gastos operativos y otros ingresos.
-- El saldo neto acumulado es lo que /objetivos leerá para las
-- métricas de ganancia (fase C).
-- ============================================================

CREATE TABLE IF NOT EXISTS caja_movimientos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha        date NOT NULL DEFAULT current_date,
  tipo         text NOT NULL CHECK (tipo IN ('ingreso','egreso')),
  categoria    text NOT NULL,
  monto        numeric(10,2) NOT NULL CHECK (monto >= 0),
  metodo_pago  text CHECK (metodo_pago IN ('efectivo-usd','efectivo-bs','transferencia','pago-movil','zelle','binance','otro')),
  descripcion  text,
  venta_id     uuid REFERENCES ventas(id) ON DELETE CASCADE,
  origen       text NOT NULL DEFAULT 'manual' CHECK (origen IN ('manual','venta-auto')),
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE TRIGGER caja_movimientos_updated_at
  BEFORE UPDATE ON caja_movimientos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS caja_mov_fecha_idx    ON caja_movimientos (fecha DESC);
CREATE INDEX IF NOT EXISTS caja_mov_tipo_idx     ON caja_movimientos (tipo);
CREATE INDEX IF NOT EXISTS caja_mov_venta_idx    ON caja_movimientos (venta_id);
CREATE INDEX IF NOT EXISTS caja_mov_origen_idx   ON caja_movimientos (origen);

-- ─── Sincronización venta → caja ────────────────────────────
-- Se dispara en INSERT y UPDATE de ventas (recalc_venta_totales
-- actualiza monto_total/costo_total tras insertar venta_items,
-- así que UPDATE es el evento donde los totales quedan reales).
-- Es idempotente: borra los movimientos auto previos de la venta
-- y los recrea con los valores actuales.
CREATE OR REPLACE FUNCTION sync_caja_venta()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM caja_movimientos
   WHERE venta_id = NEW.id AND origen = 'venta-auto';

  IF COALESCE(NEW.monto_total, 0) > 0 THEN
    INSERT INTO caja_movimientos (fecha, tipo, categoria, monto, metodo_pago, descripcion, venta_id, origen)
    VALUES (
      NEW.fecha, 'ingreso', 'venta', NEW.monto_total, NEW.metodo_pago,
      'Venta #' || substring(NEW.id::text, 1, 8),
      NEW.id, 'venta-auto'
    );
  END IF;

  IF COALESCE(NEW.costo_total, 0) > 0 THEN
    INSERT INTO caja_movimientos (fecha, tipo, categoria, monto, descripcion, venta_id, origen)
    VALUES (
      NEW.fecha, 'egreso', 'materia-prima', NEW.costo_total,
      'Fondo restock auto (venta #' || substring(NEW.id::text, 1, 8) || ')',
      NEW.id, 'venta-auto'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER ventas_sync_caja
  AFTER INSERT OR UPDATE ON ventas
  FOR EACH ROW EXECUTE FUNCTION sync_caja_venta();

-- ─── Backfill de ventas existentes ──────────────────────────
INSERT INTO caja_movimientos (fecha, tipo, categoria, monto, metodo_pago, descripcion, venta_id, origen)
SELECT
  fecha, 'ingreso', 'venta', monto_total, metodo_pago,
  'Venta #' || substring(id::text, 1, 8),
  id, 'venta-auto'
FROM ventas
WHERE COALESCE(monto_total, 0) > 0
  AND NOT EXISTS (
    SELECT 1 FROM caja_movimientos cm
     WHERE cm.venta_id = ventas.id AND cm.origen = 'venta-auto' AND cm.tipo = 'ingreso'
  );

INSERT INTO caja_movimientos (fecha, tipo, categoria, monto, descripcion, venta_id, origen)
SELECT
  fecha, 'egreso', 'materia-prima', costo_total,
  'Fondo restock auto (venta #' || substring(id::text, 1, 8) || ')',
  id, 'venta-auto'
FROM ventas
WHERE COALESCE(costo_total, 0) > 0
  AND NOT EXISTS (
    SELECT 1 FROM caja_movimientos cm
     WHERE cm.venta_id = ventas.id AND cm.origen = 'venta-auto' AND cm.tipo = 'egreso'
  );

-- RLS
ALTER TABLE caja_movimientos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON caja_movimientos FOR ALL TO authenticated USING (true) WITH CHECK (true);
