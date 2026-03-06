import { useEffect, useState, useCallback, useRef } from 'react'
import type { AxiosError } from 'axios'
import { api, setAuthToken, setRefreshToken, clearAuth, getStoredToken } from './api'
import { useI18n, CATEGORIES, getCategoryKey, STREAM_LANGUAGES, type Category } from './i18n'
import { TopBar } from './components/TopBar'
import { Sidebar } from './components/Sidebar'
import { StreamGrid } from './components/StreamGrid'
import { WatchPage } from './components/WatchPage'
import { AuthModal } from './components/AuthModal'
import { Dashboard } from './components/Dashboard'
import { BrowsePage } from './components/BrowsePage'

interface Stream {
<<<<<<< HEAD
  id: string
  title: string
  status: string
  ingest_url: string | null
  user_id: string
  created_at?: string
}

interface UserInfo {
  id: string
  email: string
  role: string
=======
  id: string; title: string; description: string; category: string; language: string
<<<<<<< HEAD
  status: string; ingest_url: string | null; stream_key: string | null; user_id: string; created_at?: string
>>>>>>> 161fe02 (feat: i18n (UA/EN/RU), improved stream creation, Dashboard for stream keys)
=======
  status: string; ingest_url: string | null; stream_key: string | null; thumbnail_url: string | null
  user_id: string; created_at?: string
>>>>>>> 294a6af (feat: thumbnail upload, rich chat (emoji/timestamps/system msgs), design polish)
}
interface UserInfo { id: string; email: string; role: string }

export default function App (): JSX.Element {
  const { t, lang } = useI18n()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [streams, setStreams] = useState<Stream[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showCreatedSuccess, setShowCreatedSuccess] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1200)
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState('home')
  const [toast, setToast] = useState<{ text: string; type: 'ok' | 'err' } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newCat, setNewCat] = useState<Category>('gaming')
  const [newLang, setNewLang] = useState(lang)
  const [newThumb, setNewThumb] = useState<File | null>(null)
  const [thumbPreview, setThumbPreview] = useState<string | null>(null)

  const selected = streams.find(s => s.id === selectedId) ?? null

  const flash = useCallback((text: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ text, type })
    if (toastTimer.current != null) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => { setToast(null) }, 5000)
  }, [])

  const fetchStreams = useCallback(async () => {
    try { const r = await api.get('/streams'); setStreams(r.data.streams) } catch {}
  }, [])

  const restoreSession = useCallback(async () => {
    if (getStoredToken() == null) return
<<<<<<< HEAD
    try {
      const res = await api.get('/auth/me')
      setUser(res.data.user)
    } catch (error) {
      const status = (error as AxiosError).response?.status
      if (status === 401) clearAuth()
    }
=======
    try { const r = await api.get('/auth/me'); setUser(r.data.user) } catch { clearAuth() }
>>>>>>> 161fe02 (feat: i18n (UA/EN/RU), improved stream creation, Dashboard for stream keys)
  }, [])

  useEffect(() => { void restoreSession(); void fetchStreams(); const t = setInterval(() => { void fetchStreams() }, 12000); return () => { clearInterval(t) } }, [fetchStreams, restoreSession])

  const navigateHome = (): void => { setView('home'); setSelectedId(null); setSearchQuery('') }

  const handleLogout = (): void => {
    const rt = localStorage.getItem('streeming_refresh_token')
    if (rt != null) void api.post('/auth/logout', { refreshToken: rt }).catch(() => {})
    clearAuth(); setUser(null); setSelectedId(null); flash(t('loggedOut'))
  }

  const handleWatch = (s: Stream): void => { setSelectedId(s.id); setView('watch') }
  const handleSelectStream = (id: string): void => { setSelectedId(id); setView('watch') }
  const handleDelete = (id: string): void => { setStreams(p => p.filter(s => s.id !== id)); setSelectedId(null); setView('home'); flash(t('streamDeleted')) }

  const resetCreateForm = (): void => { setNewTitle(''); setNewDesc(''); setNewCat('gaming'); setNewLang(lang); setNewThumb(null); setThumbPreview(null) }

  const handleThumbChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const f = e.target.files?.[0]
    if (f == null) return
    setNewThumb(f)
    setThumbPreview(URL.createObjectURL(f))
  }

  const handleCreate = async (): Promise<void> => {
    if (newTitle.trim().length < 3) { flash(t('titleMin'), 'err'); return }
    try {
      const res = await api.post('/streams', { title: newTitle.trim(), description: newDesc.trim(), category: newCat, language: newLang })
      const streamId = res.data.stream.id
      if (newThumb != null) {
        const fd = new FormData()
        fd.append('file', newThumb)
        await api.post(`/streams/${streamId}/thumbnail`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      resetCreateForm(); setShowCreate(false); await fetchStreams()
      setShowCreatedSuccess(true)
    } catch { flash(t('createError'), 'err') }
  }

  return (
    <div className="app">
      <TopBar user={user} onLogin={() => { setShowAuth(true) }} onLogout={handleLogout} onSearch={setSearchQuery} onNavigateHome={navigateHome} sidebarOpen={sidebarOpen} onToggleSidebar={() => { setSidebarOpen(!sidebarOpen) }} searchValue={searchQuery} />

      <div className="app-body">
        <Sidebar streams={streams} open={sidebarOpen} currentView={view} onNavigate={(v) => { setView(v); setSelectedId(null); setSearchQuery('') }} onSelectStream={handleSelectStream} isLoggedIn={user != null} />

        <main className={`main-content ${sidebarOpen ? '' : 'expanded'}`}>
          {view === 'watch' && selected != null ? (
            <WatchPage stream={selected} user={user} onBack={navigateHome} onRefresh={() => { void fetchStreams() }} onDelete={handleDelete} onNavigateDashboard={() => { setView('dashboard') }} />
          ) : view === 'dashboard' && user != null ? (
            <Dashboard streams={streams} userId={user.id} onRefresh={() => { void fetchStreams() }} onDelete={handleDelete} flash={flash} onShowCreate={() => { setShowCreate(true) }} />
          ) : view === 'browse' ? (
            <BrowsePage streams={streams} onWatch={handleWatch} />
          ) : (
            <StreamGrid streams={streams} onWatch={handleWatch} searchQuery={searchQuery} />
          )}
        </main>
      </div>

      {showAuth && <AuthModal onClose={() => { setShowAuth(false) }} onSuccess={(u) => { setUser(u); setShowAuth(false); flash(t('welcome')); void fetchStreams() }} />}

      {showCreate && (
        <div className="modal-overlay" onClick={() => { setShowCreate(false) }}>
          <div className="modal modal-lg" onClick={(e) => { e.stopPropagation() }}>
            <button className="modal-close" onClick={() => { setShowCreate(false) }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
            <div className="modal-header"><h2>{t('createStream')}</h2></div>
            <form className="modal-form" onSubmit={(e) => { e.preventDefault(); void handleCreate() }}>
              <div className="form-group">
                <label>{t('streamTitle')} *</label>
                <input placeholder={t('streamTitlePlaceholder')} value={newTitle} onChange={(e) => { setNewTitle(e.target.value) }} maxLength={120} autoFocus />
              </div>
              <div className="form-group">
                <label>{t('streamDescription')}</label>
                <textarea placeholder={t('streamDescPlaceholder')} value={newDesc} onChange={(e) => { setNewDesc(e.target.value) }} maxLength={500} rows={3} />
              </div>
              <div className="form-row">
                <div className="form-group form-half">
                  <label>{t('streamCategory')}</label>
                  <select value={newCat} onChange={(e) => { setNewCat(e.target.value as Category) }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{t(getCategoryKey(c))}</option>)}
                  </select>
                </div>
                <div className="form-group form-half">
                  <label>{t('streamLanguage')}</label>
                  <select value={newLang} onChange={(e) => { setNewLang(e.target.value as any) }}>
                    {STREAM_LANGUAGES.map(l => <option key={l} value={l}>{l === 'ua' ? '🇺🇦 Українська' : l === 'en' ? '🇬🇧 English' : '🇷🇺 Русский'}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>{t('thumbnail')}</label>
                <div className="thumb-upload-area">
                  {thumbPreview != null ? (
                    <div className="thumb-preview">
                      <img src={thumbPreview} alt="preview" />
                      <button type="button" className="thumb-remove" onClick={() => { setNewThumb(null); setThumbPreview(null) }}>×</button>
                    </div>
                  ) : (
                    <label className="thumb-dropzone">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                      <span>{t('uploadThumbnail')}</span>
                      <span className="thumb-hint">{t('thumbnailHint')}</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleThumbChange} hidden />
                    </label>
                  )}
                </div>
              </div>
              <button type="submit" className="btn-primary btn-full">{t('create')}</button>
            </form>
          </div>
        </div>
      )}

      {showCreatedSuccess && (
        <div className="modal-overlay" onClick={() => { setShowCreatedSuccess(false) }}>
          <div className="modal modal-sm" onClick={(e) => { e.stopPropagation() }}>
            <div className="modal-header">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              <h2>{t('streamCreated')}</h2>
            </div>
            <p className="modal-body-text">{t('streamCreatedDesc')}</p>
            <div className="modal-actions">
              <button className="btn-primary btn-full" onClick={() => { setShowCreatedSuccess(false); setView('dashboard') }}>{t('goToDashboard')}</button>
              <button className="btn-ghost btn-full" onClick={() => { setShowCreatedSuccess(false) }}>{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {toast != null && <div className={`toast ${toast.type}`}><span>{toast.text}</span><button className="toast-x" onClick={() => { setToast(null) }}>×</button></div>}
    </div>
  )
}
