// Función serverless de Vercel: sirve POST /api/daily en producción.
// Vercel detecta esta carpeta api/ y expone cada archivo como un endpoint.
// La ANTHROPIC_API_KEY se toma de las Environment Variables del proyecto en
// Vercel (NO del .env local, que no se sube).
import { generateDaily } from '../server/daily-core.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Método no permitido' })
  }

  // Vercel parsea el JSON del body automáticamente en req.body.
  const { status, body } = await generateDaily(req.body)
  return res.status(status).json(body)
}
