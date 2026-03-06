import { useState, useRef } from 'react'
import { useI18n } from '../i18n'
import { api, getApiBaseUrl } from '../api'

interface Stream {
  id: string
  title: string
  description: string
  category: string
  language: string
  thumbnail_url: string | null
  status: string
  ingest_url: string | null
  stream_key: string | null
  user_id: string
}

interface Props {
  streams: Stream[]
  userId: string
  onRefresh: () => void
  onDelete: (id: string) => void
  flash: (text: string, type?: 'ok' | 'err') => void
  onShowCreate: () => void
}

export function Dashboard ({ streams, userId, onRefresh, onDelete, flash, onShowCreate }: Props): JSX.Element {
  const { t } = useI18n()
  const myStreams = streams.filter(s => s.user_id === userId)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map())

  const handleThumbUpload = async (streamId: string, file: File): Promise<void> => {
    const fd = new FormData()
    fd.append('file', file)
    try {
      await api.post(`/streams/${streamId}/thumbnail`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      flash(t('thumbnailUploaded'))
      onRefresh()
    } catch { flash(t('createError'), 'err') }
  }

  const toggleKey = (id: string): void => {
    setVisibleKeys(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const copy = (text: string | null): void => {
    if (text == null) return
    void navigator.clipboard.writeText(text)
    flash(t('copied'))
  }

  const handleStart = async (id: string): Promise<void> => {
    try { await api.post(`/streams/${id}/start`); onRefresh() } catch { flash(t('createError'), 'err') }
  }

  const handleStop = async (id: string): Promise<void> => {
    try { await api.post(`/streams/${id}/stop`); onRefresh() } catch { flash(t('createError'), 'err') }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm(t('deleteConfirm'))) return
    try { await api.delete(`/streams/${id}`); onDelete(id) } catch { flash(t('createError'), 'err') }
  }

  return (
    <div className="dashboard">
      <div className="dash-header">
        <h1>{t('dashboardTitle')}</h1>
        <button className="btn-create" onClick={onShowCreate}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          {t('createStream')}
        </button>
      </div>

      {myStreams.length === 0 ? (
        <div className="dash-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
          <p>{t('noOwnStreams')}</p>
        </div>
      ) : (
        <div className="dash-streams">
          {myStreams.map(s => (
            <div key={s.id} className={`dash-card ${s.status === 'live' ? 'dash-card-live' : ''}`}>
              <div className="dash-card-header">
                <div className="dash-card-info">
                  <h3>{s.title}</h3>
                  <div className="dash-card-badges">
                    <span className={`status-badge ${s.status}`}>{s.status === 'live' ? '🔴 LIVE' : t('offline')}</span>
                    {s.category !== 'other' && <span className="dash-tag">{s.category}</span>}
                  </div>
                </div>
                <div className="dash-card-actions">
                  {s.status !== 'live' ? (
                    <button className="btn-go-live" onClick={() => { void handleStart(s.id) }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                      {t('goLive')}
                    </button>
                  ) : (
                    <button className="btn-stop" onClick={() => { void handleStop(s.id) }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
                      {t('stopStream')}
                    </button>
                  )}
                  <button className="btn-icon btn-danger-icon" onClick={() => { void handleDelete(s.id) }} title={t('deleteStream')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                  </button>
                </div>
              </div>

              <div className="dash-thumb-section">
                {s.thumbnail_url != null ? (
                  <div className="dash-thumb">
                    <img src={`${getApiBaseUrl()}${s.thumbnail_url}`} alt="Thumbnail" />
                    <button className="dash-thumb-change" onClick={() => { fileInputRefs.current.get(s.id)?.click() }}>{t('changeThumbnail')}</button>
                  </div>
                ) : (
                  <button className="dash-thumb-upload" onClick={() => { fileInputRefs.current.get(s.id)?.click() }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                    <span>{t('uploadThumbnail')}</span>
                  </button>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  hidden
                  ref={(el) => { if (el != null) fileInputRefs.current.set(s.id, el) }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f != null) void handleThumbUpload(s.id, f) }}
                />
              </div>

              <div className="dash-keys">
                <p className="dash-obs-hint">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                  {t('obsHint')}
                </p>
                <div className="dash-key-row">
                  <span className="dash-key-label">{t('rtmpUrl')}</span>
                  <code className="dash-key-value">{s.ingest_url ?? '—'}</code>
                  <button className="btn-copy" onClick={() => { copy(s.ingest_url) }} title="Copy">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                  </button>
                </div>
                <div className="dash-key-row">
                  <span className="dash-key-label">{t('streamKey')}</span>
                  <code className="dash-key-value">{visibleKeys.has(s.id) ? s.stream_key : '••••••••••••••••••••'}</code>
                  <button className="btn-copy" onClick={() => { toggleKey(s.id) }} title={visibleKeys.has(s.id) ? t('hide') : t('show')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {visibleKeys.has(s.id)
                        ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                        : <><path d="M17.9 17.4c-1.6 1.1-3.6 2.6-5.9 2.6-7 0-11-8-11-8a18.5 18.5 0 015.1-5.4M9.9 4.2A9.1 9.1 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.2 3.1" /><line x1="1" y1="1" x2="23" y2="23" /></>
                      }
                    </svg>
                  </button>
                  {visibleKeys.has(s.id) && (
                    <button className="btn-copy" onClick={() => { copy(s.stream_key) }} title="Copy">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
