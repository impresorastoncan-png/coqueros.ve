-- ============================================================
-- COQUEROS CRM — Módulo de Objetivos
-- Metas del negocio con progreso calculado desde ventas y aliados
-- ============================================================

CREATE TABLE IF NOT EXISTS objetivos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo         text NOT NULL,
  descripcion    text,
  categoria      text CHECK (categoria IN ('financiero','comercial','operativo','personal')),
  metrica        text NOT NULL CHECK (metrica IN (
    'ganancia_mensual',
    'ganancia_semanal',
    'ganancia_acumulada',
    'ventas_mensual',
    'ventas_semanal',
    'aliados_activos',
    'neveras_colocadas',
    'unidades_vendidas_mes',
    'custom'
  )),
  target_valor   numeric(12,2) NOT NULL,
  target_fecha   date,
  valor_inicial  numeric(12,2) DEFAULT 0,   -- para métricas acumuladas
  estado         text NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','cumplido','pausado','cancelado')),
  prioridad      text NOT NULL DEFAULT 'media' CHECK (prioridad IN ('alta','media','baja')),
  icono          text DEFAULT '🎯',
  color          text DEFAULT '#FDC829',
  notas          text,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE TRIGGER objetivos_updated_at
  BEFORE UPDATE ON objetivos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS objetivos_estado_idx ON objetivos (estado);

-- RLS
ALTER TABLE objetivos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON objetivos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Semilla: objetivos ejemplo basados en la conversación de arranque
INSERT INTO objetivos (titulo, descripcion, categoria, metrica, target_valor, prioridad, icono, color)
VALUES
  ('$1.000 de ganancia mensual',
   'Meta financiera base. Ganancia neta (monto - costo) por mes calendario.',
   'financiero', 'ganancia_mensual', 1000, 'alta', '💰', '#6FB04A'),

  ('Comprar neverita adicional ($150)',
   'Ahorro operativo para colocar otra nevera. Se cuenta contra la ganancia acumulada desde hoy.',
   'operativo', 'ganancia_acumulada', 150, 'alta', '❄️', '#006994'),

  ('10 alianzas comerciales activas',
   'Aliados en etapa Activo del pipeline. Umbral mínimo para diversificar riesgo.',
   'comercial', 'aliados_activos', 10, 'alta', '🤝', '#FDC829'),

  ('$150 de utilidad semanal (primer empleado)',
   'Cuando la utilidad semanal cruza este umbral de forma consistente, se justifica contratar apoyo.',
   'personal', 'ganancia_semanal', 150, 'media', '👤', '#a78bfa');
