# ☕ CafeApi

API REST desarrollada con ASP.NET Core 10 para el e-commerce de café: catálogo de cafés, variedades, presentaciones e imágenes de producto.

## 🚀 Descripción

CafeApi sigue una arquitectura en capas **Controllers → Interfaces → Repositories → AppDbContext (Entity Framework Core)** sobre PostgreSQL. Las imágenes de los productos se almacenan en Cloudinary y la base de datos solo guarda su URL y su `publicId`.

---

## 🛠 Tecnologías Utilizadas

### Backend

- ASP.NET Core 10 (C#)
- REST API con controladores
- JWT Authentication + roles
- Login con Google

### Datos

- PostgreSQL 17 (local)
- Entity Framework Core 10 + Npgsql
- Migraciones de EF Core (nombres en snake_case)

### Servicios

- Cloudinary (imágenes)

### Herramientas

- Visual Studio / VS Code
- Git / GitHub
- Postman / archivo `CafeApi.http`
- Swagger UI

---

## 📁 Estructura del Proyecto

```text
CafeApi
├── .config/                  dotnet-tools.json (dotnet-ef local)
├── Configurations/           CloudinarySettings
├── Controllers/              Auth, Cafes, Variedades, Presentaciones, Images
├── Data/
│   ├── AppDbContext.cs
│   ├── Configurations/       Fluent API (una clase por entidad)
│   └── Migrations/           Fuente de verdad del esquema
├── DTOs/
├── Interfaces/
├── Middleware/               ExceptionMiddleware
├── Models/
├── Repositories/
├── Services/                 CloudinaryService
├── Program.cs
├── appsettings.json
├── appsettings.example.json  Plantilla de configuración local
├── CafeApi.http
├── CLAUDE.md
├── README.md
└── CHANGELOG.md
```

---

## 💻 Cómo levantarlo en local

### Requisitos

- .NET SDK 10
- PostgreSQL 17 corriendo en `localhost:5432`
- Una cuenta de Cloudinary (para subir imágenes)

### 1. Configuración local

La configuración local va en **`appsettings.Development.json`**, en la raíz del proyecto. Ese archivo está en `.gitignore` y **nunca se sube a Git**. No se usan User Secrets: si alguna vez guardaste algo ahí, bórralo con `dotnet user-secrets clear`, porque tendría prioridad sobre este archivo.

Copia la plantilla y rellena los valores:

```powershell
Copy-Item appsettings.example.json appsettings.Development.json
```

| Clave | Qué poner |
|---|---|
| `ConnectionStrings:CafeDatabase` | `Host=localhost;Port=5432;Database=cafeapi_dev;Username=postgres;Password=TU_CONTRASEÑA` |
| `Google:ClientId` | Client ID de Google del proyecto |
| `Jwt:Key` | Clave aleatoria de 32 bytes en Base64 (ver abajo) |
| `Jwt:Issuer` / `Jwt:Audience` / `Jwt:ExpiresInMinutes` | `CafeApi` / `CafeApiUsers` / `60` |
| `CloudinarySettings:CloudName` / `ApiKey` / `ApiSecret` | Credenciales de tu cuenta de Cloudinary |

Generar la `Jwt:Key` en PowerShell:

```powershell
$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
```

### 2. Base de datos

Las **migraciones de EF Core son la fuente de verdad del esquema** (ya no existe `database/schema.sql`). Este comando crea la base `cafeapi_dev` si no existe y aplica las migraciones, incluidas las variedades iniciales:

```powershell
dotnet tool restore
dotnet ef database update
```

### 3. Ejecutar

```powershell
dotnet run --launch-profile http
```

- API: http://localhost:5031
- Swagger: http://localhost:5031/swagger (usa el botón **Authorize** y pega solo el token)
- OpenAPI JSON: http://localhost:5031/openapi/v1.json

El archivo `CafeApi.http` tiene peticiones de ejemplo: primero el login y luego el resto, reutilizando el token.

---

## ✅ Endpoints

| Método | Ruta | Permiso |
|---|---|---|
| POST | `/api/auth/login` | Público |
| POST | `/api/auth/google` | Público |
| GET | `/api/cafes` | Público |
| GET | `/api/cafes/{id}` | Público |
| POST | `/api/cafes` | Usuario autenticado |
| PUT | `/api/cafes/{id}` | Administrador |
| DELETE | `/api/cafes/{id}` | Administrador |
| GET | `/api/variedades` | Público |
| GET | `/api/variedades/{id}` | Público |
| POST | `/api/variedades` | Administrador |
| PUT | `/api/variedades/{id}` | Administrador |
| DELETE | `/api/variedades/{id}` | Administrador (409 si tiene cafés) |
| GET | `/api/presentaciones` | Público |
| POST | `/api/images` | Administrador |

---

## 🗄️ Modelo de Datos

### variedades

- `id`, `nombre` (obligatorio, único, máx. 100), `descripcion` (opcional).
- Variedades iniciales: Castillo, Geisha, Moka.

### cafes

- `id`, `nombre` (máx. 100), `variedad_id` (FK, `ON DELETE RESTRICT`), `presentacion_gramos` (340 o 500), `origen` (máx. 100), `stock` (≥ 0), `precio` (`numeric(12,0)`, > 0, pesos colombianos sin decimales), `imagen_url`, `imagen_public_id`, `created_at`, `updated_at` (UTC).
- No puede haber dos cafés con el mismo nombre (sin importar mayúsculas), variedad y presentación: la API responde **409**.

### Presentaciones

Enum en código (no es una tabla): `340 g` y `500 g`. `GET /api/presentaciones` devuelve:

```json
[{ "value": 340, "label": "340 g" }, { "value": 500, "label": "500 g" }]
```

---

## 🔐 Seguridad

La API usa JSON Web Tokens (JWT) para proteger los endpoints que modifican datos.

### Roles

#### Administrador

- Crear, actualizar y eliminar cafés
- Crear, actualizar y eliminar variedades
- Subir imágenes

#### Cliente

- Consultar cafés, variedades y presentaciones
- Crear cafés
- No puede actualizar ni eliminar cafés

### Códigos de respuesta

- `401 Unauthorized`: petición sin token o con token inválido.
- `403 Forbidden`: token válido pero sin el rol necesario.

---

## DTOs y Validaciones

La API separa los contratos de entrada y salida de las entidades. Las validaciones usan DataAnnotations con mensajes en español.

### CreateCafeDto / UpdateCafeDto

- `nombre`: obligatorio, máximo 100 caracteres.
- `variedadId`: obligatorio y debe existir (si no, 400).
- `presentacionGramos`: 340 o 500 (otro valor, 400).
- `origen`: obligatorio, máximo 100 caracteres.
- `stock`: mayor o igual a cero.
- `precio`: mayor que cero y sin decimales.
- `imagenUrl` (máx. 500) e `imagenPublicId` (máx. 255): opcionales.

### CafeResponseDto

`id`, `nombre`, `variedadId`, `variedadNombre`, `presentacionGramos`, `origen`, `stock`, `precio`, `imagenUrl`, `imagenPublicId`, `disponible` y `estadoStock`. `POST` y `PUT` también devuelven este DTO.

### Estado de Stock

| Stock | Estado |
|---------|---------|
| 0 | Agotado |
| 1 - 10 | Pocas unidades |
| 11 - 50 | Disponible |
| 51+ | Alta disponibilidad |

### DTOs de Autenticación

`LoginRequestDto`:

```json
{
  "email": "admin@cafeapi.com",
  "password": "TU_CONTRASEÑA"
}
```

`LoginResponseDto`:

```json
{
  "token": "jwt",
  "email": "admin@cafeapi.com",
  "role": "Administrador"
}
```

---

## 🖼️ Gestión de imágenes

CafeApi usa Cloudinary para almacenar las imágenes, en la carpeta `cafes`.

Flujo:

```text
Cliente
↓
POST /api/images            (Base64 con o sin prefijo data URI; jpg, png o webp; máx. 5 MB)
↓
{ imageUrl, publicId }
↓
POST /api/cafes o PUT /api/cafes/{id}   (imagenUrl + imagenPublicId)
```

- Si un `PUT` cambia la imagen, la anterior se borra de Cloudinary.
- Al eliminar un café, también se borra su imagen.
- Si Cloudinary falla al borrar, el error queda en el log pero la operación no falla.

---

## Manejo Global de Errores

Las excepciones no controladas se interceptan con un middleware global. La respuesta es un JSON uniforme sin detalles internos; el detalle queda solo en el log:

```json
{
  "success": false,
  "message": "Ha ocurrido un error inesperado. Intenta de nuevo más tarde."
}
```

---

## Logging y Auditoría

La API registra eventos mediante `ILogger`:

- Consultas, creación, actualización y eliminación de cafés.
- Recursos inexistentes y duplicados.
- Subida y borrado de imágenes en Cloudinary (incluidos los errores de borrado).
- Excepciones capturadas por el middleware global.

---

## Dominio Ecommerce (pendiente)

Las entidades `Usuario`, `Cart` y `CartItem`, y los DTOs de carrito, ya existen como base del e-commerce, pero **aún no están en la base de datos ni expuestos en la API**. El carrito se implementará más adelante sobre EF Core, usando la tabla `public.users` (en Supabase, la tabla `auth.users` quedaba reservada a su autenticación interna).

---

## 🚧 Próximos Pasos

- Carrito de compras y pedidos
- Persistencia de usuarios (login con cuentas reales)
- Rotación de `Jwt:Key`
- Frontend en Angular
- Deploy

---

## 👨‍💻 Autor

Pablo Santamaría
