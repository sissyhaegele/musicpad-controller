# Music Pad v2 - Projekt Diagnose & Fix Script
# =============================================

param(
    [string]$ProjectPath = "C:\Projekte\musicpad-v2"
)

Clear-Host
Write-Host @"
╔════════════════════════════════════════╗
║   MUSIC PAD v2 - PROJECT DIAGNOSTICS   ║
╚════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Host "`n🔍 Prüfe Projekt in: $ProjectPath" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════" -ForegroundColor Gray

# Prüfe ob Ordner existiert
if (-not (Test-Path $ProjectPath)) {
    Write-Host "❌ Projekt-Ordner existiert nicht!" -ForegroundColor Red
    Write-Host "`n📁 Soll ich das Projekt neu erstellen? (j/n)" -ForegroundColor Yellow
    if ((Read-Host) -eq 'j') {
        New-Item -ItemType Directory -Path $ProjectPath -Force | Out-Null
        Set-Location $ProjectPath
    } else {
        exit
    }
} else {
    Set-Location $ProjectPath
    Write-Host "✅ Projekt-Ordner gefunden" -ForegroundColor Green
}

# Erstelle Diagnose-Report
$missingFiles = @()
$existingFiles = @()
$issues = @()

# Liste der erforderlichen Dateien und Ordner
$requiredStructure = @{
    "package.json" = "Root"
    "vite.config.ts" = "Root"
    "tsconfig.json" = "Root"
    "tsconfig.node.json" = "Root"
    "index.html" = "Root"
    ".gitignore" = "Root"
    "src" = "Folder"
    "src\main.tsx" = "File"
    "src\App.tsx" = "File"
    "src\App.css" = "File"
    "src\types" = "Folder"
    "src\types\index.ts" = "File"
    "src\services" = "Folder"
    "src\services\AudioService.ts" = "File"
    "src\components" = "Folder"
    "src\components\PadComponent.tsx" = "File"
    "public" = "Folder"
    "node_modules" = "Folder"
}

Write-Host "`n📋 PROJEKT-STRUKTUR ANALYSE:" -ForegroundColor Yellow
Write-Host "────────────────────────────" -ForegroundColor Gray

foreach ($item in $requiredStructure.GetEnumerator()) {
    $path = Join-Path $ProjectPath $item.Key
    if (Test-Path $path) {
        $existingFiles += $item.Key
        Write-Host "  ✅ $($item.Key)" -ForegroundColor Green
    } else {
        $missingFiles += $item.Key
        Write-Host "  ❌ $($item.Key) - FEHLT!" -ForegroundColor Red
    }
}

# Prüfe Node.js und npm
Write-Host "`n🔧 ENTWICKLUNGSUMGEBUNG:" -ForegroundColor Yellow
Write-Host "────────────────────────────" -ForegroundColor Gray

$hasNode = Get-Command node -ErrorAction SilentlyContinue
$hasNpm = Get-Command npm -ErrorAction SilentlyContinue

if ($hasNode) {
    $nodeVersion = node --version
    Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  ❌ Node.js nicht installiert!" -ForegroundColor Red
    $issues += "Node.js fehlt"
}

if ($hasNpm) {
    $npmVersion = npm --version
    Write-Host "  ✅ NPM: v$npmVersion" -ForegroundColor Green
} else {
    Write-Host "  ❌ NPM nicht installiert!" -ForegroundColor Red
    $issues += "NPM fehlt"
}

# Zusammenfassung
Write-Host "`n📊 ZUSAMMENFASSUNG:" -ForegroundColor Yellow
Write-Host "════════════════════" -ForegroundColor Gray
Write-Host "  ✅ Vorhanden: $($existingFiles.Count) Dateien/Ordner" -ForegroundColor Green
Write-Host "  ❌ Fehlend: $($missingFiles.Count) Dateien/Ordner" -ForegroundColor Red

if ($missingFiles.Count -gt 0) {
    Write-Host "`n⚠️  FEHLENDE DATEIEN:" -ForegroundColor Yellow
    $missingFiles | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
    
    Write-Host "`n🔧 Soll ich die fehlenden Dateien erstellen? (j/n)" -ForegroundColor Cyan
    $fix = Read-Host
    
    if ($fix -eq 'j') {
        Write-Host "`n🚀 Erstelle fehlende Dateien..." -ForegroundColor Green
        
        # Erstelle fehlende Ordner
        if ($missingFiles -contains "src") { 
            New-Item -ItemType Directory -Path "src" -Force | Out-Null 
        }
        if ($missingFiles -contains "src\components") { 
            New-Item -ItemType Directory -Path "src\components" -Force | Out-Null 
        }
        if ($missingFiles -contains "src\services") { 
            New-Item -ItemType Directory -Path "src\services" -Force | Out-Null 
        }
        if ($missingFiles -contains "src\types") { 
            New-Item -ItemType Directory -Path "src\types" -Force | Out-Null 
        }
        if ($missingFiles -contains "public") { 
            New-Item -ItemType Directory -Path "public" -Force | Out-Null 
        }
        
        # package.json
        if ($missingFiles -contains "package.json") {
            Write-Host "  📄 Erstelle package.json..." -ForegroundColor Cyan
            @'
{
  "name": "musicpad-v2",
  "private": true,
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.344.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.1.6"
  }
}
'@ | Out-File -FilePath "package.json" -Encoding UTF8
        }
        
        # vite.config.ts
        if ($missingFiles -contains "vite.config.ts") {
            Write-Host "  📄 Erstelle vite.config.ts..." -ForegroundColor Cyan
            @'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
})
'@ | Out-File -FilePath "vite.config.ts" -Encoding UTF8
        }
        
        # tsconfig.json
        if ($missingFiles -contains "tsconfig.json") {
            Write-Host "  📄 Erstelle tsconfig.json..." -ForegroundColor Cyan
            @'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
'@ | Out-File -FilePath "tsconfig.json" -Encoding UTF8
        }
        
        # tsconfig.node.json
        if ($missingFiles -contains "tsconfig.node.json") {
            Write-Host "  📄 Erstelle tsconfig.node.json..." -ForegroundColor Cyan
            @'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
'@ | Out-File -FilePath "tsconfig.node.json" -Encoding UTF8
        }
        
        # index.html
        if ($missingFiles -contains "index.html") {
            Write-Host "  📄 Erstelle index.html..." -ForegroundColor Cyan
            @'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#667eea" />
    <title>Music Pad Controller v2</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
'@ | Out-File -FilePath "index.html" -Encoding UTF8
        }
        
        # src/main.tsx
        if ($missingFiles -contains "src\main.tsx") {
            Write-Host "  📄 Erstelle src/main.tsx..." -ForegroundColor Cyan
            @'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
'@ | Out-File -FilePath "src\main.tsx" -Encoding UTF8
        }
        
        # Erstelle Info-Datei für fehlende Source-Files
        if ($missingFiles -contains "src\App.tsx" -or 
            $missingFiles -contains "src\App.css" -or
            $missingFiles -contains "src\components\PadComponent.tsx" -or
            $missingFiles -contains "src\services\AudioService.ts") {
            
            Write-Host "`n📝 HINWEIS: Die vollständigen Source-Files sind zu groß für dieses Script." -ForegroundColor Yellow
            Write-Host "   Ich erstelle eine README mit den fehlenden Dateien..." -ForegroundColor Yellow
            
            @"
# Music Pad v2 - Fehlende Source Files

Die folgenden Dateien müssen noch hinzugefügt werden:

## Fehlende Dateien:
$(($missingFiles | Where-Object { $_ -like "src\*" }) -join "`n- ")

## Download-Link:
Die vollständigen Source-Files sind verfügbar unter:
https://claude.ai/chat (diesen Chat)

Oder nutze das vollständige Setup-Script.

## Quick Fix:
Führe diesen Befehl aus um ein minimales lauffähiges Projekt zu erstellen:
npm create vite@latest . -- --template react-ts

"@ | Out-File -FilePath "README_MISSING_FILES.md" -Encoding UTF8
            
            Write-Host "  📄 README_MISSING_FILES.md erstellt" -ForegroundColor Green
        }
        
        Write-Host "`n✅ Alle Basis-Dateien erstellt!" -ForegroundColor Green
    }
}

# NPM Install Check
if (Test-Path "package.json") {
    if (-not (Test-Path "node_modules")) {
        Write-Host "`n📦 node_modules fehlt. NPM Install durchführen? (j/n)" -ForegroundColor Yellow
        if ((Read-Host) -eq 'j') {
            Write-Host "  Installiere Dependencies..." -ForegroundColor Cyan
            npm install
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✅ Dependencies installiert!" -ForegroundColor Green
            } else {
                Write-Host "  ❌ Installation fehlgeschlagen" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "`n✅ node_modules vorhanden" -ForegroundColor Green
    }
}

# Finale Empfehlungen
Write-Host "`n💡 EMPFEHLUNGEN:" -ForegroundColor Cyan
Write-Host "═════════════════" -ForegroundColor Gray

if ($missingFiles.Count -eq 0) {
    Write-Host "  ✨ Projekt ist vollständig!" -ForegroundColor Green
    Write-Host "`n  Starte die App mit:" -ForegroundColor Yellow
    Write-Host "    npm run dev" -ForegroundColor White
} else {
    if ($missingFiles | Where-Object { $_ -like "src\*" }) {
        Write-Host "  ⚠️  Source-Files fehlen noch!" -ForegroundColor Yellow
        Write-Host "  ⚠️  Lade das komplette Projekt-Archiv herunter" -ForegroundColor Yellow
    }
    if ($missingFiles -contains "node_modules") {
        Write-Host "  📦 Führe 'npm install' aus" -ForegroundColor Yellow
    }
}

Write-Host "`n📂 Aktueller Projekt-Status:" -ForegroundColor Cyan
Get-ChildItem -Force | Format-Table Name, LastWriteTime, Length -AutoSize

Write-Host "`n✨ Diagnose abgeschlossen!" -ForegroundColor Green
