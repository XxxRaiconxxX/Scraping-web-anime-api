# Changelog IA

Historial de cambios realizados por agentes de IA en este repositorio.

## 2026-07-16
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
