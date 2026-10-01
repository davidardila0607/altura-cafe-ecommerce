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
- **frontend/**: aplicación Angular 22 (`altura-web`). Inicio editorial, catálogo de Productos con filtros en la URL y vista rápida, y vistas visuales de Login y Registro (sin autenticación real todavía).

Repositorio: https://github.com/davidardila0607/altura-cafe-ecommerce (privado). Es el **único** repositorio del proyecto; la rama principal es **`main`** (sigue a `origin/main`). El repositorio anterior (`pablorja/CafeApi`) ya no se usa. No se hace force push ni se reescribe el historial.

## Estructura del repositorio

```
CafeApi/
├── backend/                 Proyecto .NET (CafeApi.sln, CafeApi.csproj, Program.cs, Controllers/, Data/, DTOs/,
│   │                        Interfaces/, Middleware/, Models/, Repositories/, Services/, Configurations/,
│   │                        Properties/, CafeApi.http, appsettings*.json)
│   ├── .config/             Manifiesto de dotnet-ef (herramienta local)
│   └── seed/                Productos de ejemplo (seed-productos.ps1 + imagenes/: SVG fuente, PNG, DISENO.md)
│                            y fotos del sitio (subir-imagenes-sitio.ps1 + sitio/fotos.json)
├── frontend/                Proyecto Angular altura-web (package.json, angular.json, src/, e2e/, playwright.config.ts)
├── .gitignore               Reglas de .NET, Node/Angular y Playwright
├── CLAUDE.md                Esta guía
├── README.md                Puesta en marcha paso a paso
└── CHANGELOG.md
```

Los comandos de .NET se ejecutan **desde `backend/`** y los de Node/Angular **desde `frontend/`**. `frontend/CLAUDE.md` lo generó Angular CLI (`--ai-config=claude-code`) con buenas prácticas de Angular 22; complementa esta guía.

## Sistema de diseño

Marca **Altura**, subtítulo "Café de especialidad colombiano". Identidad: tostadora de especialidad colombiana, editorial y cálida (revista de café impresa + tienda de tostador). Solo modo claro (identidad de papel impreso; decisión aprobada). Todos los tokens viven en `frontend/src/styles.css` (`:root`).

**Paleta** (la base es fija; los derivados están documentados aquí):

| Token | Hex | Uso |
|---|---|---|
| `--alt-crema` | `#F6F1E9` | Fondo de página, secciones alternas |
| `--alt-papel` | `#FBF8F3` | Superficies: cards, catálogo, formularios, paneles |
| `--alt-espresso` | `#2B1D14` | Texto, footer, chip activo, badges |
| `--alt-cafe` | `#6B4226` | Variedad Castillo; trazos del mapa |
| `--alt-terracota` | `#B5562F` | Botón principal y acentos **solo como relleno** (4.31:1 sobre crema: no apto para texto); variedad Moka |
| `--alt-terracota-texto` | `#97441F` | Derivado: texto/enlaces en tono terracota (5.9:1), "Quedan N" |
| `--alt-terracota-hover` / `-activo` | `#9C4827` / `#86391B` | Derivados: estados del botón principal |
| `--alt-verde` | `#3F5A40` | Variedad Geisha; disponibilidad |
| `--alt-crema-hondo` | `#EDE3D3` | Derivado: banda del cierre, fondos de imagen |
| `--alt-blanco-calido` | `#FFFDF9` | Derivado: fondo de campos de formulario |
| `--alt-mapa-origen` / `--alt-mapa-activo` | `#E9D2BF` / `#DDB197` | Derivados: departamentos con cafés / seleccionado |
| `--alt-esqueleto-1` / `-2` | `#EADFCE` / `#F4ECE0` | Derivados: brillo de los *skeletons* |
| `--alt-linea` / `--alt-linea-fuerte` / `--alt-texto-suave` | espresso al 12 % / 24 % / 74 % | Bordes, divisores y texto secundario (AA) |

**Tipografía** (npm, `@fontsource-variable`): **Fraunces** variable con eje óptico (`font-optical-sizing: auto`, `'SOFT'` 50–80) para títulos, precios, marca y nombres de variedad; **Inter** variable para texto. Escala: `--fs-100` 13 px · `--fs-200` 14 · `--fs-300` 16 · `--fs-400` 18 · `--fs-500` 22 · `--fs-600` 25–32 · `--fs-700` 32–46 · `--fs-800` 42–70 (fluidas con `clamp`). Interlineado `--lh-ajustado` 1.04 (display), `--lh-titulo` 1.14, `--lh-texto` 1.62. Tracking de títulos −0.02 a −0.03 em.

**Espaciado**: `--esp-1` … `--esp-9` (4, 8, 12, 16, 24, 32, 48, 64, 96 px); `--seccion` (72–128 px) entre secciones; contenedor `--ancho-max` 1320 px con `--margen-lateral` fluido (16–40 px).

**Forma** (regla de radios): tarjetas e imágenes `--radio-tarjeta` 14 px · botones y campos `--radio-control` 10 px · chips, contadores y badges en píldora. Sombras teñidas de espresso (`--sombra-1`, `--sombra-2`).

**Movimiento**: `--ease-salida` `cubic-bezier(.23,1,.32,1)`, `--ease-cajon` `(.32,.72,0,1)`, `--ease-movimiento` `(.77,0,.175,1)`; `--dur-presion` 160 ms, `--dur-rapida` 200 ms, `--dur-panel` 340 ms. Momentos: entrada única del hero (texto en cascada + foto que se descubre), revelado de fotos del proceso al entrar en pantalla (directiva `appRevelar`), pulsación `scale(.97)` en botones, elevación + zoom leve en cards (solo con puntero fino), paneles con curva de cajón, transición de ruta (fundido + 8 px) y reordenamiento de la grilla con View Transitions. **Movimiento reducido**: sin desplazamientos (no hay elevación, zoom, cascadas ni deslizamientos; los paneles aparecen con fundido), se conservan los fundidos y cambios de color cortos.

**Textura**: grano de papel con `feTurbulence` en una capa fija (`body::after`, `pointer-events: none`, `mix-blend-mode: multiply`, 6 %); en capturas de página completa solo cubre el primer alto de ventana (artefacto de la captura, no del navegador).

**Capas**: `--z-nav` 100 (navbar fijo), `--z-grano` 300; los paneles usan la capa superior nativa de `<dialog>`.

**Motivos de marca**: grabado en líneas y tramas (etiquetas, muestras de variedad), kraft y mapa de Colombia por departamentos.

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

| Método | Ruta | Permiso | Respuestas |
|---|---|---|---|
| POST | /api/auth/login | Público | 200 `LoginResponseDto`, 401 |
| POST | /api/auth/google | Público | 200, 401 |
| GET | /api/cafes | Público | 200 `CafeResponseDto[]` |
| GET | /api/cafes/{id} | Público | 200, 404 |
| POST | /api/cafes | Cualquier JWT válido | 201 `CafeResponseDto`, 400, 401, 409 duplicado |
| PUT | /api/cafes/{id} | Rol Administrador | 200 `CafeResponseDto`, 400, 404, 409 |
| DELETE | /api/cafes/{id} | Rol Administrador | 204, 404 (borrado físico + borra la imagen) |
| GET | /api/variedades | Público | 200 `VariedadResponseDto[]` |
| GET | /api/variedades/{id} | Público | 200, 404 |
| POST | /api/variedades | Rol Administrador | 201, 400, 409 nombre duplicado |
| PUT | /api/variedades/{id} | Rol Administrador | 204, 400, 404, 409 |
| DELETE | /api/variedades/{id} | Rol Administrador | 204, 404, 409 si tiene cafés |
| GET | /api/presentaciones | Público | 200 `[{ value, label }]` |
| POST | /api/images | Rol Administrador | 200 `{ imageUrl, publicId }`, 400 |

Reglas relevantes:
- `variedadId` inexistente → 400 (`ValidationProblem`). Duplicados → 409 `ProblemDetails` con mensaje en español.
- `CafeResponseDto`: id, nombre, variedadId, variedadNombre, presentacionGramos, origen, stock, precio, imagenUrl, imagenPublicId, disponible, estadoStock (Agotado / Pocas unidades ≤10 / Disponible ≤50 / Alta disponibilidad).
- Imágenes: Base64 con o sin prefijo `data:image/...;base64,`; el formato se detecta por la firma de bytes (jpg, png, webp); máximo 5 MB; carpeta `cafes` de Cloudinary.
- Flujo de imagen: `POST /api/images` → guardar `imageUrl` + `publicId` en el café (POST/PUT). Si un PUT cambia el `imagenPublicId`, la anterior se borra de Cloudinary; un DELETE borra la imagen del café. Si Cloudinary falla al borrar, se registra en el log y la operación **no** falla.
- Swagger (`/swagger`) tiene el botón *Authorize* (Bearer): pega solo el token.

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
| Hero (`sitio/hero`) | George Dagerotip | https://unsplash.com/photos/a-person-holding-a-handful-of-berries-in-their-hand-XRY4giMaDoA |
| Origen (`sitio/origen`) | Phạm Trọng Họ | https://unsplash.com/photos/person-walking-on-misty-hillside-plantation-5HG67luOwFE |
| Cosecha (`sitio/cosecha`) | Gerson Cifuentes | https://unsplash.com/photos/a-person-picking-coffee-beans-from-a-tree-0-SWia-_xjA |
| Tueste (`sitio/tueste`) | Tim Mossholder | https://unsplash.com/photos/coffee-roasting-in-playa-del-carmen-YC6RVdoTtIk |
| Taza (`sitio/taza`) | Beau Carpenter | https://unsplash.com/photos/a-coffee-maker-pouring-coffee-into-a-cup-KGR2u2rG6c4 |
| Login, Registro y cierre del Inicio (`sitio/acceso`) | Łukasz Rawa | https://unsplash.com/photos/brown-coffee-beans-on-black-surface-fmc-tFMMiBs |

Solo se usaron fotos gratuitas (se descartaron las de Unsplash+). La primera elegida para `acceso` resultó ser de **granos de cacao**, no de café, y se reemplazó.

**Mapa**: `frontend/src/app/core/data/mapa-colombia.ts` se generó a partir de **Natural Earth** (`ne_10m_admin_1_states_provinces`, dominio público): contorno de los 32 departamentos continentales (sin San Andrés ni Malpelo) simplificado con Douglas-Peucker (0,015°), proyección equirectangular, y el punto de etiqueta de cada departamento. Es una tabla geográfica de referencia: los marcadores se calculan a partir de los orígenes que devuelve la API (`departamentoDeOrigen` busca por nombre normalizado); un origen sin coordenadas aparece en una lista sin marcador.

## Frontend (`frontend/`, proyecto `altura-web`)

| Componente | Versión |
|---|---|
| Angular (core, router, forms, common) / Angular CLI | 22.2.x / 22.1.8 |
| TypeScript | ~6.0 |
| Bootstrap (solo CSS: grilla, formularios, utilidades; sin JS) | 5.3.8 |
| Bootstrap Icons | 1.13.1 |
| @fontsource-variable/fraunces · @fontsource-variable/inter | 5.3.0 |
| Vitest (unitarias, `ng test`) | 4.x |
| @playwright/test (e2e) | 1.63.0 |
| Node / npm | 24.20 / 11.19 |

**Rutas** (`src/app/app.routes.ts`, carga diferida; Inicio y Productos comparten el layout `Sitio` con navbar y footer):

| Ruta | Vista | Título de pestaña |
|---|---|---|
| `''` | Inicio | Altura \| Café de especialidad |
| `productos` | Catálogo | Nuestros cafés \| Altura |
| `login` | Login (visual) | Iniciar sesión \| Altura |
| `registro` | Registro (visual) | Crear cuenta \| Altura |
| `**` | redirige a `''` | — |

Transición entre rutas con `withViewTransitions()`; las navegaciones que solo cambian query params y el movimiento reducido marcan `<html class="transicion-instantanea">` (sin animación). No se usa `skipTransition()`: en modo desarrollo el router registra el rechazo como error de consola.

**Estructura de `src/app/`:**

- `core/models/`: `Cafe` (= `CafeResponseDto`), `Variedad` (= `VariedadResponseDto`), `Presentacion` (= `PresentacionResponseDto`). Si cambia un DTO del backend, actualiza estos modelos.
- `core/services/` (`@Service()`, `HttpClient`): `Cafes` (`listar`, `obtener(id)`), `Variedades`, `Presentaciones`.
- `core/data/`: `mapa-colombia.ts` (tabla geográfica, ver arriba) y `contenido-marca.ts` (texto editorial y color de cada variedad asociados por nombre normalizado, fotos del sitio, pasos del proceso). **Los productos y las variedades siempre vienen de la API**; si aparece una variedad nueva, usa su `descripcion` y un color neutro.
- `core/utils/`: `imagenes.ts` (`optimizarImagenCloudinary` inserta `f_auto,q_auto,w_600` tras `/upload/`; `srcsetCloudinary`; `urlSitio`/`srcsetSitio`), `texto.ts` (`normalizarTexto`, `contarCafes`), `medios.ts` (`matchMedia` seguro, movimiento reducido), `transicion.ts` (`conTransicion`: cambio de estado dentro de una View Transition con `appRef.tick()`), `validadores.ts`.
- `layout/sitio`: navbar + `<router-outlet>` + footer, con enlace "Saltar al contenido".
- `pages/inicio/`: `Inicio` (carga cafés y variedades una vez con `rxResource`) y sus secciones: `Hero`, `Destacados` (3 cafés: con stock primero, precio descendente; uno grande + dos horizontales), `Proceso` (`id="proceso"`, lámina editorial de 4 fotos), `Origenes` (mapa con marcadores `<button>` accesibles; panel con los cafés de la región y enlace a `/productos?origen=`), `Variedades` (bandas con muestra de trama en el color de la variedad), `Cierre`.
- `pages/productos/`: `Productos` + `Filtros` (panel presentacional) + `catalogo.ts` (lógica pura: filtros ↔ URL, orden, búsqueda sin tildes). Estado en la URL: `?q=&variedad=&presentacion=&origen=&disponibles=1&orden=` (solo valores distintos del predeterminado). El estado vive en un signal; los cambios del panel se animan con `conTransicion` y luego se escriben en la URL (`replaceUrl`); los cambios externos (navbar, enlaces, recarga) llegan por `queryParamMap`. Con orden "Destacados", sin filtros, en ≥1200 px y con un número de resultados múltiplo de 3, el primer café ocupa un bloque 2×2. En móvil los filtros van en una hoja `<dialog>` con buscador y contador de filtros activos.
- `pages/login`, `pages/registro`: formularios reactivos; al enviar válido muestran "… estará disponible próximamente." y **no** llaman a la API.
- `shared/`: `Navbar` (enlaces con estado activo; el buscador lleva a `/productos?q=` y en Productos filtra mientras se escribe), `Footer`, `Logo`, `TarjetaCafe` (variantes `normal`/`destacada`/`horizontal`; "Quedan N" si stock ≤ 5, "Agotado"; precio `currency:'COP':'symbol-narrow':'1.0-0':'es-CO'`), `VistaRapida` (`<dialog>` modal: panel lateral en escritorio, hoja inferior en móvil; datos de `GET /api/cafes/{id}`; cierre con X, Escape y clic fuera), `SelectorCantidad`, `EstadoError` (error con "Reintentar"), `PanelMarca` (foto `acceso` a sangre), directivas `Revelar` y `AtraparFoco` (Tab cíclico dentro de los `<dialog>`).
- `src/environments/`: `apiBaseUrl` (`http://localhost:5031/api` en desarrollo; vacío en producción, se configura al desplegar) y `cloudinaryBase`.

**Comandos (desde `frontend/`):**

```powershell
npm install
npx playwright install chromium   # una vez, para las e2e
npm start                          # ng serve → http://localhost:4200 (la API debe estar en :5031)
npx ng build                       # 0 advertencias
npx ng test --watch=false          # Vitest
npm run e2e                        # Playwright (necesita la API con los 6 productos; arranca ng serve si no está)
```

Si se cambia `angular.json` (estilos, fuentes), **reinicia `ng serve`**: no recarga ese archivo en caliente.

e2e en `frontend/e2e/altura.e2e.ts` (16 pruebas; extensión `.e2e.ts` para no mezclarse con Vitest): Inicio con 3 destacados e imágenes de Cloudinary; Inicio ↔ Productos; filtros, orden y búsqueda (incluida "narino" sin tilde) con la URL; recarga que conserva filtros; vista rápida (datos, Escape, X, clic fuera, foco dentro); mapa → productos filtrados; usuario → login → registro → login; validaciones sin peticiones a la API; API caída con "Reintentar"; capturas a 1440 y 375 px. La fixture `consola` hace fallar cualquier prueba con errores de consola. Capturas en `frontend/e2e/capturas/` (ignorada por Git).

## Skills usadas en el rediseño y cómo

| Skill | Uso |
|---|---|
| design-taste-frontend | Lectura del brief, ajustes (variación 7, movimiento 4, densidad 3) y lista de patrones a evitar (eyebrows, 3 cards iguales, em-dash, CTA duplicadas). |
| impeccable | *Shape* de cada vista antes de codificar, *craft floor* durante la construcción y *audit* + *polish* al final (axe-core: 0 violaciones; objetivos táctiles ≥ 44 px; sin desbordamiento). **Sin** ejecutar su lanzador/binario ni sus hooks (decisión aprobada): se leyeron sus guías directamente. |
| emil-design-eng | Curvas y duraciones de movimiento, `scale(.97)` al pulsar, hover solo con puntero fino, paneles con curva de cajón, `@starting-style`, movimiento reducido sin desplazamientos. |
| frontend-design / angular-developer | Implementación en Angular 22 (standalone, signals, `@if`/`@for`, `rxResource`, `@Service()`, `input()`/`output()`/`model()`). |
| canvas-design | Set 2 de imágenes de producto (bolsa kraft con grabado de la región). |
| webapp-testing | Reconocimiento con capturas y revisión de consola; las pruebas se escribieron con `@playwright/test` (npm), como pide el proyecto, en lugar de los scripts en Python de la skill. |

Contradicciones resueltas a favor del brief: design-taste-frontend e impeccable desaconsejan Fraunces y la paleta crema/terracota/espresso (fijadas por la marca); design-taste-frontend presupone React/Tailwind/Motion y Phosphor (se usó Angular, Bootstrap, CSS/View Transitions y Bootstrap Icons) y exige modo oscuro (se mantuvo solo claro); impeccable considera `feTurbulence` "amateur" (el brief pide textura de papel y kraft) y pide detenerse tras cada *shape* (el plan ya estaba aprobado).

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
| Imágenes en SVG → PNG con Chromium | SVG editable como fuente; PNG con las fuentes reales (Fraunces/Inter) para Cloudinary. |
| Reactive Forms (no Signal Forms) | Lo pidió el taller, aunque Angular 22 recomienda Signal Forms para formularios nuevos. |
| `rxResource` para los GET (Inicio, Productos, vista rápida) | Estados de carga/error/valor como signals y `reload()` para "Reintentar". |
| `<img loading="lazy">` en vez de `NgOptimizedImage` | La optimización ya la hace Cloudinary (`f_auto,q_auto,w_600`); evita avisos de tamaño de `NgOptimizedImage` en consola. |
| Registro del locale `es-CO` en `TarjetaCafe` | El componente que formatea el precio es autosuficiente (también en pruebas). |
| Budget inicial de advertencia 700 kB (antes 500 kB) | Bootstrap completo + Bootstrap Icons suman ~330 kB de CSS sin comprimir; transferencia real ~110 kB. |
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

## Problemas conocidos y pendientes

- **Carrito pendiente**: `Cart`, `CartItem`, `ICartRepository`/`CartRepository` (lanza `NotImplementedException`) y los DTOs de carrito existen pero no están en el DbContext ni registrados en DI.
- **Usuarios pendientes**: `Usuario` e `IUserRepository`/`UserRepository` (ADO.NET contra `public.users`) no están registrados. El login usa **dos cuentas fijas en `AuthController`**; Google Login no persiste usuarios.
- **Rotar `Jwt:Key`**: dos claves antiguas quedaron en el historial de Git, una en `appsettings.json` (de `6829fba` a `4676745`) y otra en `appsettings.Development.json`, que se subió en `6829fba` y se borró en `a28795a`. Ese archivo también contenía el `Google:ClientId`, que es público. No se reescribió el historial porque el repo es privado. Ninguna de las dos claves está en uso: cada integrante debe generar la suya. Las credenciales de Cloudinary y la contraseña de PostgreSQL nunca se subieron (revisión del 2026-09-30).
- `POST /api/cafes` permite a cualquier usuario autenticado (también rol Cliente) crear cafés: se conservó el permiso original.
- `imagenPublicId` lo envía el cliente y no se valida contra Cloudinary: un publicId ajeno se borraría al eliminar/reemplazar el café. Si una creación de café falla (400/409) después de subir la imagen, esa imagen queda huérfana en Cloudinary.
- Los títulos de los 400 automáticos de validación salen en inglés ("One or more validation errors occurred."); los mensajes de cada campo sí están en español.
- El diagnóstico de arranque de `Program.cs` muestra "PostgreSQL (Supabase)" para cualquier cadena con el puerto 5432, también en local.
- `__EFMigrationsHistory` conserva su nombre original (la convención snake_case no lo cambia).
- **Frontend: autenticación real pendiente**. Login y Registro son solo visuales; no hay JWT, guards, interceptores ni sesión en el frontend. "Agregar al carrito" está deshabilitado ("Próximamente").
- El frontend asume `ng serve` en el puerto 4200: es el único origen permitido por CORS en `Program.cs`. Otro puerto requiere cambiar el backend.
- `environment.ts` (producción) tiene `apiBaseUrl` vacío: configúralo antes de desplegar.
- Con la API apagada, el navegador registra 2 errores de red ("Failed to load resource") en consola; son inevitables y la app los maneja mostrando "Reintentar".
- Las e2e dependen de los datos del seed (6 cafés, Sierra Nevada agotado, Tierradentro con 5 unidades); si cambian, ajusta `frontend/e2e/altura.e2e.ts`.
- Problemas encontrados en el rediseño: (1) la primera foto elegida para el acceso era de cacao, no de café (se reemplazó); (2) la firma de Cloudinary fallaba en PowerShell 5.1 por usar la hora local; (3) `ng serve` debe reiniciarse al cambiar `angular.json`; (4) el router de Angular registra como error de consola las transiciones omitidas en modo desarrollo; (5) la foto del hero estiraba la fila de la grilla (se sacó del flujo con `position: absolute`).
- La textura de grano es una capa fija: en capturas de página completa solo cubre el primer alto de ventana (en el navegador cubre siempre la pantalla).
- Problemas encontrados en este taller: (1) `dotnet new tool-manifest` en .NET 10 crea el manifiesto en la raíz, no en `.config/` (se movió a mano); (2) `curl` desde Git Bash rompe las tildes si el JSON va como argumento; (3) PowerShell 5.1 necesita el `.ps1` con BOM y el cuerpo en bytes UTF-8; (4) `rxResource` deja pendiente `whenStable()` en pruebas unitarias si no se simulan los servicios.
