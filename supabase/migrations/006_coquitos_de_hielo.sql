-- ============================================================
-- COQUEROS CRM — Nuevo producto: Coquitos de Hielo
-- Agua de coco congelada en forma esférica.
-- Costos y precios iniciales estimados — ajustar desde /crm/productos.
-- ============================================================

INSERT INTO productos (nombre, presentacion, descripcion, costo, precio_mayor, precio_final, precio_detal, precio_aliado, ganancia, unidad_medida, activo)
VALUES
  ('Coquitos de Hielo', 'Bolsa 10 uds',  'Esferas de agua de coco 100% natural, congeladas. Ideal para cocteles, aguas saborizadas y consumo directo.',  2.50, 5.00, 6.00, 6.00, 5.00, 3.50, 'bolsa', true),
  ('Coquitos de Hielo', 'Bolsa 20 uds',  'Presentación mayorista para HORECA. Esferas de agua de coco congelada.',                                        4.80, 9.00, 11.00, 11.00, 9.50, 6.20, 'bolsa', true);
