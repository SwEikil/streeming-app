import { StreamCard } from './StreamCard'

interface Stream {
  id: string
  title: string
  status: string
  ingest_url: string | null
  user_id: string
  created_at?: string
}

interface Props {
  streams: Stream[]
  onWatch: (stream: Stream) => void
  searchQuery: string
}

export function StreamGrid ({ streams, onWatch, searchQuery }: Props): JSX.Element {
  const filtered = searchQuery.length > 0
    ? streams.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : streams

  const live = filtered.filter(s => s.status === 'live')
  const offline = filtered.filter(s => s.status !== 'live')

  return (
    <div className="stream-grid-page">
      {searchQuery.length > 0 && (
        <div className="search-results-header">
          <h2>Результати пошуку: &ldquo;{searchQuery}&rdquo;</h2>
          <span className="result-count">{filtered.length} стрімів</span>
        </div>
      )}

      {live.length > 0 && (
        <section className="grid-section">
          <div className="section-header">
            <h2>
              <span className="section-live-dot" />
              Наживо
            </h2>
            <span className="section-count">{live.length} стрімів</span>
          </div>
          <div className="stream-grid">
            {live.map((s) => (
              <StreamCard key={s.id} stream={s} onWatch={onWatch} />
            ))}
          </div>
        </section>
      )}

      <section className="grid-section">
        <div className="section-header">
          <h2>{searchQuery.length > 0 ? 'Усі стріми' : 'Рекомендовані канали'}</h2>
          {offline.length > 0 && <span className="section-count">{offline.length} каналів</span>}
        </div>
        {[...live, ...offline].length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
            <h3>Поки немає стрімів</h3>
            <p>Створіть свій перший стрім!</p>
          </div>
        ) : (
          <div className="stream-grid">
            {offline.map((s) => (
              <StreamCard key={s.id} stream={s} onWatch={onWatch} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
