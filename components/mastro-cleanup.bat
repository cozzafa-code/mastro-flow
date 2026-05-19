@echo off
REM === MASTRO CLEANUP — Sposta demo/vecchi in _archive ===
cd /d C:\Users\fabio\Desktop\mastro-erp

mkdir _archive 2>nul

REM --- Demo .jsx (18 file) ---
move components\mastro-strutture.jsx _archive\ 2>nul
move components\mastro-strutture-v7.jsx _archive\ 2>nul
move components\mastro-redesign-teal.jsx _archive\ 2>nul
move components\MastroStrutture.jsx _archive\ 2>nul
move components\SezioneStrutture.jsx _archive\ 2>nul
move components\disegno-tecnico-3d.jsx _archive\ 2>nul
move components\disegno-tecnico-universale.jsx _archive\ 2>nul
move components\MastroPorteDemo.jsx _archive\ 2>nul
move components\MastroPorteV2.jsx _archive\ 2>nul
move components\MastroMisureHub.jsx _archive\ 2>nul
move components\preventivo-page-demo.jsx _archive\ 2>nul
move components\MastroCancelliDemo.jsx _archive\ 2>nul
move components\MastroCancelliV2.jsx _archive\ 2>nul
move components\MastroTendeSole.jsx _archive\ 2>nul
move components\MastroBoxDoccia.jsx _archive\ 2>nul
move components\MastroTapparelleDemo.jsx _archive\ 2>nul
move components\MastroZanzariereDemo.jsx _archive\ 2>nul
move components\MastroPersianeDemo.jsx _archive\ 2>nul

REM --- Versioni superate .tsx (8 file) ---
move components\CMDetailPane.tsx _archive\ 2>nul
move components\MastroERP-guida-v2.tsx _archive\ 2>nul
move components\SettingsPanel-ADDITIONS.tsx _archive\ 2>nul
move components\VanoAccessoriBlock-CODICE.tsx _archive\ 2>nul
move components\VanoAccessoriBlock-v2.tsx _archive\ 2>nul
move components\MastroCalendario.tsx _archive\ 2>nul
move components\MastroAgendaWidget.tsx _archive\ 2>nul
move components\mastro-catalogo-completo-v3.tsx _archive\ 2>nul

echo.
echo === CLEANUP COMPLETATO: 26 file spostati in _archive ===
echo.
echo Ora esegui:
echo   git add -A
echo   git commit -m "cleanup: 26 demo/old files to _archive"
echo   git push
echo.
pause
