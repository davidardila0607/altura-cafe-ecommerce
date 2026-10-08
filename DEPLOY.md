# Despliegue de Altura (producción)

Guía corta para publicar la API y la tienda. **El proyecto está preparado, pero todavía no se ha desplegado**: no hay cuentas ni recursos creados en ningún servicio. Los ejemplos usan Railway para la API (es lo que asume el código: variable `PORT`), pero sirve cualquier hosting de .NET 10.

> Nunca escribas claves, contraseñas ni cadenas de conexión en el repositorio. En producción todo llega por **variables de entorno**.

## 1. Requisitos

- Un hosting para la API con **.NET 10** (por ejemplo, Railway). Carpeta raíz del servicio: `backend/`.
- Una base de datos **PostgreSQL** de producción (Railway, Supabase, Neon…).
- Un hosting de **sitios estáticos** para el frontend (Netlify, Vercel, Cloudflare Pages, Railway…).
- La cuenta de **Cloudinary** del proyecto.
- En tu computador: .NET SDK 10, Node.js 24 y el repositorio clonado con `backend/appsettings.Development.json` configurado (se usa para aplicar las migraciones).

## 2. Variables de entorno de la API

Los dos guiones bajos (`__`) equivalen a `:` en `appsettings.json`.

| Variable | Valor | ¿Obligatoria? |
|---|---|---|
| `ConnectionStrings__CafeDatabase` | Cadena de la base PostgreSQL de producción (`Host=…;Port=…;Database=…;Username=…;Password=…;SSL Mode=Require`) | Sí: sin ella la API no arranca y lo dice en el log |
| `JwtSettings__Key` | Clave nueva de 64 bytes en Base64, **distinta de la local** (comando abajo) | Sí: sin ella (o con el marcador) la API no arranca |
| `CloudinarySettings__CloudName` | Cloud name de Cloudinary | Sí |
| `CloudinarySettings__ApiKey` | API key de Cloudinary | Sí |
| `CloudinarySettings__ApiSecret` | API secret de Cloudinary | Sí |
| `Admin__Correos__0` | `desarrollo.testing@gmail.com` (la cuenta administradora compartida) | Sí, antes de registrarla |
| `Cors__AllowedOrigins__0` | URL pública del frontend, sin `/` final (por ejemplo `https://altura.netlify.app`) | Sí |
| `WompiSettings__ModoSimulado` | `true` = pasarela de pruebas de Altura (no se cobra nada); `false` = Wompi real | Sí (si no se define, vale `true`, el valor de `appsettings.json`) |
| `WompiSettings__PublicKey` | Llave pública de Wompi (`pub_test_…` en Sandbox, `pub_prod_…` en producción) | Solo con Wompi real |
| `WompiSettings__PrivateKey` | Llave privada (`prv_test_…` / `prv_prod_…`); la usa `ConfirmarPago` para consultar transacciones | Solo con Wompi real |
| `WompiSettings__IntegritySecret` | Secreto de integridad (`test_integrity_…` / `prod_integrity_…`): firma cada pago | Solo con Wompi real |
| `WompiSettings__EventSecret` | Secreto de eventos (`test_events_…` / `prod_events_…`): valida el checksum del webhook. En modo simulación también firma los eventos de la pasarela de pruebas: conviene cambiar el marcador por un valor propio | Sí, aun en modo simulación |
| `WompiSettings__BaseUrl` | `https://sandbox.wompi.co/v1` (Sandbox) o `https://production.wompi.co/v1` (producción); viene en `appsettings.json` | No |
| `WompiSettings__RedirectUrl` | URL pública del frontend + `/pago/resultado` (por ejemplo `https://altura.netlify.app/pago/resultado`) | Sí |
| `ASPNETCORE_ENVIRONMENT` | `Production` (es el valor por defecto si no se define) | No |
| `PORT` | La pone Railway sola; la API escucha en `http://0.0.0.0:$PORT` | No |

`JwtSettings__Issuer`, `Audience` y `DurationInMinutes` ya vienen en `appsettings.json` (`EcommerceApi`, `EcommerceAngular`, `60`).

Generar la clave JWT (PowerShell):

```powershell
$b = New-Object byte[] 64; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
```

Qué hace la API en producción:

- **Swagger no se publica** (solo existe en Development).
- **No redirige a HTTPS**: Railway recibe el HTTPS y reenvía la petición a la API por HTTP dentro de su red.
- `GET /api/health` responde `{ "estado": "ok" }` sin token: úsalo como *healthcheck* del hosting.
- `appsettings.Development.json` nunca se copia al publicar (`CafeApi.csproj`).

## 3. Crear la base de datos de producción

Crea la base PostgreSQL vacía en el proveedor y copia su cadena de conexión (no la pegues en ningún archivo del repositorio).

## 4. Aplicar las migraciones

La API **no** aplica migraciones al arrancar: se aplican a mano, una vez por cada migración nueva. Desde `backend/` en tu computador:

```powershell
dotnet tool restore
# Opción A: directamente contra la base de producción
dotnet ef database update --connection "<cadena de conexión de producción>"

# Opción B: generar el SQL, revisarlo y ejecutarlo con psql
dotnet ef migrations script --idempotent --output migraciones.sql
```

Con la opción B, borra `migraciones.sql` al terminar (no se sube a Git). Las migraciones crean las tablas, las 9 variedades y los 3 procesos.

## 5. Publicar la API

En Railway: nuevo servicio desde el repositorio, carpeta raíz `backend/`, las variables del paso 2 y como *healthcheck* `/api/health`. Para compilar a mano: `dotnet publish CafeApi.csproj -c Release -o publicacion`.

Comprueba: `https://TU-API.up.railway.app/api/health` → `{ "estado": "ok" }`.

## 6. Registrar la cuenta administradora

Con `Admin__Correos__0` ya configurada, registra la cuenta compartida (la contraseña la conoce el equipo; no se escribe en ningún archivo):

```powershell
$cuerpo = @{ nombre = 'Administrador Altura'; email = 'desarrollo.testing@gmail.com'; password = Read-Host 'Contraseña' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'https://TU-API.up.railway.app/api/auth/Register' -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($cuerpo))
```

Respuesta esperada: `Usuario registrado correctamente.`. Si se registró antes de configurar `Admin__Correos__0`, quedó como Cliente: cambia el rol con un `UPDATE usuario SET rol = 'Administrador' WHERE email = '…';` en la base de producción.

## 7. Cargar el catálogo

Desde `backend/`, en la misma sesión de PowerShell, apuntando a la API de producción:

```powershell
& .\seed\seed-productos.ps1 -ApiBaseUrl https://TU-API.up.railway.app/api
```

Pide el correo y la contraseña de la cuenta administradora, sube las 25 imágenes a Cloudinary y crea los 25 cafés a su nombre. Es idempotente. Las fotos del sitio (`seed\subir-imagenes-sitio.ps1`) ya están en Cloudinary si se usa la misma cuenta.

## 8. Configurar CORS

`Cors__AllowedOrigins__0` debe ser exactamente la URL del frontend (paso 9). Si cambia la URL, actualiza la variable y reinicia la API. Para más orígenes: `Cors__AllowedOrigins__1`, `__2`…

## 8b. Configurar Wompi (Guía 3)

1. Mientras no haya llaves de Wompi, deja `WompiSettings__ModoSimulado=true`: "Pagar" abre la pasarela de pruebas de Altura y no se procesan pagos reales. Pon igual `WompiSettings__RedirectUrl` y un `WompiSettings__EventSecret` propio.
2. Con llaves: copia en Wompi (*Desarrollo → Programadores*, ambiente Sandbox o Producción) las 4 llaves en las variables `WompiSettings__*`, pon `WompiSettings__ModoSimulado=false` y, si es producción, `WompiSettings__BaseUrl=https://production.wompi.co/v1`. Reinicia la API.
3. En el mismo panel de Wompi, en **"URL de eventos"**, pon la URL pública de la API + el endpoint del webhook: **`https://TU-API/api/Pedido/Webhook`** (por ejemplo `https://altura-api.up.railway.app/api/Pedido/Webhook`). Debe ser HTTPS y la API debe estar publicada (paso 5).
4. Prueba con una tarjeta de pruebas de Wompi: el pedido debe pasar a "Pagado" (llega por el webhook) y el stock debe bajar.

## 9. Compilar y publicar el frontend

1. En `frontend/src/environments/environment.ts` cambia `apiBaseUrl` por la URL real de la API terminada en `/api` (hoy es el marcador `https://TU-API.up.railway.app/api`).
2. Desde `frontend/`:

   ```powershell
   npm ci
   npx ng build
   ```

3. Publica la carpeta **`frontend/dist/altura-web/browser`** en el hosting estático.
4. **Redirige todas las rutas a `index.html`** (es una SPA: `/productos`, `/carrito` o `/admin` no existen como archivos). Por ejemplo, en Netlify un archivo `_redirects` con `/* /index.html 200`; en Vercel, un *rewrite* de `/(.*)` a `/index.html`.

## 10. Comprobación final

- [ ] `/api/health` responde `ok`.
- [ ] La tienda carga los 25 cafés y sus imágenes.
- [ ] Registrar una cuenta Cliente, agregar un café al carrito y recargar: el carrito sigue ahí.
- [ ] La cuenta administradora entra a `/admin` y ve "Este café es tuyo" en sus cafés.
- [ ] Recargar directamente `https://…/productos` no da 404 (redirección a `index.html`).
- [ ] Un Cliente confirma un pedido con su dirección, pulsa "Pagar" y ve la pasarela que corresponde (pruebas o Wompi); al aprobar, el pedido queda "Pagado" y aparece en el historial del panel.
