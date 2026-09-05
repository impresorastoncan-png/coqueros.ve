# CLAUDE.md — Coqueros CRM

Contexto persistente para retomar el proyecto en sesiones nuevas. Léelo primero antes de tocar código.

---

## Qué es el proyecto

CRM interno para **Coqueros**, marca artesanal venezolana de bebidas de coco (jugo, leche y agua) con modelo B2B por consignación (nevera dentro del aliado). Opera como persona natural, sin registro formal aún. Base en Caracas, zona este (Chacao, Altamira, La Castellana, Los Palos Grandes, Las Mercedes).

El repo tiene 2 cosas conviviendo:
1. **Landing pública** en `/` (`app/page.tsx`) — página "próximamente online" con formulario B2B.
2. **CRM privado** en `/crm/*` — protegido por Supabase Auth vía `middleware.ts`.

El documento canónico de negocio y roadmap está en `master_prompt_crm_coqueros.md`. Este CLAUDE.md es el complemento técnico.

---

## Stack

- **Next.js 15** (App Router, RSC) — `package.json` fija `next: ^15.3.4`, en runtime está corriendo 15.5.22
- **React 19**, **TypeScript 5**
- **Tailwind 3.4** — colores de marca hardcodeados en clases (verde `#6FB04A`, café `#6E3F22`, crema `#F5F5DC`, ámbar `#FDC829`)
- **Supabase** (Postgres + Auth + Storage) — cliente `@supabase/ssr ^0.6.1`
- **Google Maps JS API** vía `@googlemaps/js-api-loader` v2 (functional `importLibrary`) — usado en `/ruta` (Directions + optimización de waypoints) y `/presencia` (círculos de calor). Nota: `HeatmapLayer` fue removido de Maps JS 3.65; `/presencia` usa `google.maps.Circle` ponderados para el efecto heatmap.
- **Gemini API** (Google AI Studio) — para asesoría en `/objetivos`. Key en `GEMINI_API_KEY`. Modelo actual `gemini-2.5-flash`.
- **@hello-pangea/dnd** — drag & drop del kanban del pipeline
- **xlsx (SheetJS)** — import/export Excel
- **Leaflet + react-leaflet** — deps residuales del mapa anterior de `/ruta`. Ya no se usan; se pueden desinstalar cuando se limpie.

---

## Estructura

```
app/
  page.tsx               # landing pública "próximamente"
  layout.tsx             # root layout con fonts (Inter + Bebas Neue)
  globals.css
  crm/
    layout.tsx           # one-liner: <CrmShell>{children}</CrmShell>
    login/page.tsx       # 'use client' — export const dynamic = 'force-dynamic'
    dashboard/page.tsx   # KPIs
    aliados/
      page.tsx           # dos secciones: Activos (agrupados por producto_principal) + Potenciales (agrupados por producto_interes). Filtros: zona/tipo/búsqueda.
      nuevo/page.tsx
      [id]/page.tsx      # ficha del aliado
      import-wrapper.tsx
    pipeline/page.tsx    # kanban
    ruta/page.tsx        # ruta del día
    motorizado/page.tsx  # rutas asignadas al motorizado + costo km × tarifa (query params: ?anio&mes)
    ventas/page.tsx      # calendario mensual (query params: ?anio&mes)
    caja/page.tsx        # movimientos ingreso/egreso (auto desde ventas + manual)
    inventario/page.tsx  # 3 cards: materia prima, producto terminado, en clientes
    objetivos/page.tsx   # metas del negocio con insights de Gemini
    presencia/page.tsx   # mapa de zonas de calor de aliados
    productos/
      page.tsx           # catálogo agrupado por producto
      nuevo/page.tsx
      [id]/page.tsx      # ficha con receta y bitácora
      ingredientes/page.tsx
      proveedores/page.tsx
    publicidad/page.tsx  # galería con filtros
  api/
    objetivos/insights/route.ts   # POST → llama Gemini con contexto de negocio

components/crm/
  crm-shell.tsx          # client wrapper: sidebar fija en desktop, drawer en móvil (topbar + backdrop + bloquea scroll body)
  sidebar.tsx            # nav lateral (recibe onNavigate para cerrar el drawer al click)
  aliados-secciones.tsx  # client: renderiza grupos colapsables de aliados por producto (default abierto si ≤10)
  aliado-form.tsx
  contacto-form.tsx
  interaccion-form.tsx
  kanban-board.tsx
  ruta-cliente.tsx / ruta-mapa.tsx
  badge.tsx (StageBadge, TipoBadge)
  excel-buttons.tsx (ExportButton)
  import-help.tsx
  scroll-reveal.tsx              # también usado en landing
  producto-form.tsx
  receta-panel.tsx               # ingredientes por producto con cálculo de costo
  bitacora-panel.tsx             # notas cronológicas por producto
  ingredientes-table.tsx
  proveedores-table.tsx
  ventas-calendario.tsx          # grid de días 7x6 con click-para-abrir-panel
  venta-form-modal.tsx           # modal con líneas producto + auto-costo
  publicidad-galeria.tsx         # grid + upload modal + preview modal
  inventario-cliente.tsx         # 3 tabs de stock + modales ajuste/traslado/reducir
  objetivos-cliente.tsx          # grid de objetivos + botón "Consultar IA"
  presencia-cliente.tsx          # mapa Google + círculos ponderados por peso
  ruta-cliente.tsx / ruta-mapa.tsx  # Google Maps + optimización de waypoints + print PDF

lib/
  google-maps.ts                 # loader singleton (functional API v2)

lib/
  supabase/client.ts     # createBrowserClient (usa NEXT_PUBLIC_*)
  supabase/server.ts     # createServerClient con cookies
  actions/aliados.ts     # server actions
  actions/ruta.ts
  actions/productos.ts   # productos, ingredientes, proveedores, receta, notas
  actions/ventas.ts      # createVenta (transacción con items), deleteVenta
  actions/publicidad.ts  # createPublicidad, deletePublicidad
  actions/inventario.ts  # ajustar stock materia/producto, traslado, reducir cliente (auto-venta)
  actions/caja.ts        # createMovimiento / deleteMovimiento (manuales; los 'venta-auto' se borran solo desde /ventas)
  actions/motorizado.ts  # asignarRuta (desde /ruta tras optimizar) / marcarPagada (crea egreso en caja categoria='motorizado') / deleteRuta (borra también el mov de caja asociado)
  actions/objetivos.ts   # CRUD + computarProgresoTodas + generarInsights (Gemini)
  types.ts               # tipos TypeScript de las entidades

middleware.ts            # protege /crm/*, redirige a /crm/login
supabase/
  config.toml
  migrations/
    001_initial_schema.sql       # aliados, contactos, interacciones, pipeline, productos base
    002_productos_extended.sql   # proveedores, ingredientes, producto_ingredientes, producto_notas
    003_ventas.sql               # ventas + venta_items con trigger de recalcular totales
    004_publicidad.sql           # publicidad + bucket 'publicidad' en Storage
    005_aliado_producto_principal.sql  # producto_principal_id en aliados
    006_coquitos_de_hielo.sql    # nuevo SKU: Coquitos de Hielo (2 presentaciones)
    007_inventario.sql           # stock 3 niveles + movimientos_stock
    008_objetivos.sql            # objetivos con métricas calculadas + seeds
    009_caja.sql                 # caja_movimientos + trigger sync_caja_venta (INSERT/UPDATE en ventas → ingreso monto_total + egreso costo_total como 'venta-auto', idempotente por venta_id)
    010_motorizado.sql           # rutas_motorizado con costo generated (km × tarifa_usd_km, default 0.22) + snapshot jsonb + fk suave a caja_movimientos (SET NULL)
    011_aliado_producto_interes.sql  # producto_interes_id en aliados (SKU deseado por prospectos; complementa a producto_principal_id que aplica solo en Activo)
```

---

## Convenciones no-obvias

- **Todo en español** — nombres de campos visibles, mensajes UI, commit messages en general en español.
- **Todos los precios en USD** con `$`.
- **Cualquier página del CRM que use Supabase server-side debe tener `export const dynamic = 'force-dynamic'`** — sin esto Next.js intenta prerenderar en build y falla si no hay cookies/sesión. Aplica también a páginas `'use client'` que llamen a `createBrowserClient` en el body del componente (validación de env vars corre server-side durante prerender).
- **RLS habilitado en todas las tablas**, política actual `auth_all TO authenticated USING (true) WITH CHECK (true)` — refinar por rol en fase posterior.
- **Modelo doble costo**: cada venta aparta un monto igual al costo como fondo de restock antes de contar ganancia neta. Ver tabla de precios en `master_prompt_crm_coqueros.md`.
- **CRLF line endings** en Windows — git muestra warnings, ignóralos.

---

## Auth flow

- `middleware.ts` matchea `/crm/:path*`. Sin sesión → redirige a `/crm/login`. Con sesión y visitando `/crm/login` → redirige a `/crm/dashboard`.
- Login vía Supabase email+password (no OAuth aún). Signup manual desde el dashboard de Supabase.

---

## Deployment

Todo esto vive en memoria persistente pero listado aquí también porque es crítico para arreglos rápidos.

- **Vercel project**: `josephs-projects-6f38454c/coqueros` (project ID `prj_dBgFREk4pPLm812d6Bp7dAGRpKQb`)
- **URL producción**: https://coqueros.vercel.app
- **Framework** en Vercel: DEBE estar en `nextjs`. Si vuelve a `null`, el build corre pero no registra rutas → todo 404. Se arregla con `PATCH /v9/projects/coqueros` `{"framework":"nextjs"}`.
- **SSO Protection**: deshabilitado (`ssoProtection: null`). Si se re-activa con `all_except_custom_domains`, `coqueros.vercel.app` devuelve 404.
- **Env vars en Vercel** (Preview + Production): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (marked Sensitive — sí, va al cliente), `GEMINI_API_KEY` (solo server). También en `.env.local` para dev local.
- **Restricciones de Google Maps key**: la key `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` debe estar restringida por HTTP referrer a `coqueros.vercel.app/*` y `localhost:3000/*` en Google Cloud Console. Sin restricciones cualquiera puede usarla desde el bundle público. APIs habilitadas en el proyecto Google Cloud: Maps JavaScript API, Directions API, Distance Matrix API.
- **Auto-deploy** desde GitHub `main` funciona. Si un build queda con caché rara, forzar con `npx vercel --prod --force --scope josephs-projects-6f38454c`.

---

## Supabase

- Repo GitHub: https://github.com/impresorastoncan-png/coqueros.ve
- Proyecto Supabase: ref `fglmssqpkdljvmdwgwwn`. Dashboard: https://supabase.com/dashboard/project/fglmssqpkdljvmdwgwwn
- Credenciales locales en `supabase keys.txt` (gitignored, NUNCA commit).
- Access token para CLI/API en `supabase keys.txt` (línea `access:`). Exportar como `SUPABASE_ACCESS_TOKEN` para operar.
- Migraciones en `supabase/migrations/`. Aplicar con `SUPABASE_ACCESS_TOKEN=... npx supabase db push` (link previo: `npx supabase link --project-ref fglmssqpkdljvmdwgwwn`).
- **Bucket de Storage**: `publicidad` (público, 50 MB por archivo). Mimes permitidos: png/jpeg/gif/webp/svg, mp4/quicktime, pdf. Creado en migración 004.
- URLs públicas del bucket: `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/publicidad/<storage_path>`. La página `/crm/publicidad` calcula esto server-side.

---

## Roadmap del master prompt — estado

- [x] **Fase 0** — Andamiaje, Supabase, auth, layout, brand theme, migraciones iniciales
- [x] **Fase 1** — Aliados (CRUD + tabla + kanban), contactos, interacciones, import/export Excel
- [x] **Fase 2** — Ruta con mapa Leaflet, visitas del día, marcar visitado
- [ ] **Fase 3** — Pedidos, consignación, liquidación (tablas esbozadas, sin UI). El módulo de Ventas simplificado cubre parcialmente lo esperado.
- [ ] **Fase 4** — Tablero gerencial con márgenes, exportable

**Añadidos fuera del master prompt (2026-08-05):**
- [x] **Módulo Productos extendido** — recetas con ingredientes+proveedores, cálculo de costo estimado por unidad, bitácora de producción por SKU (tabs Datos/Precios + Receta + Bitácora). Sub-vistas para catálogo de ingredientes y proveedores.
- [x] **Módulo Ventas** — calendario mensual (grid 7×6 con navegación mes anterior/siguiente/hoy). Click en día → panel con ventas del día + botón nueva venta. Modal con líneas por producto (auto-fill precio y costo desde catálogo), método de pago, aliado opcional. Totales del mes en sidebar (monto, costo, ganancia, ticket promedio).
- [x] **Módulo Publicidad** — banco de assets con Supabase Storage (bucket público `publicidad`, 50 MB máx, imágenes/video/PDF). Galería con filtros por tipo/plataforma/búsqueda, upload modal (archivo o URL externa), preview modal con descarga.
- [x] **Módulo Caja** — contabilidad simple unificada. Cada venta dispara 2 movimientos automáticos vía trigger (`ingreso` = monto_total, `egreso` = costo_total con concepto "fondo restock"). Movimientos manuales cubren gastos operativos u otros ingresos. Los `venta-auto` no se borran desde `/caja`; hay que borrar la venta en `/ventas`. Feed hacia `/objetivos` y `/dashboard` (revalidatePath).
- [x] **Módulo Motorizado** — al optimizar ruta en `/crm/ruta` aparece botón "Asignar a motorizado" que abre modal con km ya calculados por Directions API, tarifa editable (default $0.22/km) y snapshot del orden de aliados. Rutas nacen `pendiente`; al marcar `pagada` se crea egreso manual en Caja (`categoria='motorizado'`) y se linkea vía `caja_movimiento_id`. Borrar la ruta también borra el movimiento en caja asociado.
- [x] **Shell móvil** — `components/crm/crm-shell.tsx` envuelve el CRM: topbar solo en móvil, drawer con backdrop, bloquea scroll del body cuando está abierto, y auto-cierra al cambiar de ruta (`usePathname`).

**Pendiente / futuro:**
- [ ] Roles diferenciados en RLS (admin / vendedor / motorizado) — hoy `authenticated USING (true)` sin discriminar.
- [ ] Export Excel del módulo Ventas (analogía con Aliados).
- [ ] Import Excel de ventas históricas para bootstrap.
- [ ] Módulos originales de Fase 3 completos (pedidos + consignación + liquidación) si el negocio los necesita más allá de Ventas simple.
- [ ] Tablero gerencial de Fase 4 alimentado por `ventas`.

---

## Cómo trabajar en este proyecto

1. **Lee `master_prompt_crm_coqueros.md`** primero — define el negocio y la disciplina de fases.
2. **Fase por fase**: no adelantar UI de fases futuras. Terminar, mostrar, esperar OK.
3. **No romper la landing** (`app/page.tsx`) ni sus assets (`public/coquito.jpeg`, `public/patron.jpeg`, `public/6-beneficios.jpeg`, `public/logo.jpeg`).
4. **Import/export Excel es requisito de primera clase** en todas las vistas de datos, con vista previa antes de confirmar.
5. **Mobile-first en vistas de ruta**; desktop en gestión.
6. **Commits pequeños y descriptivos**, en español.

---

## Comandos frecuentes

```powershell
npm run dev                                    # local dev en :3000
npm run build                                  # verificar que compila antes de push
npm run db:push                                # aplicar migraciones nuevas a Supabase
npx vercel --prod --scope josephs-projects-6f38454c   # deploy manual a producción
npx vercel logs <deployment-url> --follow      # ver logs runtime
```
