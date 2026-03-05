import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { pool } from '../db'
import { env } from '../config/env'

const createStreamSchema = z.object({
  title: z.string().min(3).max(120)
})

const idParamSchema = z.object({
  id: z.string().uuid()
})

export async function registerStreamRoutes (app: FastifyInstance): Promise<void> {
  app.get('/streams', async (request: FastifyRequest) => {
    let userId: string | null = null
    try {
      await request.jwtVerify()
      userId = request.user?.sub ?? null
    } catch {
      // anonymous — no token or invalid token
    }
    const res = await pool.query(
      'SELECT id, title, status, ingest_url, stream_key, user_id, created_at FROM streams ORDER BY created_at DESC'
    )
    const streams = res.rows.map((s: Record<string, unknown>) => ({
      id: s.id,
      title: s.title,
      status: s.status,
      ingest_url: s.user_id === userId ? s.ingest_url : null,
      stream_key: s.user_id === userId ? s.id : null,
      user_id: s.user_id,
      created_at: s.created_at
    }))
    return { streams }
  })

  app.post('/streams', { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = createStreamSchema.safeParse(request.body)
    if (!parsed.success) {
      return await reply.code(400).send({ error: parsed.error.flatten() })
    }
    const { title } = parsed.data
    const created = await pool.query(
      'INSERT INTO streams (user_id, title, status) VALUES ($1, $2, $3) RETURNING *',
      [request.user.sub, title, 'offline']
    )
    const streamId = created.rows[0].id as string
    const ingestUrl = `${env.RTMP_INGEST_BASE_URL}/${streamId}`
    const updated = await pool.query(
      'UPDATE streams SET ingest_url=$1, stream_key=$2, updated_at=now() WHERE id=$3 RETURNING *',
      [ingestUrl, streamId, streamId]
    )
    return { stream: updated.rows[0] }
  })

  app.post('/streams/:id/start', { preHandler: [app.authenticate] }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    if (!params.success) return await reply.code(400).send({ error: params.error.flatten() })

    const stream = await pool.query('SELECT * FROM streams WHERE id=$1', [params.data.id])
    if (stream.rowCount === 0) return await reply.code(404).send({ error: 'Stream not found' })

    const record = stream.rows[0]
    if (record.user_id !== request.user.sub && request.user.role !== 'admin') {
      return await reply.code(403).send({ error: 'Forbidden' })
    }
    const updated = await pool.query(
      'UPDATE streams SET status=$1, updated_at=now() WHERE id=$2 RETURNING *',
      ['live', params.data.id]
    )
    return { stream: updated.rows[0] }
  })

  app.post('/streams/:id/stop', { preHandler: [app.authenticate] }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    if (!params.success) return await reply.code(400).send({ error: params.error.flatten() })

    const stream = await pool.query('SELECT * FROM streams WHERE id=$1', [params.data.id])
    if (stream.rowCount === 0) return await reply.code(404).send({ error: 'Stream not found' })

    const record = stream.rows[0]
    if (record.user_id !== request.user.sub && request.user.role !== 'admin') {
      return await reply.code(403).send({ error: 'Forbidden' })
    }
    const updated = await pool.query(
      'UPDATE streams SET status=$1, updated_at=now() WHERE id=$2 RETURNING *',
      ['offline', params.data.id]
    )
    return { stream: updated.rows[0] }
  })

  app.delete('/streams/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    if (!params.success) return await reply.code(400).send({ error: params.error.flatten() })

    const stream = await pool.query('SELECT user_id FROM streams WHERE id=$1', [params.data.id])
    if (stream.rowCount === 0) return await reply.code(404).send({ error: 'Stream not found' })

    const record = stream.rows[0]
    if (record.user_id !== request.user.sub && request.user.role !== 'admin') {
      return await reply.code(403).send({ error: 'Forbidden' })
    }
    await pool.query('DELETE FROM streams WHERE id=$1', [params.data.id])
    return await reply.send({ ok: true })
  })
}
