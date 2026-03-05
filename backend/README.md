# Backend (Fastify)

## Запуск локально
1. Скопіюйте `.env.example` → `.env` і заповніть `DATABASE_URL`, `JWT_SECRET`.
2. Увімкніть розширення в Postgres: `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`.
3. Встановіть залежності в корені: `pnpm install`.
4. Запустіть: `pnpm dev` (порт 4000).

## Маршрути
- `POST /auth/register` { email, password }
- `POST /auth/login` { email, password }
- `POST /auth/refresh` { refreshToken }
- `GET /auth/me` (Bearer)
- `GET /streams`
- `POST /streams` (Bearer) — створити стрім + ключ
- `POST /streams/:id/start|stop` (Bearer)
- `POST /api/webhooks/stream-start` — Nginx webhook (`application/x-www-form-urlencoded`, `name=<streamId>`)
- `POST /api/webhooks/stream-stop` — Nginx webhook (`application/x-www-form-urlencoded`, `name=<streamId>`)
- `GET /chat/:streamId` — WebSocket чат
- `GET /health`

## Нотатки
- Refresh-токени зберігаються в таблиці `refresh_tokens` (рандомний ключ + expires_at).
- Ingest базовий: `RTMP_INGEST_BASE_URL` (default `rtmp://127.0.0.1:1935/live`) + `/{streamId}`.
- Вебклієнт програє HLS за форматом `${VITE_MEDIA_SERVER_URL}/hls/{streamId}/index.m3u8`.
