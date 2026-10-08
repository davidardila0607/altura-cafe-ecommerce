# Despliegue de Altura en Railway

Guía paso a paso, pensada para quien despliega por primera vez. **El proyecto está preparado, pero todavía no se ha desplegado**: no hay cuentas ni recursos creados en Railway.

Al terminar tendrás, dentro de **un solo proyecto de Railway**, tres servicios:

| Servicio | Qué es | Sale de |
|---|---|---|
| **Postgres** | La base de datos PostgreSQL | Plantilla de Railway |
| **API** (por ejemplo `altura-api`) | El backend ASP.NET Core 10 | Carpeta `backend/` del repositorio (su `Dockerfile`) |
| **Tienda** (por ejemplo `altura-web`) | El frontend Angular, servido con nginx | Carpeta `frontend/` del repositorio (su `Dockerfile`) |

> **Nunca** escribas claves, contraseñas ni cadenas de conexión en el repositorio. En Railway todo llega por **variables** de cada servicio.

> Los nombres de botones y pestañas son los de la documentación de Railway (docs.railway.com, octubre de 2026). Si alguno cambió, todo lo de configuración está en la pestaña **Settings** del servicio y las variables en **Variables**.

## Dos formas de organizar el código

1. **Un solo repositorio, dos servicios (la que usamos).** El repositorio `davidardila0607/altura-cafe-ecommerce` tiene `backend/` y `frontend/`. En Railway se crean dos servicios desde el mismo repositorio y a cada uno se le indica su carpeta con **Root Directory** (`backend` o `frontend`). Railway busca un archivo llamado exactamente `Dockerfile` en esa carpeta y lo usa.
2. *Dos repositorios separados*: también funciona (cada `Dockerfile` está en la raíz de su carpeta), pero no lo usamos; con un solo repositorio todo queda en un lugar.

### Lo que ya está preparado en el código

- **`backend/Dockerfile`** (compila con la imagen del SDK de .NET 10 y ejecuta con la de ASP.NET, sin usuario root) y **`backend/.dockerignore`** (no entran `appsettings.Development.json`, `bin`, `obj` ni `seed`).
- La API escucha en el puerto que indica la variable **`PORT`** (Railway la pone sola).
- La API acepta la variable **`DATABASE_URL`** que entrega PostgreSQL en Railway (formato `postgresql://usuario:clave@host:puerto/base`) y la convierte al formato de Npgsql.
- Con **`Database__AplicarMigracionesAlIniciar=true`**, la API crea y actualiza las tablas al arrancar (no hace falta `dotnet ef` contra la base de Railway).
- **`GET /api/health`** responde `{ "estado": "ok" }`: lo usa Railway para saber que la API arrancó.
- Si falta la base, la clave JWT o Cloudinary, la API **no arranca** y dice en el log qué variable falta.
- **`frontend/Dockerfile`**: compila con Node 24 y sirve con nginx (`frontend/nginx.conf.template`), que escucha en `PORT`, entrega `index.html` en cualquier ruta (así `/productos` o `/admin` funcionan al recargar) y guarda en caché un año los archivos con huella en el nombre (`main-H7MQID23.js`…), pero nunca `index.html`.
- La URL de la API **no está escrita a mano**: el build del frontend la toma de la variable **`API_URL`** (`frontend/herramientas/escribir-entorno.mjs` la escribe en `environment.ts` antes de `ng build`). Si falta, el build se detiene con un mensaje.
- No hay `railway.json` ni `railway.toml`: Railway marcó *Config as Code* como obsoleto y los servicios nuevos ya no lo usan. Lo poco que hay que configurar (carpeta, *healthcheck*) se hace en **Settings** de cada servicio, como se explica abajo.

## Antes de empezar

- Una cuenta de **Railway** con tu GitHub vinculado (Railway lo pide la primera vez).
- La cuenta de **Cloudinary** del proyecto (cloud name, API key y API secret).
- En tu computador: el repositorio clonado y **PowerShell** (para cargar el catálogo al final).
- Una **clave JWT nueva** para producción, distinta de la local. Genérala en PowerShell y guárdala solo en Railway:

  ```powershell
  $b = New-Object byte[] 64; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
  ```

## Paso 1. Crear el proyecto y la base de datos

1. En el panel de Railway pulsa **New Project** y elige **Empty project**.
2. En el lienzo del proyecto pulsa **+ New** (o `Ctrl + K`) y elige **PostgreSQL**. Railway crea el servicio **Postgres** con sus variables (`DATABASE_URL`, `PGHOST`, `PGPASSWORD`…). No hace falta copiar nada: la API la usará con una *referencia*.
3. No actives **Public Access** en la base: la API la alcanza por la red privada de Railway.

## Paso 2. Agregar la API (backend)

1. En el lienzo, **+ New** → **GitHub Repo** → elige `davidardila0607/altura-cafe-ecommerce`. Si Railway empieza a construir enseguida, no pasa nada: fallará porque aún faltan la carpeta y las variables.
2. Abre el servicio → pestaña **Settings**:
   - **Root Directory**: `backend`.
   - En la sección de despliegue, **Healthcheck Path**: `/api/health`.
   - (Opcional) **Watch Paths**: `/backend/**`, para que un cambio solo en el frontend no vuelva a desplegar la API.
   - Cambia el nombre del servicio a `altura-api` (es solo para reconocerlo).
3. Pestaña **Variables** → **RAW Editor** (o **New Variable**, una por una). Pega y completa (la tabla de abajo explica cada una):

   ```env
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JwtSettings__Key=<la clave nueva de 64 bytes>
   JwtSettings__Issuer=EcommerceApi
   JwtSettings__Audience=EcommerceAngular
   JwtSettings__DurationInMinutes=60
   CloudinarySettings__CloudName=<cloud name>
   CloudinarySettings__ApiKey=<api key>
   CloudinarySettings__ApiSecret=<api secret>
   Admin__Correos__0=desarrollo.testing@gmail.com
   Cors__AllowedOrigins__0=https://TIENDA-PENDIENTE.up.railway.app
   WompiSettings__ModoSimulado=true
   WompiSettings__EventSecret=<un texto aleatorio propio>
   WompiSettings__RedirectUrl=https://TIENDA-PENDIENTE.up.railway.app/pago/resultado
   Database__AplicarMigracionesAlIniciar=true
   ```

   `${{Postgres.DATABASE_URL}}` es una **referencia**: Railway la reemplaza por la dirección real de la base (si tu servicio de base se llama distinto de `Postgres`, usa ese nombre; al escribir `${{` Railway sugiere los nombres). Los dos valores `TIENDA-PENDIENTE` se corrigen en el paso 5, cuando la tienda tenga su dominio.

4. **Settings** → **Networking** → **Public Networking** → **Generate Domain**. Railway da una dirección como `https://altura-api.up.railway.app` (anótala: es la URL de la API).
5. Si el despliegue no empezó solo, pulsa **Deploy**. Espera a que termine y abre `https://TU-API/api/health`: debe mostrar `{"estado":"ok"}`. En los logs verás "Aplicando las migraciones pendientes…" y "Migraciones aplicadas.". (La primera vez EF Core también registra un error al consultar la tabla `__EFMigrationsHistory`, que todavía no existe: es normal.)

### Variables de la API

| Variable | Valor de ejemplo | Para qué sirve |
|---|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Dirección de la base (referencia a la base de Railway). La API la convierte al formato de Npgsql. Alternativa: `ConnectionStrings__CafeDatabase` con una cadena de Npgsql (si existe, tiene prioridad) |
| `JwtSettings__Key` | 64 bytes en Base64 (comando de arriba) | Firma los tokens de sesión. **Nueva**, distinta de la local; sin ella la API no arranca |
| `JwtSettings__Issuer` | `EcommerceApi` | Emisor del token (ya viene en `appsettings.json`; ponerla es opcional) |
| `JwtSettings__Audience` | `EcommerceAngular` | Audiencia del token (opcional, igual que la anterior) |
| `JwtSettings__DurationInMinutes` | `60` | Minutos que dura una sesión (opcional) |
| `CloudinarySettings__CloudName` | `otxg5mih` | Cuenta de Cloudinary de las imágenes. Sin las tres, la API no arranca |
| `CloudinarySettings__ApiKey` | (de Cloudinary) | Ídem |
| `CloudinarySettings__ApiSecret` | (de Cloudinary) | Ídem; es un secreto |
| `Admin__Correos__0` | `desarrollo.testing@gmail.com` | Correos que se registran como Administrador (`__1`, `__2`… para más). Debe existir **antes** de registrar esa cuenta |
| `Cors__AllowedOrigins__0` | `https://altura-web.up.railway.app` | URL de la tienda que puede llamar a la API, **sin `/` al final**. Para más: `Cors__AllowedOrigins__1`… |
| `WompiSettings__ModoSimulado` | `true` | `true` = pasarela de pruebas de Altura (no se cobra nada). Déjalo así mientras no haya llaves de Wompi |
| `WompiSettings__EventSecret` | un texto aleatorio | Firma y valida los eventos de pago (también los de la pasarela de pruebas). Si no se pone, se usa el marcador de `appsettings.json` |
| `WompiSettings__RedirectUrl` | `https://altura-web.up.railway.app/pago/resultado` | Adónde vuelve el cliente después de pagar |
| `WompiSettings__PublicKey`, `__PrivateKey`, `__IntegritySecret`, `__BaseUrl` | (de Wompi) | Solo para Wompi real; ver "Pasar a Wompi real" |
| `Database__AplicarMigracionesAlIniciar` | `true` | La API crea y actualiza las tablas al arrancar |
| `PORT` | (la pone Railway) | Puerto donde escucha la API. **No la crees** |
| `ASPNETCORE_ENVIRONMENT` | (ya es `Production` en el `Dockerfile`) | Sin Swagger y sin `appsettings.Development.json`. No hace falta crearla |

Los dos guiones bajos (`__`) equivalen a `:` en `appsettings.json` (`JwtSettings__Key` = `JwtSettings:Key`).

## Paso 3. Agregar la tienda (frontend)

1. En el lienzo, **+ New** → **GitHub Repo** → el mismo repositorio.
2. Abre el servicio → **Settings**:
   - **Root Directory**: `frontend`.
   - **Healthcheck Path**: `/`.
   - (Opcional) **Watch Paths**: `/frontend/**`.
   - Nombre del servicio: `altura-web`.
3. **Variables** → **New Variable**:

   | Variable | Valor de ejemplo | Para qué sirve |
   |---|---|---|
   | `API_URL` | `https://altura-api.up.railway.app/api` | URL pública de la API **terminada en `/api`**. Se usa al compilar: el `Dockerfile` la recibe con `ARG API_URL` (Railway solo pasa variables al build si el Dockerfile las declara así). Si cambia, Railway vuelve a construir la tienda |
   | `PORT` | (la pone Railway) | Puerto de nginx. **No la crees** |

4. **Settings** → **Networking** → **Public Networking** → **Generate Domain**. Anota la URL (por ejemplo `https://altura-web.up.railway.app`).
5. Espera el despliegue y abre la URL: debe verse el Inicio. Todavía no cargarán los cafés: falta el paso 4 (CORS).

## Paso 4. Volver a la API: CORS y retorno del pago

En el servicio **altura-api** → **Variables**, cambia los dos valores pendientes por la URL real de la tienda:

```env
Cors__AllowedOrigins__0=https://altura-web.up.railway.app
WompiSettings__RedirectUrl=https://altura-web.up.railway.app/pago/resultado
```

Railway vuelve a desplegar la API. Recarga la tienda: ahora sí se ven los cafés (cuando cargues el catálogo).

## Paso 5. Cuenta administradora y catálogo

1. **Cuenta administradora**: abre `https://TU-TIENDA/registro` y registra `desarrollo.testing@gmail.com` (nombre "Administrador Altura"; la contraseña la comparte el equipo por fuera del repositorio). Como su correo está en `Admin__Correos__0`, queda como Administrador. Si se registró antes de poner esa variable, quedó como Cliente: abre el servicio **Postgres** en Railway y, desde su vista de datos o con `psql` (activando **Public Access** solo mientras tanto), ejecuta `UPDATE usuario SET rol = 'Administrador' WHERE email = 'desarrollo.testing@gmail.com';` y vuelve a iniciar sesión.
2. **Catálogo de 25 cafés**: en tu computador, desde la carpeta `backend/`, en PowerShell:

   ```powershell
   & .\seed\seed-productos.ps1 -ApiBaseUrl https://altura-api.up.railway.app/api
   ```

   Pide el correo y la contraseña de la cuenta administradora, sube cada imagen a Cloudinary (por la API) y crea el café. Es **idempotente**: si lo vuelves a ejecutar, omite los cafés que ya existen **sin volver a subir sus imágenes**. Las fotos del sitio (Inicio) ya están en Cloudinary si se usa la misma cuenta.

## Paso 6. Comprobación final

- [ ] `https://TU-API/api/health` responde `{"estado":"ok"}`.
- [ ] La tienda carga los 25 cafés y sus imágenes.
- [ ] Recargar directamente `https://TU-TIENDA/productos` y `https://TU-TIENDA/admin` no da 404.
- [ ] Registrar una cuenta Cliente, agregar un café al carrito y recargar: el carrito sigue ahí.
- [ ] La cuenta administradora entra a `/admin` y ve "Este café es tuyo" en sus cafés.
- [ ] Un Cliente confirma un pedido con su dirección, pulsa "Pagar", ve la **pasarela de pruebas** y al aprobar el pedido queda "Pagado" y aparece en **Panel → Historial**.

## Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| La tienda abre, pero no carga cafés; en la consola del navegador dice "CORS" o "blocked by CORS policy" | `Cors__AllowedOrigins__0` no es exactamente la URL de la tienda | Debe ser `https://…` (con `https`), sin `/` al final y sin rutas. Corrige la variable; Railway vuelve a desplegar la API |
| La tienda llama a `https://TU-API.up.railway.app/api` | Falta `API_URL` o se agregó después de construir | Revisa `API_URL` en el servicio de la tienda y vuelve a desplegarla (pulsa **Deploy** o **Redeploy**). Sin `API_URL` el build falla con "Falta la variable API_URL" |
| 404 al recargar `/productos`, `/login` o `/admin` | La tienda no se está sirviendo con el `Dockerfile` del repositorio | Comprueba que **Root Directory** sea `frontend` y que el log de build diga "Using detected Dockerfile". nginx ya redirige todas las rutas a `index.html` |
| La API no arranca: "Falta la cadena de conexión" | No hay `DATABASE_URL` ni `ConnectionStrings__CafeDatabase` | Agrega `DATABASE_URL=${{Postgres.DATABASE_URL}}` (con el nombre real del servicio de la base) |
| Error de conexión a la base (`Npgsql`, "connection refused", "password authentication failed") | La referencia apunta a otro servicio o la base no está desplegada | Revisa que el servicio Postgres esté activo y que `DATABASE_URL` sea la referencia, no un texto copiado a mano |
| La API no arranca: "Falta la clave de los JWT" o "Falta la configuración de Cloudinary" | Falta esa variable o tiene un error de escritura | Los nombres llevan **dos** guiones bajos (`JwtSettings__Key`, `CloudinarySettings__ApiKey`) y respetan las mayúsculas |
| El healthcheck falla ("service unavailable") | La API no escucha en `PORT` o se detuvo por una variable faltante | No crees `PORT` a mano; revisa el log de despliegue: el mensaje dice qué falta |
| Un usuario nuevo queda como Cliente | `Admin__Correos__0` se agregó después de registrarlo | `UPDATE usuario SET rol = 'Administrador' …` (paso 5) |
| "Pagar" no funciona en producción | Falta `WompiSettings__RedirectUrl` o `ModoSimulado` está en `false` sin llaves | Deja `WompiSettings__ModoSimulado=true` hasta tener llaves de Wompi |

**Dónde ver los logs**: abre el servicio y haz clic en el despliegue (la tarjeta de la lista de despliegues). Ahí están los **logs del despliegue** (lo que escribe la API o nginx al correr) y la pestaña **Build Logs** (la compilación con Docker). Para ver los logs de todos los servicios juntos, botón **Observability** en la barra superior (Log Explorer). Los errores aparecen en rojo.

## Pasar a Wompi real (cuando haya llaves)

1. En el panel de Wompi (*Desarrollo → Programadores*, ambiente Sandbox o Producción) copia las 4 llaves.
2. En **altura-api** → **Variables**: `WompiSettings__PublicKey`, `WompiSettings__PrivateKey`, `WompiSettings__IntegritySecret`, `WompiSettings__EventSecret` y `WompiSettings__ModoSimulado=false`. Si es producción, `WompiSettings__BaseUrl=https://production.wompi.co/v1`.
3. En Wompi, **"URL de eventos"**: `https://TU-API/api/Pedido/Webhook` (por ejemplo `https://altura-api.up.railway.app/api/Pedido/Webhook`).
4. Prueba con una tarjeta de pruebas de Wompi: el pedido debe pasar a "Pagado" (llega por el webhook) y el stock debe bajar.

## Sin Railway (otros hostings)

- **API**: cualquier hosting de contenedores con el `backend/Dockerfile`, o `dotnet publish CafeApi.csproj -c Release` en un hosting de .NET 10, con las mismas variables. Las migraciones también se pueden aplicar a mano: `dotnet ef database update --connection "<cadena>"` o `dotnet ef migrations script --idempotent` (desde `backend/`, sin subir el SQL a Git).
- **Tienda**: el `frontend/Dockerfile`, o `API_URL=… node herramientas/escribir-entorno.mjs` + `npx ng build` y publicar `frontend/dist/altura-web/browser` en un hosting estático que **redirija todas las rutas a `index.html`** (Netlify: `_redirects` con `/* /index.html 200`; Vercel: *rewrite* de `/(.*)` a `/index.html`). No subas el `environment.ts` modificado.
