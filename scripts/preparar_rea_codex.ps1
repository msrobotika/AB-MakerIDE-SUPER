# REVISION GUIADA: no modifica Codex sin -Aplicar. REA externo, no redistribuido.
param([switch]$Aplicar)
$ErrorActionPreference = "Stop"
$Paquete = "rea-agents@6.8.0"
foreach ($Exe in @("node", "npm", "npx", "codex")) {
    if (-not (Get-Command $Exe -ErrorAction SilentlyContinue)) {
        throw "Falta $Exe en PATH. Instálalo desde su fuente oficial y vuelve a intentarlo."
    }
}
Write-Host "Node:" (& node --version)
$NodeVersion = (& node --version).Trim() -replace "^v", ""
$Parts = @($NodeVersion.Split("."))
$Major = [int]$Parts[0]
$Minor = [int]$Parts[1]
$Patch = [int]$Parts[2]
$Valid = (($Major -eq 22 -and (($Minor -gt 23) -or ($Minor -eq 23 -and $Patch -ge 4))) -or ($Major -eq 24 -and (($Minor -gt 22) -or ($Minor -eq 22 -and $Patch -ge 1))) -or ($Major -eq 26 -and (($Minor -gt 12) -or ($Minor -eq 12 -and $Patch -ge 1))))
if (-not $Valid) { throw "REA necesita Node 22.23.4+, 24.22.1+ o 26.12.1+. Instala una versión admitida." }
Write-Host "Codex:" (& codex --version)
Write-Host "REA: $Paquete (tercero; comprobar origen antes de ejecutarlo)"
Write-Host "Revisión del plan SIN modificar la cuenta:"
& npx -y $Paquete setup --client codex --dry-run --json
if ($LASTEXITCODE -ne 0) { throw "REA no pudo generar un plan seguro." }
if (-not $Aplicar) {
    Write-Host "No se ha modificado Codex. Si apruebas el plan, ejecuta:"
    Write-Host "  .\scripts\preparar_rea_codex.ps1 -Aplicar"
    exit 0
}
Write-Host "Se inicia el setup de REA para Codex con revisión interactiva."
& npx -y $Paquete setup --client codex
if ($LASTEXITCODE -ne 0) { throw "El setup no terminó correctamente." }
Write-Host "Reinicia Codex y comprueba la conexión MCP real:"
Write-Host "  npx -y $Paquete doctor --client codex --json"
