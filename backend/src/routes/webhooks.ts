import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { pool } from '../db'

const webhookSchema = z.object({
  name: z.string().uuid()
})

async function updateStreamStatus (streamId: string, status: 'live' | 'offline'): Promise<number> {
  const res = await pool.query(
    'UPDATE streams SET status=$1, updated_at=now() WHERE id=$2',
    [status, streamId]
  )
  return res.rowCount ?? 0
}

export async function registerWebhookRoutes (app: FastifyInstance): Promise<void> {
  app.post('/api/webhooks/stream-start', async (request, reply) => {
    const parsed = webhookSchema.safeParse(request.body)
    if (!parsed.success) {
      return await reply.code(400).send({ error: 'Expected form field name=<streamId>' })
    }
    const updated = await updateStreamStatus(parsed.data.name, 'live')
    return await reply.send({ ok: true, updated })
  })

  app.post('/api/webhooks/stream-stop', async (request, reply) => {
    const parsed = webhookSchema.safeParse(request.body)
    if (!parsed.success) {
      return await reply.code(400).send({ error: 'Expected form field name=<streamId>' })
    }
    const updated = await updateStreamStatus(parsed.data.name, 'offline')
    return await reply.send({ ok: true, updated })
  })
}
