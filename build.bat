@echo off
echo.
echo  Building sheen-go.zip...
echo.

if exist sheen-go.zip (
    del sheen-go.zip
    echo  [limpiando zip anterior]
)

if exist sheen-go\ (
    rmdir /s /q sheen-go
    echo  [limpiando carpeta temporal]
)

mkdir sheen-go
copy manifest.json sheen-go\ >nul
copy background.js sheen-go\ >nul
copy content.js    sheen-go\ >nul
copy popup.html    sheen-go\ >nul
copy popup.js      sheen-go\ >nul
copy logo.png      sheen-go\ >nul

powershell -NoProfile -Command ^
  "Compress-Archive -Path sheen-go -DestinationPath sheen-go.zip -CompressionLevel Optimal"

rmdir /s /q sheen-go

if %errorlevel% == 0 (
    echo.
    echo  [OK] sheen-go.zip listo ^(contiene carpeta sheen-go/^).
) else (
    echo.
    echo  [ERROR] Algo salio mal. Verifica que logo.png exista en esta carpeta.
)
echo.
pause
