# ☕ CafeApi

API REST desarrollada con ASP.NET Core 10 para la gestión de cafés y especialidades.

## 🚀 Descripción

CafeApi es una API REST construida siguiendo una arquitectura basada en capas mediante Controllers, Interfaces y Repositories.

El proyecto permite gestionar cafés y sus especialidades mediante operaciones CRUD completas y utiliza PostgreSQL alojado en Supabase como motor de base de datos.

---

## 🛠 Tecnologías Utilizadas

### Backend

- ASP.NET Core 10
- C#
- REST API
- JWT Authentication

### Base de Datos

- PostgreSQL
- Supabase
- Npgsql

### Herramientas

- Visual Studio
- VS Code
- Git
- GitHub
- Postman

---

## 📁 Estructura del Proyecto

```text
CafeApi
│
├── Controllers
├── Interfaces
├── Models
├── Repositories
├── Properties
├── database
│
├── Program.cs
├── appsettings.json
├── appsettings.Development.json
├── README.md
└── CHANGELOG.md
```

---

## 🗄️ Configuración de Base de Datos

```text
Motor     : PostgreSQL
Proveedor : Supabase
Conector  : Npgsql
Puerto    : 5432
```

### Diagnóstico de conexión

La aplicación muestra durante el arranque:

```text
========================================
Entorno       : Development
Base de Datos : PostgreSQL (Supabase)
Puerto        : 5432
========================================
```

Esto permite verificar la configuración sin exponer credenciales.

---

## ✅ Funcionalidades Implementadas

### Cafés

- Obtener todos los cafés
- Obtener un café por Id
- Crear un café
- Actualizar un café
- Eliminar un café

### Especialidades

- Obtener especialidades

---

## 📡 Endpoints

### Cafés

#### Obtener 

## Seguridad

### JWT Authentication

El sistema implementa autenticación mediante JSON Web Tokens (JWT).

### Roles

#### Administrador

- Crear cafés
- Actualizar cafés
- Eliminar cafés

#### Cliente

- Consultar cafés
- Crear cafés
- Sin permisos de modificación o eliminación

## 🔐 Seguridad
 
### JWT Authentication
 
La API utiliza JSON Web Tokens (JWT) para proteger los endpoints que modifican datos.
 
### Roles
 
#### Administrador
 
Permisos:
 
- Crear cafés
- Actualizar cafés
- Eliminar cafés
 
#### Cliente
 
Permisos:
 
- Consultar cafés
- Crear cafés
 
Restricciones:
 
- No puede actualizar cafés
- No puede eliminar cafés
 
---
 
## ✅ Endpoints
 
### Auth
 
```http
POST /api/auth/login
POST /api/auth/google
```
 
### Cafés
 
```http
GET /api/cafes
GET /api/cafes/{id}
POST /api/cafes
PUT /api/cafes/{id}
DELETE /api/cafes/{id}
```
 
### Especialidades
 
```http
GET /api/especialidades
```
 
---
 
## 📖 Documentación
 
Swagger disponible en:
 
```text
/swagger
```
 
OpenAPI JSON:
 
```text
/openapi/v1.json
```
 
---
 
## ✅ Estado Actual
 
### Base de Datos
 
- ✅ PostgreSQL
- ✅ Supabase
- ✅ Npgsql
 
### API
 
- ✅ CRUD Cafés
- ✅ CRUD Especialidades
 
### Seguridad
 
- ✅ JWT Authentication
- ✅ Authorization
- ✅ Roles Administrador y Cliente
 
### Documentación
 
- ✅ OpenAPI
- ✅ Swagger UI
 
---
 
## 🚧 Próximos Pasos
 
- Integración completa JWT en Swagger (Authorize)
- Login con Google
- Angular Frontend
- Deploy
 
---

## DTOs y Validaciones

La API implementa DTOs para separar los modelos de entrada y salida de las entidades de base de datos.

### DTOs de Entrada

#### CreateCafeDto

Utilizado para la creación de cafés.

Validaciones:

- Especialidad obligatoria.
- Nombre obligatorio.
- Origen obligatorio.
- Stock mayor o igual a cero.
- Precio mayor que cero.

#### UpdateCafeDto

Utilizado para la actualización de cafés.

Validaciones:

- Especialidad obligatoria.
- Nombre obligatorio.
- Origen obligatorio.
- Stock mayor o igual a cero.
- Precio mayor que cero.

### DTOs de Respuesta

#### CafeResponseDto

Expone información orientada al cliente:

- Id
- Especialidad
- Nombre
- Origen
- StockDisponible
- Disponible
- EstadoStock
- Precio

### Estado de Stock

La API calcula automáticamente el estado del inventario:

| Stock | Estado |
|---------|---------|
| 0 | Agotado |
| 1 - 10 | Pocas unidades |
| 11 - 50 | Disponible |
| 51+ | Alta disponibilidad |

### Beneficios

- Validación automática mediante DataAnnotations.
- Separación entre entidades y contratos de API.
- No se exponen propiedades internas innecesarias.
- Respuestas orientadas al negocio.
 
## Manejo Global de Errores
 
La API implementa un middleware global de excepciones.
 
Todas las excepciones no controladas son interceptadas y transformadas en respuestas JSON uniformes.
 
Ejemplo:
 
```json
{
"success": false,
"message": "Ha ocurrido un error inesperado.",
"detail": "Descripción del error"
}

## Logging y Auditoría
 
La API implementa logging mediante ILogger de ASP.NET Core.
 
### Operaciones auditadas
 
- Consulta de todos los cafés.
- Consulta de cafés por identificador.
- Creación de cafés.
- Actualización de cafés.
- Eliminación de cafés.
 
### Beneficios
 
- Seguimiento de operaciones.
- Diagnóstico de incidencias.
- Auditoría de actividad.
- Preparación para producción.

## Logging y Auditoría
 
La API implementa auditoría mediante ILogger de ASP.NET Core.
 
### Eventos registrados
 
#### Consultas
 
- Listado de cafés.
- Consulta por identificador.
 
#### Escritura
 
- Creación de registros.
- Actualización de registros.
- Eliminación de registros.
 
#### Errores
 
- Recursos inexistentes.
- Excepciones capturadas por el middleware global.
 
### Beneficios
 
- Seguimiento de operaciones.
- Diagnóstico de fallos.
- Trazabilidad.
- Base para despliegues productivos.

## 👨‍💻 Autor
 
Pablo Santamaría