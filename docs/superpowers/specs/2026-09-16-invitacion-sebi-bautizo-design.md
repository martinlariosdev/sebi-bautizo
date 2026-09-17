# Diseño — Invitación digital: Bautizo y Cumpleaños de Sebastián León

## 1. Objetivo

Página web de una sola vista que muestra el flyer original de la invitación (imagen) y convierte sus 3 CTAs visuales en enlaces reales:

1. **Ver en Maps** — ubicación de la ceremonia religiosa (Parroquia San Antonio).
2. **Ver en Maps** — ubicación de la recepción (Casa club Residencial Camino verde).
3. **Confirmar asistencia** — abre WhatsApp con un mensaje prellenado.

El diseño visual del flyer no se toca ni se recrea; se usa como imagen y se superponen hotspots transparentes.

Este documento parte del plan original compartido por el usuario (`plan-pagina-confirmacion-evento.md`) y lo cierra con las decisiones tomadas durante brainstorming.

## 2. Decisiones tomadas en brainstorming

| Pregunta | Decisión |
|---|---|
| Ubicación del proyecto | Carpeta nueva `sebi-bautizo`, repo propio `git@github.com:martinlariosdev/sebi-bautizo.git` |
| Destino de "Confirmar asistencia" | Enlace `wa.me` (WhatsApp), no formulario ni página interna |
| Analytics | Omitido en v1 |
| Deploy | Vercel |
| QR del link final | Imagen PNG/SVG generada aparte después del deploy, no embebida en la página |

## 3. Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- `next/image` para el flyer
- Sin backend, sin base de datos, sin CMS — página estática

## 4. Estructura del proyecto

```
sebi-bautizo/
├── app/
│   ├── page.tsx          # única página
│   ├── layout.tsx        # metadata (title, OG, favicon)
│   └── globals.css
├── components/
│   └── EventFlyer.tsx    # imagen del flyer + 3 hotspots
├── lib/
│   └── links.ts          # config centralizada: URLs de maps + whatsapp
├── public/
│   └── flyer.webp        # flyer convertido desde assets/flyer_2x.png
├── scripts/
│   └── generate-qr.mjs   # genera el PNG del QR a partir de la URL de producción
├── assets/
│   └── flyer_2x.png      # fuente original de mayor resolución (779×2019), no servida directamente
└── docs/
    └── superpowers/specs/  # este documento
```

## 5. Componente `EventFlyer`

- Contenedor `relative w-full max-w-[618px] mx-auto` — el ancho máximo de despliegue se mantiene en 618px aunque la imagen fuente sea de mayor resolución (779×2019); es solo densidad de píxeles extra para pantallas retina.
- `next/image` con `width={779} height={2019}` fijos (dimensiones intrínsecas reales del archivo, no `fill`) y `className="block w-full h-auto"` — el navegador escala hacia abajo al ancho del contenedor, evita layout shift y coincide con el aspect ratio real de la imagen. `fill` queda descartado por añadir complejidad (requiere `aspect-ratio` propio en el contenedor) sin ningún beneficio aquí.
- 3 elementos `<a>` absolutos posicionados en **porcentajes** (no píxeles), para que se mantengan alineados con los botones del flyer en cualquier tamaño de pantalla.
- Cada `<a>` lleva `aria-label` descriptivo y feedback visual sutil (`hover:bg-white/10`, `active:bg-white/20`).
- Las coordenadas exactas de cada hotspot se miden sobre la imagen final y se validan visualmente en desktop y mobile durante implementación (no se fijan en este spec).

## 6. Enlaces y configuración

`lib/links.ts` centraliza los 3 destinos:

```ts
const WHATSAPP_NUMBER = "50557253871";
const WHATSAPP_MESSAGE =
  "Hola soy {Tu_Nombre_Y_Acompañante}\n\n¡Sí, estaré presente! 💙. Será un placer acompañarlos y compartir con ustedes ese día tan especial. 🕊️✨";

export const eventLinks = {
  churchMaps: "https://maps.app.goo.gl/YmkX9tMLW1qTpe8S7",
  receptionMaps: "https://maps.app.goo.gl/Ks5CrTZNgYBN41hj6",
  whatsappConfirm: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`,
};
```

El mensaje se codifica en runtime con `encodeURIComponent`, no se hardcodea ya codificado, para evitar errores manuales con los emojis/acentos.

El placeholder `{Tu_Nombre_Y_Acompañante}` es intencional: `wa.me` solo permite prellenar texto estático, no puede inyectar el nombre del invitado dinámicamente. El invitado ve el mensaje ya cargado en WhatsApp y reemplaza el placeholder por su nombre antes de enviarlo.

**Nota sobre el emoji de corazón:** se usa 💙 (U+1F499, "blue heart", Unicode 6.0/2010) en lugar de 🩵 (U+1FA75, "light blue heart", Unicode 15.0/2022). El emoji más nuevo se codifica correctamente pero muchos teléfonos/versiones de WhatsApp desactualizadas no tienen su glifo en la fuente del sistema, y lo muestran como un rombo con signo de interrogación (glifo de "emoji no soportado", no un error de codificación). 💙 tiene soporte prácticamente universal.

Comportamiento:
- Maps (iglesia y recepción): `target="_blank" rel="noopener noreferrer"`.
- WhatsApp: `target="_blank" rel="noopener noreferrer"`, URL `wa.me` con número y mensaje prellenado (ambos pendientes de que el usuario los proporcione).

**Nota sobre el formato del número de WhatsApp:** `wa.me/<numero>` requiere el número en formato internacional, solo dígitos, sin `+`, sin espacios ni guiones, y sin prefijos de larga distancia nacional (ej. en México: `52` + 10 dígitos, sin anteponer `044`/`045`). El mensaje prellenado (`?text=...`) debe ir URL-encoded.

Estas tres URLs son el único dato externo bloqueante para completar la implementación; todo lo demás de este spec es autocontenible.

## 7. Accesibilidad y UX

- Los 3 hotspots son elementos `<a>` reales (no `onClick` + `window.location`), para soporte de teclado, lectores de pantalla y comportamiento estándar del navegador.
- `aria-label` en cada uno:
  - "Ver ubicación de la iglesia en Google Maps"
  - "Ver ubicación de la recepción en Google Maps"
  - "Confirmar asistencia por WhatsApp"
- Feedback visual discreto en hover/active/tap, sin alterar la estética del flyer.

## 8. Manejo de errores y testing

**Manejo de errores:**
- Si la imagen del flyer falla en cargar (caso raro), el `alt` del `next/image` debe ser suficientemente descriptivo para transmitir el contenido de la invitación por texto.
- `wa.me` en desktop sin sesión de WhatsApp Web abierta redirige automáticamente a `web.whatsapp.com` para iniciar sesión — es comportamiento nativo del enlace, no algo que la app deba manejar.
- No hay estados de error propios de la app (sin backend, sin formularios, sin fetch) — la superficie de fallo se limita a la carga de la imagen y al comportamiento estándar de los enlaces externos.

**Testing / QA** (manual, antes de compartir el link):
- iPhone Safari y Android Chrome — validar que los 3 hotspots caen exactamente sobre los botones del flyer.
- Desktop Chrome y Safari — mismo chequeo, más distintos anchos de ventana.
- Navegación por teclado (Tab + Enter) sobre los 3 enlaces.
- Verificar que los 3 links abren el destino correcto (2 Maps + 1 WhatsApp con mensaje prellenado correcto).
- Compartir el link en un chat de WhatsApp y confirmar que la preview (Open Graph) se ve bien.

## 9. Performance y SEO

- **Resolución del flyer:** el `.jpeg` original medía 618×1600px (1x). El usuario proporcionó `flyer_2x.png` a **779×2019px** (~1.26x, no un 2x completo, pero se usa como fuente por ser la mejor disponible) — se usa como fuente para la conversión a WebP en lugar del original.
- Flyer convertido a `.webp` antes de subirlo a `public/`.
- `next/image` con `preload` (contenido crítico visible; `priority` está deprecado desde Next.js 16 en favor de `preload`).
- Metadata básica en `layout.tsx`: título, descripción, Open Graph image (el propio flyer), favicon — importante porque el link se compartirá por WhatsApp.

## 10. Deploy y QR

1. Push del proyecto al repo `sebi-bautizo` en GitHub.
2. Conectar el repo en Vercel, deploy a producción.
3. Una vez obtenida la URL final, correr `scripts/generate-qr.mjs` (usando la librería `qrcode`) para generar un PNG del QR apuntando a esa URL. El script queda committeado en el repo para poder regenerar el QR si la URL cambia; el PNG resultante no se commitea, es un output descartable para imprimir/compartir.

## 11. Explícitamente fuera de alcance (v1)

- Login, base de datos, CMS, panel administrativo, backend.
- Sistema de RSVP propio (se resuelve vía WhatsApp).
- Analytics / tracking de clicks.
- QR embebido en la página.
- Rediseño del flyer o botones adicionales fuera de él.

## 12. Pendientes antes de implementar

Todos los bloqueantes están resueltos:
- ✅ URL de Google Maps — Parroquia San Antonio.
- ✅ URL de Google Maps — Casa club Residencial Camino verde.
- ✅ Número de WhatsApp (`50557253871`) y mensaje prellenado.
- ✅ Flyer 2x (`flyer_2x.png`, 779×2019px) proporcionado como fuente.

No bloqueantes (se resuelven durante implementación):
- Coordenadas exactas (%) de los 3 hotspots sobre el flyer.
- Conversión del flyer a WebP.

Spec completo — listo para pasar a plan de implementación.
