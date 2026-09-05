-- ============================================================
-- COQUEROS CRM — Producto de interés (aliados potenciales)
-- Complementa a producto_principal_id (que aplica solo en etapa
-- Activo). producto_interes_id se usa en potenciales para saber
-- qué SKU quieren cuando aún están en el pipeline (Prospecto,
-- Contactado, Degustación, Negociación, Nevera colocada).
-- Cuando el aliado pasa a Activo, el producto_interes se
-- promueve manualmente a producto_principal desde el form.
-- ============================================================

ALTER TABLE aliados
  ADD COLUMN IF NOT EXISTS producto_interes_id uuid REFERENCES productos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS aliados_producto_interes_idx ON aliados (producto_interes_id);
