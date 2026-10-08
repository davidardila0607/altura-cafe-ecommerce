# ☕ Altura · CafeApi

E-commerce de café de especialidad colombiano **Altura**:

- **backend/**: API REST en ASP.NET Core 10 con Entity Framework Core, PostgreSQL y Cloudinary para las imágenes.
- **frontend/**: aplicación Angular 22 (`altura-web`), concepto **"Ascenso"**: el Inicio es subir la montaña (con un altímetro), catálogo de cafés con filtros y vista rápida, **registro e inicio de sesión reales** (usuarios en PostgreSQL, contraseñas con hash y JWT), **carrito de compras** (Guía 2), **pedidos con dirección de envío** (guía de pedidos), **pagos** (Guía 3, Wompi, hoy en **modo simulación** con una pasarela de pruebas propia), un cierre del Inicio con **reseñas de clientes** (de ejemplo) y un **panel de administración** en `/admin` (inventario, variedades, historial de compras y usuarios) para el rol Administrador.

El proyecto está preparado para producción, pero todavía **no está desplegado**: los pasos están en [DEPLOY.md](DEPLOY.md).

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
#    Rellena: contraseña de PostgreSQL, una JwtSettings:Key nueva, tu correo en
#    Admin:Correos y las credenciales de Cloudinary (detalle en el paso 2 de abajo).

# 3. Crear la base cafeapi_dev con las migraciones de EF Core
dotnet tool restore
dotnet ef database update

# 4. Levantar la API (déjala corriendo) → http://localhost:5031/swagger
dotnet run --launch-profile http

# 5. Registra la cuenta administradora compartida (desarrollo.testing@gmail.com) con
#    POST /api/auth/Register en Swagger (paso 4b de abajo).
#    Luego, en otra terminal desde backend/, carga los 25 cafés del catálogo con esa cuenta:
powershell -ExecutionPolicy Bypass -File .\seed\seed-productos.ps1
powershell -ExecutionPolicy Bypass -File .\seed\subir-imagenes-sitio.ps1

# 6. En otra terminal: frontend → http://localhost:4200
cd frontend
npm install
npm start
```

- `seed-productos.ps1` pide el correo y la contraseña de una cuenta **Administrador** (su correo en `Admin:Correos` antes de registrarla). El equipo usa la cuenta compartida `desarrollo.testing@gmail.com` (ver [Cuenta administradora compartida](#-cuenta-administradora-compartida)); los cafés quedan a su nombre.
- Para probar el carrito usa una cuenta **Cliente** (ver [Probar el carrito](#-probar-el-carrito-con-una-cuenta-cliente)).
- El frontend debe usar el puerto **4200**: es el único origen permitido por CORS.
- **No reutilices** claves JWT que aparezcan en el historial de Git: genera una `JwtSettings:Key` propia.

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
├── docs/guias/               Guías del profesor (1: usuarios y JWT; 2: carrito; pedidos; 3: Wompi)
├── CLAUDE.md                 Guía técnica detallada (arquitectura, decisiones, pendientes)
├── DEPLOY.md                 Cómo desplegar (variables de entorno, migraciones, CORS)
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
| `JwtSettings:Key` | Clave secreta para firmar los JWT: 64 bytes aleatorios en Base64 (ver abajo). Reemplaza `CLAVE_SECRETA_DEL_PROYECTO` |
| `JwtSettings:Issuer` / `Audience` / `DurationInMinutes` | `EcommerceApi` / `EcommerceAngular` / `60` (ya vienen en el ejemplo) |
| `Admin:Correos` | Los correos que deben registrarse como **Administrador**. Incluye la cuenta compartida: `["desarrollo.testing@gmail.com"]`. Cualquier otro correo queda como Cliente |
| `CloudinarySettings:CloudName` / `ApiKey` / `ApiSecret` | Credenciales de tu cuenta de Cloudinary |
| `WompiSettings` | Ya viene en el ejemplo con **marcadores falsos** y `ModoSimulado: true` (pasarela de pruebas). No hace falta cambiarlo; ver [Pagos: modo simulación y Wompi real](#-pagos-modo-simulación-y-wompi-real) |

Para generar la `JwtSettings:Key` en PowerShell (copia el resultado en `appsettings.Development.json`; no lo compartas ni lo subas a Git):

```powershell
$b = New-Object byte[] 64; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
```

### 3. Crear la base de datos

Las **migraciones de EF Core son la fuente de verdad del esquema**. Desde `backend/`:

```powershell
dotnet tool restore
dotnet ef database update
```

Esto crea la base `cafeapi_dev` (si no existe), las tablas (incluida `usuario`), las **9 variedades** (Castillo, Caturra, Colombia, Típica, Tabi, Bourbon Rojo, Bourbon Amarillo, Bourbon Rosado y Geisha) y los **3 procesos** (Lavado, Honey y Fermentado).

### 4. Ejecutar la API

Desde `backend/`:

```powershell
dotnet run --launch-profile http
```

- API: http://localhost:5031
- Swagger: http://localhost:5031/swagger (botón **Authorize**: pega solo el token)

Deja esta terminal abierta.

### 4b. Registrarte e iniciar sesión

En Swagger (http://localhost:5031/swagger):

1. **POST /api/auth/Register** → *Try it out* →
   ```json
   { "nombre": "Tu nombre", "email": "tu-correo@ejemplo.com", "password": "una-contraseña" }
   ```
   La contraseña debe tener 6 caracteres o más. Respuesta **200** `{ "mensaje": "Usuario registrado correctamente." }`; si el correo ya existe, **400** `{ "mensaje": "El usuario ya existe." }`. Si tu correo está en `Admin:Correos`, la cuenta queda como **Administrador**.
2. **POST /api/auth/Login** con el mismo correo y contraseña → **200** `{ "token": "eyJ…" }` (con datos incorrectos, **401** "Usuario o contraseña incorrectos.").
3. Opcional: **Authorize** → pega solo el token → **GET /api/auth/me** muestra tu nombre y tu rol.

También puedes registrarte desde la tienda en http://localhost:4200/registro e iniciar sesión en `/login`. ¿Te registraste antes de poner tu correo en `Admin:Correos`? Cambia el rol en la base de datos (ver CLAUDE.md, sección "Guía 1") y vuelve a iniciar sesión.

### 5. Cargar los productos de ejemplo

Con la API corriendo, abre **otra terminal** y, desde `backend/`:

```powershell
powershell -ExecutionPolicy Bypass -File .\seed\seed-productos.ps1
```

El script pide el correo y la contraseña de tu cuenta **Administrador** (la contraseña no se ve al escribirla). Inicia sesión con `POST /api/auth/Login`, así que cada café queda con tu nombre como dueño. Lee el catálogo de `seed/catalogo.json` (25 cafés de Santander, Huila, Nariño, Magdalena y Cauca, cada uno con variedad, proceso, presentación, stock y precio), sube su imagen de `seed/imagenes/` a Cloudinary y crea el café. Es idempotente: si un café ya existe (mismo nombre, variedad, proceso y presentación), lo omite sin subir su imagen, así que puedes ejecutarlo varias veces. Para usar otra URL de la API: `-ApiBaseUrl http://localhost:5031/api`.

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

Las pruebas de **usuarios y del panel** necesitan una cuenta Administrador de pruebas en variables de entorno. Su correo debe estar en `Admin:Correos` (por ejemplo `e2e-admin@altura.test`); si la cuenta no existe, las pruebas la registran. Sin las variables, esas pruebas se omiten:

```powershell
$env:ALTURA_ADMIN_EMAIL = 'e2e-admin@altura.test'; $env:ALTURA_ADMIN_PASSWORD = '<una contraseña>'
npm run e2e
```

Registran Clientes nuevos (uno prueba todo el carrito, dos los pedidos y uno el pago con la pasarela de pruebas, que descuenta stock y lo devuelve al terminar), y crean y borran cafés, una variedad y una imagen en Cloudinary (todo con "e2e" en el nombre). Los pedidos y los usuarios de prueba se borran después en PostgreSQL (los carritos se borran con los usuarios; los pedidos hay que borrarlos antes):

```sql
DELETE FROM pedido WHERE usuario_id IN (SELECT id FROM usuario WHERE email LIKE 'e2e-%@altura.test');
DELETE FROM usuario WHERE email LIKE 'e2e-%@altura.test';
```

---

## 👤 Cuenta administradora compartida

- **`desarrollo.testing@gmail.com`** (nombre **"Administrador Altura"**) es la cuenta Administrador del equipo y la dueña de los 25 cafés. Su correo está en `Admin:Correos`.
- Cada integrante la registra **en su base local**: `POST /api/auth/Register` con `{ "nombre": "Administrador Altura", "email": "desarrollo.testing@gmail.com", "password": "…" }` (la contraseña la comparte el equipo por fuera del repositorio; no se escribe en ningún archivo). Después carga el catálogo con `seed\seed-productos.ps1` iniciando sesión con ella.
- **Esta cuenta no puede comprar**: como es dueña de todos los cafés, ve "Este café es tuyo" en cada uno y la API responde 409 "No puedes comprar tu propio producto." (y, si de algún modo llegara a su carrito, el pedido respondería 409 "No puedes comprar tus propios productos."). Para el carrito y los pedidos se usa una cuenta Cliente.

## 🛒 Probar el carrito con una cuenta Cliente

1. Con la API y el frontend corriendo, abre http://localhost:4200/registro y crea una cuenta con un correo que **no** esté en `Admin:Correos` (queda como Cliente).
2. Inicia sesión en `/login`. El ícono de la bolsa (junto a tu inicial) muestra cuántas unidades tienes.
3. En **Productos**, elige la cantidad en una card y pulsa **Agregar**: aparece "Agregado al carrito · Ver carrito" y el número del ícono cambia. También puedes agregar desde la vista rápida ("Ver producto").
4. Abre el ícono del carrito (panel lateral) o ve a http://localhost:4200/carrito: cambia cantidades (hasta el stock), quita cafés, mira el subtotal de cada uno y el total en pesos, y prueba "Vaciar carrito" (pide confirmación).
5. Recarga la página o cierra y vuelve a iniciar sesión: el carrito sigue ahí (vive en la base de datos).
6. Sin sesión, "Agregar" y el ícono del carrito te llevan a `/login`.

En Swagger o `backend/CafeApi.http` están las 5 rutas de `/api/Carrito` con el token del Cliente.

## 🧾 Probar un pedido con una cuenta Cliente

1. Con la misma cuenta Cliente, agrega dos cafés al carrito (por ejemplo, 2 unidades de uno y 1 de otro).
2. Abre el carrito (panel lateral o `/carrito`) y pulsa **Confirmar pedido**. Se abre **"Datos de envío"**: dirección, ciudad, departamento, teléfono (7 a 15 dígitos) y notas opcionales. Si dejas algo vacío, el formulario te dice qué falta.
3. Pulsa **Confirmar pedido**: llegas a `/mis-pedidos/{número}` con el aviso "Pedido creado": estado **Pendiente**, la referencia (`PEDIDO-{número}`), el botón **Pagar**, cada café con su precio y su subtotal, el total y la dirección. El número del carrito vuelve a 0.
4. Pulsa **Pagar**: como estamos en modo simulación, abre la **Pasarela de pruebas** de Altura (con el aviso "Modo simulación: no se procesan pagos reales…"), con la referencia, el total y la firma de integridad.
5. Pulsa **Simular pago aprobado**: verás "¡Pago aprobado!" con la dirección y el total. El pedido queda **Pagado** y el stock de esos cafés baja.
6. Para probar un rechazo, haz otro pedido y pulsa **Simular pago rechazado**: verás "El pago fue rechazado" y el botón **Intentar de nuevo** (abre la pasarela otra vez, con la referencia `PEDIDO-{número}-2`).
7. En el menú de tu cuenta → **Mis pedidos** ves la lista (el más reciente primero); los pendientes y rechazados tienen "Pagar".
8. El precio queda guardado: si el administrador cambia el precio de un café, tu pedido sigue mostrando el anterior.
9. Con una cuenta **Administrador**, en **Panel → Historial** ves los indicadores (compras pagadas, unidades vendidas e ingresos), filtras por estado, fechas o texto (cliente, correo o referencia) y, al pulsar una compra, ves el panel con el cliente, la dirección, el teléfono, las notas, los cafés, el total y la transacción.

Para dejar el stock como estaba después de probar, cambia el stock de esos cafés desde **Panel → Inventario**.

En Swagger o `backend/CafeApi.http` están las rutas de `/api/Pedido` (con los casos 400, 401, 403, 404 y 409).

## 💳 Pagos: modo simulación y Wompi real

La Guía 3 integra **Wompi Sandbox**, pero el panel de Wompi exige activar un comercio real y no tenemos llaves. Por eso la API tiene `WompiSettings:ModoSimulado`:

- **`true` (como viene)**: "Pagar" abre la **pasarela de pruebas** de Altura. Sus botones llaman a `POST /api/Pedido/{id}/SimularPago`, que arma el mismo evento que enviaría Wompi, lo firma con el `EventSecret` configurado y lo procesa por el mismo camino del webhook real (validación del checksum, cambio de estado y descuento de stock). No se procesan pagos reales.
- **`false`**: "Pagar" va al **Web Checkout de Wompi** y el resultado llega por el webhook `POST /api/Pedido/Webhook`.

Para pasar a Wompi real:

1. En el panel de Wompi (*Desarrollo → Programadores → Sandbox*), copia las 4 llaves: pública (`pub_test_…`), privada (`prv_test_…`), de integridad (`test_integrity_…`) y de eventos (`test_events_…`).
2. Pégalas en `WompiSettings` de `backend/appsettings.Development.json` (nunca en `appsettings.json`) y pon `"ModoSimulado": false`.
3. `RedirectUrl` debe ser la URL del frontend + `/pago/resultado`.
4. Publica la API y, en Wompi, pon la **URL de eventos**: `https://TU-API/api/Pedido/Webhook` (ver [DEPLOY.md](DEPLOY.md)).

El modo real está implementado según la documentación de Wompi, pero todavía no se ha probado contra Wompi.

---

## 🖥️ Frontend

| Ruta | Vista |
|---|---|
| `/` | Inicio "Ascenso": hero con la montaña en capas, selección de la casa (3 cafés de la API), proceso "De la montaña a tu taza" (galería horizontal), cinta de notas de cata, mapa de orígenes, variedades y cierre. Un altímetro marca la altura de cada sección |
| `/productos` | Catálogo: filtros en listas (variedad, proceso, origen) y presentación, disponibilidad, orden, búsqueda, bloque de los tres procesos arriba de la grilla y vista rápida |
| `/login` | Iniciar sesión (`POST /api/auth/Login`); vuelve a la página anterior |
| `/registro` | Crear cuenta (`POST /api/auth/Register`) |
| `/carrito` | Carrito (con sesión): cantidades, subtotales, total, quitar, vaciar y "Confirmar pedido" |
| `/mis-pedidos` · `/mis-pedidos/{id}` | Pedidos del usuario (con sesión) y el detalle de uno, con "Pagar" |
| `/pago/simulador` · `/pago/resultado` | Pasarela de pruebas (modo simulación) y resultado del pago |
| `/admin/inventario` · `/admin/variedades` · `/admin/historial` · `/admin/usuarios` | Panel: cafés (con imagen), variedades, historial de compras (indicadores, filtros y detalle) y usuarios (cambio de rol) |

- Productos, variedades, procesos y presentaciones vienen de la API; nada de eso está escrito en el código (solo los textos de marca y los colores de cada variedad y proceso).
- El buscador del navbar lleva a `/productos?q=…` desde cualquier vista y filtra por nombre, origen, variedad o proceso sin importar tildes ni mayúsculas (por ejemplo, "honey" o "narino").
- Los filtros y el orden viven en la URL (por ejemplo `/productos?variedad=caturra&proceso=lavado&presentacion=500`): se pueden compartir y sobreviven a recargar. Cada café muestra su variedad (muestra de color) y su proceso (etiqueta con ícono).
- "Ver producto" (o cualquier clic en la card) abre la vista rápida: la bolsa "vuela" desde la card y el panel toma el color de la variedad.
- **Carrito** (Guía 2): cada card y la vista rápida tienen selector de cantidad y "Agregar"; el ícono del navbar muestra las unidades y abre un panel lateral; `/carrito` muestra todo con el total. Si el café es tuyo, está agotado o ya tienes todas sus unidades, el botón lo dice y queda deshabilitado.
- **Pedidos y pagos**: "Confirmar pedido" pide los datos de envío, convierte el carrito en un pedido "Pendiente" y lleva a su detalle, donde está "Pagar"; "Mis pedidos" está en el menú de la cuenta.
- **Reseñas**: el Inicio cierra con "Lo que dicen de Altura", 10 reseñas de ejemplo (ficticias) que suben despacio en una rueda; se pausa con el mouse, el teclado o el botón "Pausar reseñas", y con "reducir movimiento" se ven de 3 en 3 con Anterior/Siguiente.
- Precios en pesos colombianos (`$ 42.000`); disponibilidad "N disponibles", "Quedan N" (5 o menos) o "Agotado".
- Registro e inicio de sesión reales: la sesión se guarda en el navegador (`localStorage`) y dura lo que el token (60 minutos). Con sesión, el navbar muestra tu inicial y un menú con tu nombre, tu correo, "Mis pedidos", "Panel de administración" (solo Administrador) y "Cerrar sesión".
- Todo respeta "reducir movimiento" (la página es igual de completa, sin animaciones de desplazamiento) y funciona con teclado.
- Stack: Angular 22 (standalone, signals), sistema de diseño propio (sin Bootstrap; quedan los Bootstrap Icons), fuentes Bricolage Grotesque y Geist Mono vía npm, GSAP + ScrollTrigger cargado solo en el Inicio y View Transitions.

### Panel de administración

1. Inicia sesión en `/login` con una cuenta **Administrador** y abre el menú de tu cuenta → **"Panel de administración"** (también: footer → "Acceso administrador", o http://localhost:4200/admin). Sin sesión, te lleva a `/login`; una cuenta Cliente ve "No tienes permiso".
2. En la tabla, la columna **"Creado por"** muestra quién creó cada café.
3. En **Inventario** puedes buscar, crear, editar (con variedad, **proceso** e imagen jpg/png/webp de hasta 5 MB) y eliminar cafés; en **Variedades**, crear, editar y eliminar (no se puede eliminar una variedad que tiene cafés); en **Historial**, ver las compras con sus indicadores, filtrarlas y abrir el detalle de cada una; en **Usuarios**, buscar por nombre o correo y cambiar el rol (Administrador ↔ Cliente) con confirmación. Nadie puede quitarse su propio rol, y el rol nuevo se aplica la próxima vez que el usuario inicia sesión.
4. Los cambios se ven en el Inicio y en Productos al recargar. La sesión se cierra sola cuando vence el token o con "Cerrar sesión".

---

## ✅ Endpoints de la API

| Método | Ruta | Permiso |
|---|---|---|
| POST | `/api/auth/Register` | Público (200 `{ mensaje }`, 400 si el correo ya existe) |
| POST | `/api/auth/Login` | Público (200 `{ token }`, 401 si los datos son incorrectos) |
| GET | `/api/auth/me` | Usuario autenticado (devuelve correo, nombre y roles) |
| GET | `/api/cafes` | Público |
| GET | `/api/cafes/{id}` | Público |
| POST | `/api/cafes` | Administrador |
| PUT | `/api/cafes/{id}` | Administrador |
| DELETE | `/api/cafes/{id}` | Administrador (409 si el café aparece en algún pedido) |
| GET | `/api/variedades` | Público |
| GET | `/api/variedades/{id}` | Público |
| POST | `/api/variedades` | Administrador |
| PUT | `/api/variedades/{id}` | Administrador |
| DELETE | `/api/variedades/{id}` | Administrador (409 si tiene cafés) |
| GET | `/api/presentaciones` | Público |
| GET | `/api/procesos` | Público (Lavado, Honey, Fermentado) |
| POST | `/api/images` | Administrador |
| DELETE | `/api/images?publicId=cafes/…` | Administrador (borra una imagen subida que no se usó) |
| GET | `/api/Carrito/GetCarrito` | Usuario autenticado (lo crea vacío la primera vez) |
| POST | `/api/Carrito/AgregarProducto` | Usuario autenticado (404 si el café no existe; 409 si es tuyo, está agotado o no hay más unidades) |
| PUT | `/api/Carrito/ActualizarCarrito` | Usuario autenticado (404 si no está en el carrito; 409 si supera el stock) |
| DELETE | `/api/Carrito/EliminarProducto/{productId}` | Usuario autenticado (404 si no está en el carrito) |
| DELETE | `/api/Carrito/VaciarCarrito` | Usuario autenticado |
| POST | `/api/Pedido/CrearPedido` | Usuario autenticado; cuerpo con los datos de envío (200 `{ mensaje, pedidoId }`; 400 datos inválidos o carrito vacío; 409 café propio o sin stock) |
| GET | `/api/Pedido/GetPedidos` | Usuario autenticado (sus pedidos, el más reciente primero) |
| GET | `/api/Pedido/GetPedido/{pedidoId}` | Usuario autenticado (404 si no existe o es de otro usuario) |
| GET | `/api/Pedido/Historial` | Administrador (`?estado=&desde=&hasta=&texto=`; indicadores y compras con cliente, envío y productos) |
| POST | `/api/Pedido/{id}/PrepararPago` | Usuario autenticado (datos firmados para pagar; 404 si es ajeno; 409 si ya está pagado o sin stock) |
| POST | `/api/Pedido/Webhook` | Público, protegido por el checksum de Wompi (401 si no coincide) |
| POST | `/api/Pedido/{id}/SimularPago` | Usuario autenticado, solo en modo simulación (`{ "aprobado": true }`) |
| POST | `/api/Pedido/{id}/ConfirmarPago` | Usuario autenticado, solo con Wompi real (consulta la transacción a Wompi) |
| GET | `/api/usuarios` | Administrador (sin contraseñas) |
| PUT | `/api/usuarios/{id}/rol` | Administrador (`{ "rol": "Cliente" }`; 409 si es tu propio rol) |
| GET | `/api/health` | Público (`{ "estado": "ok" }`) |

`backend/CafeApi.http` tiene peticiones de ejemplo: primero Register y Login (el token queda en una variable) y luego el resto, con los casos 400, 401 y 403.

---

## 🗄️ Modelo de Datos

### usuario

- `id`, `nombre` (máx. 100), `email` (único, máx. 150, en minúsculas), `password` (hash de `PasswordHasher`, nunca la contraseña), `rol` (`Administrador` o `Cliente`).

### carrito y carrito_producto (Guía 2)

- `carrito`: `id`, `usuario_id` (único: un carrito por usuario; se borra con el usuario).
- `carrito_producto` (tabla intermedia): `id`, `carrito_id`, `producto_id` (el café), `cantidad` (≥ 1). Un café aparece una sola vez por carrito; si se elimina el café, sale de los carritos.

### pedido y pedido_producto (guía de pedidos)

- `pedido`: `id`, `usuario_id`, `total` (pesos sin decimales), `estado` (`Pendiente`, `Pagado` o `Rechazado`; nace `Pendiente` y el pago lo cambia), `fecha` (UTC), `referencia_wompi` (`PEDIDO-{id}`, única), `transaction_id_wompi`, y los datos de envío: `direccion_envio`, `ciudad`, `departamento`, `telefono` y `notas_entrega`.
- `pedido_producto`: `id`, `pedido_id`, `producto_id` (el café), `cantidad` (≥ 1) y `precio` (el del momento de la compra). Un café que aparece en un pedido no se puede borrar (409), para conservar el historial.

### variedades

- `id`, `nombre` (obligatorio, único, máx. 100), `descripcion` (opcional).
- Variedades iniciales (9): Castillo, Caturra, Colombia, Típica, Tabi, Bourbon Rojo, Bourbon Amarillo, Bourbon Rosado y Geisha, cada una con descripción.

### procesos

- `id`, `nombre` (obligatorio, único, máx. 50), `descripcion` (opcional).
- Procesos iniciales: Lavado, Honey y Fermentado.

### cafes

- `id`, `nombre` (máx. 100), `variedad_id` (FK, `ON DELETE RESTRICT`), `proceso_id` (FK, `ON DELETE RESTRICT`, obligatorio), `presentacion_gramos` (340 o 500), `origen` (máx. 100), `stock` (≥ 0), `precio` (`numeric(12,0)`, > 0, pesos colombianos sin decimales), `imagen_url`, `imagen_public_id`, `usuario_id` (FK al usuario que lo creó, sale del token), `created_at`, `updated_at` (UTC).
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

La API usa JSON Web Tokens (JWT) que firma ella misma con `JwtSettings:Key` para proteger los endpoints que modifican datos. Las contraseñas se guardan con hash (`PasswordHasher`). Los GET son públicos.

- Las escrituras usan la política **`GestionInventario`** (`backend/Seguridad/Politicas.cs`), que hoy exige el rol **Administrador**: crear, actualizar y eliminar cafés y variedades; subir y borrar imágenes.
- La política **`GestionUsuarios`** (también Administrador) protege la lista de usuarios y el cambio de rol.
- **Cliente:** consultar cafés, variedades y presentaciones y usar **su** carrito (recibe 403 en cualquier escritura del catálogo). El carrito siempre es el del usuario del token.
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

- Probar Wompi real cuando haya llaves de Sandbox (hoy funciona el modo simulación)
- Cancelar pedidos, seguimiento del envío y facturación
- Login con Google, cambio y recuperación de contraseña
- Desplegar siguiendo [DEPLOY.md](DEPLOY.md)

---

## 👨‍💻 Autor

Pablo Santamaría
