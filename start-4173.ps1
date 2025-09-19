# Music Pad v2 - Port 4173 Starter
Write-Host "Music Pad v2 - Starting on Port 4173" -ForegroundColor Cyan

# Port 4173 freimachen
$proc = Get-NetTCPConnection -LocalPort 4173 -ErrorAction SilentlyContinue
if ($proc) {
    Write-Host "Port 4173 belegt, räume auf..." -ForegroundColor Yellow
    Stop-Process -Id $proc.OwningProcess -Force
}

# Zum Projekt
cd C:\Projekte\musicpad-v2

# Starten
Write-Host "Starte Dev Server auf http://localhost:4173" -ForegroundColor Green
npm run dev -- --port 4173
