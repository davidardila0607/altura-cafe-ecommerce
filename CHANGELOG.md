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