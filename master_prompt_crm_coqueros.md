# MASTER PROMPT — CRM COQUEROS

> Pégale esto a Claude Code al abrir el proyecto. Está pensado para construir por fases, sin tocar la landing pública existente.

---

## CONTEXTO DEL NEGOCIO

Estás construyendo el CRM interno de **Coqueros**, una marca artesanal venezolana de bebidas de coco con base en Caracas. Vende **solo 3 productos** embotellados:

- **Jugo de coco** (leche de coco CON stevia) — 0.5 L y 1 L
- **Leche de coco** (sin stevia) — 0.5 L y 1 L
- **Agua de coco** — 0.35 L, 0.5 L y 1 L

El modelo de venta principal es **B2B por consignación / punto de venta en aliados**: se coloca una nevera o cava de marca dentro del local del aliado, y el aliado gana un margen por unidad. Los clientes son cafeterías, restaurantes, gimnasios y estudios de pilates/yoga en el este de Caracas (Chacao, Altamira, La Castellana, Los Palos Grandes, Las Mercedes).

Opera como **persona natural** (aún sin registro formal), RIF V-301420346, contacto Juan Ignacio Goncalves Madiedo, WhatsApp +58 412 396 6330.

**Precios vigentes (modelo doble costo: se aparta un monto igual al costo como fondo de restock antes de contar ganancia neta):**

| Producto | Presentación | Costo | Restock | P. Mayor | P. Final | Ganancia |
|---|---|---|---|---|---|---|
| Jugo/Leche | 0.5 L | $1.10 | $1.10 | $3.00 | $3.50 | $1.30 |
| Jugo/Leche | 1 L | $2.20 | $2.20 | $6.00 | $7.00 | $2.60 |
| Jugo/Leche | Promo 2 L | $4.40 | $4.40 | — | $12.00 | $3.20 |
| Agua | 350 ml | $1.48 | — | — | $3.50 | — |
| Agua | 500 ml | $1.95 | — | — | $4.00 | — |

Precios aliado (B2B): agua 500ml $3.50, agua 350ml $3, leche 500ml $3.

---

## OBJETIVO DEL PROYECTO

Un **CRM interno** cuyo corazón es la **gestión de aliados comerciales B2B** (pipeline de ventas + seguimiento de ruta), diseñado desde el arranque para escalar hacia la **visualización de la operación completa** (pedidos, consignación, cobros, inventario, márgenes) en fases posteriores. No construyas todo de una vez: sigue el roadmap por fases de abajo.

**Usuarios:** equipo pequeño de 2–4 personas (dueño, vendedor de ruta, motorizado). Necesita funcionar bien en **escritorio y en móvil** (el vendedor y el motorizado usan celular en la calle).

---

## STACK Y RESTRICCIONES TÉCNICAS

- **Mismo stack de la web existente:** Next.js (App Router) + Vercel. La landing pública ya vive en este proyecto (`coqueros.vercel.app`). **No la modifiques ni rompas.** El CRM va en un área separada y protegida.
- **Base de datos propia:** usa **Supabase (Postgres)** — encaja con Vercel, da auth y row-level security listos, y tiene tier gratis. Si ves mejor opción, propónmela antes de decidir.
- **Auth:** el CRM es privado. Login obligatorio (Supabase Auth). La landing sigue pública; todo lo que esté bajo `/app` (o `/crm`) requiere sesión.
- **Import/Export Excel es requisito de primera clase:** debo poder **importar** mis Excel actuales de Coqueros (aliados, ventas, costos) y **exportar** cualquier vista a `.xlsx`. Usa `xlsx` (SheetJS) o similar. Diseña los importadores tolerantes a columnas desordenadas y con vista previa antes de confirmar.
- **UI:** Tailwind + shadcn/ui. Responsive real, mobile-first para las vistas de ruta.
- **Idioma:** todo en **español**. Formato de moneda en USD ($), que es como Coqueros maneja precios.

**Identidad visual (Manual de Marca oficial):**
- Verde hoja `#6FB04A`, Café coco oscuro `#6E3F22`
- Secundarios: verde salvia `#C0D1C6`, amarillo mango `#FDC829`, azul mar `#006994`, beige `#F5F5DC`
- Reutiliza los assets que ya están en el proyecto (mascota "Coquito", `coquito.jpeg`, etc.).

---

## MODELO DE DATOS INICIAL (Fase 1)

Diseña las tablas pensando en el crecimiento, aunque solo llenes algunas ahora:

- **`aliados`** (cuentas B2B): nombre, tipo (cafetería / restaurante / gimnasio / pilates-yoga / market / otro), zona (Chacao, Altamira, La Castellana, Los Palos Grandes, Las Mercedes…), dirección, coordenadas (lat/lng), estado del pipeline, tiene_nevera (bool), notas, fecha de creación.
- **`contactos`**: persona, cargo, teléfono/WhatsApp, email, aliado_id (FK).
- **`interacciones`**: aliado_id, tipo (visita / llamada / WhatsApp / email / degustación), fecha, resultado, próximo paso, responsable.
- **`pipeline_stages`**: catálogo editable. Default: `Prospecto → Contactado → Degustación → Negociación → Nevera colocada → Activo → En pausa → Perdido`.
- **`productos`**: los 3 SKUs con sus presentaciones, costos y precios de la tabla de arriba (seed inicial).
- **`usuarios`**: perfil + rol (admin / vendedor / motorizado).

Tablas que dejarás **esbozadas pero vacías** para fases futuras (crea el schema si es barato, pero no construyas UI aún): `pedidos`, `consignaciones`, `movimientos_inventario`, `cobros`.

---

## ROADMAP POR FASES

Construye en este orden. **Al terminar cada fase, párate y muéstrame lo que hay antes de seguir.**

**FASE 0 — Andamiaje.** Estructura de carpetas, Supabase conectado, auth funcionando, layout del CRM con sidebar, tema de marca aplicado, ruta `/app` protegida sin tocar la landing. Migraciones del schema de Fase 1.

**FASE 1 — Aliados + Pipeline (el corazón).** CRUD de aliados y contactos. Vista de pipeline tipo kanban (arrastrar entre etapas) + vista de tabla filtrable por zona/tipo/estado. Registro de interacciones con "próximo paso" y recordatorios. Importar/exportar aliados desde/hacia Excel.

**FASE 2 — Ruta de ventas.** Vista de ruta/mapa de los aliados por zona (usa las coordenadas). Lista de visitas del día para el vendedor en móvil. Marcar "visitado" y registrar resultado desde el celular. Botón directo a WhatsApp de cada contacto.

**FASE 3 — Pedidos y consignación (visualización de operación).** Registrar pedidos por aliado, colocación de producto en consignación, y liquidación (cuánto se vendió, cuánto se cobra). Dashboard de qué hay colocado en cada nevera.

**FASE 4 — Tablero gerencial.** Métricas de ventas, márgenes por producto (usando el modelo doble-costo), aliados activos vs. en pausa, y resumen tipo estado de resultados. Exportable a Excel.

---

## PRINCIPIOS DE TRABAJO

1. **Fase por fase.** No adelantes UI de fases futuras. Termina, muestra, y espera mi OK.
2. **No rompas la landing** ni sus assets. Trabaja aislado bajo `/app`.
3. **Español en todo:** UI, nombres de campos visibles, mensajes.
4. **Mobile-first** en las vistas de ruta; escritorio para gestión.
5. **Import/export Excel** debe funcionar de verdad y con vista previa, no como afterthought.
6. **Explícame las decisiones de arquitectura** (elección de librerías, estructura de datos) en frases cortas antes de comprometerlas, sobre todo si te desvías de este prompt.
7. **Commits pequeños y descriptivos** por cada pieza funcional.

## PRIMER PASO

Antes de escribir código: explora el proyecto actual, dime cómo está estructurado (dónde vive la landing, qué assets hay, qué dependencias ya están instaladas), y propón el plan concreto de la **Fase 0** con la estructura de carpetas y las migraciones de Supabase. Espera mi confirmación antes de ejecutar.
