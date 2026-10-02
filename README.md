# ☕ Altura · CafeApi

E-commerce de café de especialidad colombiano **Altura**:

- **backend/**: API REST en ASP.NET Core 10 con Entity Framework Core, PostgreSQL y Cloudinary para las imágenes.
- **frontend/**: aplicación Angular 22 (`altura-web`), concepto **"Ascenso"**: el Inicio es subir la montaña (con un altímetro), catálogo de cafés con filtros y vista rápida, inicio de sesión y registro (visuales) y un **panel de administración** de inventario en `/admin`.

Repositorio: https://github.com/davidardila0607/altura-cafe-ecommerce (rama principal: `main`).

---

## 🚀 Inicio rápido (si acabas de clonar el repo)

**Stack:** ASP.NET Core 10 · EF Core 10 + PostgreSQL 17 (Npgsql) · JWT · Cloudinary · Angular 22 · CSS propio + GSAP (ScrollTrigger) · Vitest · Playwright + axe-core.

**Requisitos:** .NET SDK 10, PostgreSQL 17 en `localhost:5432`, Node.js 24 / npm 11 y una cuenta de Cloudinary (gratuita).

```powershell
# 1. Clonar
git clone https://github.com/davidardila0607/altura-cafe-ecommerce.git
cd altura-cafe-ecommerce

# 2. Configuración local (este archivo está en .gitignore: nunca lo subas)
cd backend
Copy-Item appsettings.example.json appsettings.Development.json
#    Rellena: contraseña de PostgreSQL, Google:ClientId, una Jwt:Key nueva
#    y las credenciales de Cloudinary (detalle en el paso 2 de abajo).

# 3. Crear la base cafeapi_dev con las migraciones de EF Core
dotnet tool restore
dotnet ef database update

# 4. Levantar la API (déjala corriendo) → http://localhost:5031/swagger
dotnet run --launch-profile http

# 5. En otra terminal, desde backend/: cargar los 25 cafés del catálogo
powershell -ExecutionPolicy Bypass -File .\seed\seed-productos.ps1
powershell -ExecutionPolicy Bypass -File .\seed\subir-imagenes-sitio.ps1

# 6. En otra terminal: frontend → http://localhost:4200
cd frontend
npm install
npm start
```

- `seed-productos.ps1` pide el correo y la contraseña de la cuenta Administrador (cuentas de prueba definidas en `backend/Controllers/AuthController.cs`).
- El frontend debe usar el puerto **4200**: es el único origen permitido por CORS.
- **No reutilices** valores de `Jwt:Key` que aparezcan en el historial de Git: genera una clave propia.

Cada paso está explicado en detalle en [Cómo levantar el proyecto en local](#-cómo-levantar-el-proyecto-en-local-paso-a-paso). La guía técnica completa (arquitectura, decisiones y pendientes) está en `CLAUDE.md`.

---

## 📁 Estructura

```text
altura-cafe-ecommerce
├── backend/                  API .NET (Controllers, Data, DTOs, Repositories, Services, ...)
│   ├── .config/              dotnet-ef como herramienta local
│   ├── seed/                 Productos de ejemplo (script + imágenes) y fotos del sitio
│   └── appsettings.example.json
├── frontend/                 Aplicación Angular (src/, public/, e2e/, herramientas/)
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
git clone https://github.com/davidardila0607/altura-cafe-ecommerce.git
cd altura-cafe-ecommerce
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

Esto crea la base `cafeapi_dev` (si no existe), las tablas, las **9 variedades** (Castillo, Caturra, Colombia, Típica, Tabi, Bourbon Rojo, Bourbon Amarillo, Bourbon Rosado y Geisha) y los **3 procesos** (Lavado, Honey y Fermentado).

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

El script pide el correo y la contraseña de la cuenta **Administrador**. Lee el catálogo de `seed/catalogo.json` (25 cafés de Santander, Huila, Nariño, Magdalena y Cauca, cada uno con variedad, proceso, presentación, stock y precio), sube su imagen de `seed/imagenes/` a Cloudinary y crea el café. Es idempotente: si un café ya existe (mismo nombre, variedad, proceso y presentación), lo omite sin subir su imagen, así que puedes ejecutarlo varias veces. Para usar otra URL de la API: `-ApiBaseUrl http://localhost:5031/api`.

Comprueba el resultado en http://localhost:5031/api/cafes: deben aparecer 25 cafés con imágenes de `res.cloudinary.com`.

**Regenerar las imágenes de producto** (opcional; ya están en el repositorio). Desde `frontend/`, con `npm install` hecho:

```powershell
node herramientas/generar-bolsas.mjs        # las 25
node herramientas/generar-bolsas.mjs 09 10  # solo las que empiezan por 09 y 10
```

Dibuja cada bolsa a partir de `catalogo.json` y escribe el SVG y el PNG (1600×1600, < 600 kB) en `backend/seed/imagenes/`. Luego súbelas con `-ActualizarImagenes` (abajo).

**¿Cambiaron las imágenes de `seed/imagenes/`?** Para reemplazar las imágenes de los cafés que ya existen (conservando sus datos), usa:

```powershell
powershell -ExecutionPolicy Bypass -File .\seed\seed-productos.ps1 -ActualizarImagenes
```

Sube cada imagen nueva y actualiza el café con `PUT /api/cafes/{id}`; la API borra la imagen anterior de Cloudinary, así que no quedan imágenes huérfanas.

### 5b. Subir las fotografías del sitio

El Inicio (cielo del hero, proceso y cierre) usa fotos de Unsplash alojadas en tu Cloudinary (carpeta `sitio`). Desde `backend/`:

```powershell
powershell -ExecutionPolicy Bypass -File .\seed\subir-imagenes-sitio.ps1
```

Lee las credenciales de Cloudinary de `appsettings.Development.json` y pide a Cloudinary que descargue cada foto desde Unsplash (no hace falta la API corriendo). Es idempotente: puedes repetirlo. La lista de fotos, autores y licencias está en `seed/sitio/fotos.json`.

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

Las e2e corren dos veces: con animaciones y con "reducir movimiento". Incluyen axe-core (accesibilidad). Las capturas y un video corto quedan en `frontend/e2e/capturas/` (ignorada por Git).

Las pruebas del **panel de administración** necesitan las cuentas de prueba en variables de entorno (no se escriben en el repositorio; pídelas al equipo). Sin ellas, esas pruebas se omiten:

```powershell
$env:ALTURA_ADMIN_EMAIL = '<correo admin>';    $env:ALTURA_ADMIN_PASSWORD = '<contraseña>'
$env:ALTURA_CLIENTE_EMAIL = '<correo cliente>'; $env:ALTURA_CLIENTE_PASSWORD = '<contraseña>'
npm run e2e
```

Crean y borran un café y una variedad de prueba (con "e2e" en el nombre) y una imagen en Cloudinary; al terminar todo queda como estaba.

---

## 🖥️ Frontend

| Ruta | Vista |
|---|---|
| `/` | Inicio "Ascenso": hero con la montaña en capas, selección de la casa (3 cafés de la API), proceso "De la montaña a tu taza" (galería horizontal), cinta de notas de cata, mapa de orígenes, variedades y cierre. Un altímetro marca la altura de cada sección |
| `/productos` | Catálogo: filtros por variedad, proceso, presentación, origen y disponibilidad, orden, búsqueda, ficha de los tres procesos y vista rápida |
| `/login` | Iniciar sesión (solo visual) |
| `/registro` | Crear cuenta (solo visual) |
| `/admin/ingresar` | Acceso al panel de administración |
| `/admin/inventario` · `/admin/variedades` | Panel: cafés (con imagen) y variedades |

- Productos, variedades, procesos y presentaciones vienen de la API; nada de eso está escrito en el código (solo los textos de marca y los colores de cada variedad y proceso).
- El buscador del navbar lleva a `/productos?q=…` desde cualquier vista y filtra por nombre, origen, variedad o proceso sin importar tildes ni mayúsculas (por ejemplo, "honey" o "narino").
- Los filtros y el orden viven en la URL (por ejemplo `/productos?variedad=caturra&proceso=lavado&presentacion=500`): se pueden compartir y sobreviven a recargar. Cada café muestra su variedad (muestra de color) y su proceso (etiqueta con ícono).
- "Ver producto" (o cualquier clic en la card) abre la vista rápida: la bolsa "vuela" desde la card y el panel toma el color de la variedad. "Agregar al carrito" aparece deshabilitado ("Próximamente").
- Precios en pesos colombianos (`$ 42.000`); disponibilidad "N disponibles", "Quedan N" (5 o menos) o "Agotado".
- Login y Registro validan los campos, pero **no llaman a la API**: al enviar muestran "… estará disponible próximamente."
- Todo respeta "reducir movimiento" (la página es igual de completa, sin animaciones de desplazamiento) y funciona con teclado.
- Stack: Angular 22 (standalone, signals), sistema de diseño propio (sin Bootstrap; quedan los Bootstrap Icons), fuentes Bricolage Grotesque y Geist Mono vía npm, GSAP + ScrollTrigger cargado solo en el Inicio y View Transitions.

### Panel de administración

1. En la tienda, abajo en el footer: **"Acceso administrador"** (o abre http://localhost:4200/admin).
2. Ingresa con la cuenta de rol **Administrador** (la contraseña de las cuentas de prueba la tiene el equipo; no se escribe en el repositorio). Una cuenta Cliente no puede entrar.
3. En **Inventario** puedes buscar, crear, editar (con variedad, **proceso** e imagen jpg/png/webp de hasta 5 MB) y eliminar cafés; en **Variedades**, crear, editar y eliminar (no se puede eliminar una variedad que tiene cafés).
4. Los cambios se ven en el Inicio y en Productos al recargar. La sesión se cierra sola cuando vence el token o con "Cerrar sesión".

---

## ✅ Endpoints de la API

| Método | Ruta | Permiso |
|---|---|---|
| POST | `/api/auth/login` | Público |
| POST | `/api/auth/google` | Público |
| GET | `/api/auth/me` | Usuario autenticado (devuelve correo, nombre y roles) |
| GET | `/api/cafes` | Público |
| GET | `/api/cafes/{id}` | Público |
| POST | `/api/cafes` | Administrador |
| PUT | `/api/cafes/{id}` | Administrador |
| DELETE | `/api/cafes/{id}` | Administrador |
| GET | `/api/variedades` | Público |
| GET | `/api/variedades/{id}` | Público |
| POST | `/api/variedades` | Administrador |
| PUT | `/api/variedades/{id}` | Administrador |
| DELETE | `/api/variedades/{id}` | Administrador (409 si tiene cafés) |
| GET | `/api/presentaciones` | Público |
| GET | `/api/procesos` | Público (Lavado, Honey, Fermentado) |
| POST | `/api/images` | Administrador |
| DELETE | `/api/images?publicId=cafes/…` | Administrador (borra una imagen subida que no se usó) |

`backend/CafeApi.http` tiene peticiones de ejemplo: primero el login y luego el resto, reutilizando el token.

---

## 🗄️ Modelo de Datos

### variedades

- `id`, `nombre` (obligatorio, único, máx. 100), `descripcion` (opcional).
- Variedades iniciales (9): Castillo, Caturra, Colombia, Típica, Tabi, Bourbon Rojo, Bourbon Amarillo, Bourbon Rosado y Geisha, cada una con descripción.

### procesos

- `id`, `nombre` (obligatorio, único, máx. 50), `descripcion` (opcional).
- Procesos iniciales: Lavado, Honey y Fermentado.

### cafes

- `id`, `nombre` (máx. 100), `variedad_id` (FK, `ON DELETE RESTRICT`), `proceso_id` (FK, `ON DELETE RESTRICT`, obligatorio), `presentacion_gramos` (340 o 500), `origen` (máx. 100), `stock` (≥ 0), `precio` (`numeric(12,0)`, > 0, pesos colombianos sin decimales), `imagen_url`, `imagen_public_id`, `created_at`, `updated_at` (UTC).
- No puede haber dos cafés con el mismo nombre (sin importar mayúsculas), variedad, proceso y presentación: la API responde **409**. Un `procesoId` o `variedadId` que no existe responde **400**.

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

- Las escrituras usan la política **`GestionInventario`** (`backend/Seguridad/Politicas.cs`), que hoy exige el rol **Administrador**: crear, actualizar y eliminar cafés y variedades; subir y borrar imágenes.
- **Cliente:** consultar cafés, variedades y presentaciones (recibe 403 en cualquier escritura).
- Para dar acceso a otro rol (por ejemplo "Editor") se cambia solo la política y el mapa de permisos del frontend (`frontend/src/app/core/auth/permisos.ts`); los controladores no se tocan. Detalle en CLAUDE.md, sección "Autorización".
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
- El frontend pide las imágenes optimizadas (`f_auto,q_auto,w_600` y `srcset` con varios anchos).

---

## Manejo de errores y logging

- Las excepciones no controladas devuelven un JSON uniforme sin detalles internos: `{ "success": false, "message": "Ha ocurrido un error inesperado. Intenta de nuevo más tarde." }`. El detalle queda solo en el log.
- La API registra con `ILogger` las operaciones sobre cafés, los duplicados, los recursos inexistentes y la subida y borrado de imágenes.

---

## 🚧 Próximos Pasos

- Usuarios en base de datos (hoy hay dos cuentas fijas de prueba) y login real en la tienda
- Carrito de compras y pedidos (la vista rápida ya tiene el selector de cantidad)
- Rotación de `Jwt:Key`
- Deploy

---

## 👨‍💻 Autor

Pablo Santamaría
