import { useI18n, CATEGORIES, getCategoryKey, type Category } from '../i18n'
import { StreamCard } from './StreamCard'

interface Stream { id: string; title: string; status: string; ingest_url: string | null; stream_key: string | null; user_id: string; category?: string; thumbnail_url?: string | null }
interface Props { streams: Stream[]; onWatch: (stream: Stream) => void }

const CAT_ICONS: Record<string, string> = {
  gaming: '🎮', irl: '📷', music: '🎵', esports: '🏆',
  creative: '🎨', education: '📚', talkshow: '🎙️', other: '📺'
}

export function BrowsePage ({ streams, onWatch }: Props): JSX.Element {
  const { t } = useI18n()

  const grouped = CATEGORIES.map(cat => ({
    cat,
    streams: streams.filter(s => (s.category ?? 'other') === cat)
  })).filter(g => g.streams.length > 0)

  const totalLive = streams.filter(s => s.status === 'live').length

  return (
    <div className="browse-page">
      <div className="browse-header">
        <h1>{t('browse')}</h1>
        <p className="browse-subtitle">{streams.length} {t('channels_count')} · {totalLive} live</p>
      </div>

      <div className="browse-cats">
        {CATEGORIES.map(cat => {
          const count = streams.filter(s => (s.category ?? 'other') === cat).length
          const liveCount = streams.filter(s => (s.category ?? 'other') === cat && s.status === 'live').length
          return (
            <div key={cat} className={`browse-cat-card ${count === 0 ? 'empty' : ''}`}>
              <span className="cat-icon">{CAT_ICONS[cat]}</span>
              <span className="cat-label">{t(getCategoryKey(cat as Category))}</span>
              <span className="cat-count">
                {count} {t('channels_count')}
                {liveCount > 0 && <span className="cat-live"> · {liveCount} live</span>}
              </span>
            </div>
          )
        })}
      </div>

      {grouped.map(({ cat, streams: catStreams }) => (
        <section key={cat} className="browse-section">
          <div className="section-header">
            <h2>{CAT_ICONS[cat]} {t(getCategoryKey(cat as Category))}</h2>
            <span className="section-count">{catStreams.length} {t('channels_count')}</span>
          </div>
          <div className="stream-grid">
            {catStreams.map(s => <StreamCard key={s.id} stream={s} onWatch={onWatch} />)}
          </div>
        </section>
      ))}

      {grouped.length === 0 && (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3">
            <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
          </svg>
          <h3>{t('noStreams')}</h3>
        </div>
      )}
    </div>
  )
}
