import { useEffect, useState, useCallback, useRef } from 'react'
import type { AxiosError } from 'axios'
import { api, setAuthToken, setRefreshToken, clearAuth, getStoredToken } from './api'
import { TopBar } from './components/TopBar'
import { Sidebar } from './components/Sidebar'
import { StreamGrid } from './components/StreamGrid'
import { WatchPage } from './components/WatchPage'
import { AuthModal } from './components/AuthModal'

interface Stream {
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
}

export default function App (): JSX.Element {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [streams, setStreams] = useState<Stream[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1200)
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState('home')
  const [newTitle, setNewTitle] = useState('')
  const [toast, setToast] = useState<{ text: string; type: 'ok' | 'err' } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selected = streams.find(s => s.id === selectedId) ?? null

  const flash = useCallback((text: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ text, type })
    if (toastTimer.current != null) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => { setToast(null) }, 5000)
  }, [])

  const fetchStreams = useCallback(async () => {
    try {
      const res = await api.get('/streams')
      setStreams(res.data.streams)
    } catch { /* */ }
  }, [])

  const restoreSession = useCallback(async () => {
    if (getStoredToken() == null) return
    try {
      const res = await api.get('/auth/me')
      setUser(res.data.user)
    } catch (error) {
      const status = (error as AxiosError).response?.status
      if (status === 401) clearAuth()
    }
  }, [])

  useEffect(() => {
    void restoreSession()
    void fetchStreams()
    const t = setInterval(() => { void fetchStreams() }, 12000)
    return () => { clearInterval(t) }
  }, [fetchStreams, restoreSession])

  const navigateHome = (): void => {
    setView('home')
    setSelectedId(null)
    setSearchQuery('')
  }

  const handleLogout = (): void => {
    const rt = localStorage.getItem('streeming_refresh_token')
    if (rt != null) void api.post('/auth/logout', { refreshToken: rt }).catch(() => {})
    clearAuth()
    setUser(null)
    setSelectedId(null)
    flash('Ви вийшли з акаунту')
  }

  const handleWatch = (stream: Stream): void => {
    setSelectedId(stream.id)
    setView('watch')
  }

  const handleSelectStream = (id: string): void => {
    setSelectedId(id)
    setView('watch')
  }

  const handleDelete = (id: string): void => {
    setStreams(prev => prev.filter(s => s.id !== id))
    setSelectedId(null)
    setView('home')
    flash('Стрім видалено')
  }

  const handleCreate = async (): Promise<void> => {
    if (newTitle.trim().length < 3) {
      flash('Назва мін. 3 символи', 'err')
      return
    }
    try {
      await api.post('/streams', { title: newTitle.trim() })
      setNewTitle('')
      setShowCreate(false)
      await fetchStreams()
      flash('Стрім створено!')
    } catch {
      flash('Не вдалось створити стрім', 'err')
    }
  }

  return (
    <div className="app">
      <TopBar
        user={user}
        onLogin={() => { setShowAuth(true) }}
        onLogout={handleLogout}
        onSearch={setSearchQuery}
        onNavigateHome={navigateHome}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => { setSidebarOpen(!sidebarOpen) }}
        searchValue={searchQuery}
      />

      <div className="app-body">
        <Sidebar
          streams={streams}
          open={sidebarOpen}
          currentView={view}
          onNavigate={(v) => { setView(v); setSelectedId(null); setSearchQuery('') }}
          onSelectStream={handleSelectStream}
        />

        <main className={`main-content ${sidebarOpen ? '' : 'expanded'}`}>
          {view === 'watch' && selected != null ? (
            <WatchPage
              stream={selected}
              user={user}
              onBack={navigateHome}
              onRefresh={() => { void fetchStreams() }}
              onDelete={handleDelete}
            />
          ) : (
            <>
              {user != null && (
                <div className="create-bar">
                  <button className="btn-create" onClick={() => { setShowCreate(true) }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Створити стрім
                  </button>
                </div>
              )}
              <StreamGrid streams={streams} onWatch={handleWatch} searchQuery={searchQuery} />
            </>
          )}
        </main>
      </div>

      {showAuth && (
        <AuthModal
          onClose={() => { setShowAuth(false) }}
          onSuccess={(u) => {
            setUser(u)
            setShowAuth(false)
            flash('Ласкаво просимо!')
            void fetchStreams()
          }}
        />
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => { setShowCreate(false) }}>
          <div className="modal modal-sm" onClick={(e) => { e.stopPropagation() }}>
            <button className="modal-close" onClick={() => { setShowCreate(false) }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
            <div className="modal-header">
              <h2>Створити стрім</h2>
            </div>
            <form className="modal-form" onSubmit={(e) => { e.preventDefault(); void handleCreate() }}>
              <div className="form-group">
                <label htmlFor="stream-title">Назва стріму</label>
                <input
                  id="stream-title"
                  placeholder="Наприклад: Fortnite Ranked"
                  value={newTitle}
                  onChange={(e) => { setNewTitle(e.target.value) }}
                  maxLength={120}
                  autoFocus
                />
              </div>
              <button type="submit" className="btn-primary btn-full">Створити</button>
            </form>
          </div>
        </div>
      )}

      {toast != null && (
        <div className={`toast ${toast.type}`}>
          <span>{toast.text}</span>
          <button className="toast-x" onClick={() => { setToast(null) }}>×</button>
        </div>
      )}
    </div>
  )
}
