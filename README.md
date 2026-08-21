# DescubrirTe

Diario guiado de mañana y noche que detecta automáticamente los patrones que se repiten en lo que sentís.

> DescubrirTe es el acto de amor más valiente que existe.

## Qué hace

- **Check-in de mañana y de noche** con preguntas guía, ánimo, energía y descanso.
- **Ejercicio del día** — los 7 ejercicios del diario *"7 días para salir de la neblina mental y recuperar la calma"*.
- **Ciclos de 7 o 21 días**, con calendario del viaje.
- **Patrones automáticos**: curva de ánimo, palabras que más repetís, temas y disparadores, energía vs. descanso, e insights redactados.
- **Resumen exportable** como imagen (PNG) o PDF.
- **Recordatorio diario** con alarma y notificación.
- **PWA instalable** en Android e iPhone, funciona offline.

Todo se guarda **solo en el dispositivo** de la usuaria (`localStorage`). No hay servidor, cuentas ni datos que salgan del teléfono.

## Publicar en GitHub

### 1. Crear el repositorio

En [github.com/new](https://github.com/new): nombre `descubrirte`, visibilidad **Public** (necesaria para GitHub Pages gratis). No agregues README ni .gitignore, ya están acá.

### 2. Subir los archivos

Con Git instalado, desde la carpeta del proyecto:

```bash
git init
git add .
git commit -m "DescubrirTe: primera versión"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/descubrirte.git
git push -u origin main
```

Sin Git: en el repo vacío, **Add file → Upload files**, arrastrá todo el contenido (carpetas incluidas) y confirmá.

### 3. Activar GitHub Pages

En el repo: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.

En 1–2 minutos queda publicada en:

```
https://TU-USUARIO.github.io/descubrirte/
```

Esa URL es **https**, que es justo lo que hace falta para poder instalar la app y que funcionen las notificaciones.

### 4. Instalarla en el teléfono

**Android (Chrome):** abrí la URL → menú ⋮ → *Instalar app*. También aparece el botón *Instalar la app* dentro de Ajustes ⚙.

**iPhone (Safari, iOS 16.4+):** abrí la URL → botón *Compartir* → *Añadir a pantalla de inicio*. Abrila desde el ícono y activá el recordatorio en Ajustes ⚙ (las notificaciones sólo funcionan desde el ícono, no desde Safari).

## Estructura

```
index.html               Redirección al entrar por la raíz
DescubrirTe.html         Página principal de la app
manifest.webmanifest     Datos de instalación (nombre, ícono, atajos)
sw.js                    Service worker: offline + alarmas en segundo plano
.nojekyll                Necesario para que GitHub Pages sirva todo tal cual
app/
  brand.jsx              Paletas, tipografías, preguntas guía
  program.jsx            Los 7 ejercicios del diario
  exercise.jsx           Pantalla del ejercicio del día
  checkin.jsx            Flujo de mañana y noche
  patterns.jsx           Pantalla de patrones
  analysis.jsx           Motor de análisis (palabras, temas, ánimo)
  screens.jsx            Bienvenida, Hoy, Mi viaje
  ui.jsx                 Componentes compartidos
  storage.jsx            Guardado local + semana de ejemplo
  reminders.jsx          Alarmas y notificaciones
  export.jsx             Resumen exportable (PNG / PDF)
  pwa.jsx                Instalación y service worker
  app.jsx                Raíz: navegación y estado
frames/                  Marcos de iPhone y Android (sólo vista previa)
icons/                   Íconos de la app
assets/                  Kit de marca
tweaks-panel.jsx         Panel de ajustes visuales (sólo vista previa)
```

`uploads/` y `screenshots/` están en `.gitignore`: son material de origen y no hace falta publicarlos.

## Notas técnicas

- Sin dependencias que instalar ni build. React y Babel se cargan por CDN con versión fija.
- Se sirve como archivos estáticos: cualquier hosting https funciona (GitHub Pages, Netlify, Vercel).
- Al actualizar archivos, el service worker usa *network-first*, así que los cambios se ven al recargar.
- Si cambiás el nombre del repositorio, no hace falta tocar nada: todas las rutas son relativas.

## Licencia

Sin licencia declarada: todos los derechos reservados. Si querés permitir que otras personas la reutilicen, agregá un archivo `LICENSE` (en GitHub: **Add file → Create new file → LICENSE →** *Choose a license template*).
