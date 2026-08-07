-- ============================================================
-- COQUEROS CRM — Producto principal por aliado
-- Se usa cuando el aliado está en etapa "Activo" para saber
-- cuál es el SKU insignia colocado en su nevera.
-- ============================================================

ALTER TABLE aliados
  ADD COLUMN IF NOT EXISTS producto_principal_id uuid REFERENCES productos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS aliados_producto_principal_idx ON aliados (producto_principal_id);
