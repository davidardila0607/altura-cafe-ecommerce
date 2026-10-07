<#
.SYNOPSIS
    Carga los productos de ejemplo de Altura (cafés + imágenes en Cloudinary) a través de la API.

.DESCRIPTION
    El catálogo (25 cafés) está en seed/catalogo.json: es la misma fuente que usa el
    generador de imágenes (frontend/herramientas/generar-bolsas.mjs).

    1. Inicia sesión con POST /api/auth/Login (Guía 1) y lee el token de la propiedad
       "token". Comprueba el rol con GET /api/auth/me: solo un Administrador puede crear
       cafés, y cada café queda con esa cuenta como dueño (usuarioNombre).
    2. Resuelve el id de cada variedad y de cada proceso por su nombre
       (GET /api/variedades y GET /api/procesos).
    3. Por cada producto: si ya existe (mismo nombre sin importar mayúsculas, variedad,
       proceso y presentación) lo omite SIN subir imagen; si no, sube la imagen con
       POST /api/images y crea el café con POST /api/cafes enviando imagenUrl e
       imagenPublicId. Si la creación falla, borra la imagen recién subida
       (DELETE /api/images) para no dejarla huérfana en Cloudinary.

    Es idempotente: se puede ejecutar varias veces sin duplicar cafés ni imágenes.

    Con -ActualizarImagenes, a los cafés que ya existen se les sube la imagen nueva de
    seed/imagenes/ y se hace PUT /api/cafes/{id} conservando sus datos actuales (nombre,
    variedad, proceso, presentación, origen, stock y precio) y enviando el nuevo imagenUrl e
    imagenPublicId. El backend borra la imagen anterior de Cloudinary. Los cafés que no
    existen se crean como en el modo normal.

    Compatible con Windows PowerShell 5.1 y PowerShell 7. El archivo está en UTF-8 con BOM
    y los cuerpos se envían como bytes UTF-8 para que las tildes lleguen bien a la API.

.EXAMPLE
    .\seed\seed-productos.ps1
    (pide correo y contraseña del Administrador; la contraseña no se ve al escribirla)

.EXAMPLE
    .\seed\seed-productos.ps1 -ApiBaseUrl http://localhost:5031/api -Email tu-correo@ejemplo.com

.EXAMPLE
    .\seed\seed-productos.ps1 -ActualizarImagenes
    (reemplaza las imágenes de los cafés existentes por las de seed/imagenes/)
#>
param(
    [string]$ApiBaseUrl = 'http://localhost:5031/api',
    [string]$Email,
    [SecureString]$Password,
    [switch]$ActualizarImagenes
)

$ErrorActionPreference = 'Stop'
$ApiBaseUrl = $ApiBaseUrl.TrimEnd('/')
$carpetaImagenes = Join-Path $PSScriptRoot 'imagenes'

# ✅ Catálogo de ejemplo (seed/catalogo.json, UTF-8).
$productos = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'catalogo.json') | ConvertFrom-Json

# ✅ Llama a la API y devuelve @{ Ok; Codigo; Datos; Error } sin lanzar excepción por códigos HTTP.
function Invoke-Api {
    param(
        [string]$Metodo,
        [string]$Ruta,
        $Cuerpo = $null,
        [string]$Token = $null
    )

    $parametros = @{
        Method      = $Metodo
        Uri         = "$ApiBaseUrl$Ruta"
        Headers     = @{}
        ContentType = 'application/json; charset=utf-8'
    }

    if ($Token) { $parametros.Headers['Authorization'] = "Bearer $Token" }

    if ($null -ne $Cuerpo) {
        $json = $Cuerpo | ConvertTo-Json -Depth 5 -Compress
        $parametros.Body = [System.Text.Encoding]::UTF8.GetBytes($json)
    }

    try {
        $datos = Invoke-RestMethod @parametros
        return @{ Ok = $true; Codigo = 200; Datos = $datos; Error = $null }
    }
    catch {
        $respuesta = $_.Exception.Response
        if ($null -eq $respuesta) { throw }
        return @{ Ok = $false; Codigo = [int]$respuesta.StatusCode; Datos = $null; Error = $_.ErrorDetails.Message }
    }
}

function Get-Clave([string]$nombre, [int]$variedadId, [int]$procesoId, [int]$gramos) {
    return '{0}|{1}|{2}|{3}' -f $nombre.Trim().ToLowerInvariant(), $variedadId, $procesoId, $gramos
}

# ===== Credenciales =====
if (-not $Email) { $Email = Read-Host 'Correo del Administrador' }
if (-not $Password) { $Password = Read-Host 'Contraseña' -AsSecureString }

$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
try {
    $passwordPlano = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

# ===== Login =====
Write-Host "API: $ApiBaseUrl"
$login = Invoke-Api -Metodo 'POST' -Ruta '/auth/Login' -Cuerpo ([ordered]@{ email = $Email; password = $passwordPlano })
$passwordPlano = $null

if (-not $login.Ok) {
    Write-Host "No se pudo iniciar sesión (HTTP $($login.Codigo)). Revisa el correo y la contraseña." -ForegroundColor Red
    exit 1
}
# ✅ La respuesta de Login es { token }; el rol se consulta con GET /api/auth/me.
$token = $login.Datos.token
$yo = Invoke-Api -Metodo 'GET' -Ruta '/auth/me' -Token $token
if (-not $yo.Ok -or @($yo.Datos.roles) -notcontains 'Administrador') {
    Write-Host "La cuenta '$Email' no tiene rol Administrador. Agrega el correo a Admin:Correos ANTES de registrarte o cambia el rol en la base de datos (ver CLAUDE.md)." -ForegroundColor Red
    exit 1
}
Write-Host "Sesión iniciada como $($yo.Datos.nombre) <$($yo.Datos.email)> (Administrador)." -ForegroundColor Green

# ===== Variedades y cafés existentes =====
$variedades = Invoke-Api -Metodo 'GET' -Ruta '/variedades'
if (-not $variedades.Ok) { Write-Host "No se pudieron leer las variedades (HTTP $($variedades.Codigo))." -ForegroundColor Red; exit 1 }

$idsVariedad = @{}
foreach ($v in $variedades.Datos) { $idsVariedad[$v.nombre.ToLowerInvariant()] = [int]$v.id }

$procesos = Invoke-Api -Metodo 'GET' -Ruta '/procesos'
if (-not $procesos.Ok) { Write-Host "No se pudieron leer los procesos (HTTP $($procesos.Codigo))." -ForegroundColor Red; exit 1 }

$idsProceso = @{}
foreach ($p in $procesos.Datos) { $idsProceso[$p.nombre.ToLowerInvariant()] = [int]$p.id }

$cafes = Invoke-Api -Metodo 'GET' -Ruta '/cafes'
if (-not $cafes.Ok) { Write-Host "No se pudieron leer los cafés (HTTP $($cafes.Codigo))." -ForegroundColor Red; exit 1 }

$existentes = @{}
foreach ($c in $cafes.Datos) { $existentes[(Get-Clave $c.nombre $c.variedadId $c.procesoId $c.presentacionGramos)] = $c }

# ===== Carga =====
$creados = 0; $actualizados = 0; $omitidos = 0; $fallidos = 0
if ($ActualizarImagenes) { Write-Host 'Modo: actualizar imágenes de los cafés existentes.' -ForegroundColor Cyan }

function Send-Imagen([string]$ruta) {
    $base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($ruta))
    return Invoke-Api -Metodo 'POST' -Ruta '/images' -Token $token -Cuerpo @{ imagenBase64 = "data:image/png;base64,$base64" }
}

# ✅ Borra una imagen subida que al final no se usó (solo carpeta cafes/).
function Remove-Imagen([string]$publicId) {
    $borrado = Invoke-Api -Metodo 'DELETE' -Ruta "/images?publicId=$([Uri]::EscapeDataString($publicId))" -Token $token
    if (-not $borrado.Ok) { Write-Host "          (no se pudo borrar la imagen sin usar $publicId)" -ForegroundColor Yellow }
}

foreach ($p in $productos) {
    $etiqueta = '{0} · {1} · {2} · {3} g' -f $p.nombre, $p.variedad, $p.proceso, $p.presentacion
    $variedadId = $idsVariedad[$p.variedad.ToLowerInvariant()]
    $procesoId = $idsProceso[$p.proceso.ToLowerInvariant()]

    if (-not $variedadId) {
        Write-Host "  FALLO   $etiqueta -> la variedad '$($p.variedad)' no existe." -ForegroundColor Red
        $fallidos++; continue
    }
    if (-not $procesoId) {
        Write-Host "  FALLO   $etiqueta -> el proceso '$($p.proceso)' no existe." -ForegroundColor Red
        $fallidos++; continue
    }

    $archivoImagen = "$($p.imagen).png"
    $rutaImagen = Join-Path $carpetaImagenes $archivoImagen
    $existente = $existentes[(Get-Clave $p.nombre $variedadId $procesoId $p.presentacion)]

    # ✅ Idempotencia: si ya existe, se omite antes de subir la imagen (salvo -ActualizarImagenes).
    if ($existente -and -not $ActualizarImagenes) {
        Write-Host "  OMITIDO $etiqueta (ya existe)" -ForegroundColor Yellow
        $omitidos++; continue
    }

    if (-not (Test-Path $rutaImagen)) {
        Write-Host "  FALLO   $etiqueta -> no se encontró la imagen $archivoImagen." -ForegroundColor Red
        $fallidos++; continue
    }

    $imagen = Send-Imagen $rutaImagen

    if (-not $imagen.Ok) {
        Write-Host "  FALLO   $etiqueta -> no se pudo subir la imagen (HTTP $($imagen.Codigo)): $($imagen.Error)" -ForegroundColor Red
        $fallidos++; continue
    }

    # ✅ -ActualizarImagenes: PUT con los datos actuales del café y la imagen nueva.
    if ($existente) {
        $put = Invoke-Api -Metodo 'PUT' -Ruta "/cafes/$($existente.id)" -Token $token -Cuerpo ([ordered]@{
            nombre             = $existente.nombre
            variedadId         = [int]$existente.variedadId
            procesoId          = [int]$existente.procesoId
            presentacionGramos = [int]$existente.presentacionGramos
            origen             = $existente.origen
            stock              = [int]$existente.stock
            precio             = [decimal]$existente.precio
            imagenUrl          = $imagen.Datos.imageUrl
            imagenPublicId     = $imagen.Datos.publicId
        })

        if ($put.Ok) {
            Write-Host "  IMAGEN  $etiqueta (id $($existente.id)) -> $($imagen.Datos.publicId)" -ForegroundColor Green
            $actualizados++
        }
        else {
            Write-Host "  FALLO   $etiqueta -> no se pudo actualizar (HTTP $($put.Codigo)): $($put.Error)" -ForegroundColor Red
            Remove-Imagen $imagen.Datos.publicId
            $fallidos++
        }
        continue
    }

    $cafe = Invoke-Api -Metodo 'POST' -Ruta '/cafes' -Token $token -Cuerpo ([ordered]@{
        nombre             = $p.nombre
        variedadId         = $variedadId
        procesoId          = $procesoId
        presentacionGramos = [int]$p.presentacion
        origen             = $p.origen
        stock              = [int]$p.stock
        precio             = [decimal]$p.precio
        imagenUrl          = $imagen.Datos.imageUrl
        imagenPublicId     = $imagen.Datos.publicId
    })

    if ($cafe.Ok) {
        Write-Host "  CREADO  $etiqueta (id $($cafe.Datos.id))" -ForegroundColor Green
        $creados++
    }
    elseif ($cafe.Codigo -eq 409) {
        # Alguien lo creó entre la consulta y el POST: se borra la imagen recién subida.
        Write-Host "  OMITIDO $etiqueta (409: ya existe)" -ForegroundColor Yellow
        Remove-Imagen $imagen.Datos.publicId
        $omitidos++
    }
    else {
        Write-Host "  FALLO   $etiqueta -> no se pudo crear el café (HTTP $($cafe.Codigo)): $($cafe.Error)" -ForegroundColor Red
        Remove-Imagen $imagen.Datos.publicId
        $fallidos++
    }
}

Write-Host ''
Write-Host "Resumen: $creados creados, $actualizados con imagen actualizada, $omitidos omitidos, $fallidos fallidos."
if ($fallidos -gt 0) { exit 1 }
