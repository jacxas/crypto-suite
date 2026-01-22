# Windows Optimizer Script
# Objetivo: Optimizar Windows automáticamente
# Problema abordado: Código organizado en módulos para facilitar expansión

# Importar módulos
. "$PSScriptRoot\utils.ps1"
. "$PSScriptRoot\modules\clean.ps1"
. "$PSScriptRoot\modules\boost.ps1"

# Configuración
$config = Get-Config

# Función principal
function Optimize-Windows {
    param (
        [switch]$Clean,
        [switch]$Boost,
        [switch]$All
    )

    if ($All -or $Clean) {
        Write-Host "Ejecutando limpieza..."
        Invoke-Clean
    }

    if ($All -or $Boost) {
        Write-Host "Ejecutando optimizaciones de rendimiento..."
        Invoke-Boost
    }

    Write-Host "Optimización completada."
}

# Ejecutar si se llama directamente
if ($MyInvocation.InvocationName -eq $MyInvocation.MyCommand.Name) {
    Optimize-Windows -All
}