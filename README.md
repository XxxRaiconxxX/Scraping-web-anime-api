# 🎌 Anime Scraper API (Kingdoom Edition)

API REST optimizada para Vercel diseñada para el ecosistema Kingdoom. Basada en scraping ligero con caching avanzado.

## ✨ Mejoras Kingdoom
- **Rotación de User-Agents**: Evita bloqueos de Cloudflare.
- **Vercel Edge Caching**: Peticiones casi instantáneas mediante `s-maxage`.
- **Soporte Multi-Idioma**: GogoAnime (Inglés) y AnimeFLV (Español).
- **CORS Habilitado**: Acceso global desde cualquier dominio.

## Setup

```bash
npm install
npm run dev     # desarrollo local
npm run deploy  # deploy a producción (Vercel)
```

## Endpoints

### 🔍 Buscar anime
```
GET /api/search?q={query}&source={source}
```
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `q` | string | — | Término de búsqueda |
| `source` | string | `animeflv` | `animeflv` (ES) o `gogoanime` (EN) |

**Ejemplo:** `/api/search?q=naruto&source=animeflv`

---

### 📺 Info + episodios de un anime
```
GET /api/anime/{id}?source={source}
```

**Ejemplo:** `/api/anime/naruto-shippuden?source=animeflv`

---

### 🎬 Servidores de streaming
```
GET /api/episode/{episodeId}?source={source}
```

**Ejemplo:** `/api/episode/naruto-shippuden-1?source=animeflv`

---

### 🆕 Episodios recientes
```
GET /api/recent?source={source}
```

---

## Fuentes disponibles (`source`)

| Valor | Sitio | Idioma |
|---|---|---|
| `animeflv` | animeflv.net | Español |
| `gogoanime` | anitaku.pe | Inglés |

## Estructura

```
anime-api/
├── api/                # Handlers de Vercel
├── lib/
│   ├── utils.ts        # Lógica de headers y cache
│   └── scrapers/       # Motores de scraping por sitio
├── vercel.json
├── package.json
└── tsconfig.json
```

