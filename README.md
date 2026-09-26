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