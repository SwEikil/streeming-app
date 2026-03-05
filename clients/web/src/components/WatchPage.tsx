import { useState } from 'react'
import { Player } from './Player'
import { Chat } from './Chat'
import { api } from '../api'
import { getMediaServerUrl } from '../config/env'

interface Stream {
  id: string
  title: string
  status: string
  ingest_url: string | null
  user_id: string
}

interface Props {
  stream: Stream
  user: { id: string; email: string; role: string } | null
  onBack: () => void
  onRefresh: () => void
  onDelete: (id: string) => void
}

const mediaServerUrl = getMediaServerUrl()

export function WatchPage ({ stream, user, onBack, onRefresh, onDelete }: Props): JSX.Element {
  const isOwner = user != null && user.id === stream.user_id
  const [followed, setFollowed] = useState(false)

  const playbackUrl = `${mediaServerUrl}/hls/${stream.id}/index.m3u8`
  const defaultObsServer = 'rtmp://localhost/live'
  const obsServer = (
    stream.ingest_url != null && stream.ingest_url.endsWith(`/${stream.id}`)
      ? stream.ingest_url.slice(0, -(`/${stream.id}`).length)
      : defaultObsServer
  )

  const handleStart = async (): Promise<void> => {
    try { await api.post(`/streams/${stream.id}/start`); onRefresh() } catch { /* */ }
  }

  const handleStop = async (): Promise<void> => {
    try { await api.post(`/streams/${stream.id}/stop`); onRefresh() } catch { /* */ }
  }

  const handleDelete = async (): Promise<void> => {
    if (!confirm('Видалити цей стрім?')) return
    try { await api.delete(`/streams/${stream.id}`); onDelete(stream.id) } catch { /* */ }
  }

  const copyToClipboard = (text: string | null): void => {
    if (text != null) void navigator.clipboard.writeText(text)
  }

  return (
    <div className="watch-layout">
      <div className="watch-main">
        <div className="watch-player">
          <Player src={playbackUrl} />
        </div>
        <div className="watch-info">
          <div className="watch-info-left">
            <div className="watch-avatar">{stream.title[0]}</div>
            <div className="watch-meta">
              <h1>{stream.title}</h1>
              <div className="watch-details">
                <span className={`status-badge ${stream.status}`}>
                  {stream.status === 'live' ? '🔴 LIVE' : 'Офлайн'}
                </span>
                <span className="watch-streamer">Streamer #{stream.user_id.slice(0, 8)}</span>
              </div>
            </div>
          </div>
          <div className="watch-actions">
            {!isOwner && user != null && (
              <button
                className={`btn-follow ${followed ? 'following' : ''}`}
                onClick={() => { setFollowed(!followed) }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={followed ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21.3l7.8-7.8 1-1.1a5.5 5.5 0 000-7.8z" />
                </svg>
                {followed ? 'Підписано' : 'Підписатись'}
              </button>
            )}
            {isOwner && (
              <>
                {stream.status !== 'live' ? (
                  <button className="btn-go-live" onClick={() => { void handleStart() }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                    Go Live
                  </button>
                ) : (
                  <button className="btn-stop" onClick={() => { void handleStop() }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
                    Зупинити
                  </button>
                )}
                <button className="btn-icon btn-danger-icon" onClick={() => { void handleDelete() }} title="Видалити стрім">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </>
            )}
            <button className="btn-icon" onClick={onBack} title="Назад до списку">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>

        {isOwner && stream.ingest_url != null && (
          <div className="watch-ingest">
            <div className="ingest-row">
              <span className="ingest-label">Server</span>
              <code>{obsServer}</code>
              <button className="btn-copy" onClick={() => { copyToClipboard(obsServer) }} title="Копіювати">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              </button>
            </div>
            <div className="ingest-row">
              <span className="ingest-label">Stream Key</span>
              <code>{stream.id}</code>
              <button className="btn-copy" onClick={() => { copyToClipboard(stream.id) }} title="Копіювати">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
      <Chat streamId={stream.id} />
    </div>
  )
}
