<#
.SYNOPSIS
    Sube las fotografías del sitio (hero, proceso, acceso) a Cloudinary, carpeta "sitio".

.DESCRIPTION
    Lee seed/sitio/fotos.json (fotos de Unsplash con su autor y licencia) y, por cada una,
    hace una subida firmada a Cloudinary indicando la URL de descarga de Unsplash: Cloudinary
    descarga la imagen directamente, así que no se guardan fotos en el repositorio.

    - Las credenciales se leen de appsettings.Development.json (CloudinarySettings); no se imprimen.
    - public_id fijo (sitio/<clave>) con overwrite: el script es idempotente.
    - No usa la API de CafeApi: POST /api/images siempre sube a la carpeta "cafes".

    Compatible con Windows PowerShell 5.1 y PowerShell 7 (archivo en UTF-8 con BOM).

.EXAMPLE
    .\seed\subir-imagenes-sitio.ps1
#>
param(
    [string]$Configuracion = (Join-Path $PSScriptRoot '..\appsettings.Development.json'),
    [string]$Manifiesto = (Join-Path $PSScriptRoot 'sitio\fotos.json')
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $Configuracion)) {
    Write-Host "No se encontró $Configuracion. Crea appsettings.Development.json a partir de appsettings.example.json." -ForegroundColor Red
    exit 1
}

$config = [IO.File]::ReadAllText((Resolve-Path $Configuracion), [Text.Encoding]::UTF8) | ConvertFrom-Json
$cloud = $config.CloudinarySettings.CloudName
$apiKey = $config.CloudinarySettings.ApiKey
$apiSecret = $config.CloudinarySettings.ApiSecret

if (-not $cloud -or -not $apiKey -or -not $apiSecret) {
    Write-Host 'Faltan claves en CloudinarySettings (CloudName, ApiKey, ApiSecret).' -ForegroundColor Red
    exit 1
}

$datos = [IO.File]::ReadAllText((Resolve-Path $Manifiesto), [Text.Encoding]::UTF8) | ConvertFrom-Json
$carpeta = $datos.carpeta
$sha1 = [Security.Cryptography.SHA1]::Create()

# ✅ Firma de Cloudinary: parámetros ordenados alfabéticamente + api_secret, en SHA-1 hexadecimal.
function Get-Firma([hashtable]$parametros) {
    $cadena = ($parametros.Keys | Sort-Object | ForEach-Object { "$_=$($parametros[$_])" }) -join '&'
    $bytes = [Text.Encoding]::UTF8.GetBytes($cadena + $apiSecret)
    return -join ($sha1.ComputeHash($bytes) | ForEach-Object { $_.ToString('x2') })
}

$subidas = 0; $fallidas = 0
Write-Host "Cloudinary: carpeta '$carpeta' ($($datos.fotos.Count) fotos)"

foreach ($foto in $datos.fotos) {
    # Segundos UNIX en UTC (en PowerShell 5.1, Get-Date -UFormat %s usa la hora local).
    $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $firmados = @{
        folder     = $carpeta
        invalidate = 'true'
        overwrite  = 'true'
        public_id  = $foto.clave
        timestamp  = $timestamp
    }

    $cuerpo = @{
        file       = $foto.descarga
        api_key    = $apiKey
        signature  = (Get-Firma $firmados)
    } + $firmados

    try {
        $r = Invoke-RestMethod -Method Post -Uri "https://api.cloudinary.com/v1_1/$cloud/image/upload" -Body $cuerpo
        Write-Host ("  SUBIDA  {0,-8} -> {1} ({2}x{3}, {4} KB) · foto de {5}" -f $foto.clave, $r.public_id, $r.width, $r.height, [math]::Round($r.bytes / 1KB), $foto.autor) -ForegroundColor Green
        $subidas++
    }
    catch {
        $detalle = $_.ErrorDetails.Message
        if (-not $detalle -and $_.Exception.Response) {
            $lector = New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())
            $detalle = $lector.ReadToEnd()
        }
        if (-not $detalle) { $detalle = $_.Exception.Message }
        Write-Host "  FALLO   $($foto.clave) -> $detalle" -ForegroundColor Red
        $fallidas++
    }
}

Write-Host ''
Write-Host "Resumen: $subidas subidas, $fallidas fallidas."
if ($fallidas -gt 0) { exit 1 }
