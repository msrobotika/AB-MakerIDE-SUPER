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
