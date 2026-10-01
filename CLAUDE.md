# CLAUDE.md — CafeApi

Guía para trabajar en este repositorio. **Mantenla actualizada** cuando cambie la arquitectura, el modelo, los endpoints o la configuración.

## Descripción

API REST de un e-commerce de café (proyecto universitario en grupo). Gestiona el catálogo de cafés, sus variedades y presentaciones, y las imágenes de producto en Cloudinary. El frontend en Angular (`http://localhost:4200`) se desarrollará aparte.

Repositorio: https://github.com/pablorja/CafeApi

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

## Arquitectura

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

La configuración local va en **`appsettings.Development.json`** (en la raíz, **ignorado por Git**). **No se usan User Secrets**: tienen prioridad sobre `appsettings.Development.json` y causaban confusión (el `UserSecretsId` sigue en el `.csproj` pero debe quedar vacío; si hace falta: `dotnet user-secrets clear`).

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

## Comandos

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

## Problemas conocidos y pendientes

- **Carrito pendiente**: `Cart`, `CartItem`, `ICartRepository`/`CartRepository` (lanza `NotImplementedException`) y los DTOs de carrito existen pero no están en el DbContext ni registrados en DI.
- **Usuarios pendientes**: `Usuario` e `IUserRepository`/`UserRepository` (ADO.NET contra `public.users`) no están registrados. El login usa **dos cuentas fijas en `AuthController`**; Google Login no persiste usuarios.
- **Rotar `Jwt:Key`**: una clave antigua quedó en el historial de Git (`appsettings.example.json` y el commit `6829fba`). Cada integrante debe usar una clave nueva; el valor del repo ya no es válido.
- `POST /api/cafes` permite a cualquier usuario autenticado (también rol Cliente) crear cafés: se conservó el permiso original.
- `imagenPublicId` lo envía el cliente y no se valida contra Cloudinary: un publicId ajeno se borraría al eliminar/reemplazar el café. Si una creación de café falla (400/409) después de subir la imagen, esa imagen queda huérfana en Cloudinary.
- Los títulos de los 400 automáticos de validación salen en inglés ("One or more validation errors occurred."); los mensajes de cada campo sí están en español.
- El diagnóstico de arranque de `Program.cs` muestra "PostgreSQL (Supabase)" para cualquier cadena con el puerto 5432, también en local.
- `__EFMigrationsHistory` conserva su nombre original (la convención snake_case no lo cambia).
- **Frontend Angular**: siguiente tarea (CORS ya permite `http://localhost:4200`).
