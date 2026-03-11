import type { FastifyInstance } from 'fastify'
import websocket from '@fastify/websocket'
import type { SocketStream } from '@fastify/websocket'

interface Client {
  socket: SocketStream
  userId: string | null
  userName: string | null
}

const MAX_MESSAGE_LENGTH = 500
const rooms = new Map<string, Set<Client>>()

export async function registerChatRoutes (app: FastifyInstance): Promise<void> {
  if (!app.hasRequestDecorator('ws')) {
    await app.register(websocket)
  }

  app.get('/chat/:streamId', { websocket: true }, (connection, req) => {
    const streamId = (req.params as any).streamId as string

    let userId: string | null = null
    let userName: string | null = null
    try {
      const url = new URL(req.url, 'http://localhost')
      const token = url.searchParams.get('token')
      if (token != null) {
        const decoded = app.jwt.verify<{ sub: string; email: string }>(token)
        userId = decoded.sub
        userName = decoded.email.split('@')[0]
      }
    } catch {
      // anonymous connection
    }

    let room = rooms.get(streamId)
    if (room == null) {
      room = new Set()
      rooms.set(streamId, room)
    }
    const client: Client = { socket: connection, userId, userName }
    room.add(client)

    connection.socket.on('message', (raw: Buffer) => {
      const payload = raw.toString().trim()
      if (payload.length === 0 || payload.length > MAX_MESSAGE_LENGTH) return

      const msg = { userId, userName, message: payload, ts: Date.now() }
      const json = JSON.stringify(msg)
      room?.forEach((c) => {
        try { c.socket.socket.send(json) } catch { /* disconnected */ }
      })
    })

    connection.socket.on('close', () => {
      room?.delete(client)
      if (room != null && room.size === 0) rooms.delete(streamId)
    })

    connection.socket.on('error', () => {
      room?.delete(client)
    })
  })
}
