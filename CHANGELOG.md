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

### 🚧 Próximos Pasos

- Implementar autenticación JWT completa.
- Integrar Google Sign-In.
- Conectar Angular con CafeApi.
- Implementar roles y autorización.
- Documentar endpoints.
- Despliegue en producción.