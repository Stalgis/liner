# Liner

Descubrimiento musical diario: usando tus datos de Spotify, Liner te recomienda cada día un álbum, un artista y una canción — y te cuenta la historia detrás (como las viejas *liner notes*) antes de darle play.

React + TypeScript + Vite en el frontend, con un backend Express que habla con la API de Claude.

## Getting started

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173) in your browser (usá `127.0.0.1`, no `localhost`: lo exige el login de Spotify).

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
src/
├── components/   # UI components
├── hooks/        # Custom React hooks
├── lib/          # Utilities and helpers
├── types/        # Shared TypeScript types
├── App.tsx       # Root component
├── main.tsx      # Entry point
└── app.css       # Global styles + tema (Tailwind v4)
```
