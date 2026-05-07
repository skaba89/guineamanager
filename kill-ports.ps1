# GuinéaManager - Script rapide pour liberer les ports (Windows)
# ================================================================
# Utilisation: .\kill-ports.ps1

Write-Host "Liberation des ports 3000 et 3001..." -ForegroundColor Yellow

# Tuer les processus sur le port 3000
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    $port3000 | ForEach-Object { 
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
    }
    Write-Host "Port 3000 libere." -ForegroundColor Green
} else {
    Write-Host "Port 3000 deja libre." -ForegroundColor Gray
}

# Tuer les processus sur le port 3001
$port3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($port3001) {
    $port3001 | ForEach-Object { 
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
    }
    Write-Host "Port 3001 libere." -ForegroundColor Green
} else {
    Write-Host "Port 3001 deja libre." -ForegroundColor Gray
}

Write-Host "Termine!" -ForegroundColor Cyan
