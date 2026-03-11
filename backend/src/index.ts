import { resolve } from 'path'
import Fastify from 'fastify'
import type { FastifyReply, FastifyRequest } from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import websocket from '@fastify/websocket'
import multipart from '@fastify/multipart'
import fstatic from '@fastify/static'
import { env } from './config/env'
import { migrate, pool } from './db'
import { registerHealthRoutes } from './routes/health'
import { registerAuthRoutes } from './routes/auth'
import { registerStreamRoutes } from './routes/streams'
import { registerChatRoutes } from './routes/chat'
import { registerWebhookRoutes } from './routes/webhooks'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      sub: string
      email: string
      role: string
      iat: number
      exp: number
    }
  }
}

async function bootstrap (): Promise<void> {
  const app = Fastify({ logger: true })

  await app.register(cors, { origin: env.CORS_ORIGIN ?? true })
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' })
  await app.register(jwt, { secret: env.JWT_SECRET })
  await app.register(websocket)
<<<<<<< HEAD
  app.addContentTypeParser(
    'application/x-www-form-urlencoded',
    { parseAs: 'string' },
    (request, body, done) => {
      try {
        const parsedBody: Record<string, string> = {}
        const params = new URLSearchParams(body as string)
        for (const [key, value] of params.entries()) {
          parsedBody[key] = value
        }
        done(null, parsedBody)
      } catch (error) {
        request.log.error(error)
        done(error as Error, undefined)
      }
    }
  )
=======
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } })
  await app.register(fstatic, { root: resolve(process.cwd(), 'uploads'), prefix: '/uploads/', decorateReply: false })
<<<<<<< HEAD
>>>>>>> 294a6af (feat: thumbnail upload, rich chat (emoji/timestamps/system msgs), design polish)
=======
  app.addContentTypeParser(
    'application/x-www-form-urlencoded',
    { parseAs: 'string' },
    (request, body, done) => {
      try {
        const parsedBody: Record<string, string> = {}
        const params = new URLSearchParams(body as string)
        for (const [key, value] of params.entries()) {
          parsedBody[key] = value
        }
        done(null, parsedBody)
      } catch (error) {
        request.log.error(error)
        done(error as Error, undefined)
      }
    }
  )
>>>>>>> bcebf11 (refactor: unify stream ingest URL and key handling; add webhook routes for stream status updates)

  app.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      return await reply.code(401).send({ error: 'Unauthorized' })
    }
  })

  app.setErrorHandler(async (error, request, reply) => {
    request.log.error(error)
    const statusCode = error.statusCode ?? 500
    return await reply.code(statusCode).send({
      error: statusCode >= 500 ? 'Internal Server Error' : error.message
    })
  })

  await migrate()

  await registerHealthRoutes(app)
  await registerAuthRoutes(app)
  await registerStreamRoutes(app)
  await registerChatRoutes(app)
  await registerWebhookRoutes(app)

  const port = env.PORT
  app.listen({ port, host: '0.0.0.0' }, (err, address) => {
    if (err != null) {
      app.log.error(err)
      process.exit(1)
    }
    app.log.info(`server listening on ${address}`)
  })

  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']
  for (const sig of signals) {
    process.on(sig, async () => {
      await app.close()
      await pool.end()
      process.exit(0)
    })
  }
}

void bootstrap()
