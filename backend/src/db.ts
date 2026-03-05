import { Pool } from 'pg'
import { env } from './config/env'

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10
})

export async function migrate (): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        role text NOT NULL DEFAULT 'user',
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token text NOT NULL,
        user_agent text,
        ip text,
        created_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz NOT NULL
      );

      CREATE TABLE IF NOT EXISTS streams (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title text NOT NULL,
        description text DEFAULT '',
        status text NOT NULL DEFAULT 'offline',
        ingest_url text,
        stream_key text,
        viewer_count integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS chat_bans (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        stream_id uuid NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason text,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_streams_user_id ON streams(user_id);
      CREATE INDEX IF NOT EXISTS idx_streams_status ON streams(status);
      CREATE INDEX IF NOT EXISTS idx_chat_bans_stream_user ON chat_bans(stream_id, user_id);
    `)

    // Keep ingest/key semantics consistent for OBS and Nginx:
    // ingest is always {RTMP_INGEST_BASE_URL}/{streamId}, key is streamId.
    await client.query(
      `UPDATE streams
       SET ingest_url=$1 || '/' || id::text,
           stream_key=id::text,
           updated_at=now()
       WHERE ingest_url IS NULL
          OR ingest_url <> $1 || '/' || id::text
          OR stream_key IS NULL
          OR stream_key <> id::text`,
      [env.RTMP_INGEST_BASE_URL]
    )
  } finally {
    client.release()
  }
}
