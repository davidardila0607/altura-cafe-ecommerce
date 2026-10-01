<#
.SYNOPSIS
    Carga los productos de ejemplo de Altura (cafés + imágenes en Cloudinary) a través de la API.

.DESCRIPTION
    1. Inicia sesión como Administrador en POST /api/auth/login.
    2. Resuelve el id de cada variedad por su nombre (GET /api/variedades).
    3. Por cada producto: si ya existe (mismo nombre sin importar mayúsculas, variedad y
       presentación) lo omite SIN subir imagen; si no, sube la imagen con POST /api/images
       y crea el café con POST /api/cafes enviando imagenUrl e imagenPublicId.

    Es idempotente: se puede ejecutar varias veces sin duplicar cafés ni imágenes.

    Con -ActualizarImagenes, a los cafés que ya existen se les sube la imagen nueva de
    seed/imagenes/ y se hace PUT /api/cafes/{id} conservando sus datos actuales (nombre,
    variedad, presentación, origen, stock y precio) y enviando el nuevo imagenUrl e
    imagenPublicId. El backend borra la imagen anterior de Cloudinary. Los cafés que no
    existen se crean como en el modo normal.

    Compatible con Windows PowerShell 5.1 y PowerShell 7. El archivo está en UTF-8 con BOM
    y los cuerpos se envían como bytes UTF-8 para que las tildes lleguen bien a la API.

.EXAMPLE
    .\seed\seed-productos.ps1
    (pide correo y contraseña del Administrador)

.EXAMPLE
    .\seed\seed-productos.ps1 -ApiBaseUrl http://localhost:5031/api -Email admin@cafeapi.com

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

# ✅ Productos de ejemplo.
$productos = @(
    @{ Nombre = 'Mesa de los Santos'; Variedad = 'Castillo'; Gramos = 340; Origen = 'Santander'; Stock = 24; Precio = 42000;  Imagen = '01-mesa-de-los-santos-340g.png' },
    @{ Nombre = 'Mesa de los Santos'; Variedad = 'Castillo'; Gramos = 500; Origen = 'Santander'; Stock = 15; Precio = 58000;  Imagen = '02-mesa-de-los-santos-500g.png' },
    @{ Nombre = 'Pitalito Reserva';   Variedad = 'Geisha';   Gramos = 340; Origen = 'Huila';     Stock = 8;  Precio = 89000;  Imagen = '03-pitalito-reserva-340g.png' },
    @{ Nombre = 'Volcán Galeras';     Variedad = 'Moka';     Gramos = 340; Origen = 'Nariño';    Stock = 12; Precio = 54000;  Imagen = '04-volcan-galeras-340g.png' },
    @{ Nombre = 'Sierra Nevada';      Variedad = 'Castillo'; Gramos = 500; Origen = 'Magdalena'; Stock = 0;  Precio = 61000;  Imagen = '05-sierra-nevada-500g.png' },
    @{ Nombre = 'Tierradentro';       Variedad = 'Geisha';   Gramos = 500; Origen = 'Cauca';     Stock = 5;  Precio = 118000; Imagen = '06-tierradentro-500g.png' }
)

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

function Get-Clave([string]$nombre, [int]$variedadId, [int]$gramos) {
    return '{0}|{1}|{2}' -f $nombre.Trim().ToLowerInvariant(), $variedadId, $gramos
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
$login = Invoke-Api -Metodo 'POST' -Ruta '/auth/login' -Cuerpo ([ordered]@{ email = $Email; password = $passwordPlano })
$passwordPlano = $null

if (-not $login.Ok) {
    Write-Host "No se pudo iniciar sesión (HTTP $($login.Codigo)). Revisa el correo y la contraseña." -ForegroundColor Red
    exit 1
}
if ($login.Datos.role -ne 'Administrador') {
    Write-Host "La cuenta '$Email' no tiene rol Administrador." -ForegroundColor Red
    exit 1
}
$token = $login.Datos.token
Write-Host "Sesión iniciada como $Email (Administrador)." -ForegroundColor Green

# ===== Variedades y cafés existentes =====
$variedades = Invoke-Api -Metodo 'GET' -Ruta '/variedades'
if (-not $variedades.Ok) { Write-Host "No se pudieron leer las variedades (HTTP $($variedades.Codigo))." -ForegroundColor Red; exit 1 }

$idsVariedad = @{}
foreach ($v in $variedades.Datos) { $idsVariedad[$v.nombre.ToLowerInvariant()] = [int]$v.id }

$cafes = Invoke-Api -Metodo 'GET' -Ruta '/cafes'
if (-not $cafes.Ok) { Write-Host "No se pudieron leer los cafés (HTTP $($cafes.Codigo))." -ForegroundColor Red; exit 1 }

$existentes = @{}
foreach ($c in $cafes.Datos) { $existentes[(Get-Clave $c.nombre $c.variedadId $c.presentacionGramos)] = $c }

# ===== Carga =====
$creados = 0; $actualizados = 0; $omitidos = 0; $fallidos = 0
if ($ActualizarImagenes) { Write-Host 'Modo: actualizar imágenes de los cafés existentes.' -ForegroundColor Cyan }

function Send-Imagen([string]$ruta) {
    $base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($ruta))
    return Invoke-Api -Metodo 'POST' -Ruta '/images' -Token $token -Cuerpo @{ imagenBase64 = "data:image/png;base64,$base64" }
}

foreach ($p in $productos) {
    $etiqueta = '{0} · {1} · {2} g' -f $p.Nombre, $p.Variedad, $p.Gramos
    $variedadId = $idsVariedad[$p.Variedad.ToLowerInvariant()]

    if (-not $variedadId) {
        Write-Host "  FALLO   $etiqueta -> la variedad '$($p.Variedad)' no existe." -ForegroundColor Red
        $fallidos++; continue
    }

    $rutaImagen = Join-Path $carpetaImagenes $p.Imagen
    $existente = $existentes[(Get-Clave $p.Nombre $variedadId $p.Gramos)]

    # ✅ Idempotencia: si ya existe, se omite antes de subir la imagen (salvo -ActualizarImagenes).
    if ($existente -and -not $ActualizarImagenes) {
        Write-Host "  OMITIDO $etiqueta (ya existe)" -ForegroundColor Yellow
        $omitidos++; continue
    }

    if (-not (Test-Path $rutaImagen)) {
        Write-Host "  FALLO   $etiqueta -> no se encontró la imagen $($p.Imagen)." -ForegroundColor Red
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
            Write-Host "  FALLO   $etiqueta -> no se pudo actualizar (HTTP $($put.Codigo)): $($put.Error). Imagen sin usar: $($imagen.Datos.publicId)" -ForegroundColor Red
            $fallidos++
        }
        continue
    }

    $cafe = Invoke-Api -Metodo 'POST' -Ruta '/cafes' -Token $token -Cuerpo ([ordered]@{
        nombre             = $p.Nombre
        variedadId         = $variedadId
        presentacionGramos = $p.Gramos
        origen             = $p.Origen
        stock              = $p.Stock
        precio             = $p.Precio
        imagenUrl          = $imagen.Datos.imageUrl
        imagenPublicId     = $imagen.Datos.publicId
    })

    if ($cafe.Ok) {
        Write-Host "  CREADO  $etiqueta (id $($cafe.Datos.id))" -ForegroundColor Green
        $creados++
    }
    elseif ($cafe.Codigo -eq 409) {
        # Otro proceso lo creó entre la consulta y el POST; la imagen recién subida queda huérfana.
        Write-Host "  OMITIDO $etiqueta (409: ya existe). Imagen sin usar en Cloudinary: $($imagen.Datos.publicId)" -ForegroundColor Yellow
        $omitidos++
    }
    else {
        Write-Host "  FALLO   $etiqueta -> no se pudo crear el café (HTTP $($cafe.Codigo)): $($cafe.Error)" -ForegroundColor Red
        $fallidos++
    }
}

Write-Host ''
Write-Host "Resumen: $creados creados, $actualizados con imagen actualizada, $omitidos omitidos, $fallidos fallidos."
if ($fallidos -gt 0) { exit 1 }
