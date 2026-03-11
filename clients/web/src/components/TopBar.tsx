import { useState, useRef, useEffect } from 'react'
import { useI18n, type Lang } from '../i18n'

interface Props {
  user: { id: string; email: string; role: string } | null
  onLogin: () => void
  onLogout: () => void
  onSearch: (q: string) => void
  onNavigateHome: () => void
  onNavigateDashboard: () => void
  sidebarOpen: boolean
  onToggleSidebar: () => void
  searchValue: string
}

const FLAGS: Record<Lang, string> = { ua: '🇺🇦', en: '🇬🇧', no: '🇳🇴' }
const LANG_NAMES: Record<Lang, string> = { ua: 'Українська', en: 'English', no: 'Norsk' }

export function TopBar ({ user, onLogin, onLogout, onSearch, onNavigateHome, onNavigateDashboard, sidebarOpen, onToggleSidebar, searchValue }: Props): JSX.Element {
  const { t, lang, setLang } = useI18n()
  const [query, setQuery] = useState(searchValue)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(searchValue) }, [searchValue])

  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (menuRef.current != null && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => { document.removeEventListener('mousedown', handler) }
  }, [])

  return (
    <nav className="topbar">
      <div className="topbar-left">
        <button className="topbar-hamburger" onClick={onToggleSidebar} aria-label="Menu">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M2 4h16v1.5H2zm0 5h16v1.5H2zm0 5h16v1.5H2z" /></svg>
        </button>
        <button className="topbar-logo" onClick={onNavigateHome}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="6" fill="url(#tg)" />
            <path d="M7 8l5 4-5 4V8z" fill="#fff" /><path d="M12 8l5 4-5 4V8z" fill="#fff" opacity="0.6" />
            <defs><linearGradient id="tg" x1="0" y1="0" x2="24" y2="24"><stop stopColor="#7c3aed" /><stop offset="1" stopColor="#2563eb" /></linearGradient></defs>
          </svg>
          <span className="logo-text">Streeming</span>
        </button>
      </div>

      <form className="topbar-search" onSubmit={(e) => { e.preventDefault(); onSearch(query.trim()) }}>
        <input type="text" placeholder={t('search')} value={query} onChange={(e) => { setQuery(e.target.value) }} />
        {query.length > 0 && (
          <button type="button" className="search-clear" onClick={() => { setQuery(''); onSearch('') }}>×</button>
        )}
        <button type="submit" className="search-btn" aria-label="Search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="22" y2="22" /></svg>
        </button>
      </form>

      <div className="topbar-right">
        {user != null ? (
          <div className="topbar-user" ref={menuRef}>
            <button className="avatar" onClick={() => { setMenuOpen(!menuOpen) }}>{user.email[0].toUpperCase()}</button>
            {menuOpen && (
              <div className="user-menu">
                <div className="menu-user-info">
                  <div className="menu-avatar">{user.email[0].toUpperCase()}</div>
                  <div>
                    <div className="menu-name">{user.email.split('@')[0]}</div>
                    <div className="menu-email">{user.email}</div>
                  </div>
                </div>
                <div className="menu-divider" />
                <button className="menu-item" onClick={() => { onNavigateDashboard(); setMenuOpen(false) }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 13h6a1 1 0 001-1V4a1 1 0 00-1-1H4a1 1 0 00-1 1v8a1 1 0 001 1zm0 8h6a1 1 0 001-1v-4a1 1 0 00-1-1H4a1 1 0 00-1 1v4a1 1 0 001 1zm10 0h6a1 1 0 001-1v-8a1 1 0 00-1-1h-6a1 1 0 00-1 1v8a1 1 0 001 1zm0-18v4a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1h-6a1 1 0 00-1 1z" /></svg>
                  {t('dashboard')}
                </button>
                <div className="menu-divider" />
                <div className="menu-lang-section">
                  <span className="menu-label">{t('interfaceLang')}</span>
                  <div className="menu-lang-row">
                    {(['ua', 'en', 'no'] as Lang[]).map(l => (
                      <button key={l} className={`menu-lang-btn ${l === lang ? 'active' : ''}`} onClick={() => { setLang(l) }}>
                        {FLAGS[l]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="menu-divider" />
                <button className="menu-item menu-item-danger" onClick={() => { onLogout(); setMenuOpen(false) }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                  {t('logout')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="topbar-auth">
            <div className="topbar-lang-mini">
              {(['ua', 'en', 'no'] as Lang[]).map(l => (
                <button key={l} className={`lang-mini ${l === lang ? 'active' : ''}`} onClick={() => { setLang(l) }}>{FLAGS[l]}</button>
              ))}
            </div>
            <button className="btn-signup" onClick={onLogin}>{t('login')}</button>
          </div>
        )}
      </div>
    </nav>
  )
}
