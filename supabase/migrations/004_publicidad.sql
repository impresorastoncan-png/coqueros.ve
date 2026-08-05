-- ============================================================
-- COQUEROS CRM — Banco de Publicidad
-- Metadatos de flyers, posts, gráficos y videos
-- El archivo binario vive en Supabase Storage bucket "publicidad"
-- ============================================================

CREATE TABLE publicidad (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo        text NOT NULL,
  descripcion   text,
  tipo          text CHECK (tipo IN ('flyer','post-ig','post-wa','story','grafico','video','logo','otro')),
  plataforma    text CHECK (plataforma IN ('instagram','whatsapp','facebook','tiktok','impreso','email','web','otro')),
  storage_path  text,                                -- path dentro del bucket 'publicidad'
  url_externa   text,                                -- link opcional (post publicado, drive, etc.)
  mime_type     text,
  tamano_bytes  bigint,
  tags          text[] DEFAULT '{}',
  fecha_creacion date DEFAULT CURRENT_DATE,
  autor         text,
  activo        boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE TRIGGER publicidad_updated_at
  BEFORE UPDATE ON publicidad
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX publicidad_tipo_idx       ON publicidad (tipo);
CREATE INDEX publicidad_plataforma_idx ON publicidad (plataforma);
CREATE INDEX publicidad_fecha_idx      ON publicidad (fecha_creacion DESC);
CREATE INDEX publicidad_tags_idx       ON publicidad USING gin(tags);

ALTER TABLE publicidad ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON publicidad FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Bucket de Storage: crear si no existe (idempotente)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'publicidad',
  'publicidad',
  true,                     -- URLs públicas para poder mostrar en <img>
  52428800,                 -- 50 MB por archivo
  ARRAY['image/png','image/jpeg','image/gif','image/webp','image/svg+xml','video/mp4','video/quicktime','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Policies del bucket: authenticated puede leer/escribir/borrar
CREATE POLICY "auth_read_publicidad" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'publicidad');

CREATE POLICY "auth_insert_publicidad" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'publicidad');

CREATE POLICY "auth_update_publicidad" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'publicidad');

CREATE POLICY "auth_delete_publicidad" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'publicidad');

-- Los archivos son públicos (bucket public=true) para que <img src> funcione sin firma
CREATE POLICY "anon_read_publicidad" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'publicidad');
