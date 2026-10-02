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

- **backend/**: API REST en ASP.NET Core 10 + EF Core + PostgreSQL. Gestiona el catálogo de cafés, sus variedades y presentaciones, y las imágenes de producto en Cloudinary.
- **frontend/**: aplicación Angular 22 (`altura-web`), concepto **"Ascenso"**: Inicio narrativo (subir la montaña con un altímetro), catálogo de Productos con filtros en la URL y vista rápida, Login y Registro solo visuales, y un **panel de administración** (`/admin`) con autenticación real por roles.

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
├── .gitignore               Reglas de .NET, Node/Angular y Playwright
├── CLAUDE.md                Esta guía
├── README.md                Puesta en marcha paso a paso
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
| Cierre | Cumbre | 2.100 |

## Sistema de diseño

Sistema propio en `frontend/src/styles.css` (**sin Bootstrap**). Tokens en tres capas: primitivos (`--niebla`, `--bosque`…), semánticos (`--fondo`, `--texto`, `--acento`…) y de componente (en cada CSS). Un solo tema claro: niebla de montaña al amanecer.

**Paleta**

| Token | Hex | Uso |
|---|---|---|
| `--niebla` | `#E6EAE3` | Fondo de página |
| `--niebla-honda` | `#D6DDD2` | Bandas alternas, fondos de imagen, cabecera de tablas |
| `--papel` | `#F5F6F1` | Superficies: cards, paneles, formularios |
| `--blanco-niebla` | `#FBFCF8` | Fondo de campos |
| `--bosque` | `#13281F` | Texto; secciones oscuras (cierre, footer, cinta, cabecera del panel) |
| `--musgo` | `#3E5C45` | Disponibilidad, visto de campo válido |
| `--helecho` / `--liquen` / `--liquen-hondo` | `#8FA58F` / `#C9D3C6` / `#B7C7B3` | Solo decorativos: crestas, esqueletos, mapa |
| `--alba` / `--horizonte` | `#F2D7C4` / `#EBE6DC` | Cielo del amanecer (solo decorativo) |
| `--cereza` | `#B8322A` | **Único acento**: botón principal (texto blanco 5,9:1), enlaces, "Quedan N", marca del altímetro (4,8:1 sobre niebla) |
| `--cereza-hover` / `-activo` | `#9E2A23` / `#86231D` | Estados del botón principal |
| `--error` | `#A3271F` | Errores de formulario y avisos |
| `--ambar` | `#B7791F` | Solo relleno: nivel "aceptable" del medidor de contraseña |
| `--texto-suave` | bosque al 76 % | Texto secundario (≥ 5,3:1) |
| `--linea` / `--linea-fuerte` | bosque al 14 % / 30 % | Bordes y divisores |

**Colores por variedad** (`--variedad-*` y `core/data/contenido-marca.ts`; los dos usos, texto sobre papel y fondo con texto blanco, cumplen AA): Castillo `#8A5A2B`, Geisha `#2D6A5E`, Moka `#6E3150`. Una variedad nueva de la API usa `#13281F`.

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
| Revelado de cards (90 ms entre cada una), filas de variedades y foto del cierre | Entrar en pantalla (IntersectionObserver) | 700–900 ms | `--ease-salida` | directiva `appRevelar` |
| Inclinación 3D + brillo de la card; zoom de la bolsa 4 % | Mover el mouse | 500 ms / 700 ms | `--ease-salida` | directiva `appInclinar` (solo puntero fino) |
| Botón magnético (hasta 10 px hacia el cursor) | Mover el mouse | 360 ms | `--ease-salida` | directiva `appMagnetico` |
| Pulsación de botones y chips (`scale(.97)`) | `:active` | 160 ms | `--ease-salida` | `styles.css` |
| **Vuelo de la bolsa** card → vista rápida (y de vuelta si la card sigue en pantalla) | Abrir / cerrar la vista rápida | 520 ms (resto de la página: fundido 280 ms) | `--ease-cajon` | `vista-rapida.ts` (View Transition `bolsa`) |
| Panel de la vista rápida sin vuelo (sube 24 px; en móvil, hoja desde abajo) | Abrir | 420 ms (cierre 200 ms) | `--ease-cajon` | `vista-rapida.css` (`@starting-style`) |
| Reordenamiento de la grilla al filtrar | Cambiar filtros | 380 ms | `--ease-movimiento` | View Transitions (`view-transition-class: tarjeta`) |
| Cambio de ruta (fundido + 10 px) | Navegar | 180 ms salida / 340 ms entrada | `--ease-salida` | `styles.css` |
| Navbar transparente → sólido | Dejar el principio de la página | 260 ms | `ease` | `navbar.css` + sensor en `sitio.ts` |
| Menú móvil y hoja de filtros | Abrir | 420 ms | `--ease-cajon` | `navbar.css`, `productos.css` |
| Onda del marcador activo del mapa (2 pulsos) | Elegir región | 1,8 s | `--ease-salida` | `origenes.css` |
| Niebla a la deriva (Login, Registro, ingreso al panel) | Continuo | 26 s y 34 s, ida y vuelta | `ease-in-out` | `paisaje-acceso.css` |
| Línea de foco de los campos, visto de válido, errores, medidor de contraseña | Foco / escribir | 200–360 ms | `--ease-salida` | `acceso.css` |
| Esqueletos (franja de brillo con `transform`) | Carga de datos | 1,6 s | `ease-in-out` | `styles.css` |
| Panel lateral del administrador | Abrir | 420 ms | `--ease-cajon` | `formulario-admin.css` |

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
| Magnetic Button (bundui), Magnetic (ibelick) | Botones magnéticos del hero y del cierre |
| Infinite Text Marquee (preetsuthar17), Marquee (tom_ui) | Cinta de notas de cata |
| Horizontal Scroll Gallery (pulkitxm), Scroll Horizontal Gallery (motiondotdev) | Galería "De la montaña a tu taza" anclada |
| Page Transition (su2491251) | Transición de ruta y vuelo de la bolsa |
| Floating Label (ddoemonn), Label Input (tom_ui) | Microinteracciones de los campos (la etiqueta se dejó arriba, más clara) |
| Custom Cursor (soralabs) | Se evaluó y se descartó: el concepto no lo necesita y perjudica la accesibilidad |

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
| Google.Apis.Auth | 1.68.0 |
| Base de datos local | PostgreSQL 17 (`cafeapi_dev`) |

## Arquitectura del backend

Rutas relativas a `backend/`.

```
Controller  →  Interfaces/IXRepository  →  Repositories/XRepository  →  Data/AppDbContext (EF Core)  →  PostgreSQL
ImagesController / CafesController  →  Interfaces/ICloudinaryService  →  Services/CloudinaryService  →  Cloudinary
```

- **Controllers/**: validan (DataAnnotations + reglas como "la variedad existe"), mapean DTO ↔ entidad y deciden el código HTTP. No hay capa de servicios de negocio (decisión del grupo: se mantiene Controller → Repository).
- **Repositories/**: todos los métodos son `*Async` y reciben `CancellationToken`. Las lecturas usan `AsNoTracking()` y proyectan directamente a DTO con `Select` (un solo SELECT con JOIN, sin N+1). Para modificar o borrar: `FindAsync` (con seguimiento) → el controlador cambia la entidad → `UpdateAsync`/`DeleteAsync` (que llaman a `SaveChangesAsync`).
- **Data/AppDbContext.cs**: `DbSet` de `Variedades` y `Cafes`. Aplica las configuraciones de `Data/Configurations/` (una clase `IEntityTypeConfiguration` por entidad) y asigna `created_at`/`updated_at` en UTC al guardar.
- **Data/Migrations/**: migraciones de EF Core. **Son la fuente de verdad del esquema** (ya no existe `database/schema.sql`).
- **Data/DbUpdateExceptionExtensions.cs**: detecta violaciones de unicidad (23505) y de clave foránea (23503) de PostgreSQL para responder 409.
- **Seguridad/**: `Roles` y `Politicas` (autorización por políticas; ver "Autorización").
- **Middleware/ExceptionMiddleware.cs**: cualquier excepción no controlada → 500 con mensaje genérico en español. El detalle solo va al log.
- Registro en `Program.cs`: `AddDbContext<AppDbContext>(UseNpgsql + UseSnakeCaseNamingConvention)`, repositorios y `CloudinaryService` como `Scoped`.

## Modelo de datos

**variedades**

| Columna | Tipo | Reglas |
|---|---|---|
| id | integer identity | PK |
| nombre | varchar(100) | obligatorio, único (`ux_variedades_nombre`) |
| descripcion | text | opcional |

Semilla (`HasData`): 1 Castillo, 2 Geisha, 3 Moka (descripción null).

**cafes**

| Columna | Tipo | Reglas |
|---|---|---|
| id | integer identity | PK |
| nombre | varchar(100) | obligatorio |
| variedad_id | integer | FK → variedades, `ON DELETE RESTRICT` |
| presentacion_gramos | integer | `CHECK IN (340, 500)` (enum `Presentacion`) |
| origen | varchar(100) | obligatorio |
| stock | integer | `CHECK >= 0` |
| precio | numeric(12,0) | `CHECK > 0`, pesos colombianos sin decimales |
| imagen_url | varchar(500) | opcional |
| imagen_public_id | varchar(255) | opcional |
| created_at / updated_at | timestamptz | UTC, los asigna `AppDbContext` |

Índice único `ux_cafes_nombre_variedad_presentacion` sobre `(lower(nombre), variedad_id, presentacion_gramos)`, creado con `migrationBuilder.Sql` en `InitialCreate` (EF Core no modela índices por expresión, así que **no aparece en el snapshot**: si se recrea la migración, hay que volver a añadirlo a mano en `Up` y `Down`).

`Presentacion` es un enum en código (`G340 = 340`, `G500 = 500`), no una tabla. En JSON viaja como número (`presentacionGramos: 340`).

Entidades **fuera** del DbContext (pendientes): `Usuario`, `Cart`, `CartItem`.

## Endpoints y permisos

"Inventario" = política `GestionInventario` (hoy exige el rol Administrador; ver "Autorización").

| Método | Ruta | Permiso | Respuestas |
|---|---|---|---|
| POST | /api/auth/login | Público | 200 `LoginResponseDto`, 401 |
| POST | /api/auth/google | Público | 200, 401 |
| GET | /api/auth/me | Cualquier JWT válido | 200 `UsuarioActualDto` (email, nombre, roles), 401 |
| GET | /api/cafes | Público | 200 `CafeResponseDto[]` |
| GET | /api/cafes/{id} | Público | 200, 404 |
| POST | /api/cafes | Inventario | 201 `CafeResponseDto`, 400, 401, 403, 409 duplicado |
| PUT | /api/cafes/{id} | Inventario | 200 `CafeResponseDto`, 400, 401, 403, 404, 409 |
| DELETE | /api/cafes/{id} | Inventario | 204, 401, 403, 404 (borrado físico + borra la imagen) |
| GET | /api/variedades | Público | 200 `VariedadResponseDto[]` |
| GET | /api/variedades/{id} | Público | 200, 404 |
| POST | /api/variedades | Inventario | 201, 400, 401, 403, 409 nombre duplicado |
| PUT | /api/variedades/{id} | Inventario | 204, 400, 401, 403, 404, 409 |
| DELETE | /api/variedades/{id} | Inventario | 204, 401, 403, 404, 409 si tiene cafés |
| GET | /api/presentaciones | Público | 200 `[{ value, label }]` |
| POST | /api/images | Inventario | 200 `{ imageUrl, publicId }`, 400, 401, 403 |
| DELETE | /api/images?publicId=cafes/… | Inventario | 204, 400 (fuera de la carpeta `cafes/`), 401, 403, 409 si un café la usa |

Reglas relevantes:
- Sin token → **401**; con token pero sin el permiso (por ejemplo, la cuenta Cliente) → **403**.
- `variedadId` inexistente → 400 (`ValidationProblem`). Duplicados → 409 `ProblemDetails` con mensaje en español.
- `CafeResponseDto`: id, nombre, variedadId, variedadNombre, presentacionGramos, origen, stock, precio, imagenUrl, imagenPublicId, disponible, estadoStock (Agotado / Pocas unidades ≤10 / Disponible ≤50 / Alta disponibilidad).
- Imágenes: Base64 con o sin prefijo `data:image/...;base64,`; el formato se detecta por la firma de bytes (jpg, png, webp); máximo 5 MB; carpeta `cafes` de Cloudinary.
- Flujo de imagen: `POST /api/images` → guardar `imageUrl` + `publicId` en el café (POST/PUT). Si un PUT cambia el `imagenPublicId`, la anterior se borra de Cloudinary; un DELETE borra la imagen del café. Si Cloudinary falla al borrar, se registra en el log y la operación **no** falla. Si el guardado del café falla después de subir, el panel llama a `DELETE /api/images` para no dejar la imagen huérfana.
- El JWT lleva los claims `email`, `unique_name` (nombre) y `role`; `GET /api/auth/me` los devuelve.
- Swagger (`/swagger`) tiene el botón *Authorize* (Bearer): pega solo el token.

## Autorización (roles y políticas)

- `backend/Seguridad/Roles.cs`: constantes `Administrador` y `Cliente` (los valores del claim `role`).
- `backend/Seguridad/Politicas.cs`: la política `GestionInventario` (hoy `RequireRole(Roles.Administrador)`), registrada en `Program.cs` con `Politicas.Registrar(builder.Services.AddAuthorizationBuilder())`.
- Los controladores piden la **política**, no un rol: `[Authorize(Policy = Politicas.GestionInventario)]`.

**Agregar un rol nuevo (por ejemplo "Editor") que gestione el inventario**, sin tocar controladores:
1. Agrega `public const string Editor = "Editor";` en `Roles.cs`.
2. En `Politicas.cs` cambia la regla a `politica.RequireRole(Roles.Administrador, Roles.Editor)`.
3. En el frontend agrega el rol al permiso en `frontend/src/app/core/auth/permisos.ts`: `'inventario.gestionar': ['Administrador', 'Editor']`.

**Agregar un usuario autorizado**: hoy las cuentas son fijas (`CuentasDePrueba` en `AuthController`); agrega una línea con correo, contraseña, nombre visible y rol. Cuando exista la tabla de usuarios, el rol saldrá de la base de datos y las políticas seguirán igual.

## Panel de administración

- **Entrar**: en la tienda, footer → "Acceso administrador" (o directamente `http://localhost:4200/admin`). Se ingresa con la cuenta de rol Administrador definida en `AuthController` (pide la contraseña al equipo; no se escribe en la documentación). Una cuenta Cliente ve "Esta cuenta no tiene permiso para administrar el inventario."
- **Rutas**: `/admin/ingresar` (acceso), `/admin/inventario` (cafés), `/admin/variedades`. Todo `/admin` está protegido con `canMatch` por permiso y se carga de forma diferida.
- **Inventario**: lista con búsqueda (sin tildes), crear y editar en un panel lateral (nombre, variedad, presentación, origen, stock, precio e imagen con vista previa; tipo jpg/png/webp y 5 MB se validan antes de subir), eliminar con confirmación "Esta acción es irreversible", avisos de éxito y mensajes en español para 400, 401, 403, 404 y 409.
- **Variedades**: crear, editar y eliminar (409 si tiene cafés).
- **Sesión**: token en `sessionStorage` (se borra al cerrar la pestaña); se cierra sola al expirar el JWT (`Jwt:ExpiresInMinutes`). Un 401 de la API cierra la sesión y lleva a `/admin/ingresar`; un 403 muestra "No tienes permiso para esta acción".
- Los cambios se ven en Inicio y Productos al recargar (leen la misma API).
- El **Login y el Registro públicos (`/login`, `/registro`) siguen siendo solo visuales**: no usan `Auth` ni llaman a la API (lo verifican las e2e).

## Configuración

La configuración local va en **`backend/appsettings.Development.json`** (**ignorado por Git**). **No se usan User Secrets**: tienen prioridad sobre `appsettings.Development.json` y causaban confusión (el `UserSecretsId` sigue en el `.csproj` pero debe quedar vacío; si hace falta: `dotnet user-secrets clear`).

Copia `appsettings.example.json` → `appsettings.Development.json` y rellena:

| Clave | Uso |
|---|---|
| `ConnectionStrings:CafeDatabase` | PostgreSQL local (`Host=localhost;Port=5432;Database=cafeapi_dev;Username=postgres;Password=...`) |
| `Google:ClientId` | Login con Google |
| `Jwt:Key` | Clave HMAC, 32 bytes aleatorios en Base64 |
| `Jwt:Issuer` / `Jwt:Audience` / `Jwt:ExpiresInMinutes` | `CafeApi` / `CafeApiUsers` / `60` |
| `CloudinarySettings:CloudName` / `ApiKey` / `ApiSecret` | Cuenta de Cloudinary |
| `Logging:LogLevel` | `Information` / `Microsoft.AspNetCore: Warning` |

Generar una `Jwt:Key` (PowerShell):
```powershell
$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
```

**Nunca** subas secretos a Git ni los escribas en `appsettings.json` / `appsettings.example.json`.

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
- `CafeApi.http`: peticiones de prueba (login → token → resto). Reemplaza `TU_CONTRASEÑA`.
- psql no está en el PATH: `"C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -U postgres -d cafeapi_dev`.
- Al probar con `curl` desde Git Bash, envía el cuerpo con `--data-binary @archivo.json`: pasar JSON con tildes como argumento lo convierte a ANSI y la API responde 400.

## Productos de ejemplo (seed)

`backend/seed/seed-productos.ps1` (Windows PowerShell 5.1 o 7; archivo UTF-8 con BOM):

1. Pide correo y contraseña del Administrador (o `-Email`/`-Password` como `SecureString`; `-ApiBaseUrl`, por defecto `http://localhost:5031/api`).
2. `POST /api/auth/login` → token. Resuelve `variedadId` por nombre con `GET /api/variedades`.
3. Por cada producto: si ya existe (nombre sin mayúsculas + variedad + presentación, según `GET /api/cafes`) lo **omite sin subir imagen**; si no, `POST /api/images` y `POST /api/cafes` con `imagenUrl` + `imagenPublicId`. Un 409 en el POST se reporta como omitido.
4. Los cuerpos se envían como bytes UTF-8 (las tildes llegan bien en PowerShell 5.1).

| # | Nombre | Variedad | g | Origen | Stock | Precio |
|---|---|---|---|---|---|---|
| 1 | Mesa de los Santos | Castillo | 340 | Santander | 24 | 42.000 |
| 2 | Mesa de los Santos | Castillo | 500 | Santander | 15 | 58.000 |
| 3 | Pitalito Reserva | Geisha | 340 | Huila | 8 | 89.000 |
| 4 | Volcán Galeras | Moka | 340 | Nariño | 12 | 54.000 |
| 5 | Sierra Nevada | Castillo | 500 | Magdalena | 0 | 61.000 |
| 6 | Tierradentro | Geisha | 500 | Cauca | 5 | 118.000 |

Imágenes (set 2): `backend/seed/imagenes/NN-nombre-gramos.{svg,png}` (PNG 1600×1600). Bolsa stand-up de papel kraft en tres cuartos (fuelle lateral en sombra, sello engarzado, cierre, válvula, pliegues), luz de estudio desde la izquierda, sombra proyectada sobre una mesa cálida y granos tostados en primer plano. La etiqueta lleva logo, nombre, variedad, origen, peso neto y un **grabado único de la región** (cañón del Chicamocha, laderas del Huila, volcán Galeras, Sierra Nevada, terrazas de Tierradentro) en el color de la variedad. La de 500 g es un 17 % más grande. Textura kraft con `feTurbulence`. Los SVG nombran Fraunces/Inter por familia; los PNG se exportaron con Chromium (fuentes variables de @fontsource) y se comprimieron con paleta (`sharp`, ~1,5 MB cada uno en vez de ~4 MB, sin diferencia visible). Filosofía en `DISENO.md`.

**`-ActualizarImagenes`**: `seed-productos.ps1 -ActualizarImagenes` sube la imagen nueva de cada café existente y hace `PUT /api/cafes/{id}` conservando sus datos actuales y enviando el nuevo `imagenUrl` + `imagenPublicId`; el backend borra la imagen anterior de Cloudinary. Tras ejecutarlo se verificó que la carpeta `cafes` de Cloudinary contiene exactamente los 6 `publicId` de la base de datos (sin huérfanas).

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
| `login` | Login (solo visual) | Iniciar sesión \| Altura |
| `registro` | Registro (solo visual) | Crear cuenta \| Altura |
| `admin/ingresar` | Acceso al panel (real) | Ingresar al panel \| Altura |
| `admin` → `admin/inventario`, `admin/variedades` | Panel (guard `canMatch` por permiso, layout `Admin`) | Inventario \| Altura · Variedades \| Altura |
| `**` | redirige a `''` | — |

Transición entre rutas con `withViewTransitions()`; las navegaciones que solo cambian query params y el movimiento reducido marcan `<html class="transicion-instantanea">`. Durante el vuelo de la bolsa se marca `<html class="transicion-vuelo">` (solo la bolsa tiene nombre; el resto hace un fundido corto).

**Estructura de `src/app/`:**

- `core/auth/`: `permisos.ts` (mapa centralizado permiso → roles), `auth.ts` (servicio `Auth` con signals: login, sesión en `sessionStorage`, cierre al expirar, `tienePermiso`), `interceptor.ts` (Bearer solo a la API; 401 → cierra sesión; 403 → aviso), `guard.ts` (`requierePermiso(permiso)`, `canMatch`).
- `core/models/`: `Cafe`/`CafeGuardar`, `Variedad`/`VariedadGuardar`, `Presentacion`, `Sesion`/`UsuarioActual`/`RespuestaLogin`. Si cambia un DTO del backend, actualiza estos modelos.
- `core/services/` (`@Service()`): `Cafes` y `Variedades` (lectura pública + crear/actualizar/eliminar), `Presentaciones`, `Imagenes` (subir/borrar), `Avisos` (avisos breves del panel).
- `core/data/`: `mapa-colombia.ts` (Natural Earth) y `contenido-marca.ts` (texto, color y notas de cata por variedad, fotos del sitio, pasos del proceso, `ETAPAS_ASCENSO`). **Los productos y las variedades siempre vienen de la API**.
- `core/utils/`: `gsap.ts` (`cargarGsap`, `refrescarScroll`), `medios.ts` (`matchMedia` seguro, `movimientoReducido`, `punteroFino`, `navegadorCompleto`), `imagenes.ts`, `texto.ts`, `transicion.ts`, `validadores.ts` (`PATRON_CORREO`, `camposCoinciden`, `entero`), `errores.ts` (`mensajeDeError`: mensaje en español por código HTTP).
- `layout/sitio`: navbar fijo (se vuelve sólido con un sensor de IntersectionObserver), `<router-outlet>`, footer con cresta y "Acceso administrador". `layout/admin`: cabecera del panel (usuario, "Ver tienda", "Cerrar sesión"), navegación y avisos.
- `pages/inicio/`: `Hero` (crestas + palabra + parallax), `Altimetro`, `Destacados`, `Proceso` (galería anclada), `CintaNotas` (marquee con datos de la API), `Origenes` (mapa), `Variedades`, `Cierre`. Cada sección lleva `data-etapa`.
- `pages/productos/`: `Productos` + `Filtros` + `catalogo.ts` (lógica pura de filtros ↔ URL `?q=&variedad=&presentacion=&origen=&disponibles=1&orden=`, orden, búsqueda sin tildes). Igual que antes: estado en un signal, View Transitions al filtrar, bloque 2×2 en ≥1200 px con filas completas y hoja `<dialog>` de filtros en móvil.
- `pages/login`, `pages/registro`: formularios reactivos solo visuales (validaciones, visto de campo válido, medidor de seguridad en Registro); al enviar válido muestran "… estará disponible próximamente." y **no** llaman a la API.
- `pages/admin/`: `ingresar`, `inventario`, `variedades` (`variedades-admin.ts`) y los estilos compartidos `lista-admin.css` y `formulario-admin.css`.
- `shared/`: `Navbar`, `Footer`, `Logo`, `TarjetaCafe` (toda la card es clicable; emite el `Cafe`; imagen con `data-bolsa`), `VistaRapida` (datos de la lista al instante + `GET /api/cafes/{id}`; vuelo de la bolsa; color de la variedad; Escape se atiende en `keydown`), `SelectorCantidad`, `EstadoError`, `PaisajeAcceso` (amanecer con niebla de Login/Registro/ingreso), `acceso/acceso.css` (estilos compartidos de los formularios de acceso), directivas `Revelar`, `AtraparFoco`, `movimiento/Inclinar` y `movimiento/Magnetico`.
- `src/environments/`: `apiBaseUrl` (`http://localhost:5031/api` en desarrollo; vacío en producción) y `cloudinaryBase`.

**Comandos (desde `frontend/`):**

```powershell
npm install
npx playwright install chromium   # una vez, para las e2e
npm start                          # ng serve → http://localhost:4200 (la API debe estar en :5031)
npx ng build                       # 0 advertencias
npx ng test --watch=false          # Vitest
npm run e2e                        # Playwright (API con los 6 productos; arranca ng serve si no está)
node herramientas/generar-paisaje.mjs   # regenera crestas y curvas de nivel (public/)
```

Si se cambia `angular.json` (estilos, fuentes), **reinicia `ng serve`**: no recarga ese archivo en caliente.

**e2e** (`frontend/e2e/*.e2e.ts`, dos proyectos de Playwright: `chromium` con movimiento y `movimiento-reducido` con `prefers-reduced-motion: reduce`; etiquetas `@movimiento`, `@reducido`, `@una-vez`):
- `altura.e2e.ts`: Inicio (destacados de la API con Cloudinary, etapas, altímetro, mapa → catálogo, galería anclada / fila con movimiento reducido), navegación (estado activo, navbar sólido, menú móvil, login ↔ registro), Productos (filtros, orden, búsqueda sin tildes, recarga, cards, vista rápida con color de variedad, vuelo de la bolsa, hoja de filtros en móvil), API caída, formularios sin peticiones a la API, axe-core en todas las vistas a 1440 y 375 px, capturas y grabación.
- `admin.e2e.ts`: acceso sin sesión, credenciales incorrectas, cuenta Cliente sin acceso, crear café con imagen → verlo en la tienda → editarlo → eliminarlo (y comprobar que la imagen ya no existe en Cloudinary), variedades (crear, duplicada 409, editar, no eliminar con cafés, eliminar), 403 y 401 simulados, axe del panel y cierre de sesión. **Necesita variables de entorno** con las cuentas de prueba (si faltan, se omite):

```powershell
$env:ALTURA_ADMIN_EMAIL = '<correo admin>';    $env:ALTURA_ADMIN_PASSWORD = '<contraseña>'
$env:ALTURA_CLIENTE_EMAIL = '<correo cliente>'; $env:ALTURA_CLIENTE_PASSWORD = '<contraseña>'
npm run e2e
```

Todo lo que crean estas pruebas lleva "e2e" en el nombre y se borra al terminar (también si una prueba falla). La fixture `consola` hace fallar cualquier prueba con errores de consola. Capturas y video (`hero-y-vista-rapida.webm`) en `frontend/e2e/capturas/` (ignorada por Git).

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
| canvas-design | Piezas gráficas del concepto: crestas y curvas de nivel generadas por código (`herramientas/generar-paisaje.mjs`). |
| webapp-testing | Capturas y consola durante el desarrollo; pruebas escritas con `@playwright/test` (npm), como pide el proyecto. |

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
| Imágenes en SVG → PNG con Chromium | SVG editable como fuente; PNG con las fuentes de la etapa anterior (Fraunces/Inter) para Cloudinary. Las bolsas no se rehicieron: funcionan como "foto de producto" sobre el color de cada variedad. |
| Reactive Forms (no Signal Forms) | Lo pidió el taller, aunque Angular 22 recomienda Signal Forms para formularios nuevos. |
| `rxResource` para los GET (Inicio, Productos, vista rápida) | Estados de carga/error/valor como signals y `reload()` para "Reintentar". |
| `<img loading="lazy">` en vez de `NgOptimizedImage` | La optimización ya la hace Cloudinary (`f_auto,q_auto,w_600`); evita avisos de tamaño de `NgOptimizedImage` en consola. |
| Registro del locale `es-CO` en `app.config.ts` (y también en `TarjetaCafe`) | Lo necesitan la tienda y el panel; `TarjetaCafe` lo conserva para sus pruebas unitarias. |
| Budget inicial de advertencia 700 kB (antes 500 kB) | Se mantiene; sin Bootstrap el inicial quedó en ~394 kB (~97 kB transferidos). El de 4 kB por componente no se subió: el CSS del panel se dividió en dos archivos por responsabilidad. |
| Grilla de 3/2/1 columnas; destacada 2×2 solo con filas completas | Con 6 cafés: 4 + 5 celdas = 3 filas llenas; nunca una card sola al final. |
| Prueba "API caída" con `page.route` | Suite autocontenida; se verificó también apagando la API real. |
| Inicio y Productos en rutas separadas, con layout compartido | Pedido del rediseño; navbar y footer no se recrean al navegar. |
| Filtros en un signal y reflejados en la URL después de animar | Permite animar el reordenamiento con View Transitions sin que la navegación del router interrumpa la transición; la URL sigue siendo compartible y sobrevive a recargar. |
| Vista rápida sobre `<dialog>` nativo + directiva `AtraparFoco` | Fondo inerte, Escape y capa superior nativos; el Tab cíclico evita que el foco salga a la interfaz del navegador. |
| Fotos del sitio por subida firmada directa a Cloudinary | `POST /api/images` fija la carpeta `cafes`; así no se toca el backend. |
| Contenido editorial de variedades en el frontend, asociado por nombre | Las variedades salen de la API; el texto de marca no existe en el backend y no se quiso cambiarlo. |
| Mapa generado de Natural Earth (dominio público) | Contorno real de Colombia sin dibujarlo a mano; coordenadas de los 32 departamentos como tabla de referencia. |
| `matchMedia` envuelto en `core/utils/medios.ts` | Sin él, los componentes fallaban en entornos sin navegador completo (jsdom, servidor). |
| Selector de cantidad como componente propio | Mantiene la vista rápida bajo el presupuesto de 4 kB de CSS por componente y servirá para el carrito. |
| Concepto "Ascenso" (A) + vuelo de la bolsa (B) + color por variedad (C) | Elección del equipo entre tres conceptos con maqueta; el nombre "Altura" se vuelve la experiencia. |
| Sistema propio y sin Bootstrap | Bootstrap solo aportaba grilla y utilidades; con tokens propios el CSS inicial bajó de ~330 kB a ~99 kB y no hay que pelear con sus estilos. |
| GSAP + ScrollTrigger con `import()` solo en el Inicio | Lo complejo (parallax, altímetro, galería) queda legible y no pesa en Productos, Login ni el panel. |
| Galería anclada con `position: sticky` (no el "pin" de GSAP) | No modifica el DOM de Angular y se explica en una frase: la sección mide 400vh y su contenido queda fijo. |
| Parallax en el contenedor de cada cresta y entrada en la imagen | GSAP absorbe la propiedad `translate` de la animación CSS: separadas no se pisan. |
| Vuelo de la bolsa con View Transitions (nombre `bolsa`) | Elemento compartido nativo, sin librerías; sin soporte o con movimiento reducido el panel solo aparece. |
| Vista rápida con los datos de la lista + `GET /api/cafes/{id}` | La imagen está lista en el primer fotograma (requisito del vuelo) y los datos se actualizan igual. |
| Escape de la vista rápida en `keydown` | Chrome no deja cancelar el evento `cancel` del `<dialog>` sin interacción previa y el cierre no se animaba. |
| Altímetro decorativo (`aria-hidden`) y sin movimiento reducido | Cada sección ya tiene título; el número cambia con el scroll pero no es animación. |
| Login y Registro públicos solo visuales; panel en `/admin` | Restricción del Taller 3: la administración es una zona separada con su propio acceso. |
| Autorización por políticas (`GestionInventario`) y mapa de permisos en el frontend | Agregar un rol después es cambiar una línea en cada lado, sin tocar controladores ni componentes. |
| Sesión del panel en `sessionStorage` | Se borra al cerrar la pestaña; sobrevive a una recarga. |
| `DELETE /api/images` restringido a `cafes/` y con 409 si la imagen está en uso | Limpia subidas no usadas sin poder borrar otras imágenes de la cuenta. |
| Credenciales de las e2e del panel por variables de entorno | No se escriben contraseñas en el repositorio. |

## Problemas conocidos y pendientes

- **Carrito pendiente**: `Cart`, `CartItem`, `ICartRepository`/`CartRepository` (lanza `NotImplementedException`) y los DTOs de carrito existen pero no están en el DbContext ni registrados en DI.
- **Usuarios pendientes**: `Usuario` e `IUserRepository`/`UserRepository` (ADO.NET contra `public.users`) no están registrados. El login usa **dos cuentas fijas en `AuthController`**; Google Login no persiste usuarios.
- **Rotar `Jwt:Key`**: dos claves antiguas quedaron en el historial de Git, una en `appsettings.json` (de `6829fba` a `4676745`) y otra en `appsettings.Development.json`, que se subió en `6829fba` y se borró en `a28795a`. Ese archivo también contenía el `Google:ClientId`, que es público. No se reescribió el historial porque el repo es privado. Ninguna de las dos claves está en uso: cada integrante debe generar la suya. Las credenciales de Cloudinary y la contraseña de PostgreSQL nunca se subieron (revisión del 2026-09-30).
- `imagenPublicId` lo envía el cliente y no se valida contra Cloudinary: un publicId ajeno se borraría al eliminar/reemplazar el café (solo puede hacerlo quien tiene el permiso de inventario). Si una creación falla después de subir la imagen, el panel la borra con `DELETE /api/images`; un cliente que use la API directamente puede dejarla huérfana.
- Los títulos de los 400 automáticos de validación salen en inglés ("One or more validation errors occurred."); los mensajes de cada campo sí están en español.
- El diagnóstico de arranque de `Program.cs` muestra "PostgreSQL (Supabase)" para cualquier cadena con el puerto 5432, también en local.
- `__EFMigrationsHistory` conserva su nombre original (la convención snake_case no lo cambia).
- **Login y Registro públicos solo visuales** (requisito del taller). La autenticación real existe solo en el panel `/admin`, con las dos cuentas fijas del backend. "Agregar al carrito" está deshabilitado ("Próximamente").
- El token del panel vive en `sessionStorage`: es visible para cualquier script de la página (no hay `HttpOnly` sin cookies); aceptable para el proyecto, no para producción.
- El frontend asume `ng serve` en el puerto 4200: es el único origen permitido por CORS en `Program.cs`. Otro puerto requiere cambiar el backend.
- `environment.ts` (producción) tiene `apiBaseUrl` vacío: configúralo antes de desplegar.
- Con la API apagada, el navegador registra 2 errores de red ("Failed to load resource") en consola; son inevitables y la app los maneja mostrando "Reintentar".
- Las e2e dependen de los datos del seed (6 cafés, Sierra Nevada agotado, Tierradentro con 5 unidades); si cambian, ajusta `frontend/e2e/altura.e2e.ts`. Las del panel crean y borran datos reales (con "e2e" en el nombre) y suben una imagen real a Cloudinary.
- Problemas encontrados en el rediseño: (1) la primera foto elegida para el acceso era de cacao, no de café (se reemplazó); (2) la firma de Cloudinary fallaba en PowerShell 5.1 por usar la hora local; (3) `ng serve` debe reiniciarse al cambiar `angular.json`; (4) el router de Angular registra como error de consola las transiciones omitidas en modo desarrollo; (5) la foto del hero estiraba la fila de la grilla (se sacó del flujo con `position: absolute`).
- Rendimiento medido en local (Chromium sin GPU): LCP del Inicio ~0,4 s, CLS ~0, ~58 fps de media al hacer scroll; los fotogramas lentos (33 ms) coinciden con la carga de imágenes. Falta medirlo en un móvil real.
- Durante una View Transition (vuelo de la bolsa, 520 ms) el navegador no recibe clics; las pruebas esperan a que termine.
- En la captura de página completa con movimiento reducido, la galería del proceso aparece desplazada porque la prueba lleva cada imagen a la vista (artefacto de la captura).
- Problemas encontrados en el rediseño Ascenso: (1) GSAP absorbía la propiedad `translate` de la entrada de las crestas (se separaron contenedor e imagen); (2) los atributos `height` de las imágenes ganaban al `aspect-ratio` (se agregó `img { height: auto }`); (3) las cards con `view-transition-name` se pintaban sobre el panel durante el vuelo (se desactivan con `.transicion-vuelo`); (4) Escape cerraba el `<dialog>` sin animación (ver Decisiones); (5) la capa clicable de la card solo cubría el cuerpo (se quitó `position: relative`); (6) el panel no tenía el locale `es-CO`.
- Problemas encontrados en este taller: (1) `dotnet new tool-manifest` en .NET 10 crea el manifiesto en la raíz, no en `.config/` (se movió a mano); (2) `curl` desde Git Bash rompe las tildes si el JSON va como argumento; (3) PowerShell 5.1 necesita el `.ps1` con BOM y el cuerpo en bytes UTF-8; (4) `rxResource` deja pendiente `whenStable()` en pruebas unitarias si no se simulan los servicios.
