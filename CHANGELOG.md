# Changelog

Todos los cambios importantes de este proyecto serán documentados aquí.

El formato está basado en Keep a Changelog.

---

## [1.0.0] - 2026-09-26

### 🚀 Añadido

- API REST desarrollada con ASP.NET Core 10.
- Implementación de repositorios para Cafés y Especialidades.
- Interfaces para desacoplar la capa de acceso a datos.
- Configuración de CORS para futuras integraciones con Angular.
- Configuración de autenticación JWT.
- Diagnóstico seguro de conexión en Program.cs.
- Archivo README.md para documentación del proyecto.

### 🗄️ Base de Datos

- Integración con PostgreSQL.
- Integración con Supabase.
- Configuración de Npgsql como proveedor de acceso a datos.
- Configuración de cadenas de conexión mediante appsettings.Development.json.

### 🔄 Migración

- Migración desde MySQL local.
- Eliminación de dependencias heredadas de Clever Cloud.
- Reemplazo de MySqlConnector por Npgsql.
- Actualización de repositorios para trabajar con PostgreSQL.

### ✅ CRUD Validado

#### Cafés

- GET /api/cafes
- GET /api/cafes/{id}
- POST /api/cafes
- PUT /api/cafes/{id}
- DELETE /api/cafes/{id}

#### Especialidades

- GET /api/especialidades

### 🛠️ Corregido

- Eliminada la configuración antigua almacenada en User Secrets.
- Corrección de conflictos entre MySQL local y PostgreSQL Supabase.
- Corrección del error de conexión SSL.
- Eliminado warning MSB3884 relacionado con MinimumRecommendedRules.ruleset.
- Limpieza del archivo CafeApi.csproj.

### 🔍 Aprendizajes Técnicos

- Uso de dotnet user-secrets para depuración de configuraciones.
- Diagnóstico de cadenas de conexión en ASP.NET Core.
- Configuración de entornos Development y Production.
- Migración de motores de base de datos sin afectar la arquitectura del proyecto.

### 📌 Estado Actual

- ✅ CRUD Cafés funcionando.
- ✅ CRUD Especialidades funcionando.
- ✅ PostgreSQL funcionando.
- ✅ Supabase funcionando.
- ✅ Npgsql funcionando.
- ✅ API validada mediante Postman.


### Seguridad

Se implementaron dos roles:

#### Administrador

Acceso completo a operaciones CRUD.

#### Cliente

Acceso limitado a lectura y creación de registros.

#### Validaciones realizadas

- ✅ JWT Authentication
- ✅ Role-Based Authorization
- ✅ 401 Unauthorized
- ✅ 403 Forbidden

### 🚧 Próximos Pasos

-
- Integrar Google Sign-In.
- Conectar Angular con CafeApi.
- Implementar roles y autorización.
- Documentar endpoints.
- Despliegue en producción.

## [1.2.0] - 2026-09-25
 
### 🚀 Añadido
 
- Swagger UI.
- OpenAPI Documentation.
- JWT Authentication.
- Endpoint POST /api/auth/login.
- Roles Administrador y Cliente.
- Role-Based Authorization.
 
### 🔐 Seguridad
 
Administrador:
 
- GET
- POST
- PUT
- DELETE
 
Cliente:
 
- GET
- POST
- PUT (403 Forbidden)
- DELETE (403 Forbidden)
 
### ✅ Validado
 
JWT Authentication:
 
- ✅ Generación de Token
- ✅ Bearer Token
- ✅ Claims
- ✅ Roles
 
Autorización:
 
- ✅ 401 Unauthorized
- ✅ 403 Forbidden
- ✅ Protección de POST
- ✅ Protección de PUT
- ✅ Protección de DELETE
 
Swagger:
 
- ✅ Swagger UI
- ✅ OpenAPI
- ✅ Documentación automática de endpoints
 
### 🗄 Base de Datos
 
- PostgreSQL funcionando correctamente.
- Supabase funcionando correctamente.
- CRUD completamente validado.
 
---

## [1.3.0] - 2026-09-25

### 🚀 Añadido

#### DTOs

- CreateCafeDto
- UpdateCafeDto
- CafeResponseDto

#### Validaciones

Implementadas mediante DataAnnotations:

- Required
- StringLength
- Range

#### Reglas de negocio

Nuevo sistema de disponibilidad de stock:

- Agotado
- Pocas unidades
- Disponible
- Alta disponibilidad

#### Información de respuesta

Los endpoints GET ahora utilizan CafeResponseDto en lugar de exponer directamente la entidad Cafe.

Campos añadidos:

- StockDisponible
- Disponible
- EstadoStock

### ✅ Validado

POST /api/cafes

- DTO de creación
- Validaciones automáticas
- Respuestas 400 Bad Request

PUT /api/cafes/{id}

- DTO de actualización
- Validaciones automáticas
- Respuestas 400 Bad Request

GET /api/cafes

- DTO de respuesta
- Información orientada al cliente
- Estado de stock calculado

### 🏗 Arquitectura

Separación completa entre:

- Entidades de dominio
- DTOs de entrada
- DTOs de salida


## [1.4.0] - 2026-09-25

### Añadido

- Middleware global de manejo de excepciones.
- Captura centralizada de errores no controlados.
- Respuestas JSON uniformes para errores.

### Validado

- Captura de excepciones mediante ExceptionMiddleware.
- Respuestas HTTP 500 estandarizadas.

### Beneficios

- Menos código repetido.
- Mejor integración con Angular.
- API más preparada para producción.


## [1.5.0] - 2026-09-25
 
### Añadido
 
#### Logging
 
Implementación de auditoría mediante ILogger.
 
Eventos registrados:
 
- Consulta de lista de cafés.
- Consulta de café por Id.
- Creación de cafés.
- Actualización de cafés.
- Eliminación de cafés.
 
### Validado
 
- LogInformation
- LogWarning
- Inyección de ILogger
- Auditoría CRUD completa
 
### Beneficios
 
- Trazabilidad de operaciones.
- Diagnóstico de incidencias.
- Preparación para producción.

## [1.5.0] - 2026-09-25
 
### Añadido
 
#### Logging
 
Implementación de auditoría mediante ILogger.
 
Se registran los siguientes eventos:
 
- Consulta de lista de cafés.
- Consulta de cafés por identificador.
- Creación de cafés.
- Actualización de cafés.
- Eliminación de cafés.
- Recursos no encontrados.
- Excepciones no controladas.
 
#### Middleware
 
Integración del middleware global de excepciones con logging.
 
### Validado
 
- LogInformation
- LogWarning
- LogError
- Auditoría completa CRUD
- Registro de errores globales
 
### Beneficios
 
- Trazabilidad de operaciones.
- Diagnóstico de incidencias.
- Preparación para producción.

## [1.6.0] - 2026-09-25

### Añadido

#### DTOs de autenticación

- LoginRequestDto
- LoginResponseDto
- UserDto

### Cambios

- AuthController migrado para utilizar contratos DTO.
- Eliminados objetos de respuesta anónimos.
- Contratos preparados para Angular.

### Beneficios

- Tipado fuerte.
- Mejor integración con Swagger.
- Contratos estables para frontend.
- Base para futuras funcionalidades de usuario autenticado.

## [1.7.0] - 2026-09-25

### Añadido

#### Dominio Usuario

Nueva entidad:

- Usuario

Campos:

- Id
- Email
- Nombre
- Role
- EsGoogleUser
- FechaCreacion

#### DTOs

- UserDto

### Arquitectura

Preparación del dominio para futuras capacidades ecommerce:

- Cart
- CartItem
- Orders
- Users

## [1.8.0] - 2026-09-25

### Añadido

#### Dominio Ecommerce

Nueva entidad:

- Cart

Campos:

- Id
- UserId
- FechaCreacion
- FechaActualizacion
- Estado

### Arquitectura

Preparación para futuras funcionalidades:

- CartItem
- Orders
- Checkout
- Payments

## [1.8.0] - 2026-09-25

### Añadido

#### Dominio Ecommerce

- Usuario
- Cart
- CartItem

#### DTOs

- UserDto
- CartResponseDto
- CartItemResponseDto

#### Repositorios

- ICartRepository
- CartRepository

### Arquitectura

Preparación para:

- Carrito de compras
- Pedidos
- Checkout
- Pagos

### Mejoras

- Contratos asíncronos mediante Task<T>.

### Arquitectura

Se definió oficialmente el uso de la tabla:

- public.users

como origen de datos para el dominio ecommerce.

La tabla:

- auth.users

permanece reservada para autenticación interna de Supabase.

## [1.10.0] - 2026-09-26

### Añadido

#### Cloudinary

- CloudinarySettings
- ICloudinaryService
- CloudinaryService
- UploadImageDto
- ImagesController

### Catálogo

- Integración de ImagenUrl en cafés.
- Almacenamiento de imágenes mediante Cloudinary.
- La base de datos almacena únicamente la URL.

### Infraestructura

- Registro de Cloudinary en Program.cs.
- Preparado para integración con Angular.

## [1.11.0] - 2026-09-30

### 🚀 Añadido

#### Entity Framework Core

- `Data/AppDbContext.cs` con configuraciones Fluent API en `Data/Configurations/` (una por entidad).
- Paquetes: Npgsql.EntityFrameworkCore.PostgreSQL 10.0.3, Microsoft.EntityFrameworkCore.Design 10.0.12, EFCore.NamingConventions 10.0.1 (snake_case).
- `dotnet-ef` 10.0.12 como herramienta local (`.config/dotnet-tools.json`).
- Migración `InitialCreate` con las tablas `variedades` y `cafes`, sus CHECK, la FK `ON DELETE RESTRICT` y el índice único `(lower(nombre), variedad_id, presentacion_gramos)`.
- Variedades iniciales mediante `HasData`: Castillo, Geisha y Moka.

#### Catálogo

- Enum `Presentacion` (340 g y 500 g), guardado en `presentacion_gramos` con CHECK.
- `GET /api/presentaciones`.
- Nuevos campos en cafés: `presentacion_gramos`, `imagen_public_id`, `created_at` y `updated_at` (UTC).
- Precio en pesos colombianos: `numeric(12,0)`, mayor que cero y sin decimales.
- DTOs `CreateVariedadDto`, `UpdateVariedadDto`, `PresentacionResponseDto` e `ImagenSubidaDto`.
- Respuestas 409 en español para cafés duplicados, variedades duplicadas y variedades con cafés asociados.
- `variedadId` inexistente → 400.

#### Cloudinary

- `POST /api/images` acepta Base64 con o sin prefijo data URI, solo jpg/png/webp y máximo 5 MB, y responde `{ imageUrl, publicId }`. Las imágenes van a la carpeta `cafes`.
- `ICloudinaryService.DeleteImageAsync`: al cambiar la imagen de un café se borra la anterior, y al eliminar un café se borra su imagen. Los fallos se registran en el log sin romper la operación.

#### Documentación

- `CLAUDE.md` con arquitectura, modelo, endpoints, configuración, decisiones y pendientes.
- `CafeApi.http` con peticiones reales (login y uso del token).

### 🔄 Cambiado

- Acceso a datos migrado de ADO.NET a EF Core. Los repositorios reciben `AppDbContext` por DI, son 100 % asíncronos y leen con `AsNoTracking`.
- **Especialidad → Variedad** en todo el proyecto (modelo, DTOs, repositorio, controlador); la ruta pasa a ser `/api/variedades` y la tabla `variedades`.
- `POST /api/variedades`, `PUT` y `DELETE` ahora requieren el rol Administrador; los `GET` siguen siendo públicos.
- `POST` y `PUT` de cafés devuelven `CafeResponseDto` (201 y 200) en lugar de la entidad.
- `CafeResponseDto`: `stock` (antes `stockDisponible`), `variedadId`, `variedadNombre`, `presentacionGramos` e `imagenPublicId`.
- Microsoft.AspNetCore.Authentication.JwtBearer y Microsoft.AspNetCore.OpenApi alineados en 10.0.12; Npgsql actualizado a 10.0.3.
- La configuración local va en `appsettings.Development.json` (ignorado por Git) en lugar de User Secrets; `appsettings.example.json` queda solo con marcadores.
- `ExceptionMiddleware` responde un mensaje genérico en español; el detalle de la excepción solo va al log.
- Swagger incluye la definición de seguridad Bearer (botón *Authorize*).

### 🗑️ Eliminado

- `database/schema.sql`: ahora las migraciones son la fuente de verdad del esquema.
- `Models/CloudinarySettings.cs` (duplicado; queda `Configurations/CloudinarySettings.cs`).
- `Models/LoginRequest.cs` (sin uso) y `OpenApiReference.cs`.
- `Console.WriteLine` de depuración y constructor comentado en `CafesController`.
- `<Folder Include="Services\">` del `.csproj`.

### ⏳ Pendiente

- El carrito (`Cart`, `CartItem`, `CartRepository`) y los usuarios (`Usuario`, `UserRepository`) no están en el DbContext ni registrados en DI.
- Rotar la `Jwt:Key` que quedó en el historial de Git.


## [1.12.0] - 2026-09-30

### 🏗 Reorganización

- Repositorio dividido en `backend/` (proyecto .NET, con su `.config/` y `seed/`) y `frontend/` (Angular), con `git mv` para conservar el historial.
- `.gitignore` actualizado con reglas de Node/Angular (`node_modules/`, `dist/`, `.angular/`) y de Playwright (`test-results/`, `playwright-report/`, `e2e/capturas/`).

### 🚀 Añadido

#### Marca y productos de ejemplo

- Marca **Altura** ("Café de especialidad colombiano") con paleta crema, papel, espresso, café, terracota y verde hoja.
- 6 ilustraciones de producto (bolsa stand-up con válvula, color por variedad, 500 g más grande) en SVG y PNG de 1200×1200 en `backend/seed/imagenes/`, con su filosofía visual en `DISENO.md`.
- `backend/seed/seed-productos.ps1`: script idempotente que hace login como Administrador, sube cada imagen a Cloudinary y crea los 6 cafés de ejemplo. Compatible con PowerShell 5.1 (UTF-8 con BOM, cuerpos en bytes UTF-8).

#### Frontend Angular 22 (`frontend/`, `altura-web`)

- Home: navbar con buscador y menú móvil, banner con ilustración SVG propia, catálogo "Nuestros cafés" desde `GET /api/cafes`, filtros por variedad desde `GET /api/variedades`, búsqueda por nombre, origen o variedad (sin tildes), *skeletons*, error con "Reintentar" y estado vacío.
- Card de café con imagen optimizada de Cloudinary (`f_auto,q_auto,w_600`), precio en COP (`$ 42.000`), disponibilidad y badge "Agotado".
- Login y Registro visuales en dos paneles, con formularios reactivos, validaciones en español y mostrar/ocultar contraseña. No llaman a la API.
- Títulos de pestaña por ruta; la ruta `**` redirige al Home.
- Bootstrap 5 (solo CSS) personalizado con variables, Bootstrap Icons y fuentes Fraunces e Inter vía @fontsource.
- Pruebas: 14 unitarias (Vitest) y 11 e2e (Playwright, `npm run e2e`) que cubren el catálogo, los filtros, la navegación, los formularios sin llamadas a la API, el estado "API caída", la consola sin errores y las capturas a 1440 y 375 px.

### 🔄 Cambiado

- README con la puesta en marcha paso a paso de backend, productos de ejemplo y frontend.
- CLAUDE.md con la nueva estructura, la marca, el frontend, el seed, las decisiones y los problemas encontrados.

## [1.13.0] - 2026-09-30

### 🎨 Rediseño del frontend

#### Inicio (`/`) y Productos (`/productos`) en vistas separadas

- Layout compartido (navbar + footer) con enlaces Inicio y Productos con estado activo; el buscador lleva a `/productos?q=` desde cualquier vista.
- Transiciones de ruta con View Transitions (sin animación cuando solo cambian los filtros o con "reducir movimiento").
- **Inicio**: hero asimétrico con fotografía, "Selección de la casa" (3 cafés de la API: con stock primero, precio descendente), "De la montaña a tu taza" (lámina editorial de 4 fotos), mapa de orígenes de Colombia con marcadores calculados de la API y enlace al catálogo filtrado, variedades desde la API con su color y texto editorial, cierre y footer completo.
- **Productos**: filtros combinables (variedad, presentación, origen, solo disponibles), orden (destacados, precio, nombre) y búsqueda sin tildes, todo reflejado en la URL; hoja de filtros en móvil con contador; estado vacío; grilla con un café destacado 2×2 y reordenamiento animado.
- **Vista rápida**: panel lateral (escritorio) u hoja inferior (móvil) con los datos de `GET /api/cafes/{id}`, selector de cantidad y "Agregar al carrito" deshabilitado ("Próximamente"); se cierra con X, Escape y clic fuera, con el foco atrapado.
- Cards con imagen grande, variedad con su color, origen, precio en COP y disponibilidad ("Quedan N" en tono de alerta si stock ≤ 5, "Agotado").

#### Login y Registro

- Panel de marca con fotografía a sangre; formularios con mejor jerarquía, errores con ícono y aparición suave, y foco más visible. Misma funcionalidad: validaciones, mostrar/ocultar contraseña y aviso "próximamente", sin llamadas a la API.

#### Sistema de diseño

- Tokens en `styles.css`: paleta con derivados documentados, escala tipográfica fluida, espaciado, regla de radios, sombras teñidas, curvas y duraciones de movimiento, capas.
- Fraunces e Inter en sus versiones variables (eje óptico de Fraunces).
- Textura de grano de papel; movimiento reducido sin desplazamientos.

#### Imágenes

- Nuevo set de imágenes de producto: bolsa kraft en tres cuartos con un grabado de la región de origen en cada etiqueta (PNG 1600×1600).
- `seed-productos.ps1 -ActualizarImagenes`: reemplaza la imagen de los cafés existentes (sin dejar huérfanas en Cloudinary).
- Fotografías del sitio de Unsplash subidas a Cloudinary (carpeta `sitio`) con `seed/subir-imagenes-sitio.ps1`; créditos en CLAUDE.md.
- Mapa de Colombia generado de Natural Earth (dominio público).

### ✅ Calidad

- Accesibilidad verificada con axe-core en las 4 vistas y la vista rápida (1440 y 375 px): 0 violaciones; objetivos táctiles ≥ 44 px; sin desbordamiento horizontal.
- 24 pruebas unitarias (Vitest) y 16 e2e (Playwright) para la nueva estructura.

### 🗑️ Eliminado

- Página `home` (reemplazada por `inicio`), ilustración SVG de bolsas del banner y servicio `Busqueda` (la búsqueda vive en la URL).

---

## [1.14.0] - 2026-10-01

Rediseño inmersivo "Ascenso" y panel de administración de inventario (rama `feature/rediseno-inmersivo`).

### 🎨 Rediseño "Ascenso"

- **Concepto**: hacer scroll es subir la montaña, del valle (1.200 msnm) a la cumbre (2.100 msnm), con un altímetro fijo. Elegido entre tres conceptos con maqueta; incorpora el vuelo de la bolsa y el color por variedad.
- **Sistema de diseño propio** (sin Bootstrap): paleta niebla, bosque y cereza; Bricolage Grotesque (display condensado) y Geist Mono; tokens de espaciado, forma, profundidad y movimiento; logo con la cereza en la cumbre.
- **Inicio**: hero con la palabra "Altura" entre crestas de montaña (entrada en cascada y parallax con GSAP ScrollTrigger), selección de la casa, galería horizontal anclada "De la montaña a tu taza", cinta de notas de cata con datos de la API, mapa de orígenes, variedades y cierre "Llegaste a la cumbre".
- **Productos**: encabezado con curvas de nivel, cards con inclinación 3D y brillo (solo con mouse), toda la card abre el producto; estados de carga, error y vacío nuevos.
- **Vista rápida**: la bolsa vuela desde la card (View Transitions) y el panel toma el color de la variedad; notas de cata.
- **Login y Registro**: amanecer con niebla en movimiento, línea de foco, visto de campo válido y medidor de seguridad de la contraseña. Siguen siendo solo visuales.
- Navbar transparente que se vuelve sólido, footer con cresta y enlace discreto "Acceso administrador".
- Versión completa con "reducir movimiento" y efectos adaptados a pantallas táctiles.

### 🔐 API: autorización por políticas

- `Seguridad/Roles` y `Seguridad/Politicas` con la política `GestionInventario` (hoy: rol Administrador) en todas las escrituras de cafés, variedades e imágenes. **`POST /api/cafes` ya no acepta cualquier JWT** (la cuenta Cliente recibe 403).
- `GET /api/auth/me`: correo, nombre y roles del token. Las cuentas de prueba tienen nombre visible.
- `DELETE /api/images?publicId=cafes/...`: borra imágenes subidas que no se usaron (solo carpeta `cafes/`, 409 si un café la usa).
- `CafeApi.http` con casos 401, 403, `/me` y borrado de imágenes.

### 🛠️ Panel de administración (`/admin`)

- Acceso real en `/admin/ingresar` (las cuentas sin permiso no entran), guard `canMatch` por permiso, interceptor con el token solo para la API (401 cierra la sesión, 403 avisa), sesión en `sessionStorage` con cierre automático al expirar y mapa de permisos centralizado.
- **Inventario**: búsqueda, crear y editar en panel lateral con imagen (validación de tipo y tamaño, vista previa y limpieza si el guardado falla), eliminar con confirmación y avisos en español.
- **Variedades**: crear, editar y eliminar (409 si tiene cafés).

### ✅ Calidad

- `ng build` sin advertencias; CSS inicial de ~330 kB a ~99 kB; GSAP en un chunk diferido.
- axe-core: 0 violaciones en todas las vistas (tienda y panel), a 1440 y 375 px, con y sin movimiento reducido.
- LCP del Inicio ~0,4 s y CLS ~0 en local.
- 27 pruebas unitarias y 56 e2e (dos proyectos: con movimiento y con movimiento reducido), capturas y grabación del hero y de la vista rápida.

### 🗑️ Eliminado

- Bootstrap (CSS), Fraunces, Inter, `PanelMarca` y el grano de papel.

---

## [1.15.0] - 2026-10-01

Ampliación del módulo de productos: procesos, 9 variedades, catálogo de 25 cafés e imágenes nuevas (rama `feature/rediseno-inmersivo`).

### 🗄️ API y base de datos

- Nueva tabla **`procesos`** (nombre único de hasta 50 caracteres y descripción) con Lavado, Honey y Fermentado.
- **9 variedades** con descripción: Castillo, Caturra, Colombia, Típica, Tabi, Bourbon Rojo, Bourbon Amarillo, Bourbon Rosado y Geisha (se retiró Moka).
- `cafes.proceso_id`: obligatorio, FK con `ON DELETE RESTRICT`.
- Índice único nuevo `ux_cafes_nombre_variedad_proceso_presentacion` (nombre sin mayúsculas + variedad + proceso + presentación). Mensaje de 409: "Ya existe un café con ese nombre, variedad, proceso y presentación."
- Una sola migración: `AgregarProcesosYVariedades`.
- `GET /api/procesos` (público). Los cafés devuelven `procesoId` y `procesoNombre`; `procesoId` es obligatorio al crear y editar, y uno inexistente responde 400.
- `CafeApi.http`: el proceso en todos los cuerpos, `GET /api/procesos`, proceso inexistente (400) y el mismo café con otro proceso (201).

### ☕ Catálogo e imágenes

- Se borraron los 6 cafés anteriores (y sus imágenes en Cloudinary).
- Catálogo de **25 cafés** de cinco regiones (Santander, Huila, Nariño, Magdalena y Cauca), en `backend/seed/catalogo.json`.
- `seed-productos.ps1` lee el catálogo y envía el proceso. Si un guardado falla, borra la imagen recién subida. Es idempotente: la segunda ejecución omite los 25.
- **Set 3 de imágenes, "Herbario Kraft"**:
  - Bolsa kraft de frente sobre gris neutro, con una rama de café ilustrada sobre una banda de granos tostados.
  - Cerezas del color de la variedad, emblema hexagonal "Café Altura" y sello circular del proceso con su color.
  - La bolsa de 500 g es más grande. PNG de 378 a 530 kB.
  - Las genera `frontend/herramientas/generar-bolsas.mjs` con Playwright y `sharp`.

### 🎨 Frontend

- **Etiquetas de café** de variedad (muestra de color) y de proceso (píldora con ícono y color propio), en las cards y en la vista rápida. La ficha de la vista rápida incluye el proceso y cómo se nota en la taza.
- **Filtros**:
  - Por proceso, con chips cargados desde `/api/procesos`, guardado en la URL (`?proceso=`) y combinable con los demás.
  - Cada chip muestra cuántos cafés tiene.
  - "Ver las 9 variedades" despliega la lista completa y la variedad elegida nunca se esconde.
  - El buscador también encuentra por proceso.
- **Ficha "Tres procesos, tres tazas"** dentro de la grilla del catálogo. Explica cada proceso, filtra al elegir uno y ocupa justo las columnas que faltan para que ninguna fila quede incompleta.
- **9 colores de variedad y 3 de proceso** con contraste AA verificado. Textos de marca de cada variedad y cada proceso.
- **Inicio**: las variedades pasan a una cuadrícula de 9 fichas con el número de cafés de cada una. El mapa muestra los 5 orígenes y los destacados salen del catálogo nuevo.
- **Panel de administración**: select de proceso al crear y editar, con el proceso en la tabla y en la búsqueda.
- Las fotos de producto se recortan en Cloudinary, así que la bolsa llena más la card y mide lo mismo durante el vuelo a la vista rápida.

### ✅ Calidad

- `dotnet build` y `ng build` sin advertencias.
- 32 pruebas unitarias, con pruebas nuevas de la lógica del catálogo y del servicio de procesos.
- 62 pruebas e2e, entre ellas:
  - 25 cafés y filtro por proceso.
  - Variedad + proceso + presentación en la URL y conservados al recargar.
  - Búsquedas "honey" y "rosado".
  - Vista rápida con el proceso y mapa con 5 orígenes.
  - Ficha de procesos y alta y edición con proceso en el panel.
- axe-core: 0 violaciones, también con filtros aplicados.
- Al terminar, la base tiene exactamente los 25 cafés y Cloudinary tiene 25 imágenes, sin restos de pruebas.

---

## [1.15.1] - 2026-10-02

Ajustes de diseño en Productos.

### 🎨 Cambiado

- **Grilla uniforme**: ya no hay card gigante; todas las cards miden lo mismo (3 columnas en escritorio, 2 en tableta, 1 en móvil) y sus textos quedan alineados (cada fila de la card ocupa una línea).
- **Bloque "Tres procesos, tres tazas"** arriba de la grilla, a todo el ancho y compacto (~200 px): "Ver N cafés" aplica el filtro del proceso, que se marca en el bloque; en móvil, los procesos se desplazan en horizontal.
- **Filtros ordenados**: Variedad, Proceso y Origen como listas verticales con su color o ícono y el número de cafés a la derecha; Presentación con tres botones iguales. Mismo estilo en la hoja móvil.

### 🐛 Corregido

- Al filtrar, la página ya no salta arriba (`scroll: 'manual'` al escribir la URL).
- Desbordamiento horizontal a 375 px causado por el texto oculto de los botones del bloque de procesos.
- Anillo de foco recortado en la barra lateral con scroll.

### ✅ Calidad

- `ng build` sin advertencias; 32 pruebas unitarias y 64 e2e en verde (nuevas: alineación de las cards, bloque de procesos sin salto de scroll, sin desplazamiento horizontal en móvil).

---

## [1.16.0] - 2026-10-06

Guía 1 del profesor: usuarios, registro, login y JWT (`docs/guias/guia-1-usuarios-login-jwt.md`).

### 🚀 Añadido

- **Tabla `usuario`** (nombre, email único en minúsculas, contraseña con hash de `PasswordHasher` y rol) y **dueño de cada café** (`cafes.usuario_id`, FK `RESTRICT`), con la migración `AddUsuario`.
- **`POST /api/auth/Register`** (200 o 400 "El usuario ya existe.") y **`POST /api/auth/Login`** (200 `{ token }` o 401 "Usuario o contraseña incorrectos."), con `UsuarioDto`, `LoginDto`, `IUsuarioRepository` y `UsuarioRepository` como la guía.
- JWT firmado por la API con la sección **`JwtSettings`** (emisor `EcommerceApi`, audiencia `EcommerceAngular`, 60 minutos) y una clave nueva de 64 bytes; el token lleva id, nombre, correo y rol.
- **`Admin:Correos`**: los correos de esa lista se registran como Administrador.
- `POST /api/cafes` guarda como dueño al usuario del token; `CafeResponseDto` incluye `usuarioId` y `usuarioNombre`.
- **Frontend**: `/registro` y `/login` conectados a la API; el nombre, el correo y el rol se leen del token; la sesión dura lo que el token (`localStorage`). Menú de cuenta en el navbar (inicial, nombre, correo, "Panel de administración" solo para Administrador y "Cerrar sesión"). Columna "Creado por" en el inventario.

### 🔄 Cambiado

- El panel usa la misma sesión de `/login`: sin sesión lleva a `/login` y con una cuenta Cliente muestra "No tienes permiso". Un 401 de la API cierra la sesión y lleva a `/login`.
- `GET /api/auth/me` lee el usuario de la base de datos con el id del token.
- `seed-productos.ps1` inicia sesión con `POST /api/auth/Login` y comprueba el rol con `GET /api/auth/me`.
- Los 25 cafés del catálogo se borraron (con sus imágenes) y se volvieron a cargar con dueño.

### 🗑️ Eliminado

- Las dos cuentas fijas escritas en `AuthController`, el login con Google (`/api/auth/google` y el paquete `Google.Apis.Auth`), la sección `"Jwt"`, el `UserRepository` ADO.NET y la pantalla `/admin/ingresar`.

### ✅ Calidad

- `dotnet build` y `ng build` sin advertencias.
- 37 pruebas unitarias (nuevas: lectura de los claims del token y servicio `Auth`).
- 64 pruebas e2e, entre ellas: registro desde `/registro`, login correcto e incorrecto, menú de cuenta del Cliente sin panel, `/admin` sin permiso, café creado por el Administrador con "Creado por" y axe-core del login y del menú.
- Verificado por la API: Register 200/400, Login 200/401, `POST /api/cafes` 401 sin token, 403 con un Cliente y 201 con un Administrador; GET públicos 200; contraseñas guardadas como hash (`AQAAAA…`).
