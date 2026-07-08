# Liner

Descubrimiento musical diario: usando tus datos de Spotify, Liner te recomienda cada día un álbum, un artista y una canción — y te cuenta la historia detrás (como las viejas *liner notes*) antes de darle play.

React + TypeScript + Vite en el frontend, con un backend Express que habla con la API de Claude.

## Setup

Necesitás **Node 18+**, una app de **Spotify** y una **API key de Anthropic**.

### 1. Crear la app de Spotify

En [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) → **Create app**:

- **Redirect URI** (exacto): `http://127.0.0.1:5173/callback` — tiene que ser `127.0.0.1`, no `localhost`.
- Marcá **Web API**.
- Copiá el **Client ID**.
- En **User Management**, agregá el email de cada cuenta de Spotify que vaya a usar la app. La app está en Development Mode: **solo entran las cuentas registradas ahí**.

### 2. API key de Anthropic

Generá una en [console.anthropic.com](https://console.anthropic.com/settings/keys) (necesita saldo/crédito).

### 3. Variables de entorno

```bash
cp .env.example .env
```

Completá `.env` con tu `VITE_SPOTIFY_CLIENT_ID` y tu `ANTHROPIC_API_KEY`. El `.env` no se versiona (está en `.gitignore`).

### 4. Instalar y correr

```bash
npm install
npm start
```

Abrí [http://127.0.0.1:5173](http://127.0.0.1:5173) — usá `127.0.0.1`, **no** `localhost` (lo exige el login de Spotify).

## Scripts

| Command           | Description                                  |
| ----------------- | -------------------------------------------- |
| `npm start`       | Frontend + backend juntos (Vite + Express)   |
| `npm run dev`     | Solo el frontend (Vite)                      |
| `npm run server`  | Solo el backend (Express → API de Claude)    |
| `npm run build`   | Type-check and build                         |
| `npm run preview` | Preview production build                     |
| `npm run lint`    | Run Oxlint                                   |

## Project structure

```
server/            # Backend Express (habla con la API de Claude)
└── index.js
src/
├── components/    # UI + componentes shadcn (en ui/)
├── screen/        # Pantallas: Landing y su landing/ (hero animado)
├── hooks/         # Custom React hooks (useSpotifyAuth)
├── lib/           # OAuth de Spotify + helpers
├── types/         # Tipos TypeScript compartidos
├── App.tsx        # Componente raíz
├── main.tsx       # Entry point
└── app.css        # Estilos globales + tema (Tailwind v4)
```
