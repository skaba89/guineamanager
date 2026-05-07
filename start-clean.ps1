# GuinéaManager - Script de démarrage propre (Windows PowerShell)
# ================================================================
# Ce script tue les processus sur les ports 3000 et 3001, puis démarre les serveurs

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  GuinéaManager - Démarrage Propre" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Fonction pour tuer les processus sur un port
function Kill-ProcessOnPort {
    param([int]$Port)
    
    Write-Host "Verification du port $Port..." -ForegroundColor Yellow
    
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    
    if ($connections) {
        foreach ($conn in $connections) {
            $processId = $conn.OwningProcess
            $processName = (Get-Process -Id $processId -ErrorAction SilentlyContinue).ProcessName
            
            Write-Host "  Processus trouve: $processName (PID: $processId) sur le port $Port" -ForegroundColor Red
            
            try {
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                Write-Host "  Processus $processName (PID: $processId) arrete." -ForegroundColor Green
            } catch {
                Write-Host "  Impossible d'arreter le processus $processId. Essayez en administrateur." -ForegroundColor Red
            }
        }
    } else {
        Write-Host "  Port $Port est libre." -ForegroundColor Green
    }
}

# Tuer les processus sur les ports 3000 et 3001
Write-Host ""
Write-Host "1. Liberation des ports..." -ForegroundColor Cyan
Kill-ProcessOnPort -Port 3000
Kill-ProcessOnPort -Port 3001
Write-Host ""

# Verifier que le fichier .env existe
$envFile = ".\backend\.env"
if (-Not (Test-Path $envFile)) {
    Write-Host "Creation du fichier .env..." -ForegroundColor Yellow
    $envContent = @"
# GuineaManager Backend Environment Configuration
DATABASE_URL="file:./dev.db"
JWT_SECRET="guineamanager_jwt_secret_2026_production_key"
NODE_ENV=development
PORT=3001
"@
    Set-Content -Path $envFile -Value $envContent
    Write-Host "Fichier .env cree." -ForegroundColor Green
}

# Aller dans le backend et initialiser la base de donnees
Write-Host ""
Write-Host "2. Initialisation de la base de donnees..." -ForegroundColor Cyan
Set-Location backend

# Verifier si node_modules existe
if (-Not (Test-Path "node_modules")) {
    Write-Host "Installation des dependances backend..." -ForegroundColor Yellow
    npm install
}

# Generer le client Prisma et synchroniser la base
Write-Host "Generation du client Prisma..." -ForegroundColor Yellow
npx prisma generate

Write-Host "Synchronisation de la base de donnees..." -ForegroundColor Yellow
npx prisma db push --accept-data-loss

Set-Location ..
Write-Host ""

# Demander a l'utilisateur s'il veut demarrer les serveurs
Write-Host ""
Write-Host "3. Pret a demarrer les serveurs." -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour demarrer le BACKEND uniquement:" -ForegroundColor White
Write-Host "  cd backend && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Pour demarrer le FRONTEND uniquement:" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Pour demarrer les DEUX serveurs (dans des terminaux separes):" -ForegroundColor White
Write-Host "  Terminal 1: cd backend && npm run dev" -ForegroundColor Gray
Write-Host "  Terminal 2: npm run dev" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Voulez-vous demarrer les serveurs maintenant? (O/N)"

if ($choice -eq "O" -or $choice -eq "o") {
    Write-Host ""
    Write-Host "Demarrage du backend sur le port 3001..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm run dev"
    
    Start-Sleep -Seconds 3
    
    Write-Host "Demarrage du frontend sur le port 3000..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
    
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "  Serveurs demarres!" -ForegroundColor Green
    Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "  Backend:  http://localhost:3001" -ForegroundColor White
    Write-Host "================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Les serveurs n'ont pas ete demarres." -ForegroundColor Yellow
    Write-Host "Utilisez les commandes ci-dessus pour les demarrer manuellement." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Appuyez sur une touche pour quitter..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
