<p align="center">
  <img src="https://raw.githubusercontent.com/cisnerosnow/sheen-go/main/logo.png" width="120" alt="Sheen Go" />
</p>

# Sheen Go

Plugin de Chrome para automatizar interacciones en TikTok Lives: likes, comentarios y respuestas con IA.

**Made by @cisnerosnow**

**[⬇ Descargar sheen-go.zip](https://github.com/cisnerosnow/sheen-go/raw/main/sheen-go.zip)**

---

## ¿Qué hace?

Al presionar **START**, el plugin actúa sobre la pestaña activa de TikTok Live con tres módulos independientes que se pueden activar o desactivar por separado:

- **Likes** — simula mantener presionada la tecla `L`, enviando ráfagas de likes de forma continua.
- **Comentarios** — envía una lista de comentarios (formato JSON) uno por uno, con tipeo carácter a carácter y errores orgánicos opcionales para que se vea natural.
- **Claude** — lee el chat acumulado y genera respuestas automáticas usando la API de Claude (Haiku), ignorando los mensajes del propio usuario.

Al activarse muestra una cuenta regresiva de 5 segundos antes de comenzar.

---

## Instalación

> El plugin no está en la Chrome Web Store. Se instala en modo desarrollador.

**Opción A — desde el zip (recomendado):**

1. Descarga y descomprime `sheen-go.zip`
2. Abre Chrome y ve a `chrome://extensions/`
3. Activa el **Modo desarrollador** (esquina superior derecha)
4. Haz click en **"Cargar descomprimida"**
5. Selecciona la carpeta descomprimida

**Opción B — desde el código fuente:**

1. Abre Chrome y ve a `chrome://extensions/`
2. Activa el **Modo desarrollador**
3. Haz click en **"Cargar descomprimida"**
4. Selecciona la carpeta `sheen-go`

---

## Uso

1. Entra a un **TikTok Live** en Chrome
2. Haz click en el ícono del plugin en la barra de Chrome
3. Configura cada módulo en su pestaña correspondiente
4. Presiona **▶ START**
5. Presiona **■ STOP** para detenerlo cuando quieras

> El plugin solo actúa sobre la pestaña donde presionaste START.

---

## Configuración

### Pestaña Likes

| Campo | Descripción |
|---|---|
| Cantidad (min – max) | Rango de likes por ráfaga |
| Pausa (seg) | Segundos de espera entre ráfagas |

### Pestaña Comentarios

| Campo | Descripción |
|---|---|
| JSON de comentarios | Array de strings: `["Hola!", "Qué live tan bueno"]` |
| Pausa (seg) | Segundos entre cada comentario |
| Repetir al acabar | Vuelve al primer comentario al terminar la lista |

Los comentarios se escriben carácter a carácter. En el 40% de los mensajes se simulan errores de tipeo (letras de más, borrar y reescribir) para que se vea más orgánico.

### Pestaña Claude

| Campo | Descripción |
|---|---|
| Tu usuario de TikTok | Tu nombre de usuario — el plugin no responderá si el último mensaje fue tuyo |
| API Key | Tu clave de Anthropic (`sk-ant-api03-...`) |
| Prompt | Instrucción que se le da a Claude para generar la respuesta |
| Pausa (seg) | Segundos entre cada llamada a Claude |

Claude recibe como contexto los últimos 5 mensajes de hasta 10 usuarios del chat. Usa el modelo `claude-haiku-4-5`.

> **Nota:** Comentarios y Claude son mutuamente excluyentes — activar uno desactiva el otro.

---

## Archivos

```
sheen-go/
├── manifest.json   # Configuración del plugin (MV3)
├── background.js   # Service worker: estado por pestaña y llamadas a la API de Claude
├── content.js      # Inyectado en TikTok: overlay, likes, comentarios, chat tracking
├── popup.html      # Panel del plugin
├── popup.js        # Lógica del panel
└── logo.png        # Ícono del plugin
```

---

## Requisitos

- Google Chrome (Manifest V3)
- Estar en una página de TikTok (`tiktok.com`)
- Para el módulo Claude: una API key válida de [Anthropic](https://console.anthropic.com/)
