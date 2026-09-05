-- ============================================================
-- COQUEROS CRM — Módulo Motorizado
-- Registra rutas asignadas al motorizado con costo calculado
-- como km × tarifa_usd_km (default 0.22, editable por ruta).
-- Estado 'pendiente' hasta que se marca 'pagada' → dispara
-- egreso en caja_movimientos (categoria='motorizado').
-- Snapshot del orden de aliados se guarda en JSON para no
-- depender de referencias que pueden cambiar/desaparecer.
-- ============================================================

CREATE TABLE IF NOT EXISTS rutas_motorizado (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha               date NOT NULL DEFAULT current_date,
  km                  numeric(10,2) NOT NULL CHECK (km >= 0),
  tarifa_usd_km       numeric(6,4)  NOT NULL DEFAULT 0.22 CHECK (tarifa_usd_km >= 0),
  costo               numeric(10,2) GENERATED ALWAYS AS (ROUND(km * tarifa_usd_km, 2)) STORED,
  num_paradas         int NOT NULL DEFAULT 0,
  duracion_segundos   int,
  origen_lat          numeric,
  origen_lng          numeric,
  motorizado_nombre   text,
  notas               text,
  snapshot            jsonb,
  estado              text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','pagada')),
  pagada_at           timestamptz,
  caja_movimiento_id  uuid REFERENCES caja_movimientos(id) ON DELETE SET NULL,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE TRIGGER rutas_motorizado_updated_at
  BEFORE UPDATE ON rutas_motorizado
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS rutas_motorizado_fecha_idx  ON rutas_motorizado (fecha DESC);
CREATE INDEX IF NOT EXISTS rutas_motorizado_estado_idx ON rutas_motorizado (estado);

-- RLS
ALTER TABLE rutas_motorizado ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON rutas_motorizado FOR ALL TO authenticated USING (true) WITH CHECK (true);
