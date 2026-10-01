# ☕ Altura · CafeApi

E-commerce de café de especialidad colombiano **Altura**:

- **backend/**: API REST en ASP.NET Core 10 con Entity Framework Core, PostgreSQL y Cloudinary para las imágenes.
- **frontend/**: aplicación Angular 22 (`altura-web`) con el catálogo de cafés y las vistas de inicio de sesión y registro.

---

## 📁 Estructura

```text
CafeApi
├── backend/                  API .NET (Controllers, Data, DTOs, Repositories, Services, ...)
│   ├── .config/              dotnet-ef como herramienta local
│   ├── seed/                 Script e imágenes de los productos de ejemplo
│   └── appsettings.example.json
├── frontend/                 Aplicación Angular (src/, e2e/)
├── CLAUDE.md                 Guía técnica detallada (arquitectura, decisiones, pendientes)
├── README.md
└── CHANGELOG.md
```

---

## 💻 Cómo levantar el proyecto en local (paso a paso)

### Requisitos

| Herramienta | Versión |
|---|---|
| .NET SDK | 10 |
| PostgreSQL | 17, corriendo en `localhost:5432` |
| Node.js / npm | 24 / 11 |
| Angular CLI (opcional, se usa con `npx`) | 22 |
| Cuenta de Cloudinary | para subir las imágenes de producto |

### 1. Clonar el repositorio

```powershell
git clone https://github.com/pablorja/CafeApi.git
cd CafeApi
```

### 2. Configurar el backend

Toda la configuración local va en **`backend/appsettings.Development.json`**. Ese archivo está en `.gitignore` y **nunca se sube a Git**. No se usan User Secrets: si alguna vez guardaste algo ahí, bórralo desde `backend/` con `dotnet user-secrets clear`, porque tendría prioridad sobre este archivo.

```powershell
cd backend
Copy-Item appsettings.example.json appsettings.Development.json
```

Abre `appsettings.Development.json` y rellena:

| Clave | Qué poner |
|---|---|
| `ConnectionStrings:CafeDatabase` | `Host=localhost;Port=5432;Database=cafeapi_dev;Username=postgres;Password=TU_CONTRASEÑA` |
| `Google:ClientId` | Client ID de Google del proyecto |
| `Jwt:Key` | Clave aleatoria de 32 bytes en Base64 (ver abajo) |
| `Jwt:Issuer` / `Jwt:Audience` / `Jwt:ExpiresInMinutes` | `CafeApi` / `CafeApiUsers` / `60` |
| `CloudinarySettings:CloudName` / `ApiKey` / `ApiSecret` | Credenciales de tu cuenta de Cloudinary |

Para generar la `Jwt:Key` en PowerShell:

```powershell
$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
```

### 3. Crear la base de datos

Las **migraciones de EF Core son la fuente de verdad del esquema**. Desde `backend/`:

```powershell
dotnet tool restore
dotnet ef database update
```

Esto crea la base `cafeapi_dev` (si no existe), las tablas y las variedades iniciales (Castillo, Geisha y Moka).

### 4. Ejecutar la API

Desde `backend/`:

```powershell
dotnet run --launch-profile http
```

- API: http://localhost:5031
- Swagger: http://localhost:5031/swagger (botón **Authorize**: pega solo el token)

Deja esta terminal abierta.

### 5. Cargar los productos de ejemplo

Con la API corriendo, abre **otra terminal** y, desde `backend/`:

```powershell
powershell -ExecutionPolicy Bypass -File .\seed\seed-productos.ps1
```

El script pide el correo y la contraseña de la cuenta **Administrador**. Después sube las 6 imágenes de `seed/imagenes/` a Cloudinary y crea los 6 cafés de ejemplo. Es idempotente: si un café ya existe, lo omite sin subir su imagen, así que puedes ejecutarlo varias veces. Para usar otra URL de la API: `-ApiBaseUrl http://localhost:5031/api`.

Comprueba el resultado en http://localhost:5031/api/cafes: deben aparecer 6 cafés con imágenes de `res.cloudinary.com`.

### 6. Ejecutar el frontend

En otra terminal, desde `frontend/`:

```powershell
cd frontend
npm install
npm start
```

Abre http://localhost:4200. El frontend debe correr en el puerto **4200**, porque es el origen que permite el CORS de la API.

### 7. Pruebas (opcional)

Desde `frontend/`, con la API corriendo y los productos cargados:

```powershell
npx ng test --watch=false          # pruebas unitarias (Vitest)
npx playwright install chromium    # solo la primera vez
npm run e2e                        # pruebas end-to-end (Playwright)
```

Las capturas de las e2e quedan en `frontend/e2e/capturas/` (ignorada por Git).

---

## 🖥️ Frontend

| Ruta | Vista |
|---|---|
| `/` | Home: navbar con buscador, banner y catálogo "Nuestros cafés" con filtros por variedad |
| `/login` | Iniciar sesión (solo visual) |
| `/registro` | Crear cuenta (solo visual) |

- Los productos y las variedades vienen de la API (`GET /api/cafes` y `GET /api/variedades`).
- El buscador filtra por nombre, origen o variedad, sin importar tildes ni mayúsculas.
- Los precios se muestran en pesos colombianos (`$ 42.000`) y la disponibilidad como "24 disponibles" o "Agotado".
- Login y Registro validan los campos, pero **todavía no llaman a la API**: al enviar muestran "… estará disponible próximamente."
- Stack: Angular 22 (componentes standalone, signals, `@if`/`@for`), Bootstrap 5 (solo CSS), Bootstrap Icons y las fuentes Fraunces e Inter vía npm.

---

## ✅ Endpoints de la API

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

`backend/CafeApi.http` tiene peticiones de ejemplo: primero el login y luego el resto, reutilizando el token.

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

### Estado de stock

| Stock | Estado |
|---|---|
| 0 | Agotado |
| 1 - 10 | Pocas unidades |
| 11 - 50 | Disponible |
| 51+ | Alta disponibilidad |

---

## 🔐 Seguridad

La API usa JSON Web Tokens (JWT) para proteger los endpoints que modifican datos.

- **Administrador:** crear, actualizar y eliminar cafés y variedades; subir imágenes.
- **Cliente:** consultar cafés, variedades y presentaciones; crear cafés.
- `401 Unauthorized`: petición sin token o con token inválido. `403 Forbidden`: token válido sin el rol necesario.

---

## 🖼️ Gestión de imágenes

Las imágenes se guardan en Cloudinary, en la carpeta `cafes`:

```text
POST /api/images  (Base64 con o sin prefijo data URI; jpg, png o webp; máx. 5 MB)
      ↓
{ imageUrl, publicId }
      ↓
POST /api/cafes o PUT /api/cafes/{id}  (imagenUrl + imagenPublicId)
```

- Si un `PUT` cambia la imagen, la anterior se borra de Cloudinary.
- Al eliminar un café, también se borra su imagen.
- El frontend pide las imágenes optimizadas (`f_auto,q_auto,w_600`).

---

## Manejo de errores y logging

- Las excepciones no controladas devuelven un JSON uniforme sin detalles internos: `{ "success": false, "message": "Ha ocurrido un error inesperado. Intenta de nuevo más tarde." }`. El detalle queda solo en el log.
- La API registra con `ILogger` las operaciones sobre cafés, los duplicados, los recursos inexistentes y la subida y borrado de imágenes.

---

## 🚧 Próximos Pasos

- Autenticación real en el frontend (login, registro y sesión)
- Detalle de producto
- Carrito de compras y pedidos
- Rotación de `Jwt:Key`
- Deploy

---

## 👨‍💻 Autor

Pablo Santamaría
