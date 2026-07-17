// Backend Express: server de DESARROLLO LOCAL. Vite (5173) proxya /api aquí.
// En producción (Vercel) el mismo endpoint lo sirve api/daily.js.
// Ambos comparten la lógica de server/daily-core.js — el ÚNICO lugar con la
// llamada a Claude, donde vive la ANTHROPIC_API_KEY.

import dotenv from 'dotenv'
// Cargamos primero .env.local (gitignored) y luego .env.
dotenv.config({ path: ['.env.local', '.env'] })

import express from 'express'
import { generateDaily } from './daily-core.js'

const app = express()
app.use(express.json())

app.post('/api/daily', async (req, res) => {
  const { status, body } = await generateDaily(req.body)
  res.status(status).json(body)
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`✅ API de Liner escuchando en http://localhost:${PORT}`)
})
