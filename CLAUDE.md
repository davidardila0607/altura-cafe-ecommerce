# CLAUDE.md — CafeApi

Guía para trabajar en este repositorio. **Mantenla actualizada** cuando cambie la arquitectura, el modelo, los endpoints o la configuración.

## Regla principal: código explicable

El proyecto es universitario y quienes lo entregan deben poder explicar cada parte. Por eso:

- Prefiere soluciones **simples y legibles** sobre patrones avanzados.
- **No agregues capas ni abstracciones** que no se necesiten hoy (nada de "por si acaso").
- **Comenta en español** las partes no obvias (el porqué, no el qué).
- Cuando algo complejo sea realmente necesario (por ejemplo, la configuración de GSAP o el altímetro), explícalo en el resumen del cambio **en palabras sencillas**.

## Descripción

E-commerce de café de especialidad **Altura** (proyecto universitario en grupo):

- **backend/**: API REST en ASP.NET Core 10 + EF Core + PostgreSQL. Gestiona el catálogo de cafés (25 en el seed), sus variedades (9), procesos (3) y presentaciones, las imágenes de producto en Cloudinary, el carrito, los pedidos y sus pagos (Wompi o la pasarela de pruebas).
- **frontend/**: aplicación Angular 22 (`altura-web`), concepto **"Ascenso"**: Inicio narrativo (subir la montaña con un altímetro), catálogo de Productos con filtros en la URL y vista rápida, **Login y Registro reales** (Guía 1: usuarios en la base de datos, contraseñas con hash y JWT propio), **carrito de compras** (Guía 2: ícono con contador, panel lateral y página `/carrito`), **pedidos** con dirección de envío (guía de pedidos: "Confirmar pedido" desde el carrito, `/mis-pedidos` y su detalle), **pagos** (Guía 3, Wompi; hoy en **modo simulación** con una pasarela de pruebas propia), un Inicio que cierra con **reseñas de clientes** (de ejemplo) y un **panel de administración** (`/admin`: inventario, variedades, historial de compras y usuarios) solo para el rol Administrador.

El proyecto está **preparado para producción pero no desplegado**: los pasos están en `DEPLOY.md`.

Repositorio: https://github.com/davidardila0607/altura-cafe-ecommerce (privado). Es el **único** repositorio del proyecto; la rama principal es **`main`** (sigue a `origin/main`). El repositorio anterior (`pablorja/CafeApi`) ya no se usa. No se hace force push ni se reescribe el historial.

## Estructura del repositorio

```
CafeApi/
├── backend/                 Proyecto .NET (CafeApi.sln, CafeApi.csproj, Program.cs, Controllers/, Data/, DTOs/,
│   │                        Interfaces/, Middleware/, Models/, Repositories/, Services/, Configurations/, Seguridad/,
│   │                        Properties/, CafeApi.http, appsettings*.json)
│   ├── .config/             Manifiesto de dotnet-ef (herramienta local)
│   └── seed/                Productos de ejemplo (seed-productos.ps1 + imagenes/: SVG fuente, PNG, DISENO.md)
│                            y fotos del sitio (subir-imagenes-sitio.ps1 + sitio/fotos.json)
├── frontend/                Proyecto Angular altura-web (package.json, angular.json, src/, public/, e2e/,
│                            playwright.config.ts, herramientas/generar-paisaje.mjs)
├── docs/guias/              Guías del profesor (guía 1: usuarios y JWT; guía 2: carrito de compras; pedidos;
│                            guía 3: Wompi Sandbox, implementada con modo simulación)
├── .gitignore               Reglas de .NET, Node/Angular y Playwright
├── CLAUDE.md                Esta guía
├── README.md                Puesta en marcha paso a paso
├── DEPLOY.md                Pasos para desplegar (variables de entorno, migraciones, CORS, frontend)
└── CHANGELOG.md
```

Los comandos de .NET se ejecutan **desde `backend/`** y los de Node/Angular **desde `frontend/`**. `frontend/CLAUDE.md` lo generó Angular CLI (`--ai-config=claude-code`) con buenas prácticas de Angular 22; complementa esta guía.

## Concepto: "Ascenso"

Rediseño de octubre de 2026 (rama `feature/rediseno-inmersivo`). **Idea central: hacer scroll es subir la montaña**, del valle (1.200 msnm) a la cumbre (2.100 msnm), y un altímetro fijo marca los metros de cada sección. Se eligió entre tres conceptos (A "Ascenso", B "Brasa" oscuro de tostión, C "Cartel" tipográfico) y se combinó con dos ideas de los otros: **el vuelo de la bolsa** de la card a la vista rápida (de B) y **el color por variedad** dentro de la vista rápida (de C).

Etapas del Inicio (`ETAPAS_ASCENSO` en `core/data/contenido-marca.ts`; son narrativas: el café colombiano se cultiva más o menos entre 1.200 y 2.100 m):

| Sección | Etapa | msnm |
|---|---|---|
| Hero | Valle | 1.200 |
| Selección de la casa | Ladera | 1.450 |
| De la montaña a tu taza | Finca | 1.700 |
| Orígenes (mapa) | Cordillera | 1.900 |
| Variedades | Cafetal | 2.000 |
| Reseñas ("Lo que dicen de Altura") | Cumbre | 2.100 |

## Sistema de diseño

Sistema propio en `frontend/src/styles.css` (**sin Bootstrap**). Tokens en tres capas: primitivos (`--niebla`, `--bosque`…), semánticos (`--fondo`, `--texto`, `--acento`…) y de componente (en cada CSS). Un solo tema claro: niebla de montaña al amanecer.

**Paleta**

| Token | Hex | Uso |
|---|---|---|
| `--niebla` | `#E6EAE3` | Fondo de página |
| `--niebla-honda` | `#D6DDD2` | Bandas alternas, fondos de imagen, cabecera de tablas |
| `--papel` | `#F5F6F1` | Superficies: cards, paneles, formularios |
| `--blanco-niebla` | `#FBFCF8` | Fondo de campos |
| `--bosque` | `#13281F` | Texto; secciones oscuras (footer, cinta, cabecera del panel) |
| `--musgo` | `#3E5C45` | Disponibilidad, visto de campo válido |
| `--helecho` / `--liquen` / `--liquen-hondo` | `#8FA58F` / `#C9D3C6` / `#B7C7B3` | Solo decorativos: crestas, esqueletos, mapa |
| `--alba` / `--horizonte` | `#F2D7C4` / `#EBE6DC` | Cielo del amanecer. `--alba` es además el fondo de la sección de reseñas (el amanecer en la cumbre; texto bosque 13:1, texto suave 5,9:1; el cereza solo en las estrellas, que son gráficos con su texto aparte) |
| `--cereza` | `#B8322A` | **Único acento**: botón principal (texto blanco 5,9:1), enlaces, "Quedan N", marca del altímetro (4,8:1 sobre niebla) |
| `--cereza-hover` / `-activo` | `#9E2A23` / `#86231D` | Estados del botón principal |
| `--error` | `#A3271F` | Errores de formulario y avisos |
| `--ambar` | `#B7791F` | Solo relleno: nivel "aceptable" del medidor de contraseña |
| `--texto-suave` | bosque al 76 % | Texto secundario (≥ 5,3:1) |
| `--linea` / `--linea-fuerte` | bosque al 14 % / 30 % | Bordes y divisores |

**Colores por variedad** (`--variedad-*` y `core/data/contenido-marca.ts`; los tres usos, texto sobre papel, texto sobre niebla y fondo con texto blanco, cumplen AA ≥ 4,5:1, verificado): Castillo `#7A4A26` (tostado), Caturra `#3B6B34` (verde hoja), Colombia `#A2482A` (teja), Típica `#7E5A10` (ocre), Tabi `#4A5868` (pizarra), Bourbon Rojo `#9E2433` (cereza), Bourbon Amarillo `#7A6400` (mostaza oscuro), Bourbon Rosado `#B03A6B` (rosa), Geisha `#2D6A5E` (verde jade). Una variedad nueva de la API usa `#13281F`.

**Colores por proceso** (`--proceso-*` y `marcaProceso()`; mismas comprobaciones AA): Lavado `#2E6A8A` (agua) con ícono `bi-droplet`, Honey `#875700` (miel) con `bi-hexagon`, Fermentado `#6E2E4A` (vino) con `bi-hourglass-split`. Un proceso nuevo usa el color neutro y `bi-circle`.

**Estados de un pedido** (`--estado-pendiente` miel `#875700`, `--estado-pagado` musgo, `--estado-rechazado` rojo de error; `shared/estado-pedido`): píldora con ícono y fondo de papel teñido al 8 % (opaco, para pasar AA también sobre niebla). Los mismos tonos se usan en el aviso de pago del detalle, la pasarela de pruebas y el sello de la página de resultado.

**Etiquetas de café** (`shared/etiqueta-cafe`): la **variedad** es texto en su color con una muestra cuadrada; el **proceso** es una píldora con borde y fondo tenue de su color y su ícono. Así se distinguen a simple vista aunque compartan tono (por ejemplo, Geisha y Lavado).

**Tipografía** (npm, `@fontsource-variable`): **Bricolage Grotesque** (archivo `standard.css`: ejes de peso, ancho 75–100 % y tamaño óptico) para todo; el *display* usa `font-stretch: 75%` y peso 800. **Geist Mono** solo para medidas: altitud, gramos, contadores. Escala `--fs-100` 13 px … `--fs-800` 48–96 px (fluidas con `clamp`); la palabra del hero es la excepción (hasta 30rem). Interlineado `--lh-display` 0,88, `--lh-titulo` 1,05, `--lh-texto` 1,6. Tracking mínimo −0,04 em.

**Espaciado**: `--esp-1` … `--esp-9` (4–96 px); `--seccion` 80–160 px; contenedor `--ancho-max` 1360 px con `--margen-lateral` 16–40 px (en el Inicio, desde 1024 px, 136–160 px para dejar libre el altímetro).

**Forma**: tarjetas e imágenes `--radio-tarjeta` 16 px · paneles grandes 24 px · campos `--radio-campo` 12 px · botones, chips y contadores en píldora. Sombras teñidas de bosque (`--sombra-1`, `--sombra-2`).

**Profundidad y motivos**: crestas de montaña en capas (`public/paisaje/cresta-1..4.svg`) y curvas de nivel (`public/texturas/curvas-nivel.svg`), generadas con `frontend/herramientas/generar-paisaje.mjs` (suma de ondas seno para las crestas; *marching squares* para las curvas). Para regenerarlas: `node herramientas/generar-paisaje.mjs` desde `frontend/`.

**Movimiento**: `--ease-salida` `cubic-bezier(.23,1,.32,1)` (entradas), `--ease-cajon` `(.32,.72,0,1)` (paneles), `--ease-movimiento` `(.77,0,.175,1)` (cosas que se mueven en pantalla); `--dur-presion` 160 ms, `--dur-rapida` 200 ms, `--dur-panel` 420 ms, `--dur-revelado` 900 ms. Solo se anima `transform`, `opacity` y `clip-path`.

**Movimiento reducido** (versión completa, igual de usable): sin parallax, sin galería anclada (la pista es una fila con scroll horizontal), sin vuelo de la bolsa, sin inclinación ni botón magnético, sin cinta en movimiento ni niebla a la deriva, sin entradas con desplazamiento; se conservan fundidos y cambios de color cortos. El altímetro sigue funcionando (no es movimiento).

**Capas**: `--z-altimetro` 90, `--z-nav` 100; los paneles usan la capa superior nativa de `<dialog>`.

**Marca**: logo con la línea de la montaña y la **cereza en la cumbre** (`shared/logo`, `public/favicon.svg`). Voz sobria, en español, de tú.

## Mapa de animaciones

| Elemento | Disparador | Duración | Curva | Dónde |
|---|---|---|---|---|
| Crestas del hero (subida en cascada, 90 ms entre capas) | Carga | 1,4 s | `--ease-salida` | `hero.css` (CSS, propiedad `translate`) |
| Letras de "Altura" (subida + fundido, 60 ms entre letras) | Carga | 1,1 s | `--ease-salida` | `hero.css` |
| Texto y botones del hero | Carga (650–830 ms de retraso) | 800 ms | `--ease-salida` | `hero.css` |
| Parallax: cielo 30 %, cresta 1 24 %, palabra 70 %, cresta 2 16 %, cresta 3 8 %; el texto se desvanece | Scroll (scrub) | Ligado al scroll | Lineal | `hero.ts` (GSAP ScrollTrigger) |
| Altímetro: número y marca de la regla | Scroll | Ligado al scroll | — | `altimetro.ts` (ScrollTrigger) |
| Galería del proceso: la pista se desplaza en horizontal; fotos de 115 % a 100 % | Scroll (sección anclada con `sticky`, 400vh) | Ligado al scroll (`scrub: 0.6`) | Lineal | `proceso.ts` (≥ 900 px) |
| Cinta de notas de cata | Continuo (pausa con el mouse encima) | 60 s por vuelta | Lineal | `cinta-notas.ts` |
| Revelado de cards (90 ms entre cada una) y filas de variedades | Entrar en pantalla (IntersectionObserver) | 700–900 ms | `--ease-salida` | directiva `appRevelar` |
| Inclinación 3D + brillo de la card; zoom de la bolsa 4 % | Mover el mouse | 500 ms / 700 ms | `--ease-salida` | directiva `appInclinar` (solo puntero fino) |
| Botón magnético (hasta 10 px hacia el cursor) | Mover el mouse | 360 ms | `--ease-salida` | directiva `appMagnetico` |
| Pulsación de botones y chips (`scale(.97)`) | `:active` | 160 ms | `--ease-salida` | `styles.css` |
| **Vuelo de la bolsa** card → vista rápida (y de vuelta si la card sigue en pantalla) | Abrir / cerrar la vista rápida | 520 ms (resto de la página: fundido 280 ms) | `--ease-cajon` | `vista-rapida.ts` (View Transition `bolsa`) |
| Panel de la vista rápida sin vuelo (sube 24 px; en móvil, hoja desde abajo) | Abrir | 420 ms (cierre 200 ms) | `--ease-cajon` | `vista-rapida.css` (`@starting-style`) |
| Reordenamiento de la grilla al filtrar | Cambiar filtros | 380 ms | `--ease-movimiento` | View Transitions (`view-transition-class: tarjeta`) |
| Filas de variedad que aparecen con "Ver las 9 variedades" (subida de 6 px + fundido, 25 ms entre filas) | Desplegar la lista | 220–260 ms | `--ease-salida` | `filtros.css` (`@starting-style`; con movimiento reducido no se anima) |
| Flecha de "Ver las 9 variedades" (gira 180°) | Desplegar / plegar | 240 ms | `--ease-salida` | `filtros.css` |
| Cambio de ruta (fundido + 10 px) | Navegar | 180 ms salida / 340 ms entrada | `--ease-salida` | `styles.css` |
| Navbar transparente → sólido | Dejar el principio de la página | 260 ms | `ease` | `navbar.css` + sensor en `sitio.ts` |
| Menú móvil y hoja de filtros | Abrir | 420 ms | `--ease-cajon` | `navbar.css`, `productos.css` |
| Onda del marcador activo del mapa (2 pulsos) | Elegir región | 1,8 s | `--ease-salida` | `origenes.css` |
| Niebla a la deriva (Login, Registro, ingreso al panel) | Continuo | 26 s y 34 s, ida y vuelta | `ease-in-out` | `paisaje-acceso.css` |
| Línea de foco de los campos, visto de válido, errores, medidor de contraseña | Foco / escribir | 200–360 ms | `--ease-salida` | `acceso.css` |
| Esqueletos (franja de brillo con `transform`) | Carga de datos | 1,6 s | `ease-in-out` | `styles.css` |
| Panel lateral del administrador | Abrir | 420 ms | `--ease-cajon` | `formulario-admin.css` |
| Panel lateral del carrito (entra desde la derecha) | Abrir | 420 ms | `--ease-cajon` | `boton-carrito.css` (`@starting-style`; sin desplazamiento con movimiento reducido) |
| Pulso del contador del carrito (`scale` 1 → 1,3 → 1) | Cambia el número de unidades | 320 ms | `--ease-salida` | `boton-carrito.ts` (Web Animations API; no con movimiento reducido) |
| Avisos de la tienda ("Agregado al carrito", "Pedido creado"; sube 8 px + fundido) | Aparecer | 260 ms | `--ease-salida` | `zona-avisos.ts` (`@starting-style`) |
| Rueda de reseñas: dos columnas suben sin fin (la segunda desfasada media vuelta), bordes con máscara de gradiente | Continuo; se pausa con el mouse, el foco o el botón "Pausar reseñas" | 7 s por tarjeta (35 s por vuelta) | `linear` (marquesina) | `resenas.css` (`translateY(-50%)` sobre la lista duplicada; con movimiento reducido no se renderiza: 3 reseñas con Anterior/Siguiente) |
| Sello del resultado del pago (escala 0,8 → 1 + fundido) | Llegar a `/pago/resultado` | 420 ms | `--ease-salida` | `resultado-pago.css` (`@starting-style`; nada con movimiento reducido) |
| Indicador "Preparando pago…" (giro) | Pulsar "Pagar" | 700 ms por vuelta | `linear` | `boton-pagar.ts` (con movimiento reducido gira más lento, 1,6 s) |

## Librerías y por qué

| Librería | Versión | Por qué |
|---|---|---|
| `gsap` (+ ScrollTrigger) | 3.15.0 | Animaciones ligadas al scroll (parallax del hero, altímetro, galería anclada) con una API clara. Se carga **bajo demanda** con `import()` en `core/utils/gsap.ts` (chunk aparte de unos 40 kB comprimidos) y solo en el Inicio. |
| `@fontsource-variable/bricolage-grotesque`, `@fontsource-variable/geist-mono` | 5.3.0 | Fuentes autoalojadas (sin Google Fonts en producción). |
| `bootstrap-icons` | 1.13.1 | Se conservan los íconos (una sola familia); el CSS de Bootstrap se eliminó. |
| `@axe-core/playwright` (desarrollo) | 4.13 | axe-core dentro de las e2e: 0 violaciones en todas las vistas. |

No se usaron: **Lenis** (el scroll nativo basta y sin él no hay conflictos con `<dialog>` ni con la restauración del scroll), **SplitText** (las letras del hero se separan en la plantilla, más simple), **three.js** (el concepto no tiene 3D real). **Bootstrap se eliminó por completo**: solo aportaba grilla, formularios y utilidades (~230 kB de CSS); con el sistema propio el CSS inicial queda en ~99 kB sin comprimir (~14 kB transferidos).

## Referencias de 21st.dev

Se usaron como referencia visual (búsqueda en el catálogo con el MCP de 21st); no se copió código ni se agregó React.

| Componente de 21st | Inspiró |
|---|---|
| Hero Parallax (manuarora700), Hero Scrub (jean.duthil13) | Capas del hero con parallax ligado al scroll |
| Text Reveal (ddoemonn), Vertical Cut Reveal (cnippet-dev) | Entrada letra por letra de "Altura" |
| Optimized Tilt Card (sh20raj), Glare Card (manuarora700), Tilt (ibelick) | Inclinación 3D con brillo de las cards (solo con mouse) |
| Magnetic Button (bundui), Magnetic (ibelick) | Botones magnéticos del hero |
| Infinite Text Marquee (preetsuthar17), Marquee (tom_ui) | Cinta de notas de cata |
| Horizontal Scroll Gallery (pulkitxm), Scroll Horizontal Gallery (motiondotdev) | Galería "De la montaña a tu taza" anclada |
| Page Transition (su2491251) | Transición de ruta y vuelo de la bolsa |
| Floating Label (ddoemonn), Label Input (tom_ui) | Microinteracciones de los campos (la etiqueta se dejó arriba, más clara) |
| Custom Cursor (soralabs) | Se evaluó y se descartó: el concepto no lo necesita y perjudica la accesibilidad |
| Role Filter Chips (cnippet-dev), Selector Chips (preetsuthar17) | Número de cafés en cada opción del filtro (hoy en filas verticales, no en chips) |
| Chip (preetsuthar17), Badge con ícono (sean0205), Astryx Badge | Etiquetas de proceso: píldora con ícono y color propio, distinta de la muestra de variedad |

## Stack y versiones

| Componente | Versión |
|---|---|
| .NET / ASP.NET Core | net10.0 (SDK 10.0.4xx) |
| EF Core (Design, Relational) | 10.0.12 |
| Npgsql.EntityFrameworkCore.PostgreSQL / Npgsql | 10.0.3 |
| EFCore.NamingConventions (snake_case) | 10.0.1 |
| dotnet-ef (herramienta local, `.config/dotnet-tools.json`) | 10.0.12 |
| Microsoft.AspNetCore.Authentication.JwtBearer / OpenApi | 10.0.12 |
| Swashbuckle.AspNetCore | 10.2.3 |
| CloudinaryDotNet | 1.29.3 |
| Base de datos local | PostgreSQL 17 (`cafeapi_dev`) |

## Arquitectura del backend

Rutas relativas a `backend/`.

```
Controller  →  Interfaces/IXRepository  →  Repositories/XRepository  →  Data/AppDbContext (EF Core)  →  PostgreSQL
ImagesController / CafesController  →  Interfaces/ICloudinaryService  →  Services/CloudinaryService  →  Cloudinary
AuthController  →  Interfaces/IUsuarioRepository  →  Repositories/UsuarioRepository  →  AppDbContext (tabla usuario) + JwtSettings
UsuariosController  →  Interfaces/IUsuarioRepository  →  Repositories/UsuarioRepository  →  AppDbContext (lista y cambio de rol)
CarritoController  →  Interfaces/ICarritoRepository  →  Repositories/CarritoRepository  →  AppDbContext (carrito, carrito_producto, cafes)
PedidoController   →  Interfaces/IPedidoRepository   →  Repositories/PedidoRepository   →  AppDbContext (carrito, pedido, pedido_producto, cafes, usuario)
PedidoController / PedidoRepository  →  Interfaces/IWompiService  →  Repositories/WompiService  →  firmas SHA-256 y API de Wompi (HttpClient)
```

- **Controllers/**: validan (DataAnnotations + reglas como "la variedad existe"), mapean DTO ↔ entidad y deciden el código HTTP. No hay capa de servicios de negocio (decisión del grupo: se mantiene Controller → Repository).
- **Repositories/**: todos los métodos son `*Async` y reciben `CancellationToken`. Las lecturas usan `AsNoTracking()` y proyectan directamente a DTO con `Select` (un solo SELECT con JOIN, sin N+1). Para modificar o borrar: `FindAsync` (con seguimiento) → el controlador cambia la entidad → `UpdateAsync`/`DeleteAsync` (que llaman a `SaveChangesAsync`).
- **Data/AppDbContext.cs**: `DbSet` de `Variedades`, `Procesos`, `Cafes`, `Usuario`, `Carrito`, `CarritoProducto`, `Pedido` y `PedidoProducto` (los cinco últimos en singular, como las guías). Aplica las configuraciones de `Data/Configurations/` (una clase `IEntityTypeConfiguration` por entidad) y asigna `created_at`/`updated_at` en UTC al guardar.
- **Data/Migrations/**: migraciones de EF Core. **Son la fuente de verdad del esquema** (ya no existe `database/schema.sql`).
- **Data/DbUpdateExceptionExtensions.cs**: detecta violaciones de unicidad (23505) y de clave foránea (23503) de PostgreSQL para responder 409.
- **Seguridad/**: `Roles` y `Politicas` (autorización por políticas; ver "Autorización").
- **Middleware/ExceptionMiddleware.cs**: cualquier excepción no controlada → 500 con mensaje genérico en español. El detalle solo va al log.
- Registro en `Program.cs`: `AddDbContext<AppDbContext>(UseNpgsql + UseSnakeCaseNamingConvention)`, repositorios (incluidos `ICarritoRepository` e `IPedidoRepository`) y `CloudinaryService` como `Scoped`. También: puerto `PORT`, CORS desde `Cors:AllowedOrigins`, comprobación de la cadena de conexión y de `JwtSettings:Key` al arrancar y `GET /api/health` (ver "Preparación para producción").

## Modelo de datos

**variedades**

| Columna | Tipo | Reglas |
|---|---|---|
| id | integer identity | PK |
| nombre | varchar(100) | obligatorio, único (`ux_variedades_nombre`) |
| descripcion | text | opcional |

Semilla (`HasData`, con descripción): 1 Castillo, 2 Caturra, 3 Colombia, 4 Típica, 5 Tabi, 6 Bourbon Rojo, 7 Bourbon Amarillo, 8 Bourbon Rosado, 9 Geisha. (Moka se retiró en `AgregarProcesosYVariedades`: el id 3 pasó a ser Colombia).

**procesos**

| Columna | Tipo | Reglas |
|---|---|---|
| id | integer identity | PK |
| nombre | varchar(50) | obligatorio, único (`ux_procesos_nombre`) |
| descripcion | text | opcional |

Semilla (`HasData`, con descripción): 1 Lavado, 2 Honey, 3 Fermentado. Es una **tabla** (no un enum como `Presentacion`) porque tiene nombre y descripción y se podrían agregar procesos sin cambiar el código.

**usuario** (Guía 1, migración `AddUsuario`)

| Columna | Tipo | Reglas |
|---|---|---|
| id | integer identity | PK |
| nombre | varchar(100) | obligatorio |
| email | varchar(150) | obligatorio, único (`ux_usuario_email`); se guarda en minúsculas y sin espacios |
| password | text | obligatorio; hash de `PasswordHasher` (empieza por `AQAAAA`), nunca el texto |
| rol | varchar(20) | obligatorio, `CHECK (rol IN ('Administrador','Cliente'))`, por defecto `Cliente` |

**cafes**

| Columna | Tipo | Reglas |
|---|---|---|
| id | integer identity | PK |
| nombre | varchar(100) | obligatorio |
| variedad_id | integer | FK → variedades, `ON DELETE RESTRICT` |
| proceso_id | integer | FK → procesos, `ON DELETE RESTRICT` (índice `ix_cafes_proceso_id`) |
| presentacion_gramos | integer | `CHECK IN (340, 500)` (enum `Presentacion`) |
| origen | varchar(100) | obligatorio |
| stock | integer | `CHECK >= 0` |
| precio | numeric(12,0) | `CHECK > 0`, pesos colombianos sin decimales |
| imagen_url | varchar(500) | opcional |
| imagen_public_id | varchar(255) | opcional |
| usuario_id | integer | FK → usuario, `ON DELETE RESTRICT` (índice `ix_cafes_usuario_id`); el dueño: sale del JWT al crear y el PUT no lo cambia |
| created_at / updated_at | timestamptz | UTC, los asigna `AppDbContext` |

Índice único `ux_cafes_nombre_variedad_proceso_presentacion` sobre `(lower(nombre), variedad_id, proceso_id, presentacion_gramos)`: el mismo café puede venderse con dos procesos distintos. Se crea con `migrationBuilder.Sql` (EF Core no modela índices por expresión, así que **no aparece en el snapshot**: si se recrea una migración, hay que volver a añadirlo a mano en `Up` y `Down`). Reemplaza al índice anterior `ux_cafes_nombre_variedad_presentacion` de `InitialCreate`.

**Migración `AgregarProcesosYVariedades`** (una sola, aplicada): crea `procesos` con sus 3 filas; agrega `cafes.proceso_id` con valor por defecto 1 (para que las filas que ya existían queden como "Lavado") y luego quita ese valor por defecto; actualiza e inserta las 9 variedades; crea la FK, el índice nuevo y avanza las secuencias de identidad con `setval(pg_get_serial_sequence(...))` (los `HasData` con id fijo no las mueven y el siguiente `INSERT` chocaría). `Down` deshace todo en orden inverso.

`Presentacion` es un enum en código (`G340 = 340`, `G500 = 500`), no una tabla. En JSON viaja como número (`presentacionGramos: 340`).

**Migración `AddUsuario`**: crea `usuario` y agrega `cafes.usuario_id NOT NULL` **sin valor por defecto**. Por eso exige la tabla `cafes` vacía: los cafés anteriores no tenían dueño y se borraron antes (por la API, para borrar también sus imágenes). El modelo `Usuario` anterior (Email, Nombre, Role, EsGoogleUser, FechaCreacion) nunca estuvo en el DbContext ni en una migración, así que no hubo tabla que transformar.

**carrito** (Guía 2, migración `AddCarrito`)

| Columna | Tipo | Reglas |
|---|---|---|
| id | integer identity | PK |
| usuario_id | integer | FK → usuario, `ON DELETE CASCADE`; **único** (`ux_carrito_usuario_id`): un carrito por usuario |

**carrito_producto** (tabla intermedia, Guía 2)

| Columna | Tipo | Reglas |
|---|---|---|
| id | integer identity | PK |
| carrito_id | integer | FK → carrito, `ON DELETE CASCADE` |
| producto_id | integer | FK → cafes, `ON DELETE CASCADE` (índice `ix_carrito_producto_producto_id`): si se elimina un café, sale de todos los carritos |
| cantidad | integer | `CHECK (cantidad >= 1)` (`ck_carrito_producto_cantidad`) |

Índice único `ux_carrito_producto_carrito_producto` sobre `(carrito_id, producto_id)`: un café aparece una sola vez por carrito (agregarlo otra vez suma la cantidad). La columna se llama `producto_id` porque la guía llama `ProductoId` a la propiedad, aunque apunta a `cafes`.

**Migración `AddCarrito`**: solo crea `carrito` y `carrito_producto` con sus índices y FKs; no toca otras tablas (revisado antes de aplicarla).

**pedido** (guía de pedidos, migración `AddPedidos`)

| Columna | Tipo | Reglas |
|---|---|---|
| id | integer identity | PK; es el "número de pedido" (#id) |
| usuario_id | integer | FK → usuario, `ON DELETE RESTRICT` (índice `ix_pedido_usuario_id`): el historial no se pierde |
| total | numeric(12,0) | suma de precio × cantidad, calculada al crear |
| estado | varchar(20) | obligatorio, `CHECK (estado IN ('Pendiente','Pagado','Rechazado'))` (`ck_pedido_estado`); hoy todos nacen `Pendiente`; los otros dos los asignará la guía de Wompi |
| fecha | timestamptz | UTC, `DateTime.UtcNow` al crear |
| referencia_wompi | varchar(50) | Guía 3: `PEDIDO-{id}` (o `PEDIDO-{id}-2`, `-3`… al reintentar un pago rechazado); único sin contar la vacía (`ux_pedido_referencia_wompi`, filtro `referencia_wompi <> ''`) |
| transaction_id_wompi | varchar(100) | Guía 3, opcional: la última transacción informada por Wompi (o `SIM-<guid>` en modo simulación) |
| direccion_envio / ciudad / departamento | varchar(200) / (80) / (80) | Obligatorios (adaptación de envío); los pedidos anteriores quedaron con "No registrada" |
| telefono | varchar(15) | Obligatorio, 7 a 15 dígitos (lo valida `DatosEnvioDto`) |
| notas_entrega | varchar(300) | Opcional |

**pedido_producto**

| Columna | Tipo | Reglas |
|---|---|---|
| id | integer identity | PK |
| pedido_id | integer | FK → pedido, `ON DELETE CASCADE` (índice `ix_pedido_producto_pedido_id`) |
| producto_id | integer | FK → cafes, `ON DELETE RESTRICT` (índice `ix_pedido_producto_producto_id`): un café con pedidos no se borra |
| cantidad | integer | `CHECK (cantidad >= 1)` (`ck_pedido_producto_cantidad`) |
| precio | numeric(12,0) | precio del café **en el momento de la compra** |

**Migración `AddWompi`** (Guía 3): agrega `referencia_wompi` (NOT NULL) y `transaction_id_wompi` a `pedido`, asigna `'PEDIDO-' || id` a los pedidos que ya existían con un `UPDATE` y crea el índice único filtrado. No toca otras tablas.

**Migración `AddDireccionPedido`**: agrega las 5 columnas de envío; las obligatorias se crean con el valor por defecto "No registrada" (para las filas existentes) y después se quita ese valor por defecto con `ALTER COLUMN … DROP DEFAULT`: los pedidos nuevos siempre traen sus datos.

**Migración `AddPedidos`**: solo crea `pedido` y `pedido_producto` con sus índices, FKs y `CHECK`; no toca otras tablas (revisado antes de aplicarla). Al contrario que en `carrito_producto` (CASCADE hacia `cafes`), aquí la FK al café es `RESTRICT`. El carrito anterior en inglés (`Cart`, `CartItem`, `ICartRepository`, `CartRepository` ADO.NET con `NotImplementedException` y 4 DTOs) nunca estuvo en el DbContext ni en DI y se eliminó.

## Endpoints y permisos

"Inventario" = política `GestionInventario` y "Usuarios" = política `GestionUsuarios` (las dos exigen hoy el rol Administrador; ver "Autorización"). "JWT" = cualquier usuario con sesión (`[Authorize]`).

| Método | Ruta | Permiso | Respuestas |
|---|---|---|---|
| POST | /api/auth/Register | Público | 200 `{ mensaje }`; 400 `{ mensaje: "El usuario ya existe." }` o de validación |
| POST | /api/auth/Login | Público | 200 `{ token }`; 400 de validación; 401 `{ mensaje: "Usuario o contraseña incorrectos." }` |
| GET | /api/auth/me | Cualquier JWT válido | 200 `UsuarioActualDto` (email, nombre, roles; leídos de la base con el claim NameIdentifier), 401 |
| GET | /api/cafes | Público | 200 `CafeResponseDto[]` |
| GET | /api/cafes/{id} | Público | 200, 404 |
| POST | /api/cafes | Inventario | 201 `CafeResponseDto`, 400, 401, 403, 409 duplicado |
| PUT | /api/cafes/{id} | Inventario | 200 `CafeResponseDto`, 400, 401, 403, 404, 409 |
| DELETE | /api/cafes/{id} | Inventario | 204, 401, 403, 404 (borrado físico + borra la imagen); 409 `ProblemDetails` "No se puede eliminar un café que tiene pedidos." |
| GET | /api/variedades | Público | 200 `VariedadResponseDto[]` |
| GET | /api/variedades/{id} | Público | 200, 404 |
| POST | /api/variedades | Inventario | 201, 400, 401, 403, 409 nombre duplicado |
| PUT | /api/variedades/{id} | Inventario | 204, 400, 401, 403, 404, 409 |
| DELETE | /api/variedades/{id} | Inventario | 204, 401, 403, 404, 409 si tiene cafés |
| GET | /api/presentaciones | Público | 200 `[{ value, label }]` |
| GET | /api/procesos | Público | 200 `ProcesoResponseDto[]` (id, nombre, descripcion) |
| POST | /api/images | Inventario | 200 `{ imageUrl, publicId }`, 400, 401, 403 |
| DELETE | /api/images?publicId=cafes/… | Inventario | 204, 400 (fuera de la carpeta `cafes/`), 401, 403, 409 si un café la usa |
| GET | /api/Carrito/GetCarrito | JWT | 200 `CarritoDto` (lo crea vacío la primera vez), 401 |
| POST | /api/Carrito/AgregarProducto | JWT | 200 `{ mensaje }`; 400 validación; 401; 404 "El producto no existe."; 409 propio / agotado / sin unidades |
| PUT | /api/Carrito/ActualizarCarrito | JWT | 200 `{ mensaje }`; 400; 401; 404 "El producto no está en el carrito."; 409 sin unidades |
| DELETE | /api/Carrito/EliminarProducto/{productId} | JWT | 200 `{ mensaje }`; 401; 404 |
| DELETE | /api/Carrito/VaciarCarrito | JWT | 200 `{ mensaje: "Carrito vaciado." }`, 401 |
| POST | /api/Pedido/CrearPedido | JWT | Cuerpo `DatosEnvioDto` (direccionEnvio, ciudad, departamento, telefono, notasEntrega). 200 `{ mensaje: "Pedido creado correctamente.", pedidoId }`; 400 datos de envío inválidos (`ValidationProblem` en español) o "El carrito está vacío."; 415 sin cuerpo JSON; 401; 409 "No puedes comprar tus propios productos." / "No hay stock suficiente de NOMBRE (disponibles: N)." / "NOMBRE está agotado." |
| GET | /api/Pedido/GetPedidos | JWT | 200 `PedidoDto[]` (los del usuario, el más reciente primero), 401 |
| GET | /api/Pedido/GetPedido/{pedidoId} | JWT | 200 `PedidoDto`; 401; 404 `{ mensaje: "Pedido no encontrado." }` (no existe o es de otro usuario) |
| GET | /api/Pedido/Historial | Inventario | `?estado=&desde=AAAA-MM-DD&hasta=AAAA-MM-DD&texto=` (todos opcionales). 200 `HistorialDto` { comprasPagadas, unidadesVendidas, ingresos, pedidos: `PedidoAdminDto[]` }; 400 estado desconocido o desde > hasta; 401; 403 |
| POST | /api/Pedido/{id}/PrepararPago | JWT | 200 `WompiPagoDto` { publicKey, reference, amountInCents, currency, integritySignature, redirectUrl, modoSimulado }; 401; 404 "Pedido no encontrado." (no existe o es ajeno); 409 "Este pedido ya fue pagado." / sin stock / agotado. Un pedido Rechazado vuelve a Pendiente con referencia nueva |
| POST | /api/Pedido/Webhook | Público (lo protege el checksum) | Evento `transaction.updated` de Wompi. 401 si el checksum no coincide; 200 siempre que sea válido (aunque no cambie nada) |
| POST | /api/Pedido/{id}/SimularPago | JWT, **solo con `ModoSimulado` = true** (si no, 404) | `{ aprobado: bool }` → 200 `{ estado, transactionId: "SIM-…" }`; 404/409 como PrepararPago |
| POST | /api/Pedido/{id}/ConfirmarPago | JWT, **solo con Wompi real** (`ModoSimulado` = false; si no, 404) | `{ transactionId }` → consulta la transacción a Wompi y la aplica. 200 `{ estado, transactionId }`; 404 pedido o transacción no encontrados; 409 "La transacción no corresponde a este pedido." |
| GET | /api/usuarios | Usuarios | 200 `UsuarioAdminDto[]` (id, nombre, email, rol, cafesCreados; nunca el password), 401, 403 |
| PUT | /api/usuarios/{id}/rol | Usuarios | 200 `{ mensaje: "Rol actualizado." }`; 400 rol distinto de Administrador/Cliente; 401; 403; 404 "El usuario no existe."; 409 "No puedes quitarte tu propio rol de administrador." |
| GET | /api/health | Público | 200 `{ estado: "ok" }` (monitoreo del hosting) |

Reglas relevantes:
- Sin token → **401**; con token pero sin el permiso (por ejemplo, la cuenta Cliente) → **403**.
- `variedadId` o `procesoId` inexistente → 400 (`ValidationProblem`: "La variedad indicada no existe." / "El proceso indicado no existe."). `procesoId` es obligatorio al crear y al editar. Duplicados → 409 `ProblemDetails` con mensaje en español ("Ya existe un café con ese nombre, variedad, proceso y presentación.").
- `CafeResponseDto`: id, nombre, variedadId, variedadNombre, procesoId, procesoNombre, presentacionGramos, origen, stock, precio, imagenUrl, imagenPublicId, usuarioId, usuarioNombre (quien lo creó), disponible, estadoStock (Agotado / Pocas unidades ≤10 / Disponible ≤50 / Alta disponibilidad).
- Imágenes: Base64 con o sin prefijo `data:image/...;base64,`; el formato se detecta por la firma de bytes (jpg, png, webp); máximo 5 MB; carpeta `cafes` de Cloudinary.
- Flujo de imagen: `POST /api/images` → guardar `imageUrl` + `publicId` en el café (POST/PUT). Si un PUT cambia el `imagenPublicId`, la anterior se borra de Cloudinary; un DELETE borra la imagen del café. Si Cloudinary falla al borrar, se registra en el log y la operación **no** falla. Si el guardado del café falla después de subir, el panel llama a `DELETE /api/images` para no dejar la imagen huérfana.
- El JWT lleva los claims `ClaimTypes.NameIdentifier` (id), `Name`, `Email` y `Role`. En el JSON del token llegan como URIs largas (por ejemplo `http://schemas.microsoft.com/ws/2008/06/identity/claims/role`); el frontend las traduce en `core/auth/token.ts`.
- Swagger (`/swagger`) tiene el botón *Authorize* (Bearer): pega solo el token.

## Autorización (roles y políticas)

- `backend/Seguridad/Roles.cs`: constantes `Administrador` y `Cliente` (los valores del claim `role`).
- `backend/Seguridad/Politicas.cs`: las políticas `GestionInventario` y `GestionUsuarios` (las dos `RequireRole(Roles.Administrador)`), registradas en `Program.cs` con `Politicas.Registrar(builder.Services.AddAuthorizationBuilder())`.
- Los controladores piden la **política**, no un rol: `[Authorize(Policy = Politicas.GestionInventario)]` (también `GET /api/Pedido/Historial`), `[Authorize(Policy = Politicas.GestionUsuarios)]` (todo `UsuariosController`). El carrito y los pedidos propios solo piden `[Authorize]` (cualquier rol).
- En el frontend, `core/auth/permisos.ts` tiene `inventario.gestionar` y `usuarios.gestionar`.

**Agregar un rol nuevo (por ejemplo "Editor") que gestione el inventario**, sin tocar controladores:
1. Agrega `public const string Editor = "Editor";` en `Roles.cs`.
2. En `Politicas.cs` cambia la regla a `politica.RequireRole(Roles.Administrador, Roles.Editor)`.
3. En el frontend agrega el rol al permiso en `frontend/src/app/core/auth/permisos.ts`: `'inventario.gestionar': ['Administrador', 'Editor']`.

**Dar rol de administrador**: ver "Guía 1" (agregar el correo a `Admin:Correos` antes de registrarse, o un `UPDATE` en la base de datos).

## Panel de administración

- **Entrar**: con la misma sesión de la tienda. Menú de cuenta del navbar → "Panel de administración" (solo aparece al rol Administrador), footer → "Acceso administrador" o `http://localhost:4200/admin`. Sin sesión, el guard lleva a `/login?volver=/admin…`; con una cuenta Cliente, a `/login?permiso=denegado`, que muestra "No tienes permiso para entrar al panel de administración.".
- **Rutas**: `/admin/inventario` (cafés), `/admin/variedades`, `/admin/historial` (la ruta vieja `/admin/pedidos` redirige aquí), `/admin/usuarios`. Todo `/admin` está protegido con `canMatch` por permiso (`/admin/usuarios` además con `usuarios.gestionar`) y se carga de forma diferida. La pantalla `/admin/ingresar` se eliminó.
- **Inventario**: lista con búsqueda (sin tildes), columna **"Creado por"** (`usuarioNombre`), crear y editar en un panel lateral (nombre, variedad, presentación, origen, stock, precio e imagen con vista previa; tipo jpg/png/webp y 5 MB se validan antes de subir), eliminar con confirmación "Esta acción es irreversible", avisos de éxito y mensajes en español para 400, 401, 403, 404 y 409.
- **Variedades**: crear, editar y eliminar (409 si tiene cafés).
- **Historial de compras** (solo lectura; ver la sección "Historial de compras"): indicadores, filtros por estado, fechas y texto, tabla y panel lateral con el resumen completo de cada compra.
- Eliminar un café que aparece en un pedido muestra el 409 "No se puede eliminar un café que tiene pedidos.".
- **Usuarios** (Guía 2): tabla con nombre, correo, rol (etiqueta: Administrador en bosque, Cliente con borde), "Cafés creados" y buscador por nombre o correo (sin tildes). "Hacer Administrador" / "Hacer Cliente" con confirmación; la fila propia dice "(tú)" y su botón está deshabilitado (si aun así llega un 409, se muestra el mensaje de la API). Aviso fijo: "El nuevo rol se aplica la próxima vez que el usuario inicie sesión." No se pueden borrar usuarios.
- **Sesión**: token en `localStorage` (sobrevive a cerrar la pestaña); se cierra sola al expirar el JWT (`JwtSettings:DurationInMinutes`, 60). Un 401 de la API a una petición con sesión la cierra y lleva a `/login` ("Tu sesión terminó. Vuelve a iniciar sesión."); un 403 muestra "No tienes permiso para esta acción". "Cerrar sesión" en el panel lleva a `/login`.
- Los cambios se ven en Inicio y Productos al recargar (leen la misma API).

## Guía 1: usuarios, login, registro y JWT

Implementación de `docs/guias/guia-1-usuarios-login-jwt.md` (guía del profesor). Se respetaron sus nombres de clases, métodos, DTOs, sección de configuración, rutas y migración. El "Producto" de la guía es nuestro `Cafe`.

**En palabras sencillas**

- **JWT** (JSON Web Token): un texto en tres partes (`cabecera.datos.firma`) que la API entrega al iniciar sesión. Los *datos* (claims) dicen quién es el usuario (id, nombre, correo y rol) y cuándo expira el token. Cualquiera puede leerlos (no están cifrados), pero nadie puede cambiarlos sin romper la firma.
- **Firma con `JwtSettings:Key`**: la API calcula la firma con HMAC-SHA256 y su clave secreta (`UsuarioRepository.GenerarToken`). En cada petición, `AddJwtBearer` (Program.cs) vuelve a calcularla y comprueba emisor (`EcommerceApi`), audiencia (`EcommerceAngular`) y expiración (60 min). Si alguien cambia el rol dentro del token, la firma ya no coincide y la API responde 401. Por eso la clave solo vive en `appsettings.Development.json`.
- **`PasswordHasher<Usuario>`**: la contraseña nunca se guarda. Se guarda un *hash* con sal aleatoria y miles de iteraciones (PBKDF2), que empieza por `AQAAAA`. Al iniciar sesión, `VerifyHashedPassword` repite el cálculo con la contraseña escrita y compara. Dos usuarios con la misma contraseña tienen hashes distintos.
- **`[Authorize]`**: el endpoint exige un token válido; sin él, 401. `[Authorize(Policy = Politicas.GestionInventario)]` además exige el rol Administrador; con otro rol, 403. Los GET siguen públicos.
- **Leer el usuario del token**: en un controlador, `User` son los claims del token ya validado. `int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!)` da el id del usuario; así `POST /api/cafes` guarda al dueño sin que el cliente lo envíe.

**Paso de la guía → archivo**

| Paso | Archivo |
|---|---|
| 1. Clase Usuario | `backend/Models/Usuario.cs` |
| 2. Modificar Producto | `backend/Models/Cafe.cs`, `backend/Data/Configurations/CafeConfiguration.cs` (FK `RESTRICT`) |
| 3. DbContext | `backend/Data/AppDbContext.cs`, `backend/Data/Configurations/UsuarioConfiguration.cs` |
| 4. Migración | `backend/Data/Migrations/*_AddUsuario.cs` |
| 5. DTOs | `backend/DTOs/UsuarioDto.cs`, `backend/DTOs/LoginDto.cs` |
| 6. Configuración JWT | `backend/appsettings.json`, `appsettings.example.json`, `appsettings.Development.json` (ignorado) |
| 7. JwtSettings | `backend/Models/JwtSettings.cs` |
| 8. Program.cs | `backend/Program.cs` |
| 9–12. Repositorio | `backend/Interfaces/IUsuarioRepository.cs`, `backend/Repositories/UsuarioRepository.cs` |
| 13. AuthController | `backend/Controllers/AuthController.cs` |
| 14. Crear producto con el JWT | `backend/Interfaces/ICafeRepository.cs`, `backend/Repositories/CafeRepository.cs`, `backend/Controllers/CafesController.cs`, `backend/DTOs/CafeResponseDto.cs` |
| 15. Proteger endpoints | `CafesController`, `VariedadesController`, `ImagesController` (ya tenían `[Authorize(Policy = …)]`) |
| Frontend | `core/auth/` (`auth.ts`, `token.ts`, `guard.ts`, `interceptor.ts`), `pages/login`, `pages/registro`, `shared/menu-usuario`, `pages/admin/inventario` (columna "Creado por") |

**Adaptaciones respecto a la guía**

| # | Adaptación | Motivo |
|---|---|---|
| 1 | `Usuario.Rol` (`"Cliente"` por defecto) | El panel y la política `GestionInventario` dependen del rol. |
| 2 | DataAnnotations en español en `UsuarioDto` y `LoginDto` | Errores claros (400 automático de `[ApiController]`); el frontend valida igual. |
| 3 | Se conservan las políticas (`Politicas.Registrar`) además de `AddAuthorization()` | Escribir cafés, variedades e imágenes sigue siendo solo para Administrador. |
| 4 | Email con `Trim().ToLowerInvariant()` al registrar y al iniciar sesión | "Ana@Correo.com " y "ana@correo.com" son la misma cuenta, y basta un índice único simple. |
| 5 | Rol al registrarse según `Admin:Correos` (si no, Cliente); `IConfiguration` en el constructor | Crear administradores sin cuentas fijas en el código. |
| 6 | Claim `ClaimTypes.Role` en `GenerarToken` | Lo leen `[Authorize(Policy)]` y el frontend. |
| 7 | `AuthController` traduce el texto del repositorio a códigos HTTP: Register 400/200 `{ mensaje }`; Login 401 `{ mensaje }` o 200 `{ token }` | Con `Ok()` siempre, el frontend no puede saber si el login falló. |

**Otras diferencias (decisiones tomadas)**

- `ICafeRepository.CreateAsync(Cafe cafe, int userId, CancellationToken)`: el `userId` va antes del `CancellationToken` porque, por convención de .NET, el token de cancelación siempre es el último parámetro. El repositorio recibe la entidad (no el DTO), como ya hacía el proyecto: los controladores mapean DTO → entidad.
- `IUsuarioRepository.ObtenerPorId(int id)` no está en la guía: se agregó porque `GET /api/auth/me` se conservó y ahora lee los datos de la base con el claim NameIdentifier, siguiendo el patrón Controller → Repository.
- La tabla `usuario` queda en singular (sale del nombre del `DbSet` de la guía). `cafes.usuario_id` no tiene valor por defecto (la tabla debía estar vacía).
- `[Route("api/auth")]` fijo: las rutas quedan exactamente `/api/auth/Register` y `/api/auth/Login`.
- Se eliminaron: el login con cuentas fijas (`LoginRequestDto`, `LoginResponseDto`), el de Google (`GoogleLoginRequest` y el paquete `Google.Apis.Auth`), la sección `"Jwt"`, `UserDto` y el `IUserRepository`/`UserRepository` ADO.NET, que nunca se registró. La guía los reemplaza con `IUsuarioRepository`.
- `Admin:Correos` local incluye también `davidardila0607@gmail.com`: el plan pedía registrar esa cuenta como Administrador, y fuera de la lista habría quedado como Cliente. (Al final, el equipo cargó el catálogo con la cuenta de `desarrollo.testing@gmail.com`).
- Skills frente a la guía (gana la guía):
  - `dotnet-webapi` recomienda DTOs `sealed record`, capa de servicios y Problem Details. Se mantuvieron las clases, el patrón Controller → Repository y las respuestas `{ mensaje }`/`{ token }`.
  - `create-datadriven-aspnetcore` pediría CRUD completo de Usuario; la guía no lo incluye.
  - `optimizing-ef-core-queries`: `AnyAsync` y `FirstOrDefaultAsync` comparan la columna `email` sin funciones (ya está en minúsculas), así que usan el índice único. `/me` y `usuarioNombre` usan proyección: el JOIN de cafés solo lee el nombre, nunca el hash.
- Frontend: formularios reactivos (no Signal Forms), por coherencia con el resto del proyecto.

**Cómo dar rol de administrador**

1. Antes de registrarse: agrega el correo a `Admin:Correos` en `backend/appsettings.Development.json` y regístrate (Swagger, `CafeApi.http` o `/registro`).
2. Si la cuenta ya existe y ya hay un Administrador, cámbialo desde `/admin/usuarios` (Guía 2). Si no hay ninguno, en PostgreSQL (`psql` está en `C:\Program Files\PostgreSQL\17\bin\psql.exe`):

```sql
UPDATE usuario SET rol = 'Administrador' WHERE email = 'correo@ejemplo.com';
```

El rol viaja dentro del token: el usuario debe **cerrar sesión e iniciarla otra vez** para que el cambio se note.

**Clave JWT**: la clave local anterior (sección `"Jwt"`, del compañero) quedó **reemplazada** por una nueva de 64 bytes en `JwtSettings:Key`. Los tokens emitidos con la clave anterior ya no sirven. Cada integrante genera la suya (ver "Configuración").

## Guía 2: carrito de compras

Implementación de `docs/guias/guia-2-carrito-de-compras.md` (guía del profesor). Se respetaron sus nombres de clases, interfaz, métodos, DTOs, DbSets, rutas y migración. Equivalencias: el "Producto" de la guía es nuestro `Cafe`, `_context.Producto` es `_context.Cafes` y `Producto.Valor` es `Cafe.Precio`.

**En palabras sencillas**

- **Tabla intermedia**: un carrito tiene muchos cafés y un café puede estar en muchos carritos (relación muchos a muchos). Por eso existe `carrito_producto`: cada fila dice "en el carrito X hay N unidades del café Y". El carrito (`carrito`) solo guarda de quién es.
- **El carrito se crea al primer uso**: no se crea al registrarse. `ObtenerCarritoLocal` busca el carrito del usuario y, si no existe, lo crea en ese momento. Todos los métodos lo llaman primero, así que el primer `GetCarrito` (o el primer "Agregar") lo crea.
- **El usuario sale del token**: el controlador lee el id con `User.FindFirstValue(ClaimTypes.NameIdentifier)`. El frontend nunca envía de quién es el carrito; así nadie puede ver ni cambiar el carrito de otra persona aunque modifique la petición.
- **No comprar lo propio**: si el `UsuarioId` del café es el del token, "No puedes comprar tu propio producto." (409). Por eso la cuenta administradora compartida, dueña de los 25 cafés, no puede comprar.
- **El carrito no descuenta stock**: solo comprueba que no se pida más de lo que hay. Confirmar el pedido tampoco lo descuenta: bajará cuando el pago se apruebe (guía de Wompi).
- **Totales**: los calcula la API en `ObtenerCarrito` con una sola consulta (JOIN de `carrito_producto` con `cafes`, `variedades` y `procesos`, proyectada al DTO). `Precio`, `Subtotal` y `Total` son `double` como la guía; como los precios son pesos sin decimales, la conversión desde `decimal` no pierde nada.

**Paso de la guía → archivo**

| Paso | Archivo |
|---|---|
| 1. Clase Carrito | `backend/Models/Carrito.cs` |
| 2. CarritoProducto | `backend/Models/CarritoProducto.cs` (navegación `public Cafe? Producto`) |
| 3. DbSets | `backend/Data/AppDbContext.cs` (`Carrito`, `CarritoProducto`) + `Data/Configurations/CarritoConfiguration.cs` y `CarritoProductoConfiguration.cs` |
| 4. Modificar Usuario | `backend/Models/Usuario.cs` (`public Carrito? Carrito`) |
| 5. Migración | `backend/Data/Migrations/*_AddCarrito.cs` |
| 6. DTOs | `backend/DTOs/AddProductDto.cs`, `CarritoDto.cs`, `CarritoProductoDto.cs` |
| 7. Interfaz y registro | `backend/Interfaces/ICarritoRepository.cs`, `backend/Program.cs` (`AddScoped`) |
| 8–13. Repositorio | `backend/Repositories/CarritoRepository.cs` (`ObtenerCarritoLocal`, `AgregarProducto`, `ObtenerCarrito`, `ActualizarProducto`, `EliminarProducto`, `VaciarCarrito`) |
| 14. Controlador | `backend/Controllers/CarritoController.cs` |
| Frontend | `core/services/carrito.ts`, `core/models/carrito.ts`, `shared/carrito/` (`boton-carrito`, `lista-carrito`), `shared/agregar-carrito/`, `shared/zona-avisos/`, `pages/carrito/` |

**Adaptaciones respecto a la guía**

| | Adaptación | Motivo |
|---|---|---|
| A | `CarritoProductoDto` agrega `Variedad`, `Proceso`, `PresentacionGramos` y `Stock`; `CarritoDto` agrega `TotalUnidades` | La interfaz muestra variedad, proceso y gramos; el selector de cantidad necesita el stock y el ícono del navbar el total de unidades. |
| B | `AddProductDto` con `[Range(1, …)]` en `ProductId` y `Cantidad`, mensajes en español | Sin esto se podían enviar cantidades 0 o negativas (el CHECK de la base las rechazaría con un 500). Ahora es un 400 claro. |
| C | Control de stock en `AgregarProducto` ("El producto está agotado." si el stock es 0; "Solo hay N unidades disponibles de este café." si lo que hay en el carrito más lo nuevo supera el stock) y en `ActualizarProducto` (mismo mensaje) | La guía no controla el stock. Las comprobaciones van después de las de la guía (producto inexistente y propio). La suma se hace en `long` para que una cantidad enorme no desborde. Con 1 unidad el mensaje va en singular ("Solo hay 1 unidad disponible…"). |
| D | El controlador traduce el texto del repositorio a códigos HTTP, siempre con `{ mensaje }`: 404 (no existe / no está en el carrito), 409 (propio, agotado, sin unidades), 200 (éxito); `GetCarrito` devuelve el `CarritoDto` | Igual que la adaptación 7 de la Guía 1: con `Ok()` siempre, el frontend no sabría si algo falló. Los mensajes son constantes públicas de `CarritoRepository`. |

**Otras diferencias (decisiones tomadas)**

- La interfaz y el repositorio no reciben `CancellationToken` (la guía no lo tiene), igual que `IUsuarioRepository` en la Guía 1.
- `ObtenerCarrito` agrega `OrderBy(x => x.Id)` (los cafés salen en el orden en que se agregaron) y lee variedad y proceso en la misma proyección.
- `ActualizarProducto` lee solo la columna `stock` del café (`Select(c => c.Stock)`), sin cargar la entidad.
- `VaciarCarrito` se dejó como la guía (`ToListAsync` + `RemoveRange`), aunque `ExecuteDeleteAsync` haría un solo `DELETE`: con pocos cafés por carrito no hay diferencia y el código es el de la guía.
- Configuración: `carrito.usuario_id` único (un carrito por usuario) con FK `CASCADE` a `usuario`; `carrito_producto` con FK `CASCADE` a `carrito` y a `cafes`, índice único `(carrito_id, producto_id)` y `CHECK (cantidad >= 1)`.
- Skills frente a la guía (gana la guía): `dotnet-webapi` recomienda `ProblemDetails` y `ActionResult<T>` tipados; se mantuvo `IActionResult` con `{ mensaje }`. `optimizing-ef-core-queries`: proyección en `ObtenerCarrito` y lectura de una sola columna en `ActualizarProducto`; se descartó `ExecuteDeleteAsync` para no apartarse de la guía. `database-schema-designer`: índices únicos y `CHECK` en la base, no solo en la API.

**Reglas del carrito (frontend)**

- `Carrito` (`core/services/carrito.ts`) guarda el carrito en un signal. Se carga al iniciar sesión (o al recargar con una sesión guardada) mediante un `effect` sobre la sesión, y se borra de la memoria al cerrar sesión. Después de cada cambio vuelve a pedir `GetCarrito`: los totales siempre son los de la API.
- **Ícono del navbar** (`shared/carrito/boton-carrito`): siempre visible. Sin sesión es un enlace a `/login?volver=`; con sesión abre el **panel lateral** (`<dialog>` que entra desde la derecha) y muestra `TotalUnidades` en una píldora cereza que hace un pulso corto al cambiar (Web Animations API, 320 ms; sin pulso con movimiento reducido).
- **"Agregar al carrito"** (`shared/agregar-carrito`, en las cards de Productos e Inicio y en la vista rápida): selector de 1 a (stock − unidades que ya están en el carrito). Sin sesión lleva a `/login?volver=<página actual>`. Botón deshabilitado con el motivo: "Este café es tuyo" (`usuarioId` del café = id del token), "Agotado" o "Ya tienes todas las unidades disponibles". En las cards, el resultado se avisa abajo a la derecha ("Agregado al carrito" + "Ver carrito", `shared/zona-avisos`); en la vista rápida, dentro del panel, porque lo que está fuera de un `<dialog>` modal no se puede pulsar. Los 404 y 409 muestran el mensaje de la API.
- **Lista del carrito** (`shared/carrito/lista-carrito`, en el panel y en `/carrito`): por café, imagen, nombre, variedad · proceso · gramos, precio unitario, selector de 1 a stock (`ActualizarCarrito`), quitar (`EliminarProducto`) y subtotal. Resumen con unidades y total en COP ("$ 45.000"), "Confirmar pedido" (guía de pedidos, ver abajo), "Vaciar carrito" con confirmación (`VaciarCarrito`) y estado vacío con "Ver cafés".
- **`/carrito`**: dentro del layout de la tienda, protegida con el guard `requiereSesion` (sin sesión, `/login?volver=/carrito`).

## Guía de pedidos

Implementación de `docs/guias/guia-pedidos.md` (en el PDF del profesor aparece como "Guía 2 — Pedidos"; va después de la del carrito y antes de la de Wompi). Se respetaron sus nombres de clases, interfaz, métodos, DTOs, DbSets, propiedades, rutas, el estado `"Pendiente"` y la migración `AddPedidos`. Equivalencias: el "Producto" de la guía es nuestro `Cafe`, `item.Producto.Valor` es `Cafe.Precio` y `p.Producto.Nombre` / `ImagenUrl` son `Cafe.Nombre` / `Cafe.ImagenUrl`.

**En palabras sencillas**

- **Qué es un pedido**: la "foto" de un carrito en el momento de confirmarlo. `pedido` guarda de quién es, cuándo se hizo, el total y su estado; `pedido_producto` guarda cada café con su cantidad y su precio. Hoy todos nacen **Pendiente** (todavía no hay pago).
- **Por qué se guarda el precio**: el precio del café puede cambiar después. Si el pedido leyera el precio actual, un pedido de ayer cambiaría de total hoy. Por eso `CrearPedido` copia `Cafe.Precio` en `PedidoProducto.Precio`, y "Mis pedidos" muestra siempre ese precio guardado (verificado: se cambió el precio de un café y el pedido conservó el anterior).
- **Qué pasa con el carrito**: `CrearPedido` agrega el pedido y borra las filas de `carrito_producto` del usuario en **un solo `SaveChangesAsync`**: o pasan las dos cosas o ninguna. El carrito (la fila de `carrito`) sigue existiendo, vacío. Si algo falla (carrito vacío, café propio, sin stock), se devuelve el motivo **antes** de guardar y el carrito queda igual.
- **Por qué no se descuenta el stock al crear el pedido**: un pedido "Pendiente" aún no está pagado. Si se descontara al crearlo, un pedido que nunca se paga dejaría unidades "atrapadas". El stock se descuenta cuando el pago se aprueba (Guía 3, adaptación 7). `CrearPedido` sí **comprueba** que haya stock suficiente (adaptación A).
- **Nadie ve pedidos ajenos**: el usuario sale del token y `ObtenerPedido` filtra por `Id` **y** `UsuarioId`. El pedido de otra persona, para la API, simplemente no existe (404).

**Paso de la guía → archivo**

| Paso | Archivo |
|---|---|
| 1. Clase Pedido | `backend/Models/Pedido.cs` |
| 2. PedidoProducto | `backend/Models/PedidoProducto.cs` (navegación `public Cafe? Producto`) |
| 3. DbSets | `backend/Data/AppDbContext.cs` (`Pedido`, `PedidoProducto`) + `Data/Configurations/PedidoConfiguration.cs` y `PedidoProductoConfiguration.cs` |
| 4. Modificar Usuario | `backend/Models/Usuario.cs` (`ICollection<Pedido> Pedidos`) |
| 5. Migración | `backend/Data/Migrations/*_AddPedidos.cs` |
| 6. DTOs | `backend/DTOs/PedidoDto.cs`, `PedidoProductoDto.cs` (+ `PedidoAdminDto.cs`, adaptación F) |
| 7. Interfaz y registro | `backend/Interfaces/IPedidoRepository.cs`, `backend/Program.cs` (`AddScoped`) |
| 8–10. Repositorio | `backend/Repositories/PedidoRepository.cs` (`CrearPedido`, `ObtenerPedidos`, `ObtenerPedido`) |
| 11. Controlador | `backend/Controllers/PedidoController.cs` |
| Adaptación E | `backend/Interfaces/ICafeRepository.cs` y `Repositories/CafeRepository.cs` (`TienePedidosAsync`), `Controllers/CafesController.cs` (DELETE) |
| Frontend | `core/models/pedido.ts`, `core/services/pedidos.ts`, `shared/carrito/lista-carrito` ("Confirmar pedido"), `shared/estado-pedido`, `pages/mis-pedidos/` (`mis-pedidos`, `detalle-pedido`), `pages/admin/pedidos/`, `shared/menu-usuario` ("Mis pedidos"), `layout/admin` ("Pedidos") |

**Adaptaciones respecto a la guía**

| | Adaptación | Motivo |
|---|---|---|
| A | Control de stock en `CrearPedido`, después de la comprobación de café propio: stock 0 → "NOMBRE está agotado."; cantidad mayor que el stock → "No hay stock suficiente de NOMBRE (disponibles: N)." No se crea nada y el carrito queda igual. **El stock no se descuenta** | El stock pudo bajar desde que el café entró al carrito. Descontarlo es trabajo de la guía de Wompi (cuando el pago se aprueba). |
| B | `ObtenerPedidos` ordena por `Fecha` descendente (y por `Id` descendente para desempatar) | "Mis pedidos" muestra primero el más reciente. |
| C | `CrearPedido` sigue devolviendo el texto de la guía y se agregó un segundo método mínimo, `ObtenerUltimoPedidoId(usuarioId)` (lee solo la columna `id` del pedido más reciente del usuario). El controlador lo llama después de un `CrearPedido` exitoso y responde `{ mensaje, pedidoId }` | Es lo más simple que no cambia la firma de la guía: un `out` no se puede usar en métodos `async` y devolver una tupla cambiaría `Task<string>`. El frontend usa el id para abrir `/mis-pedidos/{id}`. |
| D | El controlador traduce el texto a códigos HTTP, siempre con `{ mensaje }`: carrito vacío → 400; café propio, sin stock o agotado → 409; éxito → 200 `{ mensaje, pedidoId }`; `GetPedido` inexistente o ajeno → 404 "Pedido no encontrado." | Igual que la adaptación 7 de la Guía 1 y la D de la Guía 2: con `Ok()` siempre, el frontend no sabría si algo falló, y `GetPedido` devolvería un 204 vacío. |
| E | `DELETE /api/cafes/{id}` responde 409 "No se puede eliminar un café que tiene pedidos." (lo comprueba `TienePedidosAsync` antes de borrar; si un pedido aparece entre la comprobación y el borrado, la FK `RESTRICT` da 23503 y también se responde 409). Un café que solo está en carritos se sigue borrando | Conservar el historial: un pedido no puede quedar con un café que ya no existe. Sin la comprobación, la FK daría un 500. |
| F | `GET /api/Pedido/Todos` con la política `GestionInventario`: todos los pedidos con `ClienteNombre` y `ClienteEmail`, en `PedidoAdminDto : PedidoDto`. **Después lo reemplazó `GET /api/Pedido/Historial`** (ver "Historial de compras") | La página del panel. Heredar de `PedidoDto` evita repetir sus propiedades. |

**Correcciones de errores del PDF**

- La interfaz declara `Task<PedidoDto> ObtenerPedido(...)` pero la implementación devuelve `PedidoDto?`: se usó `Task<PedidoDto?>` en las dos.
- `return Ok(await _ pedidoRepository.CrearPedido(userId));` tiene un espacio en `_ pedidoRepository`: es `_pedidoRepository`.
- `(decimal)item.Producto.Valor`: en este proyecto `Cafe.Precio` ya es `decimal`, así que no hay conversión.
- La guía dice "ampliará el e-commerce construido en la Guía 1", pero necesita el carrito de la Guía 2.

**Otras diferencias (decisiones tomadas)**

- Como en las guías anteriores, la interfaz y el repositorio no reciben `CancellationToken` y los DTOs son clases (no `sealed record`); `Fecha` es `DateTime` (en UTC), no `DateTimeOffset`.
- `GetPedidos` y `Todos` devuelven la lista directamente (como la guía); `GetPedido` pasó a `IActionResult` por el 404.
- Los productos de cada pedido salen ordenados por `Id` (el orden en que se agregaron), como en `ObtenerCarrito`.
- Mensaje de café propio: el de esta guía, "No puedes comprar tus propios productos." (el carrito conserva el suyo, "No puedes comprar tu propio producto.").
- `CrearPedido` es la guía tal cual (`Include` + `ThenInclude` con seguimiento): necesita las entidades del carrito para borrarlas con `RemoveRange`. Las lecturas (`ObtenerPedidos`, `ObtenerPedido`, `Todos`) proyectan directamente al DTO: una sola consulta con JOIN, sin cargar entidades.
- Índice `ix_pedido_usuario_id` (lo usan "Mis pedidos", `GetPedido` y `ObtenerUltimoPedidoId`). No se indexó `fecha`: la tabla es pequeña y el orden de `Todos` no lo necesita hoy.
- Skills frente a la guía (gana la guía): `dotnet-webapi` recomienda `sealed record`, `DateTimeOffset`, `CancellationToken`, capa de servicios y ProblemDetails; se mantuvo el estilo de las guías. `database-schema-designer`: `CHECK` de estado y cantidad, `RESTRICT` hacia `usuario` y `cafes`, `CASCADE` de pedido a sus productos. `optimizing-ef-core-queries`: proyecciones y lectura de una sola columna en `ObtenerUltimoPedidoId`. La skill pide no aplicar la migración sin permiso: aquí el plan de trabajo pedía aplicarla.

**Reglas de los pedidos (frontend)**

- **"Confirmar pedido"** (`shared/carrito/lista-carrito`, en el panel lateral y en `/carrito`): habilitado cuando hay cafés. Abre el formulario **"Datos de envío"** (`shared/carrito/formulario-envio`, ver "Dirección de envío") con el resumen "Se creará un pedido con N productos por $ TOTAL…" (N = unidades). Al confirmar: `Pedidos.crear(datos)` → recarga el carrito (el contador vuelve a 0) → aviso "Pedido creado" → `/mis-pedidos/{pedidoId}`, donde está "Pagar". Un 400 o 409 se muestra dentro del formulario y el carrito queda igual.
- **`/mis-pedidos`** (guard `requiereSesion`; enlace "Mis pedidos" en el menú de la cuenta): una fila por pedido (enlace al detalle) con "Pedido #id", fecha (`d 'de' MMMM 'de' y`, es-CO), estado, hasta 3 fotos pequeñas, "N productos" y total en COP. Estado vacío con "Ver cafés" (`/productos`).
- **`/mis-pedidos/:id`** (guard `requiereSesion`): fecha y hora, referencia, estado, aviso de pago con el botón **"Pagar"** si está Pendiente (o "Intentar de nuevo" si fue Rechazado), y el resumen (`shared/resumen-pedido`): cada café (imagen, nombre, cantidad × precio guardado, subtotal), total y dirección de envío. El 404 (o un id que no es número) muestra "Pedido no encontrado" con "Ver mis pedidos": el `rxResource` convierte el 404 en `null` con `catchError`.
- **Etiqueta de estado** (`shared/estado-pedido`): píldora con ícono y color propio (Pendiente `bi-hourglass-split` en miel, Pagado `bi-check-circle` en musgo, Rechazado `bi-x-circle` en el rojo de error), tokens `--estado-*` en `styles.css`. Fondo opaco (papel teñido al 8 %) para que pase AA sobre la niebla de la página.

## Guía 3: Wompi (con modo simulación)

Implementación de `docs/guias/guia-3-wompi-sandbox.md` (guía del profesor). Se respetaron sus nombres (`WompiSettings`, `ReferenciaWompi`, `TransactionIdWompi`, `WompiWebhookDto`, `WompiData`, `WompiTransaction`, `WompiSignature`, `IWompiService`, `GenerarFirmaIntegridad`, `ValidarEvento`, `WompiPagoDto`, `PrepararPago`, `ProcesarPagoWompi`), las rutas `POST /api/Pedido/{id}/PrepararPago` y `POST /api/Pedido/Webhook` y la migración `AddWompi`. **No tenemos llaves reales de Sandbox** (el panel de Wompi exige activar un comercio real), así que se agregó un **modo simulación**: todo el código de la guía está y se ejecuta, pero el "checkout" es una pasarela de pruebas de Altura.

**En palabras sencillas**

- **Referencia**: el nombre con el que Wompi identifica el pago, `PEDIDO-15`. Se asigna justo después de crear el pedido (el Id lo da la base de datos). Wompi no deja reutilizar una referencia que ya tuvo una transacción finalizada, así que un pago rechazado se reintenta con `PEDIDO-15-2`, `PEDIDO-15-3`…
- **Firma de integridad**: el navegador no puede decidir cuánto cobrar. El backend calcula SHA-256 de `referencia + monto en centavos + moneda + IntegritySecret` (en ese orden, sin separadores) y se la entrega al checkout; si alguien cambia el monto en el navegador, la firma ya no coincide y Wompi rechaza el pago. El secreto nunca sale del servidor. El monto va en **centavos**: 45.000 COP = 4.500.000.
- **Webhook**: cuando una transacción termina, Wompi llama a `POST /api/Pedido/Webhook` con un evento `transaction.updated`. Es la fuente de verdad del pago (la redirección del navegador es solo informativa). La API responde 200 a todo evento válido: si recibe otro código, Wompi reintenta.
- **Validación del checksum**: el webhook es público, así que cualquiera podría enviar un "pago aprobado" falso. Cada evento trae `signature.properties` (por ejemplo `transaction.id`, `transaction.status`, `transaction.amount_in_cents`) y `signature.checksum`. Se concatenan los **valores** de esas propiedades (leídos de `data`, en ese orden), luego el `timestamp` y luego el **EventSecret**; se calcula SHA-256 y debe coincidir con el checksum (Wompi lo muestra en mayúsculas: se compara sin distinguirlas). Si no coincide → 401 y no cambia nada.
- **Al aprobarse**: el pedido pasa a "Pagado" solo si el monto y la moneda son los del pedido, y en el mismo guardado se descuenta el stock. Si el mismo evento llega dos veces, el segundo no hace nada (un pedido pagado ya no cambia).
- **Modo simulación** (`WompiSettings:ModoSimulado = true`): "Pagar" lleva a `/pago/simulador`, la **pasarela de pruebas** de Altura (con el aviso "Modo simulación: no se procesan pagos reales…"). Sus botones llaman a `POST /api/Pedido/{id}/SimularPago`, que **arma el mismo evento que enviaría Wompi** (id `SIM-<guid>`, la referencia, APPROVED o DECLINED, el monto en centavos, COP), lo **firma con el EventSecret** con la fórmula de arriba y lo pasa por el **mismo camino del webhook real** (`RecibirEvento` → `ValidarEvento` → `ProcesarPagoWompi`). No hay lógica de pago duplicada: lo único simulado es quién envía el evento.

**Cómo pasar a Wompi real**

1. Crear la cuenta de comercio en Wompi y copiar, de *Desarrollo → Programadores → Sandbox*, las 4 llaves: `pub_test_…`, `prv_test_…`, `test_integrity_…` y `test_events_…`.
2. Pegarlas en `WompiSettings` (local: `appsettings.Development.json`; producción: variables `WompiSettings__PublicKey`, `__PrivateKey`, `__IntegritySecret`, `__EventSecret`; ver `DEPLOY.md`). `BaseUrl` sigue siendo `https://sandbox.wompi.co/v1` (producción: `https://production.wompi.co/v1` con las llaves `prod_`).
3. Poner `ModoSimulado` en `false` (`WompiSettings__ModoSimulado=false`). `SimularPago` deja de existir (404) y "Pagar" va al Web Checkout.
4. Poner `RedirectUrl` con la URL pública del frontend + `/pago/resultado`.
5. Publicar la API y, en el panel de Wompi, poner la **URL de eventos**: `https://TU-API/api/Pedido/Webhook` (la API debe ser pública con HTTPS).

Con Wompi real, el frontend arma la URL `https://checkout.wompi.co/p/?public-key=…&currency=COP&amount-in-cents=…&reference=…&signature:integrity=…&redirect-url=…` (`urlCheckoutWompi` en `core/services/pagos.ts`). Al terminar, Wompi vuelve a `/pago/resultado?id=<transacción>`; como no trae el número del pedido, `Pagos.pagar()` lo guarda antes en `sessionStorage`. La página llama a `POST /api/Pedido/{id}/ConfirmarPago`, que consulta la transacción a Wompi (`GET {BaseUrl}/transactions/{id}` con `Authorization: Bearer <llave privada>`) y la aplica con `ProcesarPagoWompi`; el webhook la habría aplicado igual (es idempotente). **Pendiente**: nada de esto se ha probado contra Wompi (no hay llaves); solo se comprobó que con llaves de marcador Wompi Sandbox responde 404 y la API lo maneja.

**Paso de la guía → archivo**

| Paso | Archivo |
|---|---|
| 2. WompiSettings | `backend/Models/WompiSettings.cs` (+ `ModoSimulado`) |
| 3. appsettings | `backend/appsettings.json`, `appsettings.example.json` (marcadores), `appsettings.Development.json` (ignorado; marcadores `…_SIMULADO`) |
| 4. Registro | `backend/Program.cs` (`Configure<WompiSettings>`, `AddScoped<IWompiService, WompiService>`, `AddHttpClient`) |
| 6. Pedido | `backend/Models/Pedido.cs`, `Data/Configurations/PedidoConfiguration.cs` |
| 7. Migración | `backend/Data/Migrations/*_AddWompi.cs` |
| 8. Referencia | `backend/Repositories/PedidoRepository.cs` (`CrearPedido`) |
| 9. DTOs del webhook | `backend/DTOs/WompiWebhookDto.cs` |
| 10. IWompiService / WompiService | `backend/Interfaces/IWompiService.cs`, `backend/Repositories/WompiService.cs` (en `Repositories/`, como dice la guía) |
| 11. WompiPagoDto | `backend/DTOs/WompiPagoDto.cs` (+ `SimularPagoDto`, `ConfirmarPagoDto`) |
| 12–14. PrepararPago | `backend/Interfaces/IPedidoRepository.cs`, `Repositories/PedidoRepository.cs` |
| 15–16. Endpoints | `backend/Controllers/PedidoController.cs` (`PrepararPago`, `Webhook`, `SimularPago`, `ConfirmarPago`) |
| 17. ProcesarPagoWompi | `backend/Repositories/PedidoRepository.cs` |
| 18. URL de eventos | `DEPLOY.md` (no se configura hasta publicar) |
| Frontend | `core/models/pago.ts`, `core/services/pagos.ts`, `shared/boton-pagar`, `pages/pago/` (`pasarela-pruebas`, `resultado-pago`), `shared/resumen-pedido` |

**Adaptaciones respecto a la guía**

| # | Adaptación | Motivo |
|---|---|---|
| 1 | **Modo simulación**: `WompiSettings.ModoSimulado`, `WompiPagoDto.ModoSimulado`, `POST /api/Pedido/{id}/SimularPago` (solo con `ModoSimulado = true`; si no, 404) y la pasarela `/pago/simulador`. También `POST /api/Pedido/{id}/ConfirmarPago` (solo con Wompi real) y `IWompiService.ConsultarTransaccion` | Sin llaves de Sandbox no se puede abrir el checkout ni recibir eventos. La simulación ejerce el mismo código del webhook. |
| 2 | `[JsonPropertyName("amount_in_cents")]` en `WompiTransaction` | Wompi envía *snake_case*; el resto de nombres coincide sin distinguir mayúsculas. |
| 3 | `ValidarEvento` valida de verdad el checksum (la guía devuelve `true`); el cálculo está en `CalcularChecksumEvento`, que también usa la simulación para firmar | Seguridad: sin validación, cualquiera marcaría pedidos como pagados. |
| 4 | `PrepararPago` solo para pedidos Pendiente o Rechazado (un Rechazado vuelve a Pendiente con referencia nueva `-2`, `-3`…); 409 "Este pedido ya fue pagado."; 404 "Pedido no encontrado." (no existe o es ajeno); 409 si falta stock. Las comprobaciones están en `ValidarPago`, aparte, para no cambiar la firma de `PrepararPago` | La guía devuelve `Ok(null)` en todos los casos. Wompi no deja reutilizar una referencia finalizada. |
| 5 | Monto en centavos y moneda (`COP`) deben coincidir con el pedido para marcarlo Pagado | Un evento con otro monto no debe pagar el pedido. |
| 6 | VOIDED y ERROR también → Rechazado; PENDING no cambia nada | Son los estados finales que documenta Wompi. |
| 7 | Al pasar a Pagado por primera vez se descuenta el stock en el mismo `SaveChangesAsync`; un pedido ya pagado no cambia más (idempotencia). Si un café no alcanza, queda en 0 y se registra en el log | El stock baja cuando el pago es real (no al crear el pedido). |
| — | `RecibirEvento` (privado): un solo camino para webhook y simulación; el webhook valida antes de mirar el tipo de evento | Evitar duplicar la lógica. |
| — | `CrearPedido` guarda pedido y referencia en una transacción de base de datos; el índice único de la referencia excluye la vacía | Entre los dos guardados la referencia está vacía; dos pedidos simultáneos chocarían sin el filtro. |

**Correcciones de errores del PDF**: el constructor del repositorio usa `ApplicationDbContext` (aquí `AppDbContext`); a la línea `Configure<WompiSettings>(…)` le falta un paréntesis en el PDF; `ValidarEvento` devuelve `true` sin validar (corregido, adaptación 3); el PDF guarda `WompiService` en `Repositories/` aunque es un servicio (se respetó).

**Verificado contra la documentación (docs.wompi.co)**: Web Checkout en `https://checkout.wompi.co/p/` con `public-key`, `currency`, `amount-in-cents`, `reference`, `signature:integrity` y `redirect-url`; firma de integridad `<Referencia><Monto><Moneda><Secreto>`; evento con `signature.properties` y `checksum` (fórmula de arriba; el ejemplo oficial va en mayúsculas); estados finales APPROVED, DECLINED, VOIDED, ERROR; Wompi agrega `?id=<transacción>` a la URL de retorno; consultar una transacción exige la llave privada; las referencias no se reutilizan. Contradicción con el plan de trabajo: ninguna de fondo; solo se precisó que el checksum se compara sin distinguir mayúsculas.

## Dirección de envío

Adaptación a la guía de pedidos (no estaba en la guía): el pedido guarda adónde se envía.

- **Backend**: `DatosEnvioDto` (dirección obligatoria, máx. 200; ciudad obligatoria, máx. 80; departamento obligatorio, máx. 80; teléfono obligatorio de 7 a 15 dígitos, solo números; notas opcionales, máx. 300; mensajes en español). Es el cuerpo de `POST /api/Pedido/CrearPedido`: si algo no cumple, `[ApiController]` responde 400 antes de llegar al repositorio. `CrearPedido(usuarioId, datos)` (la firma de la guía cambia) guarda los datos con `Trim()`; el resto de la lógica de la guía no cambió. `PedidoDto` incluye referencia y envío.
- **Frontend**: `shared/carrito/formulario-envio` es un `<dialog>` con formulario reactivo: dirección, ciudad o municipio, departamento (lista de los 32 departamentos y Bogotá D.C., `core/data/departamentos.ts`), teléfono (acepta espacios al escribir y los quita al enviar) y notas. Errores bajo cada campo; al enviar con errores, el foco va al primero. Es un componente aparte (y no parte de `ListaCarrito`) por el presupuesto de 4 kB de CSS por componente. La dirección se muestra en el detalle, en la pasarela, en el resultado del pago y en el historial (`shared/resumen-pedido`); los pedidos anteriores dicen que se hicieron antes de pedir la dirección.

## Historial de compras

Reemplaza a la página "Pedidos" del panel (y a `GET /api/Pedido/Todos`). Solo Administrador (política `GestionInventario`: el Cliente recibe 403 en la API y "No tienes permiso" en la ruta).

- **API**: `GET /api/Pedido/Historial?estado=&desde=&hasta=&texto=`. Por defecto todos, del más reciente al más antiguo. Las fechas son días de Colombia (UTC-5 todo el año: el 7 de octubre va de las 05:00 UTC del 7 a las 05:00 UTC del 8). El texto busca con `ILIKE` (sin distinguir mayúsculas) en el nombre y el correo del cliente y en la referencia (se escapan `%` y `_`). Cada fila (`PedidoAdminDto`): id, referencia, fecha, estado, cliente, unidades, total, productos (precio guardado), dirección, teléfono, notas y `TransactionIdWompi`. **Indicadores**: compras pagadas, unidades vendidas e ingresos (suma de los pedidos Pagado) del rango de fechas y el texto; **no dependen del filtro de estado**, para que no queden en cero al mirar los pendientes. Se calculan en la base de datos (`COUNT` y `SUM`).
- **Frontend** (`pages/admin/historial`, ruta `/admin/historial`; `/admin/pedidos` redirige): tres indicadores en una franja con divisores (no tres tarjetas), filtros (estado en botones con `aria-pressed`, "Desde" y "Hasta" con `input type="date"` que se limitan entre sí, buscador) y "Quitar filtros"; tabla con referencia, fecha y hora (`dd/MM/yyyy, h:mm a`), cliente, unidades, total y estado. Toda la fila abre el **panel lateral** (`<dialog>`, mismo estilo que el inventario; la referencia es un botón para el teclado): estado, cliente, transacción y el resumen (cafés, total y dirección). Estados de carga (esqueletos), error ("Reintentar") y vacío ("Ninguna compra coincide con los filtros." con "Quitar filtros").

## Reseñas del Inicio

La sección de cierre ("Llegaste a la cumbre", su texto, el botón y la foto) se reemplazó por **"Lo que dicen de Altura"** (`pages/inicio/resenas`), con `data-etapa="cumbre"` (el altímetro sigue terminando en Cumbre, 2.100 msnm).

- **Las 10 reseñas son ficticias**: contenido de marca de un proyecto académico (`core/data/resenas.ts`), sin una plataforma de reseñas detrás. Los cafés que mencionan sí son del catálogo. Promedio 4,8 (8 de cinco estrellas y 2 de cuatro), calculado de esos datos. Avatares con la inicial sobre tonos suaves de la paleta (alba, liquen, helecho, niebla honda) y la letra en bosque.
- **Fondo**: degradado del papel de la sección anterior al **alba**; contra el bosque del footer (con su cresta) se leen como dos bloques. Se eligió alba sobre niebla porque niebla es el fondo de toda la página y no marcaba el cierre, y sobre horizonte porque este es casi beige y se confunde con el papel.
- **Rueda** (con movimiento): dos columnas de 5 tarjetas suben sin fin a 7 s por tarjeta; la segunda va desfasada media vuelta y en móvil se oculta. Cada columna tiene la lista **dos veces** (la copia con `aria-hidden`) y la pista sube exactamente `-50 %` (la separación es `padding-bottom` de cada tarjeta, no `gap`, para que las dos copias midan igual y el empalme no salte). Máscara de gradiente en cada columna (no en la rueda, para no recortar su contorno de foco). Se pausa con el mouse, al enfocarla con el teclado (`tabindex="0"`, `role="region"` con `aria-label`) y con el botón **"Pausar reseñas"** (WCAG 2.2.2 pide poder detener todo movimiento automático de más de 5 s; el botón cambia a "Reanudar reseñas").
- **Movimiento reducido**: la rueda no se dibuja; se ven 3 reseñas con "Anterior" y "Siguiente" (`aria-controls`) y "Reseñas 1 a 3 de 10" (`aria-live`). La última página empieza antes para mostrar siempre 3.
- Las estrellas son íconos `aria-hidden` con su texto aparte ("5 de 5 estrellas"). Sin marca, logo ni colores de plataformas de reseñas reales.

## Cuenta administradora compartida

- **`desarrollo.testing@gmail.com`** (nombre **"Administrador Altura"**) es la cuenta Administrador del equipo. Está en `Admin:Correos` y es la dueña de los 25 cafés del catálogo.
- Cada integrante la registra **en su base de datos local** con `POST /api/auth/Register` (Swagger, `CafeApi.http` o `/registro`) y luego carga el catálogo con `& .\seed\seed-productos.ps1` iniciando sesión con ella. La contraseña la comparte el equipo por fuera del repositorio: **nunca se escribe en ningún archivo**.
- **Esa cuenta no puede comprar**: es dueña de todos los cafés, así que ve "Este café es tuyo" en cada uno (y la API responde 409; un pedido con un café propio también da 409). **Para probar el carrito y los pedidos se usa una cuenta Cliente** (cualquier correo que no esté en `Admin:Correos`, registrado en `/registro`).
- Un cambio de rol (desde `/admin/usuarios` o con `UPDATE`) se aplica cuando el usuario vuelve a iniciar sesión: el token que ya tiene conserva el rol anterior hasta que expira (60 min).

## Preparación para producción

Resumen; los pasos completos están en `DEPLOY.md`. **No se ha desplegado nada.**

- **Configuración por variables de entorno** sin código especial (ASP.NET Core ya lee `Seccion__Clave`): `ConnectionStrings__CafeDatabase`, `JwtSettings__Key`, `CloudinarySettings__CloudName`, `CloudinarySettings__ApiKey`, `CloudinarySettings__ApiSecret`, `Admin__Correos__0`, `Cors__AllowedOrigins__0`.
- **Falla al arrancar con un mensaje claro** si falta `ConnectionStrings:CafeDatabase` o si `JwtSettings:Key` falta, es el marcador `CLAVE_SECRETA_DEL_PROYECTO` o tiene menos de 32 bytes (verificado ejecutando la DLL en Production sin esas variables).
- **`PORT`** (Railway): si existe, `builder.WebHost.UseUrls("http://0.0.0.0:{PORT}")`; si no, `launchSettings.json` (verificado con `PORT=5099`).
- **CORS**: `Cors:AllowedOrigins` (en `appsettings.json` solo `http://localhost:4200`); la política se llama `PermitirFrontend`.
- **Swagger y OpenAPI solo en Development** (en Production `/swagger` da 404). **Sin `UseHttpsRedirection`**: el hosting recibe el HTTPS.
- **`GET /api/health`** público: `{ "estado": "ok" }` (una línea con `app.MapGet` en `Program.cs`).
- **Migraciones**: no se aplican al arrancar. Se aplican a mano con `dotnet ef database update --connection "<cadena de producción>"` o con `dotnet ef migrations script --idempotent` (ver `DEPLOY.md`).
- `CafeApi.csproj` no copia `appsettings.Development.json` ni `appsettings.example.json` al publicar (antes `dotnet publish` copiaba el archivo con secretos).
- **Frontend**: `environment.ts` (producción) con `apiBaseUrl` de marcador `https://TU-API.up.railway.app/api`; `ng build` sin advertencias. El hosting debe **redirigir todas las rutas a `index.html`** (SPA).

## Configuración

La configuración local va en **`backend/appsettings.Development.json`** (**ignorado por Git**). **No se usan User Secrets**: tienen prioridad sobre `appsettings.Development.json` y causaban confusión (el `UserSecretsId` sigue en el `.csproj` pero debe quedar vacío; si hace falta: `dotnet user-secrets clear`).

Copia `appsettings.example.json` → `appsettings.Development.json` y rellena:

| Clave | Uso |
|---|---|
| `ConnectionStrings:CafeDatabase` | PostgreSQL local (`Host=localhost;Port=5432;Database=cafeapi_dev;Username=postgres;Password=...`) |
| `JwtSettings:Key` | Clave secreta con la que la API firma los JWT: 64 bytes aleatorios en Base64. En `appsettings.json` y `appsettings.example.json` solo va el marcador `CLAVE_SECRETA_DEL_PROYECTO` |
| `JwtSettings:Issuer` / `Audience` / `DurationInMinutes` | `EcommerceApi` / `EcommerceAngular` / `60` (valores de la guía) |
| `Admin:Correos` | Correos que se registran como Administrador (comparados en minúsculas). Local: `davidardila0607@gmail.com`, `desarrollo.testing@gmail.com` (la cuenta compartida) y `e2e-admin@altura.test` (este último **solo para las pruebas automáticas**) |
| `Cors:AllowedOrigins` | Orígenes del frontend permitidos por CORS. Viene en `appsettings.json` con `http://localhost:4200`; en producción, `Cors__AllowedOrigins__0` |
| `CloudinarySettings:CloudName` / `ApiKey` / `ApiSecret` | Cuenta de Cloudinary |
| `WompiSettings:PublicKey` / `PrivateKey` / `IntegritySecret` / `EventSecret` | Llaves de Wompi (Guía 3). Hoy, **marcadores claramente falsos** (`pub_test_SIMULADO`, `prv_test_SIMULADO`, `test_integrity_SIMULADO_local`, `test_events_SIMULADO_local`); con ellos funciona el modo simulación (la firma y el checksum se calculan igual) |
| `WompiSettings:BaseUrl` / `RedirectUrl` | `https://sandbox.wompi.co/v1` / `http://localhost:4200/pago/resultado` |
| `WompiSettings:ModoSimulado` | `true`: pasarela de pruebas de Altura. `false`: Wompi real (ver "Guía 3: Wompi") |
| `Logging:LogLevel` | `Information` / `Microsoft.AspNetCore: Warning` |

Generar una `JwtSettings:Key` (PowerShell):
```powershell
$b = New-Object byte[] 64; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
```

**Nunca** subas secretos a Git ni los escribas en `appsettings.json` / `appsettings.example.json`. En producción la misma configuración llega por variables de entorno (lista completa en `DEPLOY.md`).

## Comandos del backend (desde `backend/`)

```powershell
dotnet tool restore                      # instala dotnet-ef local (.config/dotnet-tools.json)
dotnet build                             # debe quedar con 0 advertencias
dotnet ef database update                # crea/actualiza cafeapi_dev
dotnet ef migrations add NombreCambio --output-dir Data/Migrations
dotnet ef migrations script              # ver el SQL antes de aplicarlo
dotnet ef migrations remove              # solo si la migración NO está aplicada
dotnet run --launch-profile http         # http://localhost:5031  (https: 7031)
```

- Swagger: http://localhost:5031/swagger — OpenAPI: `/openapi/v1.json` (solo en Development).
- `CafeApi.http`: peticiones de prueba (Register → Login → token → resto, con los casos 400/401/403). Reemplaza el correo y `TU_CONTRASEÑA`.
- psql no está en el PATH: `"C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -U postgres -d cafeapi_dev`.
- Al probar con `curl` desde Git Bash, envía el cuerpo con `--data-binary @archivo.json`: pasar JSON con tildes como argumento lo convierte a ANSI y la API responde 400.

## Productos de ejemplo (seed)

El catálogo vive en **`backend/seed/catalogo.json`** (25 cafés: imagen, nombre, variedad, proceso, presentación, origen, stock y precio). Lo leen el script de carga y el generador de imágenes, así que hay una sola fuente.

`backend/seed/seed-productos.ps1` (Windows PowerShell 5.1 o 7; archivo UTF-8 con BOM):

1. Pide correo y contraseña del Administrador (o `-Email`/`-Password` como `SecureString`; `-ApiBaseUrl`, por defecto `http://localhost:5031/api`). Para pasar un `SecureString`, ejecuta el script **en la misma sesión** (`& .\seed\seed-productos.ps1 -Email ... -Password $clave`): no viaja a un proceso `powershell` nuevo.
2. `POST /api/auth/Login` → token (propiedad `token`); `GET /api/auth/me` comprueba que la cuenta sea Administrador. Resuelve `variedadId` y `procesoId` por nombre con `GET /api/variedades` y `GET /api/procesos`.
3. Por cada café: si ya existe (nombre sin mayúsculas + variedad + proceso + presentación, según `GET /api/cafes`) lo **omite sin subir imagen**; si no, `POST /api/images` y `POST /api/cafes` con `procesoId`, `imagenUrl` e `imagenPublicId`. Si el `POST` falla (por ejemplo 409), borra la imagen recién subida con `DELETE /api/images` y lo reporta como omitido.
4. Los cuerpos se envían como bytes UTF-8 (las tildes llegan bien en PowerShell 5.1).

Resultado verificado: primera ejecución "25 creados"; segunda, "0 creados, 25 omitidos" (sin subir imágenes). Desde la Guía 1 cada café tiene dueño: la carga del 2026-10-06 la hizo la cuenta Administrador del equipo y los 25 cafés tienen ese `usuarioNombre`. La API devuelve exactamente los 25 cafés del catálogo y la carpeta `cafes/` de Cloudinary tiene 25 imágenes, sin huérfanas.

| Región (origen) | Cafés |
|---|---|
| Santander | Mesa de los Santos (340 y 500 g), Chicamocha, Los Santos, Cañón Dorado |
| Huila | Pitalito (340 y 500 g), Pitalito Reserva, Rosa del Huila (340 y 500 g), San Agustín |
| Nariño | Volcán Galeras (340 y 500 g), La Unión, Buesaco, Altiplano Sur |
| Magdalena | Sierra Nevada (Castillo 340 g y Colombia 500 g), Minca, Sierra Antigua |
| Cauca | Tierradentro (340 y 500 g), Inzá, Popayán, Inzá Reserva |

Todos tienen stock (ninguno agotado); solo Inzá Reserva queda en "Quedan 5". Precios de 45.000 a 132.000 COP. Los orígenes coinciden con las claves del mapa (`departamentoDeOrigen`). Procesos: 11 Lavado, 8 Honey, 6 Fermentado.

**`-ActualizarImagenes`**: sube la imagen nueva de cada café existente y hace `PUT /api/cafes/{id}` conservando sus datos (incluido `procesoId`) y enviando el nuevo `imagenUrl` + `imagenPublicId`; el backend borra la imagen anterior de Cloudinary.

**Limpieza previa (esta versión)**: antes de cargar el catálogo nuevo se borraron por la API los 6 cafés anteriores (cada `DELETE /api/cafes/{id}` borra también su imagen) y se verificó que la carpeta `cafes/` de Cloudinary quedara vacía.

### Imágenes de producto (set 3, "Herbario Kraft")

`backend/seed/imagenes/NN-nombre-gramos.{svg,png}` (25 + 25; las del set 2 se borraron). Filosofía completa en `backend/seed/imagenes/DISENO.md`.

- Bolsa stand-up de kraft **de frente** sobre fondo gris neutro `#ECECEA`, luz de estudio desde arriba y sombra blanda; sello engarzado, muesca, cierre y válvula.
- Una banda de **granos tostados** cruza la bolsa y sobre ella una **ilustración botánica** (rama, hojas con nervaduras, flores blancas y cerezas). Las cerezas siguen la variedad: rojas en general, **amarillas** en Bourbon Amarillo y **rosadas** en Bourbon Rosado. Cada bolsa tiene una rama un poco distinta (semilla aleatoria por café).
- **Emblema hexagonal** "Café Altura", nombre en Bricolage Grotesque condensada, filete del color de la variedad, VARIEDAD y ORIGEN en Geist Mono, PESO NETO y "100% café colombiano premium". Todo el texto en español.
- **Sello circular del proceso** con su color: Lavado azul de agua, Honey ámbar, Fermentado vino.
- La de **500 g es un 17 % más grande**.
- PNG 1600×1600 de **378 a 530 kB** (promedio 431 kB; el límite pedido era 600 kB).

**Generador**: `frontend/herramientas/generar-bolsas.mjs` (Node, desde `frontend/`): `node herramientas/generar-bolsas.mjs` (todas) o `node herramientas/generar-bolsas.mjs 09 10` (solo esas). Lee `catalogo.json`, arma cada SVG, lo abre en Chromium (Playwright) con las fuentes de `@fontsource` **incrustadas en base64** (con `setContent` las URL `file://` no cargaban), exporta el PNG y lo comprime con **`sharp`** (paleta de 192 colores; devDependency). Sus colores son "de imprenta": Típica `#8A6316` y Honey `#B97A12` son más cálidos que los de la web (`#7E5A10` y `#875700`, oscurecidos para el contraste AA del texto).

## Fotografías del sitio

`backend/seed/subir-imagenes-sitio.ps1` lee `seed/sitio/fotos.json` y hace una **subida firmada directa a Cloudinary** (carpeta `sitio`, `public_id` fijo, `overwrite`, idempotente) pasando la URL de Unsplash: Cloudinary descarga la foto, así que no se guardan fotos en el repo. Usa las credenciales de `appsettings.Development.json` sin imprimirlas. No usa la API porque `POST /api/images` siempre sube a la carpeta `cafes` (no se modificó el backend). La marca de tiempo de la firma se calcula en UTC (`DateTimeOffset.UtcNow`; en PowerShell 5.1 `Get-Date -UFormat %s` usa la hora local y Cloudinary rechaza la firma).

El frontend las sirve con `f_auto,q_auto,w_N` y `srcset` (`core/utils/imagenes.ts` → `urlSitio`, `srcsetSitio`; base en `environment.cloudinaryBase`).

| Uso (`public_id`) | Autor | Foto original (Unsplash License) |
|---|---|---|
| `sitio/hero` (no se usa en el concepto Ascenso; se conserva en Cloudinary) | George Dagerotip | https://unsplash.com/photos/a-person-holding-a-handful-of-berries-in-their-hand-XRY4giMaDoA |
| Cielo del hero y paso "Origen" (`sitio/origen`) | Phạm Trọng Họ | https://unsplash.com/photos/person-walking-on-misty-hillside-plantation-5HG67luOwFE |
| Cosecha (`sitio/cosecha`) | Gerson Cifuentes | https://unsplash.com/photos/a-person-picking-coffee-beans-from-a-tree-0-SWia-_xjA |
| Tueste (`sitio/tueste`) | Tim Mossholder | https://unsplash.com/photos/coffee-roasting-in-playa-del-carmen-YC6RVdoTtIk |
| Paso "Taza" y foto del cierre (`sitio/taza`) | Beau Carpenter | https://unsplash.com/photos/a-coffee-maker-pouring-coffee-into-a-cup-KGR2u2rG6c4 |
| `sitio/acceso` (no se usa en el concepto Ascenso; Login y Registro usan el paisaje dibujado) | Łukasz Rawa | https://unsplash.com/photos/brown-coffee-beans-on-black-surface-fmc-tFMMiBs |

Solo se usaron fotos gratuitas (se descartaron las de Unsplash+). La primera elegida para `acceso` resultó ser de **granos de cacao**, no de café, y se reemplazó.

**Mapa**: `frontend/src/app/core/data/mapa-colombia.ts` se generó a partir de **Natural Earth** (`ne_10m_admin_1_states_provinces`, dominio público): contorno de los 32 departamentos continentales (sin San Andrés ni Malpelo) simplificado con Douglas-Peucker (0,015°), proyección equirectangular, y el punto de etiqueta de cada departamento. Es una tabla geográfica de referencia: los marcadores se calculan a partir de los orígenes que devuelve la API (`departamentoDeOrigen` busca por nombre normalizado); un origen sin coordenadas aparece en una lista sin marcador.

## Frontend (`frontend/`, proyecto `altura-web`)

| Componente | Versión |
|---|---|
| Angular (core, router, forms, common) / Angular CLI | 22.2.x / 22.1.8 |
| TypeScript | ~6.0 |
| GSAP (+ ScrollTrigger, carga diferida) | 3.15.0 |
| Bootstrap Icons (solo íconos; Bootstrap CSS eliminado) | 1.13.1 |
| @fontsource-variable/bricolage-grotesque · @fontsource-variable/geist-mono | 5.3.0 |
| Vitest (unitarias, `ng test`) | 4.x |
| @playwright/test (e2e) · @axe-core/playwright | 1.63.0 · 4.13 |
| Node / npm | 24.20 / 11.19 |

**Rutas** (`src/app/app.routes.ts`, todas con carga diferida; Inicio y Productos comparten el layout `Sitio`):

| Ruta | Vista | Título de pestaña |
|---|---|---|
| `''` | Inicio | Altura \| Café de especialidad |
| `productos` | Catálogo | Nuestros cafés \| Altura |
| `login` | Login (`POST /api/auth/Login`; acepta `?volver=`, `?cuenta=creada`, `?permiso=denegado`) | Iniciar sesión \| Altura |
| `registro` | Registro (`POST /api/auth/Register`) | Crear cuenta \| Altura |
| `carrito` | Carrito (layout `Sitio`, guard `requiereSesion`) | Tu carrito \| Altura |
| `mis-pedidos` · `mis-pedidos/:id` | Mis pedidos y detalle (layout `Sitio`, guard `requiereSesion`) | Mis pedidos \| Altura · Detalle del pedido \| Altura |
| `pago/simulador` · `pago/resultado` | Pasarela de pruebas (`?pedido=&referencia=&monto=&firma=`) y resultado del pago (`?id=&pedido=`) (layout `Sitio`, guard `requiereSesion`) | Pasarela de pruebas \| Altura · Resultado del pago \| Altura |
| `admin` → `admin/inventario`, `admin/variedades`, `admin/historial` (`admin/pedidos` redirige), `admin/usuarios` | Panel (guard `canMatch` por permiso, layout `Admin`; usuarios con `usuarios.gestionar`) | Inventario \| Altura · Variedades \| Altura · Historial de compras \| Altura · Usuarios \| Altura |
| `**` | redirige a `''` | — |

Transición entre rutas con `withViewTransitions()`; las navegaciones que solo cambian query params y el movimiento reducido marcan `<html class="transicion-instantanea">`. Durante el vuelo de la bolsa se marca `<html class="transicion-vuelo">` (solo la bolsa tiene nombre; el resto hace un fundido corto).

**Estructura de `src/app/`:**

- `core/auth/`: `permisos.ts` (mapa centralizado permiso → roles: `inventario.gestionar`, `usuarios.gestionar`), `token.ts` (`leerToken`: traduce los claims de .NET, con nombres en URI larga, a id, nombre, email, roles y expiración), `auth.ts` (servicio `Auth` con signals: `registrar`, `iniciarSesion`, sesión en `localStorage`, cierre al expirar, `tienePermiso`), `interceptor.ts` (Bearer solo a la API; 401 → cierra sesión y lleva a `/login`; 403 → aviso), `guard.ts` (`requierePermiso(permiso)`, `canMatch`: sin sesión → `/login?volver=`, sin permiso → `/login?permiso=denegado`; `requiereSesion` para `/carrito`).
- `core/models/`: `Cafe`/`CafeGuardar` (con `procesoId`/`procesoNombre`), `Variedad`/`VariedadGuardar`, `Proceso`, `Presentacion`, `Sesion`/`RespuestaLogin`/`RespuestaRegistro`, `CarritoDto`/`CarritoProductoDto`/`AddProductDto` y `PedidoDto`/`PedidoProductoDto`/`PedidoAdminDto`/`RespuestaCrearPedido` (mismos nombres que el backend; `unidadesDe(pedido)`), y `UsuarioAdmin`/`Rol`. `Cafe` incluye `usuarioId` y `usuarioNombre`. Si cambia un DTO del backend, actualiza estos modelos.
- `core/services/` (`@Service()`): `Cafes` y `Variedades` (lectura pública + crear/actualizar/eliminar), `Procesos` (`GET /api/procesos`), `Presentaciones`, `Imagenes` (subir/borrar), `Avisos` (avisos breves del panel y de la tienda, con enlace opcional), `Carrito` (Guía 2, ver "Reglas del carrito"), `Pedidos` (`crear(datos)`, `misPedidos`, `pedido`, `historial(filtros)`; ver "Reglas de los pedidos"), `Pagos` (`preparar`, `simular`, `confirmar`, `pagar`; `urlCheckoutWompi`) y `Usuarios` (`GET /api/usuarios`, `PUT /api/usuarios/{id}/rol`).
- `core/data/`: `mapa-colombia.ts` (Natural Earth), `departamentos.ts` (formulario de envío), `resenas.ts` (reseñas de ejemplo, ficticias) y `contenido-marca.ts` (texto, color y notas de cata de las 9 variedades; texto, color, ícono y "en taza" de los 3 procesos con `marcaProceso()`; fotos del sitio, pasos del proceso, `ETAPAS_ASCENSO`). **Los productos, las variedades y los procesos siempre vienen de la API**; aquí solo está el texto de marca, asociado por nombre normalizado.
- `core/utils/`: `gsap.ts` (`cargarGsap`, `refrescarScroll`), `medios.ts` (`matchMedia` seguro, `movimientoReducido`, `punteroFino`, `navegadorCompleto`), `imagenes.ts` (las fotos de producto se piden con el recorte `c_crop,g_center,w_0.86,h_0.86` antes de `f_auto,q_auto,w_N`: la bolsa llena más la card y mide lo mismo en la card, la vista rápida y el vuelo), `texto.ts`, `transicion.ts`, `validadores.ts` (`PATRON_CORREO`, `camposCoinciden`, `entero`), `errores.ts` (`mensajeDeError`: mensaje en español por código HTTP; en 404 y 409 usa el `{ mensaje }` de la API si viene).
- `layout/sitio`: navbar fijo (se vuelve sólido con un sensor de IntersectionObserver), `<router-outlet>`, footer con cresta y "Acceso administrador" y `ZonaAvisos` ("Agregado al carrito"). `layout/admin`: cabecera del panel (usuario, "Ver tienda", "Cerrar sesión"), navegación (Inventario, Variedades, Historial y, con permiso, Usuarios; se envuelve en móvil) y avisos.
- `pages/inicio/`: `Hero` (crestas + palabra + parallax), `Altimetro`, `Destacados`, `Proceso` (galería anclada), `CintaNotas` (marquee con datos de la API), `Origenes` (mapa; 5 regiones con cafés), `Variedades` (cuadrícula de 9 fichas: 3/2/1 columnas, muestra de color, texto y enlace con el número de cafés), `Resenas` + `TarjetaResena` (cierre, ver "Reseñas del Inicio"). Cada sección lleva `data-etapa`.
- `pages/productos/`: `Productos` + `Filtros` + `GuiaProcesos` + `catalogo.ts` (lógica pura de filtros ↔ URL `?q=&variedad=&proceso=&presentacion=&origen=&disponibles=1&orden=`, orden, búsqueda sin tildes por nombre, origen, variedad **o proceso**, `contarPor`). Estado en un signal, View Transitions al filtrar y hoja `<dialog>` de filtros en móvil.
  - **Filtros** (barra lateral y hoja móvil, mismo componente): Variedad, Proceso y Origen son **listas verticales**, una fila por opción con su marca (muestra de color, ícono del proceso o `bi-geo-alt`), el nombre y el número de cafés alineado a la derecha; la fila activa tiene fondo `--tinte-activo`, negrita y una barra corta de su color a la izquierda. Filas de 40 px (44 px con puntero táctil). Presentación son tres botones del mismo ancho (Todas · 340 g · 500 g). Con más de 6 variedades se muestran 5 y "Ver las 9 variedades" (`aria-expanded`); la elegida nunca se esconde. La barra lateral es fija al bajar y, si es más alta que la pantalla, tiene su propio scroll.
  - **Bloque "Tres procesos, tres tazas"** (`GuiaProcesos`): arriba de la grilla, a todo el ancho de la columna de productos, debajo de la barra "25 cafés / Ordenar por". Compacto (~200 px en escritorio): título y bajada a la izquierda y los tres procesos en columnas con ícono, descripción y "Ver N cafés"; en móvil, los procesos van en una fila con desplazamiento horizontal. "Ver N cafés" aplica el mismo filtro de la barra lateral (`?proceso=`); el proceso activo se tiñe de su color y su botón queda como píldora (`aria-pressed`); pulsarlo otra vez quita el filtro.
  - **Grilla uniforme**: todas las cards miden lo mismo (3 columnas a ≥1200 px, 2 en tableta, 1 en móvil). Para que los textos queden alineados entre cards, cada fila de la card ocupa una sola línea: variedad + gramos, nombre (con "…" si no cabe), origen + etiqueta de proceso, precio + disponibilidad. Una e2e mide que alto, imagen, nombre, origen y precio estén en la misma posición en las 25 cards.
  - Al filtrar, la URL se escribe con `scroll: 'manual'` (opción por navegación del router de Angular 22): la página no salta arriba; al cambiar de ruta sí se sube, como siempre.
- `pages/login`, `pages/registro`: formularios reactivos conectados a la API (Guía 1). Registro valida igual que `UsuarioDto` (nombre obligatorio de hasta 100 caracteres, correo válido, contraseña de 6 o más, confirmación) y al terminar lleva a `/login?cuenta=creada` ("Cuenta creada. Ahora inicia sesión."); un 400 muestra el mensaje del backend. Login vuelve a `?volver=` (solo rutas internas) o al Inicio; un 401 muestra "Usuario o contraseña incorrectos.".
- `pages/admin/`: `historial` (historial de compras), `inventario` (formulario con selects de variedad **y proceso**, obligatorios; la tabla muestra "variedad · proceso · gramos" y el buscador también encuentra por proceso), `variedades` (`variedades-admin.ts`), `usuarios` (`usuarios-admin.ts`, Guía 2) y los estilos compartidos `lista-admin.css` y `formulario-admin.css`.
- `pages/carrito`: página `/carrito` (`PaginaCarrito`) con `ListaCarrito` y "Seguir comprando".
- `pages/mis-pedidos`: `MisPedidos` (`/mis-pedidos`) y `DetallePedido` (`/mis-pedidos/:id`, el id llega como `input()` por `withComponentInputBinding`).
- `pages/pago`: `PasarelaPruebas` (`/pago/simulador`) y `ResultadoPago` (`/pago/resultado`, con `resource()`: en modo real confirma la transacción y después lee el pedido).
- `pages/admin/historial`: `HistorialAdmin` (`/admin/historial`, estilos de `lista-admin.css` + `formulario-admin.css` + `historial-admin.css`).
- `shared/`: `Navbar` (con `BotonCarrito` junto a `MenuUsuario`), `carrito/` (`BotonCarrito` con el panel lateral y `ListaCarrito`), `AgregarCarrito` (selector + botón y sus estados), `ZonaAvisos`, `MenuUsuario` (cuenta del navbar: sin sesión, ícono a `/login?volver=`; con sesión, la inicial y un menú *disclosure* con nombre, correo, "Mis pedidos", "Panel de administración" solo para Administrador y "Cerrar sesión"; se cierra con Escape, clic fuera o al navegar; es un componente aparte por el presupuesto de 4 kB del CSS del navbar), `Footer`, `Logo`, `EtiquetaCafe` (variedad o proceso, ver "Sistema de diseño"), `EstadoPedidoEtiqueta` (`shared/estado-pedido`, estado de un pedido), `BotonPagar` (`shared/boton-pagar`), `ResumenPedido` (`shared/resumen-pedido`: cafés, total y dirección), `FormularioEnvio` (`shared/carrito/formulario-envio`), `TarjetaCafe` (toda la card es clicable; emite el `Cafe`; imagen con `data-bolsa`; etiquetas de variedad y proceso, gramos junto al origen), `VistaRapida` (datos de la lista al instante + `GET /api/cafes/{id}`; vuelo de la bolsa; color de la variedad; etiquetas de variedad y proceso y, en la ficha, el proceso con su "en taza"; `AgregarCarrito`; Escape se atiende en `keydown`), `SelectorCantidad` (con `etiqueta` y `compacto` para las listas; nunca muestra más que el máximo), `EstadoError`, `PaisajeAcceso` (amanecer con niebla de Login/Registro/ingreso), `acceso/acceso.css` (estilos compartidos de los formularios de acceso), directivas `Revelar`, `AtraparFoco`, `movimiento/Inclinar` y `movimiento/Magnetico`.
- `src/environments/`: `apiBaseUrl` (`http://localhost:5031/api` en desarrollo; marcador `https://TU-API.up.railway.app/api` en producción, a cambiar al desplegar) y `cloudinaryBase`.

**Comandos (desde `frontend/`):**

```powershell
npm install
npx playwright install chromium   # una vez, para las e2e
npm start                          # ng serve → http://localhost:4200 (la API debe estar en :5031)
npx ng build                       # 0 advertencias
npx ng test --watch=false          # Vitest
npm run e2e                        # Playwright (API con los 25 cafés del catálogo; arranca ng serve si no está)
node herramientas/generar-bolsas.mjs    # regenera las 25 imágenes de producto (backend/seed/imagenes)
node herramientas/generar-paisaje.mjs   # regenera crestas y curvas de nivel (public/)
```

Si se cambia `angular.json` (estilos, fuentes), **reinicia `ng serve`**: no recarga ese archivo en caliente.

**e2e** (`frontend/e2e/*.e2e.ts`, dos proyectos de Playwright: `chromium` con movimiento y `movimiento-reducido` con `prefers-reduced-motion: reduce`; etiquetas `@movimiento`, `@reducido`, `@una-vez`):
- `altura.e2e.ts`: Inicio (3 destacados de la API con Cloudinary, 9 variedades con enlace al catálogo, reseñas: la rueda sube sola, se pausa con el mouse y con el botón, 10 reseñas más su copia oculta; con movimiento reducido, 3 estáticas con Anterior/Siguiente; altímetro, mapa con 5 orígenes → catálogo filtrado, galería anclada / fila con movimiento reducido), navegación (estado activo, navbar sólido, menú móvil, login ↔ registro), Productos (25 cafés; variedad + proceso + presentación combinados en la URL; "Ver las 9 variedades"; bloque de procesos arriba de la grilla que filtra, marca el activo y no mueve la página; cards del mismo tamaño y alineadas; sin desplazamiento horizontal a 375 px; búsquedas "narino", "honey" y "rosado"; recarga; cards con etiquetas; vista rápida con proceso y color de variedad; vuelo de la bolsa; hoja de filtros en móvil), API caída, formularios sin peticiones a la API, axe-core en todas las vistas a 1440 y 375 px, capturas y grabación.
- `carrito.e2e.ts` (Guía 2): sin sesión, "Agregar", el ícono del carrito y `/carrito` llevan a `/login`; un Cliente nuevo se registra, agrega desde una card y desde la vista rápida (el contador cambia), llega al límite de stock ("Ya tienes todas las unidades disponibles"), usa el panel, cambia cantidades en `/carrito` (subtotales y total en COP), recarga (el carrito persiste), quita, vacía con confirmación y no entra a `/admin/usuarios`; con el Administrador de pruebas: un café suyo muestra "Este café es tuyo" y en `/admin/usuarios` busca al Cliente, le cambia el rol con confirmación y lo devuelve (su propia fila está deshabilitada); axe del panel, de `/carrito` y de `/admin/usuarios`.
- `pagos.e2e.ts` (Guía 3 e historial; **necesita las variables del Administrador de pruebas**, porque los pagos aprobados descuentan stock real y al terminar lo devuelve por la API): un Cliente nuevo agrega 2 Pitalito y 1 La Unión, confirma con datos de envío, pulsa "Pagar", ve la pasarela de pruebas (aviso, referencia, monto $ 149.000), "Simular pago aprobado" → "¡Pago aprobado!" con dirección y total; el stock bajó 2 y 1; en Mis pedidos queda Pagado y sin "Pagar". Otro pedido: "Simular pago rechazado" → "El pago fue rechazado" → "Intentar de nuevo" (referencia `PEDIDO-{id}-2`) → aprobado; el Cliente no entra a `/admin/historial`. El Administrador busca al cliente en el historial (2 compras, 4 unidades, $ 198.000), filtra por estado y por fechas (hoy y un rango vacío), quita filtros y abre el panel con cliente, transacción `SIM-`, productos, total y dirección. axe en la pasarela, el resultado aprobado y rechazado, el historial y el panel.
- `pedidos.e2e.ts` (guía de pedidos): sin sesión, `/mis-pedidos` y `/mis-pedidos/1` llevan a `/login`; dos Clientes nuevos se registran por la API (`e2e-pedidos-a/b-<número>@altura.test`); el Cliente A agrega dos cafés desde las cards, abre "Datos de envío" (errores en español y foco en el primero; teléfono inválido), prueba un 409 simulado con `page.route` (mensaje dentro del formulario y carrito intacto), confirma el pedido ("Se creará un pedido con 2 productos por $ 95.000…"), llega al detalle con "Pedido creado", Pendiente, la referencia, "Pagar", el total y la dirección, el contador queda en 0, lo ve en "Mis pedidos" (con "Pagar") y no entra a `/admin/historial` ni a `/admin/pedidos`; el Cliente B ve "Pedido no encontrado" en el pedido de A y su lista vacía; el Administrador de pruebas entra por la ruta vieja `/admin/pedidos` (redirige al historial), ve el pedido pendiente con el cliente, filtra por estado y no hay desplazamiento horizontal a 375 px. axe del formulario con errores, el detalle, Mis pedidos (con y sin pedidos) y "no encontrado". Como el 409 simulado y el 404 dejan "Failed to load resource" en consola, ese bloque usa `permitirErroresDeRed`.
- `admin.e2e.ts` (usuarios y panel; autocontenido, no depende del catálogo): sin sesión `/admin` → `/login?volver=`; registrar un Cliente desde `/registro` (y el 400 "El usuario ya existe."); contraseña incorrecta (401); el Cliente inicia sesión y vuelve a la página anterior, el menú muestra su nombre y correo sin "Panel de administración", la sesión sobrevive a recargar, `/admin` → "No tienes permiso", cerrar sesión desde el menú; el Administrador entra al panel desde el menú, crea un café con imagen y proceso, **"Creado por" muestra su nombre**, lo edita (el dueño no cambia) y lo elimina (la imagen desaparece de Cloudinary); variedades (crear, duplicada 409, no eliminar con cafés —crea uno por la API—, eliminar); 403 y 401 simulados; axe del login, el menú de cuenta y el panel; cerrar sesión en el panel. **Necesita variables de entorno** con la cuenta Administrador de pruebas, cuyo correo debe estar en `Admin:Correos` (si la cuenta no existe, se registra sola; sin las variables, se omite):

```powershell
$env:ALTURA_ADMIN_EMAIL = 'e2e-admin@altura.test'; $env:ALTURA_ADMIN_PASSWORD = '<contraseña>'
npm run e2e
```

El Cliente se registra en cada ejecución con un correo nuevo (`e2e-cliente-<número>@altura.test`) y una contraseña aleatoria. Los cafés y variedades de prueba llevan "e2e" en el nombre y se borran al terminar (también si una prueba falla). Los usuarios no se pueden borrar por la API; después de las pruebas se borran en PostgreSQL:

```sql
-- Primero los pedidos (pedido → usuario es RESTRICT; sus productos se borran solos por CASCADE).
DELETE FROM pedido WHERE usuario_id IN (SELECT id FROM usuario WHERE email LIKE 'e2e-%@altura.test');
DELETE FROM usuario WHERE email LIKE 'e2e-%@altura.test';  -- falla (RESTRICT) si alguno todavía tiene cafés; sus carritos se borran solos (CASCADE)
```

Antes de cada análisis de axe, `esperarAnimaciones` (`e2e/fixtures.ts`) espera a que terminen las animaciones con fin: a mitad del fundido de entrada del login, axe medía colores intermedios y marcaba contraste insuficiente. La fixture `consola` hace fallar cualquier prueba con errores de consola. Capturas y video (`hero-y-vista-rapida.webm`) en `frontend/e2e/capturas/` (ignorada por Git).

## Skills usadas en el rediseño y cómo

| Skill / herramienta | Uso |
|---|---|
| ui-ux-pro-max (`ui-ux-pro-max`, `design-system`) | Búsquedas de estilos (*parallax storytelling*, *kinetic typography*), pares tipográficos y presets de movimiento para proponer los tres conceptos y armar los tokens en tres capas. Su sistema sugerido ("Brutalism" con verde/naranja de e-commerce y Rubik/Nunito) se descartó por genérico; no tenía paletas de café (0 resultados), así que la paleta es propia con contraste AA verificado. |
| ui-ux-pro-max (`brand`, `banner-design`) | Evolución de la marca (logo con la cereza en la cumbre, voz) y composición del hero como bloque de impacto. |
| ui-ux-pro-max (`ui-styling`) | Patrones de formularios, tablas y diálogos del panel (etiqueta arriba, errores bajo el campo, tabla semántica). Está pensada para React/shadcn/Tailwind: se tomaron los patrones y se implementaron con el sistema propio en Angular. |
| MCP 21st | Búsqueda de componentes de referencia (ver "Referencias de 21st.dev"); se reescribieron en Angular, sin agregar React. |
| design-taste-frontend | Lectura del brief y lista de patrones a evitar (eyebrows, em-dash, CTA duplicadas, un solo marquee, un solo acento). Prohíbe Fraunces y la paleta crema/terracota: el rediseño ya no los usa. |
| emil-design-eng, animation-vocabulary | Curvas, duraciones, `scale(.97)` al pulsar, hover solo con puntero fino, asimetría entrada/salida, movimiento reducido sin desplazamientos. |
| improve-animations (auditoría) | Auditoría de las 8 categorías del movimiento: se corrigieron el brillo de los esqueletos (de `background-position` a `transform`) y la onda infinita del mapa (2 pulsos). **`review-animations` no estaba instalada**: se usó esta auditoría más la lista de emil-design-eng. |
| impeccable (audit + polish, guías leídas sin ejecutar su lanzador ni sus hooks) | Tracking mínimo −0,04 em, radios de card 16 px, display máximo 6rem, quitar el grano `feTurbulence` y el revelado repetido, tokens para colores sueltos, caret de marca, objetivos de 44 px, landmark en el acceso. |
| angular-developer / frontend CLAUDE.md | Angular 22: standalone, signals, `rxResource`, `@Service()`, `input()`/`output()`, interceptor y guard funcionales. |
| canvas-design | Piezas gráficas del concepto: crestas y curvas de nivel generadas por código (`herramientas/generar-paisaje.mjs`). En la ampliación del catálogo: filosofía "Herbario Kraft" (`DISENO.md`) y las 25 bolsas generadas con `herramientas/generar-bolsas.mjs`, revisadas en una hoja de contacto con las 25 juntas. |
| database-schema-designer, dotnet-webapi, create-datadriven-aspnetcore, optimizing-ef-core-queries | Ampliación del modelo: `procesos` como tabla con FK `RESTRICT` (no enum), índice único por expresión con el proceso, migración segura para una columna `NOT NULL` en una tabla con datos, `GET /api/procesos` con el mismo patrón Controller → Repository, lectura con `AsNoTracking` y proyección (el `procesoNombre` sale del mismo JOIN, sin consultas extra). |
| find-animation-opportunities, emil-design-eng (improve-animations en lugar de review-animations, que no está instalada) | Movimiento de los filtros nuevos: chips que entran en cascada corta (25 ms) con `@starting-style` solo al desplegar "Ver las 9 variedades", flecha que gira; sin animación en acciones frecuentes (elegir un chip solo cambia color) ni con movimiento reducido. |
| impeccable (solo sus guías, sin lanzador ni hooks) | *Audit* + *polish* de Productos y la vista rápida: contraste del chip activo de Lavado, card sola al final de la grilla, recorte de la bolsa en el vuelo. En el ajuste de Productos: anillo de foco recortado por el scroll de la barra lateral (margen interno), píldora activa de 44 px en táctil, tintes de fondo como tokens (`--tinte-hover`, `--tinte-activo`) y un desbordamiento horizontal a 375 px (el texto oculto del botón, con `position: absolute`, escapaba de la fila con scroll: se agregó `position: relative`). |
| webapp-testing | Capturas y consola durante el desarrollo; pruebas escritas con `@playwright/test` (npm), como pide el proyecto. |
| Guía 2: dotnet-webapi, create-datadriven-aspnetcore, database-schema-designer, optimizing-ef-core-queries | Carrito y usuarios con el patrón Controller → Repository, índices únicos y `CHECK` en la base, `CASCADE` hacia `cafes`, proyección del carrito en una sola consulta y lectura de una sola columna para el stock. Donde contradecían la guía (ProblemDetails, `CancellationToken`, `ExecuteDeleteAsync`), ganó la guía. |
| Guía 2: angular-developer | Servicio `@Service()` con signals y un `effect` sobre la sesión, `linkedSignal` para la cantidad (se ajusta sola si baja el máximo) y para limpiar el aviso al cambiar de café, `afterRenderEffect` para el pulso del contador, guard funcional `requiereSesion`. |
| Guía 2: emil-design-eng, design-taste-frontend, ui-ux-pro-max (`ui-styling`) | Panel lateral con `--ease-cajon` (como la hoja de filtros), pulso del contador corto y solo cuando cambia, sin animar acciones frecuentes (cambiar cantidad o quitar), un solo acento (cereza) para el contador y "Agregar", botones deshabilitados que dicen por qué, estado vacío con una acción clara, confirmación solo en lo destructivo (vaciar) y en el cambio de rol. Los patrones de `ui-styling` (React/shadcn) se implementaron en Angular con el CSS propio. |

| Guía de pedidos: dotnet-webapi, create-datadriven-aspnetcore, database-schema-designer, optimizing-ef-core-queries | Pedido y PedidoProducto con el patrón Controller → Repository, `CHECK` de estado y cantidad, `RESTRICT` hacia `usuario` y `cafes` y `CASCADE` hacia los productos del pedido, migración revisada antes de aplicarla, proyecciones en las tres lecturas y `CafeApi.http` con todos los casos. Donde contradecían la guía (records, `DateTimeOffset`, `CancellationToken`, ProblemDetails, capa de servicios), ganó la guía. |
| Guía de pedidos: angular-developer | `@Service()` `Pedidos`, `rxResource` con `params` para el detalle (el 404 se convierte en `null` con `catchError`), `input()` del `:id` por `withComponentInputBinding`, guard `requiereSesion` en las dos rutas nuevas y prueba unitaria del servicio. |
| Guía de pedidos: ui-ux-pro-max (`ui-styling`), design-taste-frontend, emil-design-eng | Mis pedidos como lista de filas-enlace sobre papel (como `/carrito`), estado con ícono además de color, confirmación solo en la acción importante (crear el pedido), un solo acento (cereza) en "Confirmar pedido", sin animaciones nuevas en vistas frecuentes salvo la flecha del detalle (240 ms, nada con movimiento reducido). Los patrones de `ui-styling` (shadcn/Tailwind) se hicieron con el CSS propio. |
| Guía de pedidos: webapp-testing | Capturas a 1440 y 375 px con Playwright para revisar las pantallas (así apareció el desbordamiento de la navegación del panel); las pruebas se escribieron con `@playwright/test`, como el resto del proyecto. |

| Guía 3: dotnet-webapi, create-datadriven-aspnetcore, database-schema-designer, optimizing-ef-core-queries | Mismo patrón Controller → Repository; índice único filtrado de la referencia, migraciones revisadas y aplicadas (`AddWompi` con `UPDATE` de los pedidos existentes; `AddDireccionPedido` con valor por defecto temporal); historial con `COUNT`/`SUM` en la base de datos y proyección; `ValidarPago` lee solo estado, nombre y stock. Donde contradecían la guía (records, `CancellationToken`, ProblemDetails, servicios en `Services/`), ganó la guía. |
| Guía 3: angular-developer | Servicios `Pedidos` y `Pagos` con `@Service()`, `resource()` para el resultado del pago, `rxResource` con filtros como `params` en el historial, `input()` de query params (`withComponentInputBinding`), formulario reactivo del envío, rutas nuevas con `requiereSesion` y redirección de la ruta vieja del panel. |
| Guía 3: ui-ux-pro-max (`ui-styling`), design-taste-frontend, frontend-design | Pasarela como "comprobante" de Altura (sin marca de Wompi), resultado con el sello del estado como protagonista, historial con indicadores en franja (no tres tarjetas iguales) y panel lateral del sistema; sin colores nuevos. design-taste-frontend limita a una marquesina por página y el Inicio ya tiene la cinta de notas: **ganó el pedido de la rueda de reseñas**. frontend-design desaconseja etiquetas sobre los títulos: se dejó el kicker "Experiencias de clientes" porque lo pedía el plan, en minúsculas y sin mayúsculas sostenidas. |
| Reseñas: find-animation-opportunities, animation-vocabulary, emil-design-eng, improve-animations | El efecto es una marquesina vertical con máscara (*marquee* + *mask*): curva `linear`, solo `transform`, pausa con `animation-play-state`. Pasa el filtro de frecuencia (Inicio, ocasional) con condiciones: pausa con mouse, foco y botón, y nada con movimiento reducido. La auditoría con improve-animations (en lugar de **review-animations, que no está instalada**) quitó un `aria-pressed` contradictorio del botón de pausa. |
| impeccable (solo sus guías de audit y polish) | Contraste del fondo alba, objetivos de 44 px (el botón de referencia del historial medía ~30 px), estados de carga, vacío y error, y desbordes a 375 px (fechas del historial, firma de la pasarela). |
| Guía 3: webapp-testing | Capturas a 1440 y 375 px del flujo de pago, el historial y el Inicio; así aparecieron la firma que se salía del comprobante, las fechas que desbordaban en móvil y la máscara que no desvanecía el borde inferior. |

Contradicciones resueltas a favor del brief: design-taste-frontend exige modo oscuro y desaconseja cursores propios (se mantuvo un solo tema claro y no hay cursor propio); ui-ux-pro-max propuso un estilo genérico (se descartó); ui-styling presupone React/Tailwind (se usó Angular con CSS propio); impeccable considera amateur `feTurbulence` (se quitó el grano). En la etapa anterior (rediseño editorial) se usaron también estas skills; esa identidad (Fraunces, crema/terracota) quedó reemplazada.

## Decisiones tomadas

| Decisión | Motivo |
|---|---|
| ADO.NET → EF Core con migraciones | Esquema versionado y reproducible para todo el grupo; se elimina `database/schema.sql`. |
| `EFCore.NamingConventions` (snake_case) | Tablas/columnas idiomáticas de PostgreSQL sin `HasColumnName` en cada propiedad. |
| Se mantiene Controller → Repository (sin capa de servicios) | Estilo existente del proyecto; los repositorios devuelven DTO en lecturas. |
| Lecturas con `AsNoTracking` + proyección a DTO | Un solo SELECT con JOIN, sin cargar entidades completas ni seguimiento. |
| Especialidad → Variedad, ruta `/api/variedades` | Nombre de negocio acordado. |
| `Presentacion` como enum (no tabla) + CHECK | Solo hay 2 valores fijos; el CHECK protege la base aunque se escriba por fuera de la API. |
| Precio `numeric(12,0)` y validación sin decimales | Pesos colombianos no usan decimales. |
| Índice único con `lower(nombre)` vía SQL | Evitar duplicados que solo difieren en mayúsculas; EF no lo modela. Duplicado → 409. |
| Unicidad detectada por el nombre del índice (23505) | Evita condiciones de carrera de "consultar y luego insertar". |
| Formato de imagen por firma de bytes | No se confía en el prefijo `data:` que envía el cliente. |
| Borrado de imágenes después de guardar en BD, con `CancellationToken.None` y sin fallar | La BD es la fuente de verdad; un fallo de Cloudinary solo deja una imagen huérfana (queda en el log). |
| Config local en `appsettings.Development.json` (ignorado), no User Secrets | Mismo mecanismo que usa el resto del grupo. |
| `presentacionGramos` como número en JSON | Requisito del frontend (`value: 340`). |
| Repo dividido en `backend/` y `frontend/` con `git mv` | Separar los dos proyectos conservando el historial de cada archivo. |
| Seed por la API (no SQL) | Reutiliza validaciones, subida a Cloudinary y genera `imagenPublicId` reales; idempotente. |
| Imágenes en SVG → PNG con Chromium (set 3, "Herbario Kraft") | SVG editable como fuente y PNG para Cloudinary, generados por un script (`generar-bolsas.mjs`) a partir de `catalogo.json`: 25 imágenes coherentes sin dibujarlas una a una. Fuentes de la marca actual (Bricolage Grotesque, Geist Mono) incrustadas en base64. |
| Reactive Forms (no Signal Forms) | Lo pidió el taller, aunque Angular 22 recomienda Signal Forms para formularios nuevos. |
| `rxResource` para los GET (Inicio, Productos, vista rápida) | Estados de carga/error/valor como signals y `reload()` para "Reintentar". |
| `<img loading="lazy">` en vez de `NgOptimizedImage` | La optimización ya la hace Cloudinary (`f_auto,q_auto,w_600`); evita avisos de tamaño de `NgOptimizedImage` en consola. |
| Registro del locale `es-CO` en `app.config.ts` (y también en `TarjetaCafe`) | Lo necesitan la tienda y el panel; `TarjetaCafe` lo conserva para sus pruebas unitarias. |
| Budget inicial de advertencia 700 kB (antes 500 kB) | Se mantiene; sin Bootstrap el inicial quedó en ~394 kB (~97 kB transferidos). El de 4 kB por componente no se subió: el CSS del panel se dividió en dos archivos por responsabilidad. |
| Grilla uniforme de 3/2/1 columnas, sin card destacada en el catálogo | Pedido del equipo: todas las cards iguales y alineadas. La destacada 2×2 y la ficha de procesos intercalada se quitaron; con 25 cafés la última fila tiene una card, se acepta a cambio de una grilla regular. |
| Bloque de procesos arriba de la grilla, no dentro | Explica los procesos antes de ver los cafés y sirve de filtro rápido; dentro de la grilla rompía el ritmo de las cards. |
| Filas de una sola línea en la card (en vez de *subgrid*) | Alinea los textos entre cards con CSS simple de explicar; los nombres largos se cortan con "…" y el nombre completo está en `title`, en el `alt` de la imagen y en la vista rápida. |
| Filtros como listas verticales con conteo a la derecha | Los chips se acomodaban en filas de distinto ancho y se veían desordenados; la lista se lee de arriba abajo y alinea los números. |
| `scroll: 'manual'` al escribir los filtros en la URL | Con `scrollPositionRestoration: 'top'` cada filtro llevaba la página arriba (también pasaba antes con la barra lateral). |
| Proceso como **tabla** `procesos` (no enum) | Tiene nombre y descripción y podría crecer (por ejemplo, "Natural") sin cambiar código; la FK con `RESTRICT` protege los datos. `Presentacion` sigue como enum porque son 2 valores fijos sin texto. |
| Índice único con el proceso (`ux_cafes_nombre_variedad_proceso_presentacion`) | El mismo lote puede venderse en dos procesos; el índice anterior lo impedía. Sigue siendo un índice por expresión (`lower(nombre)`), creado con SQL en la migración. |
| Una sola migración `AgregarProcesosYVariedades` con valor por defecto temporal | Agregar `proceso_id NOT NULL` a una tabla con filas exige un valor; se usa 1 (Lavado) y luego se quita el `DEFAULT` para que la API siempre lo exija. Se avanzan las secuencias para que el siguiente `INSERT` no choque con los ids sembrados. |
| Catálogo en `backend/seed/catalogo.json` | Una sola fuente para el script de carga y el generador de imágenes; cambiar un café es editar una línea. |
| Recorte de las fotos de producto en Cloudinary (`c_crop,…,w_0.86,h_0.86`) y no con `scale` en CSS | Con CSS, durante el vuelo de la bolsa (View Transition) la imagen se veía sin recortar y más grande por un instante. Recortada en el servidor, la bolsa mide lo mismo en la card, la vista rápida y el vuelo; además se descargan menos píxeles. |
| "Ver las 9 variedades" (5 visibles) en vez de chips con scroll horizontal | El scroll horizontal esconde opciones sin avisar y es incómodo con mouse; el botón dice cuántas hay, usa `aria-expanded` y mantiene visible la variedad elegida. |
| Colores de variedad y proceso oscurecidos para AA (Típica, Honey) | Se usan como texto sobre papel y niebla y como fondo con texto blanco: los tres casos deben pasar 4,5:1. Las bolsas impresas conservan el tono más cálido. |
| Etiqueta de proceso distinta de la de variedad | Variedad = muestra cuadrada + texto; proceso = píldora con ícono. Se distinguen aunque los colores se parezcan y no dependen solo del color (WCAG 1.4.1). |
| Variedades del Inicio en cuadrícula de 9 fichas | Con 9 filas altas la sección se volvía muy larga; la cuadrícula muestra todas a la vez con su color y el número de cafés. |
| Prueba "API caída" con `page.route` | Suite autocontenida; se verificó también apagando la API real. |
| Inicio y Productos en rutas separadas, con layout compartido | Pedido del rediseño; navbar y footer no se recrean al navegar. |
| Filtros en un signal y reflejados en la URL después de animar | Permite animar el reordenamiento con View Transitions sin que la navegación del router interrumpa la transición; la URL sigue siendo compartible y sobrevive a recargar. |
| Vista rápida sobre `<dialog>` nativo + directiva `AtraparFoco` | Fondo inerte, Escape y capa superior nativos; el Tab cíclico evita que el foco salga a la interfaz del navegador. |
| Fotos del sitio por subida firmada directa a Cloudinary | `POST /api/images` fija la carpeta `cafes`; así no se toca el backend. |
| Contenido editorial de variedades en el frontend, asociado por nombre | Las variedades salen de la API; el texto de marca no existe en el backend y no se quiso cambiarlo. |
| Mapa generado de Natural Earth (dominio público) | Contorno real de Colombia sin dibujarlo a mano; coordenadas de los 32 departamentos como tabla de referencia. |
| `matchMedia` envuelto en `core/utils/medios.ts` | Sin él, los componentes fallaban en entornos sin navegador completo (jsdom, servidor). |
| Selector de cantidad como componente propio | Mantiene la vista rápida bajo el presupuesto de 4 kB de CSS por componente; en la Guía 2 se reutiliza en las cards, la vista rápida y el carrito. |
| Concepto "Ascenso" (A) + vuelo de la bolsa (B) + color por variedad (C) | Elección del equipo entre tres conceptos con maqueta; el nombre "Altura" se vuelve la experiencia. |
| Sistema propio y sin Bootstrap | Bootstrap solo aportaba grilla y utilidades; con tokens propios el CSS inicial bajó de ~330 kB a ~99 kB y no hay que pelear con sus estilos. |
| GSAP + ScrollTrigger con `import()` solo en el Inicio | Lo complejo (parallax, altímetro, galería) queda legible y no pesa en Productos, Login ni el panel. |
| Galería anclada con `position: sticky` (no el "pin" de GSAP) | No modifica el DOM de Angular y se explica en una frase: la sección mide 400vh y su contenido queda fijo. |
| Parallax en el contenedor de cada cresta y entrada en la imagen | GSAP absorbe la propiedad `translate` de la animación CSS: separadas no se pisan. |
| Vuelo de la bolsa con View Transitions (nombre `bolsa`) | Elemento compartido nativo, sin librerías; sin soporte o con movimiento reducido el panel solo aparece. |
| Vista rápida con los datos de la lista + `GET /api/cafes/{id}` | La imagen está lista en el primer fotograma (requisito del vuelo) y los datos se actualizan igual. |
| Escape de la vista rápida en `keydown` | Chrome no deja cancelar el evento `cancel` del `<dialog>` sin interacción previa y el cierre no se animaba. |
| Altímetro decorativo (`aria-hidden`) y sin movimiento reducido | Cada sección ya tiene título; el número cambia con el scroll pero no es animación. |
| Login y Registro reales y un solo acceso (`/login`) para la tienda y el panel | Guía 1. La pantalla `/admin/ingresar` se eliminó: el panel usa la misma sesión y el guard decide por rol. |
| Autorización por políticas (`GestionInventario`) y mapa de permisos en el frontend | Agregar un rol después es cambiar una línea en cada lado, sin tocar controladores ni componentes. |
| Sesión en `localStorage` (antes `sessionStorage`) | Lo pide la Guía 1 para la tienda: la sesión dura lo que el token (60 min) aunque se cierre la pestaña. |
| `DELETE /api/images` restringido a `cafes/` y con 409 si la imagen está en uso | Limpia subidas no usadas sin poder borrar otras imágenes de la cuenta. |
| Credenciales de las e2e del panel por variables de entorno | No se escriben contraseñas en el repositorio. El Cliente de pruebas se registra en cada ejecución con un correo único y una contraseña aleatoria. |
| Carrito fiel a la Guía 2 (nombres, rutas `api/[controller]`, `string` en el repositorio) con 4 adaptaciones (A–D) | Ver "Guía 2". Gana la guía frente a las skills. |
| `carrito_producto` con `CASCADE` hacia `cafes` (no `RESTRICT`) | Si el administrador elimina un café, debe poder hacerlo aunque esté en carritos: simplemente desaparece de ellos. |
| Recargar el carrito completo después de cada cambio | Un `GET` extra por acción, pero los totales y el stock siempre son los de la API y el servicio queda simple. |
| Un solo componente `AgregarCarrito` para cards y vista rápida | Las reglas (dueño, agotado, completo, sin sesión) viven en un sitio. En la card va en una fila compacta; en la vista rápida, completo con el aviso dentro del `<dialog>`. |
| `ListaCarrito` compartida entre el panel lateral y `/carrito` | Mismo comportamiento en los dos sitios; ids únicos por instancia porque pueden coexistir. El contenido del panel solo se dibuja mientras está abierto. |
| Política `GestionUsuarios` aparte de `GestionInventario` | Hoy ambas son "Administrador", pero se podría dar inventario a un "Editor" sin dejarle cambiar roles. |
| No poder quitarse el propio rol (409 en la API y botón deshabilitado) | Evita que el panel se quede sin administradores por un clic propio. |
| Modo simulación que firma y procesa el evento por el mismo camino del webhook | Sin llaves de Sandbox, es la forma de probar (y explicar) la validación del checksum, el cambio de estado y el descuento de stock reales, sin código de pago paralelo. |
| `ValidarPago` aparte de `PrepararPago` | Las respuestas 404/409 sin cambiar la firma `Task<WompiPagoDto?>` de la guía. |
| Referencia con sufijo al reintentar (`PEDIDO-15-2`) | Wompi no acepta una referencia que ya tuvo una transacción finalizada. |
| Descuento de stock al aprobar el pago, idempotente | Un pedido sin pagar no debe quitar unidades; Wompi puede repetir eventos. |
| Historial con indicadores que ignoran el filtro de estado | Mirar los pendientes no debe dejar "Ingresos" en cero. |
| Fechas del historial en días de Colombia (UTC-5) | Las fechas se guardan en UTC; el administrador piensa en días locales. |
| Rueda de reseñas en CSS (sin librerías) con la lista duplicada | Un `@keyframes` de `transform` es lo más simple de explicar y corre en el compositor. |
| Botón "Pausar reseñas" además de la pausa con mouse y foco | WCAG 2.2.2 (movimiento automático de más de 5 s) y para táctil. |
| Pedidos fieles a la guía (nombres, rutas `api/[controller]`, `string` en el repositorio) con 6 adaptaciones (A–F) | Ver "Guía de pedidos". Gana la guía frente a las skills. |
| `pedido_producto` con `RESTRICT` hacia `cafes` (en el carrito es `CASCADE`) | Un pedido es historial: no puede perder sus cafés. El borrado de un café con pedidos responde 409. |
| El stock no se descuenta al crear el pedido, solo se comprueba | Un pedido pendiente no está pagado; el stock bajará con el pago aprobado (guía de Wompi). |
| `pedidoId` con un segundo método (`ObtenerUltimoPedidoId`) | No cambia la firma de `CrearPedido` de la guía y se explica en una línea. |
| Etiqueta de estado con fondo opaco | Con un tinte transparente, "Pendiente" quedaba en 4,4:1 sobre la niebla de la página (axe lo detectó); opaco queda en 5,1:1 o más. |
| Producción: variables de entorno, `PORT`, CORS configurable, `/api/health`, migraciones manuales | Ver "Preparación para producción" y `DEPLOY.md`. Aplicar migraciones al arrancar es arriesgado con varias instancias y oculta errores de esquema. |

## Problemas conocidos y pendientes

- **Wompi real sin probar**: con `ModoSimulado = false`, el Web Checkout, la redirección y `ConfirmarPago` están implementados según la documentación, pero no se han probado contra Wompi (no hay llaves de Sandbox). Tampoco se ha recibido un webhook real (la API no está publicada).
- **Stock y pedidos pendientes**: el stock se descuenta al aprobarse el pago, no al crear el pedido, y no se reservan unidades. Dos clientes pueden tener pedidos pendientes por las mismas últimas unidades; `PrepararPago` comprueba el stock antes de pagar, pero si dos pagos se aprueban casi a la vez, el segundo deja el café en 0 (queda en el log).
- Dos eventos aprobados del mismo pedido que lleguen exactamente a la vez podrían leer los dos "Pendiente" y descontar dos veces (no hay bloqueo de fila); con eventos que llegan uno detrás de otro, la idempotencia funciona (verificado).
- `POST /api/Pedido/CrearPedido` sin cuerpo ni `Content-Type` responde 415 (comportamiento estándar de ASP.NET Core), no 400; con JSON vacío o datos inválidos, 400.
- Las reseñas del Inicio son de ejemplo (ficticias); en una tienda real deben venir de compradores verificados.
- La rueda de reseñas sigue animando cuando está fuera de pantalla (animación de `transform`, barata para el navegador); no se pausa con IntersectionObserver para no agregar código.
- Si un usuario confirma el pedido dos veces casi a la vez (por ejemplo, desde dos pestañas), las dos peticiones pueden leer el mismo carrito: la segunda falla al borrar filas que ya no existen (500 en esa petición; el primer pedido queda bien). El botón se deshabilita mientras se crea el pedido, así que desde una sola pestaña no pasa.
- `ObtenerUltimoPedidoId` toma el pedido más reciente del usuario: si ese mismo usuario creara otro pedido entre las dos consultas (dos pestañas), el `pedidoId` devuelto sería el del otro pedido (los dos son suyos).
- No se pueden borrar ni cancelar pedidos por la API (fuera de alcance: cancelar, seguimiento de envíos y facturación). Para borrar usuarios de prueba hay que borrar antes sus pedidos (ver la limpieza de las e2e).
- Problemas encontrados en la Guía 3: (1) la firma de integridad (64 caracteres sin espacios) ensanchaba la columna de la pasarela (`min-width: 0`); (2) los `input type="date"` desbordaban el historial a 375 px; (3) la máscara de la rueda se aplicaba al alto total de la columna (el doble de la lista) y el borde inferior no se desvanecía (fila de la rueda con `minmax(0, 1fr)` y `overflow: hidden`); (4) el foco al primer campo con error no llegaba porque `aria-invalid` se pinta un instante después (se busca por el control); (5) un `const URL` en una prueba tapaba la clase `URL` del navegador.
- Problemas encontrados en la guía de pedidos: (1) la etiqueta de estado "Pendiente" con fondo transparente no llegaba a 4,5:1 sobre la niebla (fondo opaco); (2) con el cuarto enlace ("Pedidos"), la navegación del panel desbordaba a 375 px en todas sus páginas (ahora se envuelve; lo comprueba una e2e); (3) en Git Bash los heredocs con comillas y acentos siguen fallando: los archivos se escribieron con el editor.
- Si llegan a la vez las dos primeras peticiones de carrito de un usuario nuevo, ambas pueden intentar crear el carrito; el índice único `ux_carrito_usuario_id` rechaza la segunda (500 en esa petición; la siguiente funciona). Es poco probable porque el frontend pide `GetCarrito` una vez al iniciar sesión.
- Si un café del carrito queda con menos stock que la cantidad elegida, `GetCarrito` lo muestra igual; al cambiar la cantidad, la API exige que no supere el stock nuevo.
- **Login con Google eliminado** en la Guía 1 (endpoint `/api/auth/google`, `GoogleLoginRequest` y el paquete `Google.Apis.Auth`); se rehará en una guía posterior. Fuera de alcance por ahora: cambio y recuperación de contraseña, proveedores externos (Auth0) y borrar usuarios por la API.
- **Rotar `Jwt:Key`**: dos claves antiguas quedaron en el historial de Git, una en `appsettings.json` (de `6829fba` a `4676745`) y otra en `appsettings.Development.json`, que se subió en `6829fba` y se borró en `a28795a`. Ese archivo también contenía el `Google:ClientId`, que es público. No se reescribió el historial porque el repo es privado. Ninguna de las dos claves está en uso: cada integrante debe generar la suya. En la Guía 1 la sección pasó a llamarse `JwtSettings` y la clave local anterior (del compañero) se **reemplazó** por una nueva de 64 bytes. Las credenciales de Cloudinary y la contraseña de PostgreSQL nunca se subieron (revisión del 2026-09-30).
- `imagenPublicId` lo envía el cliente y no se valida contra Cloudinary: un publicId ajeno se borraría al eliminar/reemplazar el café (solo puede hacerlo quien tiene el permiso de inventario). Si una creación falla después de subir la imagen, el panel la borra con `DELETE /api/images`; un cliente que use la API directamente puede dejarla huérfana.
- Los títulos de los 400 automáticos de validación salen en inglés ("One or more validation errors occurred."); los mensajes de cada campo sí están en español.
- `__EFMigrationsHistory` conserva su nombre original (la convención snake_case no lo cambia).
- El token vive en `localStorage`: es visible para cualquier script de la página (no hay `HttpOnly` sin cookies); aceptable para el proyecto, no para producción.
- El login responde igual (401) a un correo que no existe y a una contraseña incorrecta, pero el Register sí revela si un correo ya está registrado ("El usuario ya existe."), como pide la guía.
- `Admin:Correos` solo se consulta al **registrarse**: agregar un correo después no cambia el rol de una cuenta que ya existe (usa el `UPDATE` de la sección "Guía 1").
- El frontend asume `ng serve` en el puerto 4200: es el único origen de `Cors:AllowedOrigins` en `appsettings.json`. Otro puerto requiere agregarlo ahí (o en `appsettings.Development.json`).
- `environment.ts` (producción) tiene `apiBaseUrl` de marcador (`https://TU-API.up.railway.app/api`): cámbialo antes de desplegar (ver `DEPLOY.md`).
- Problemas encontrados en la Guía 2: (1) `dotnet publish` copiaba `appsettings.Development.json` (con secretos) a la salida: se excluyó en el `.csproj`; (2) las e2e de axe fallaban a veces porque medían el login a mitad del fundido de entrada (se agregó `esperarAnimaciones`); (3) en móvil la columna del subtotal apretaba el nombre del café en el carrito (cantidad y subtotal pasaron a una segunda fila); (4) faltaba un `h2` entre el `h1` de `/carrito` y los `h3` de cada café (axe `heading-order`); (5) en Git Bash algunos heredocs con comillas y acentos fallan: los archivos se escribieron con el editor.
- Con la API apagada, el navegador registra 2 errores de red ("Failed to load resource") en consola; son inevitables y la app los maneja mostrando "Reintentar".
- Las e2e dependen de los datos del seed (`catalogo.json`: 25 cafés, todos disponibles, Inzá Reserva con 5 unidades, 11 Lavado / 8 Honey / 6 Fermentado, 5 orígenes); si cambian, ajusta `frontend/e2e/altura.e2e.ts`. Las del panel crean y borran datos reales (con "e2e" en el nombre) y suben una imagen real a Cloudinary.
- Problemas encontrados en el rediseño: (1) la primera foto elegida para el acceso era de cacao, no de café (se reemplazó); (2) la firma de Cloudinary fallaba en PowerShell 5.1 por usar la hora local; (3) `ng serve` debe reiniciarse al cambiar `angular.json`; (4) el router de Angular registra como error de consola las transiciones omitidas en modo desarrollo; (5) la foto del hero estiraba la fila de la grilla (se sacó del flujo con `position: absolute`).
- Rendimiento medido en local (Chromium sin GPU): LCP del Inicio ~0,4 s, CLS ~0, ~58 fps de media al hacer scroll; los fotogramas lentos (33 ms) coinciden con la carga de imágenes. Falta medirlo en un móvil real.
- Durante una View Transition (vuelo de la bolsa, 520 ms) el navegador no recibe clics; las pruebas esperan a que termine.
- En la captura de página completa con movimiento reducido, la galería del proceso aparece desplazada porque la prueba lleva cada imagen a la vista (artefacto de la captura).
- Problemas encontrados en el rediseño Ascenso: (1) GSAP absorbía la propiedad `translate` de la entrada de las crestas (se separaron contenedor e imagen); (2) los atributos `height` de las imágenes ganaban al `aspect-ratio` (se agregó `img { height: auto }`); (3) las cards con `view-transition-name` se pintaban sobre el panel durante el vuelo (se desactivan con `.transicion-vuelo`); (4) Escape cerraba el `<dialog>` sin animación (ver Decisiones); (5) la capa clicable de la card solo cubría el cuerpo (se quitó `position: relative`); (6) el panel no tenía el locale `es-CO`.
- **Mapa del Inicio**: los marcadores se activan también al pasar el mouse (`mouseenter`). Al ir con el mouse desde un marcador hasta el botón "Ver cafés de …" se puede cruzar otro marcador (por ejemplo, de Nariño a Cauca) y el panel cambia justo antes del clic. La e2e del mapa usa el teclado para ser estable. Pendiente: activar solo con clic o foco, o retrasar el cambio por hover.
- Ya no hay ningún café agotado en el catálogo: el estado "Agotado" de las cards sigue funcionando, pero ninguna e2e lo ve con datos reales.
- La migración `AgregarProcesosYVariedades` reemplazó Moka por Colombia en el id 3: si alguien tenía cafés Moka en su base local, quedaron como Colombia. Con el seed nuevo no aplica.
- Problemas encontrados al ampliar el catálogo: (1) agregar `proceso_id` con valor por defecto 0 rompía la FK de las filas existentes (se usó 1 y luego `DROP DEFAULT`); (2) `HasData` con ids fijos no avanza las secuencias de identidad (se agregó `setval`); (3) en el generador de imágenes las fuentes no cargaban desde `file://` con `setContent` (se incrustaron en base64) y la rama botánica tapaba los textos (se recortó al contorno de la bolsa); (4) Típica y Honey no llegaban a 4,5:1 sobre niebla (se oscurecieron); (5) un `SecureString` no pasa a un proceso `powershell` nuevo (el seed se ejecuta en la misma sesión); (6) el número del chip de proceso activo no tenía contraste sobre el azul de Lavado (pasó a blanco); (7) el altímetro depende de qué sección ocupa la pantalla: la prueba alinea la sección arriba.
- Problemas encontrados en este taller: (1) `dotnet new tool-manifest` en .NET 10 crea el manifiesto en la raíz, no en `.config/` (se movió a mano); (2) `curl` desde Git Bash rompe las tildes si el JSON va como argumento; (3) PowerShell 5.1 necesita el `.ps1` con BOM y el cuerpo en bytes UTF-8; (4) `rxResource` deja pendiente `whenStable()` en pruebas unitarias si no se simulan los servicios.
