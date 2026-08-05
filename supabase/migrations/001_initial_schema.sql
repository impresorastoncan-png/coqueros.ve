-- ============================================================
-- COQUEROS CRM — Schema inicial
-- Fase 0: Andamiaje completo. Fase 1 lista para conectar UI.
-- ============================================================

-- Pipeline stages (catálogo editable)
CREATE TABLE pipeline_stages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text NOT NULL,
  orden      integer NOT NULL,
  color      text,
  created_at timestamptz DEFAULT now()
);

INSERT INTO pipeline_stages (nombre, orden, color) VALUES
  ('Prospecto',        1, '#94a3b8'),
  ('Contactado',       2, '#60a5fa'),
  ('Degustación',      3, '#a78bfa'),
  ('Negociación',      4, '#f59e0b'),
  ('Nevera colocada',  5, '#6FB04A'),
  ('Activo',           6, '#22c55e'),
  ('En pausa',         7, '#f97316'),
  ('Perdido',          8, '#ef4444');

-- Productos (3 SKUs con presentaciones)
CREATE TABLE productos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        text NOT NULL,
  presentacion  text NOT NULL,
  costo         numeric(10,2),
  precio_mayor  numeric(10,2),
  precio_final  numeric(10,2),
  ganancia      numeric(10,2),
  activo        boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

INSERT INTO productos (nombre, presentacion, costo, precio_mayor, precio_final, ganancia) VALUES
  ('Jugo de Coco',   '500ml',    1.10, 3.00, 3.50,  1.30),
  ('Jugo de Coco',   '1L',       2.20, 6.00, 7.00,  2.60),
  ('Jugo de Coco',   'Promo 2L', 4.40, null, 12.00, 3.20),
  ('Leche de Coco',  '500ml',    1.10, 3.00, 3.50,  1.30),
  ('Leche de Coco',  '1L',       2.20, 6.00, 7.00,  2.60),
  ('Leche de Coco',  'Promo 2L', 4.40, null, 12.00, 3.20),
  ('Agua de Coco',   '350ml',    1.48, null, 3.50,  null),
  ('Agua de Coco',   '500ml',    1.95, null, 4.00,  null),
  ('Agua de Coco',   '1L',       null, null, null,  null);

-- Usuarios (extiende auth.users de Supabase)
CREATE TABLE usuarios (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre     text,
  rol        text NOT NULL DEFAULT 'vendedor' CHECK (rol IN ('admin', 'vendedor', 'motorizado')),
  activo     boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Aliados B2B
CREATE TABLE aliados (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre             text NOT NULL,
  tipo               text NOT NULL CHECK (tipo IN ('cafetería','restaurante','gimnasio','pilates-yoga','market','otro')),
  zona               text,
  direccion          text,
  lat                numeric(10,7),
  lng                numeric(10,7),
  pipeline_stage_id  uuid REFERENCES pipeline_stages(id),
  tiene_nevera       boolean DEFAULT false,
  notas              text,
  activo             boolean DEFAULT true,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

-- Trigger: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER aliados_updated_at
  BEFORE UPDATE ON aliados
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Contactos por aliado
CREATE TABLE contactos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aliado_id    uuid NOT NULL REFERENCES aliados(id) ON DELETE CASCADE,
  nombre       text NOT NULL,
  cargo        text,
  telefono     text,
  email        text,
  es_principal boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

-- Interacciones / registro de actividad
CREATE TABLE interacciones (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aliado_id     uuid NOT NULL REFERENCES aliados(id) ON DELETE CASCADE,
  tipo          text NOT NULL CHECK (tipo IN ('visita','llamada','whatsapp','email','degustación','otro')),
  fecha         timestamptz NOT NULL DEFAULT now(),
  resultado     text,
  proximo_paso  text,
  responsable   text,
  created_at    timestamptz DEFAULT now()
);

-- ── Tablas futuras (schema esbozado, sin UI en Fase 0) ──────────────────────

CREATE TABLE pedidos (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aliado_id  uuid REFERENCES aliados(id),
  fecha      timestamptz DEFAULT now(),
  estado     text DEFAULT 'pendiente',
  total      numeric(10,2),
  notas      text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE consignaciones (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aliado_id          uuid REFERENCES aliados(id),
  pedido_id          uuid REFERENCES pedidos(id),
  fecha_colocacion   timestamptz DEFAULT now(),
  fecha_liquidacion  timestamptz,
  estado             text DEFAULT 'activa',
  created_at         timestamptz DEFAULT now()
);

CREATE TABLE movimientos_inventario (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id  uuid REFERENCES productos(id),
  tipo         text,
  cantidad     integer,
  referencia_id uuid,
  notas        text,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE cobros (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aliado_id  uuid REFERENCES aliados(id),
  pedido_id  uuid REFERENCES pedidos(id),
  monto      numeric(10,2),
  fecha      timestamptz DEFAULT now(),
  metodo     text,
  estado     text DEFAULT 'pendiente',
  created_at timestamptz DEFAULT now()
);

-- ── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE aliados              ENABLE ROW LEVEL SECURITY;
ALTER TABLE contactos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE interacciones        ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios             ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignaciones       ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobros               ENABLE ROW LEVEL SECURITY;

-- Política simple Fase 0: cualquier usuario autenticado puede leer/escribir.
-- Refinar con roles en fases posteriores.
CREATE POLICY "auth_all" ON aliados              FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON contactos            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON interacciones        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_read" ON pipeline_stages     FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON productos           FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all" ON pedidos              FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON consignaciones       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON movimientos_inventario FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON cobros               FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "own_profile" ON usuarios          FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
