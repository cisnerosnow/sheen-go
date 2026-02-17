@echo off
echo.
echo  Building sheen-go.zip...
echo.

if exist sheen-go.zip (
    del sheen-go.zip
    echo  [limpiando zip anterior]
)

powershell -NoProfile -Command ^
  "Compress-Archive -Path manifest.json, background.js, content.js, popup.html, popup.js, logo.png -DestinationPath sheen-go.zip -CompressionLevel Optimal"

if %errorlevel% == 0 (
    echo.
    echo  [OK] sheen-go.zip listo para subir a Chrome.
) else (
    echo.
    echo  [ERROR] Algo salio mal. Verifica que logo.png exista en esta carpeta.
)
echo.
pause
