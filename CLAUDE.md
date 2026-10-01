# CLAUDE.md — CafeApi

Guía para trabajar en este repositorio. **Mantenla actualizada** cuando cambie la arquitectura, el modelo, los endpoints o la configuración.

## Descripción

E-commerce de café de especialidad **Altura** (proyecto universitario en grupo):

- **backend/**: API REST en ASP.NET Core 10 + EF Core + PostgreSQL. Gestiona el catálogo de cafés, sus variedades y presentaciones, y las imágenes de producto en Cloudinary.
- **frontend/**: aplicación Angular 22 (`altura-web`). Home con el catálogo desde la API y vistas visuales de Login y Registro (sin autenticación real todavía).

Repositorio: https://github.com/pablorja/CafeApi

## Estructura del repositorio

```
CafeApi/
├── backend/                 Proyecto .NET (CafeApi.sln, CafeApi.csproj, Program.cs, Controllers/, Data/, DTOs/,
│   │                        Interfaces/, Middleware/, Models/, Repositories/, Services/, Configurations/,
│   │                        Properties/, CafeApi.http, appsettings*.json)
│   ├── .config/             Manifiesto de dotnet-ef (herramienta local)
│   └── seed/                Productos de ejemplo: seed-productos.ps1 + imagenes/ (SVG fuente, PNG, DISENO.md)
├── frontend/                Proyecto Angular altura-web (package.json, angular.json, src/, e2e/, playwright.config.ts)
├── .gitignore               Reglas de .NET, Node/Angular y Playwright
├── CLAUDE.md                Esta guía
├── README.md                Puesta en marcha paso a paso
└── CHANGELOG.md
```

Los comandos de .NET se ejecutan **desde `backend/`** y los de Node/Angular **desde `frontend/`**. `frontend/CLAUDE.md` lo generó Angular CLI (`--ai-config=claude-code`) con buenas prácticas de Angular 22; complementa esta guía.

## Marca y paleta

Marca **Altura**, subtítulo "Café de especialidad colombiano". Motivo visual: **curvas de nivel** (altitud), presentes en las bolsas, el banner y el panel de login.

| Token | Hex | Uso |
|---|---|---|
| crema | `#F6F1E9` | Fondo de página; fondo de las imágenes de producto |
| papel | `#FBF8F3` | Superficies: cards, catálogo, formularios |
| espresso | `#2B1D14` | Texto, footer, panel de login, chip activo |
| café | `#6B4226` | Texto secundario; bolsas Castillo |
| terracota | `#B5562F` | Botones y acentos (solo como **relleno**); bolsas Moka |
| terracota texto | `#97441F` | Enlaces y texto terracota (contraste AA 5.9 sobre crema) |
| verde hoja | `#3F5A40` | Disponibilidad; bolsas Geisha |

Tipografías (vía npm, @fontsource): **Fraunces** (títulos, precios, marca) e **Inter** (texto). Contraste verificado: terracota sobre crema da 4.31 (no apto para texto normal), por eso existe `--alt-terracota-texto`.

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

Imágenes: `backend/seed/imagenes/NN-nombre-gramos.{svg,png}` (1200×1200). Una plantilla SVG de bolsa stand-up con válvula sobre fondo crema; color por variedad (Castillo café, Geisha verde hoja, Moka terracota); las de 500 g son un 18 % más grandes sobre el mismo suelo. Los SVG nombran las fuentes Fraunces/Inter por familia (sin ellas instaladas se ven con la fuente de respaldo); los PNG se exportaron con Chromium (Playwright) cargando las fuentes de @fontsource. Filosofía visual en `DISENO.md`.

## Frontend (`frontend/`, proyecto `altura-web`)

| Componente | Versión |
|---|---|
| Angular (core, router, forms, common) / Angular CLI | 22.2.x / 22.1.8 |
| TypeScript | ~6.0 |
| Bootstrap (solo CSS, sin JS) | 5.3.8 |
| Bootstrap Icons | 1.13.1 |
| @fontsource/fraunces · @fontsource/inter | 5.3.0 |
| Vitest (unitarias, `ng test`) | 4.x |
| @playwright/test (e2e) | 1.63.0 |
| Node / npm | 24.20 / 11.19 |

**Rutas** (`src/app/app.routes.ts`, carga diferida):

| Ruta | Vista | Título de pestaña |
|---|---|---|
| `''` | Home | Altura \| Café de especialidad |
| `login` | Login (visual) | Iniciar sesión \| Altura |
| `registro` | Registro (visual) | Crear cuenta \| Altura |
| `**` | redirige a `''` | — |

**Estructura de `src/app/`:**

- `core/models/`: `Cafe` (idéntico a `CafeResponseDto`) y `Variedad` (idéntico a `VariedadResponseDto`). Si cambia un DTO del backend, actualiza estos modelos.
- `core/services/`: `Cafes` y `Variedades` (`HttpClient`, `GET`), `Busqueda` (signal con el texto del buscador del navbar). Usan `@Service()` (Angular 22).
- `core/utils/`: `optimizarImagenCloudinary` (inserta `f_auto,q_auto,w_600` tras `/upload/`), `normalizarTexto` (búsqueda sin tildes), `PATRON_CORREO` y `camposCoinciden`.
- `pages/`: `Home` (banner + catálogo con `rxResource`, chips de variedad, búsqueda, estados de carga/error/vacío), `Login`, `Registro` (formularios reactivos; al enviar válido muestran "… estará disponible próximamente." y **no** llaman a la API).
- `shared/`: `Navbar` (menú móvil con signal, buscador, ícono de usuario → `/login`), `Footer`, `Logo`, `TarjetaCafe` (precio `currency:'COP':'symbol-narrow':'1.0-0':'es-CO'`), `PanelMarca` (panel izquierdo de login/registro), `IlustracionBolsas` (SVG en línea).
- Estilos globales en `src/styles.css`: tokens `--alt-*`, sobrescritura de variables `--bs-*` de Bootstrap y layout compartido `.auth-*` de login/registro.
- `src/environments/`: `environment.development.ts` → `apiBaseUrl: 'http://localhost:5031/api'`; `environment.ts` (producción) → vacío, se configura en el despliegue.

**Comandos (desde `frontend/`):**

```powershell
npm install
npx playwright install chromium   # una vez, para las e2e
npm start                          # ng serve → http://localhost:4200 (la API debe estar en :5031)
npx ng build                       # 0 advertencias
npx ng test --watch=false          # Vitest
npm run e2e                        # Playwright (necesita la API con los 6 productos; arranca ng serve si no está)
```

e2e en `frontend/e2e/altura.e2e.ts` (extensión `.e2e.ts` para no mezclarse con Vitest). La fixture `consola` hace fallar cualquier prueba con errores de consola o excepciones; la prueba de "API caída" corta `/api` con `page.route` y solo admite los errores de red esperados. Capturas en `frontend/e2e/capturas/` (ignorada por Git).

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
| `rxResource` para los GET del Home | Estados de carga/error/valor como signals y `reload()` para "Reintentar". |
| `<img loading="lazy">` en vez de `NgOptimizedImage` | La optimización ya la hace Cloudinary (`f_auto,q_auto,w_600`); evita avisos de tamaño de `NgOptimizedImage` en consola. |
| Registro del locale `es-CO` en `TarjetaCafe` | El componente que formatea el precio es autosuficiente (también en pruebas). |
| Budget inicial de advertencia 700 kB (antes 500 kB) | Bootstrap completo + Bootstrap Icons suman ~330 kB de CSS sin comprimir; transferencia real ~110 kB. |
| Grilla de 3/2/1 columnas | 6 productos quedan en 3+3 en escritorio. |
| Prueba "API caída" con `page.route` | Suite autocontenida; se verificó también apagando la API real. |

## Problemas conocidos y pendientes

- **Carrito pendiente**: `Cart`, `CartItem`, `ICartRepository`/`CartRepository` (lanza `NotImplementedException`) y los DTOs de carrito existen pero no están en el DbContext ni registrados en DI.
- **Usuarios pendientes**: `Usuario` e `IUserRepository`/`UserRepository` (ADO.NET contra `public.users`) no están registrados. El login usa **dos cuentas fijas en `AuthController`**; Google Login no persiste usuarios.
- **Rotar `Jwt:Key`**: una clave antigua quedó en el historial de Git (`appsettings.example.json` y el commit `6829fba`). Cada integrante debe usar una clave nueva; el valor del repo ya no es válido.
- `POST /api/cafes` permite a cualquier usuario autenticado (también rol Cliente) crear cafés: se conservó el permiso original.
- `imagenPublicId` lo envía el cliente y no se valida contra Cloudinary: un publicId ajeno se borraría al eliminar/reemplazar el café. Si una creación de café falla (400/409) después de subir la imagen, esa imagen queda huérfana en Cloudinary.
- Los títulos de los 400 automáticos de validación salen en inglés ("One or more validation errors occurred."); los mensajes de cada campo sí están en español.
- El diagnóstico de arranque de `Program.cs` muestra "PostgreSQL (Supabase)" para cualquier cadena con el puerto 5432, también en local.
- `__EFMigrationsHistory` conserva su nombre original (la convención snake_case no lo cambia).
- **Frontend: autenticación real pendiente**. Login y Registro son solo visuales; no hay JWT, guards, interceptores ni sesión en el frontend. "Ver producto" no navega.
- El frontend asume `ng serve` en el puerto 4200: es el único origen permitido por CORS en `Program.cs`. Otro puerto requiere cambiar el backend.
- `environment.ts` (producción) tiene `apiBaseUrl` vacío: configúralo antes de desplegar.
- Con la API apagada, el navegador registra 2 errores de red ("Failed to load resource") en consola; son inevitables y la app los maneja mostrando "Reintentar".
- Las e2e dependen de los datos del seed (6 cafés, Sierra Nevada agotado); si cambian, ajusta `frontend/e2e/altura.e2e.ts`.
- Problemas encontrados en este taller: (1) `dotnet new tool-manifest` en .NET 10 crea el manifiesto en la raíz, no en `.config/` (se movió a mano); (2) `curl` desde Git Bash rompe las tildes si el JSON va como argumento; (3) PowerShell 5.1 necesita el `.ps1` con BOM y el cuerpo en bytes UTF-8; (4) `rxResource` deja pendiente `whenStable()` en pruebas unitarias si no se simulan los servicios.
