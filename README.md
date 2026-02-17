<p align="center">
  <img src="https://raw.githubusercontent.com/cisnerosnow/sheen-go/main/logo.png" width="120" alt="Sheen Go" />
</p>

# Sheen Go

Plugin de Chrome para enviar likes automáticos en TikTok Lives.

**Made by @cisnerosnow**

**[⬇ Descargar sheen-go.zip](https://github.com/cisnerosnow/sheen-go/raw/main/sheen-go.zip)**

---

## ¿Qué hace?

Al presionar **START**, el plugin simula mantener presionada la tecla `L` en la pestaña activa de TikTok, enviando likes de forma continua mientras dure el Live. Al activarse, muestra una pantalla de cuenta regresiva de 5 segundos antes de comenzar.

---

## Build

Para generar el `.zip` listo para cargar en Chrome, ejecuta:

```
build.bat
```

Esto crea `sheen-go.zip` con solo los archivos necesarios del plugin. Asegúrate de que `logo.png` esté en la carpeta antes de correrlo.

---

## Instalación

> El plugin no está en la Chrome Web Store. Se instala en modo desarrollador.

**Opción A — desde el zip (recomendado para distribución):**

1. Corre `build.bat` para generar `sheen-go.zip`
2. Descomprime el zip en una carpeta
3. Abre Chrome y ve a `chrome://extensions/`
4. Activa el **Modo desarrollador** (esquina superior derecha)
5. Haz click en **"Cargar descomprimida"**
6. Selecciona la carpeta descomprimida

**Opción B — desde el código fuente directamente:**

1. Coloca tu archivo `logo.png` dentro de la carpeta del proyecto
2. Abre Chrome y ve a `chrome://extensions/`
3. Activa el **Modo desarrollador**
4. Haz click en **"Cargar descomprimida"**
5. Selecciona la carpeta `sheen-go`

---

## Uso

1. Entra a un **TikTok Live** en Chrome
2. Haz click en el ícono del plugin en la barra de Chrome
3. Presiona **▶ START**
   - Aparece una pantalla semitransparente con cuenta regresiva de 5 segundos
   - Al llegar a 0, comienza el envío automático de likes
4. Presiona **■ STOP** para detenerlo cuando quieras

> El plugin solo actúa sobre la pestaña donde presionaste START. Otras pestañas no se ven afectadas.

---

## Archivos

```
sheen-go/
├── manifest.json   # Configuración del plugin (MV3)
├── background.js   # Service worker: gestiona estado por pestaña
├── content.js      # Inyectado en TikTok: overlay + simulación de tecla L
├── popup.html      # Panel del plugin
├── popup.js        # Lógica del panel (Start / Stop)
└── logo.png        # Ícono del plugin (debes agregarlo tú)
```

---

## Requisitos

- Google Chrome (Manifest V3)
- Estar en una página de TikTok (`tiktok.com`) para que el content script funcione
