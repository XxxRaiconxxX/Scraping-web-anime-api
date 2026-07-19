# Changelog IA

Historial de cambios realizados por agentes de IA en este repositorio.

## 2026-07-19
- **feat**: Migración del scraper de AnimeFLV a su nuevo dominio `https://animeflv.or.at/` ya que el dominio anterior dejó de ofrecer servidores de reproducción.
- **feat**: Rediseño de selectores y análisis de HTML (búsqueda mediante `?s=`, detalles vía metadatos del tema de WordPress y JSON incrustado `.animeflv-episodes-data`).
- **feat**: Soporte para la extracción nativa tanto de servidores de streaming (decodificados desde Base64 `data-src` en `.iframe_btn`) como de enlaces de descarga directa (de la tabla de descargas).
- **feat**: Actualización del endpoint `api/episode/[id].ts` para admitir de forma nativa y retrocompatible objetos estructurados con propiedades `stream` y `download`.
- **fix**: Corrección en `animeflvSearch` implementando búsqueda a través del WP REST API `/wp-json/wp/v2/categories` e iteración paralela de raspado de portadas. Esto resuelve la indexación de búsqueda rota del frontend (`?s=`) del nuevo dominio, permitiendo buscar series del catálogo como `clevatess` o `mushoku` de forma instantánea.
- **feat**: Integración del nuevo proveedor `animeflvone` (`https://vww.animeflv.one/`). Añadido el scraper `lib/scrapers/animeflvone.ts` y cableado en los endpoints de la API (`api/search.ts`, `api/anime/[id].ts`, `api/episode/[id].ts`, `api/recent.ts`). Soporta búsqueda, detalles de anime con lista de episodios desde variables JS globales, y obtención dinámica de opciones de video mediante emulación de peticiones POST a `/flv` con decodificación de strings hex, así como extracción de enlaces de descargas del atributo `data-dwn`.
- **check**: Ejecución exitosa de pruebas automatizadas locales de búsqueda, detalle y servidores/descargas para "black torch" en vivo contra el nuevo dominio.
- **fix**: Corrección en `anichiServers` de `lib/scrapers/anichi.ts` y del controlador de API `api/episode/[id].ts` para evadir los bloqueos de IP/anti-hotlinking del dominio `anichi.to`. Al recibir los parámetros `series` y `episode` (enviados por el cliente), se genera y devuelve directamente el enlace de reproducción oficial en el sitio web original (`https://anichi.to/watch/...`). Esto evita los errores 404 causados por la verificación cruzada de IP y cookies del reproductor incrustado.
- *Firma*: [Antigravity]

## 2026-07-16
- **fix**: Las fichas AniChi usan cabeceras HTML separadas de las llamadas AJAX y reintentan una vez la carga completa ante respuestas transitorias o incompletas.
- **fix**: La comprobacion e2e incorpora `Black Butler: Book of the Atlantic` y exige que una pelicula se normalice como un episodio con sinopsis disponible.
- **check**: La prueba en vivo devolvio 12 episodios de serie, 1 episodio de pelicula y 9 servidores; `npx tsc --noEmit -p tsconfig.json` paso limpio.
- **Riesgo abierto**: El reintento no protege frente a cambios permanentes del HTML o endpoints privados de AniChi.
- *Firma*: [Codex]

- **feat**: Integracion de `anichi.to` en `lib/scrapers/anichi.ts` con busqueda, ficha, episodios y resolucion tolerante a fallos de hasta 12 servidores por episodio.
- **feat**: Los endpoints `search.ts`, `anime/[id].ts` y `episode/[id].ts` aceptan ahora `source=anichi` bajo la autenticacion existente.
- **check**: `lib/test_anichi.ts` comprobo en vivo 5 resultados, 12 episodios y 9 servidores; `npx tsc --noEmit -p tsconfig.json` paso limpio y el audit de produccion reporto 0 vulnerabilidades.
- **Riesgos abiertos**: AniChi no publica API ni SLA, sus rutas privadas pueden cambiar sin aviso y sus Terms of Use no garantizan permiso para este conector.
- *Firma*: [Codex]

## 2026-06-21
- **feat**: Integración de scraper para `veranimeonline.co` (Dooplay template) en `lib/scrapers/veranimeonline.ts`.
- **feat**: Actualización de los endpoints `search.ts`, `anime/[id].ts` y `episode/[id].ts` para aceptar `source=veranimeonline`.
- **Riesgos abiertos**: Ninguno detectado. El sitio no utiliza protección agresiva de Cloudflare, a diferencia del intento inicial con animeonline.ninja.
- *Firma*: [Antigravity]
