# 🎌 Anime Scraper API

API REST propia deployada en Vercel para scraping de anime.

## Setup

```bash
npm install
npm run dev     # desarrollo local
npm run deploy  # deploy a producción
```

## Endpoints

### 🔍 Buscar anime
```
GET /api/search?q={query}&source={source}
```
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `q` | string | — | Término de búsqueda |
| `source` | string | `gogoanime` | Fuente del scraper |

**Ejemplo:**
```
GET /api/search?q=naruto
```
```json
{
  "success": true,
  "data": {
    "source": "gogoanime",
    "query": "naruto",
    "results": [
      {
        "id": "naruto-shippuden",
        "title": "Naruto: Shippuden",
        "image": "https://...",
        "released": "2007"
      }
    ]
  }
}
```

---

### 📺 Info + episodios de un anime
```
GET /api/anime/{id}?source={source}
```

**Ejemplo:**
```
GET /api/anime/naruto-shippuden
```
```json
{
  "success": true,
  "data": {
    "id": "naruto-shippuden",
    "title": "Naruto: Shippuden",
    "description": "...",
    "genres": ["Action", "Adventure"],
    "status": "Completed",
    "totalEpisodes": 500,
    "episodes": [
      { "id": "naruto-shippuden-episode-1", "number": "1" }
    ]
  }
}
```

---

### 🎬 Servidores de streaming de un episodio
```
GET /api/episode/{episodeId}?source={source}
```

**Ejemplo:**
```
GET /api/episode/naruto-shippuden-episode-1
```
```json
{
  "success": true,
  "data": {
    "episodeId": "naruto-shippuden-episode-1",
    "servers": [
      { "name": "vidstreaming", "link": "https://..." },
      { "name": "gogo", "link": "https://..." }
    ]
  }
}
```

---

### 🆕 Episodios recientes
```
GET /api/recent?page={page}&type={type}
```
| Param | Valores | Descripción |
|---|---|---|
| `page` | número | Página (default: 1) |
| `type` | 1, 2, 3 | 1=SUB · 2=DUB · 3=CN |

---

## Fuentes disponibles (`source`)

| Valor | Sitio |
|---|---|
| `gogoanime` | anitaku.pe |

> Para agregar más fuentes, creá un scraper en `lib/scrapers/` e importalo en cada endpoint.

## Cache

| Endpoint | Cache |
|---|---|
| `/api/recent` | 60s |
| `/api/episode/[id]` | 120s |
| `/api/search` | 180s |
| `/api/anime/[id]` | 600s |

## Estructura

```
anime-api/
├── api/
│   ├── search.ts
│   ├── recent.ts
│   ├── anime/[id].ts
│   └── episode/[id].ts
├── lib/
│   ├── utils.ts
│   └── scrapers/
│       └── gogoanime.ts   ← agregar más acá
├── vercel.json
├── package.json
└── tsconfig.json
```
