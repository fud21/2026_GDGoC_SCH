import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

const CHAPTER_FILTERS = [
  { slug: '', label: '전체' },
  { slug: 'economy', label: '경제' },
  { slug: 'finance', label: '금융' },
  { slug: 'stock', label: '주식' },
  { slug: 'slang', label: '은어' },
]

export default function Glossary() {
  const [q, setQ] = useState('')
  const [chapter, setChapter] = useState('')
  const [terms, setTerms] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (chapter) params.set('chapter', chapter)
      api(`/edu/glossary?${params}`).then(setTerms).catch((e) => setError(e.message))
    }, 250)
    return () => clearTimeout(t)
  }, [q, chapter])

  return (
    <div>
      <header className="page-header">
        <Link to="/">←</Link>
        <h1>용어 사전</h1>
      </header>
      <input
        className="search-input"
        type="search"
        placeholder="용어 검색 (예: 물타기, PER)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="filter-row">
        {CHAPTER_FILTERS.map((f) => (
          <button
            key={f.slug}
            type="button"
            className={chapter === f.slug ? 'chip active' : 'chip'}
            onClick={() => setChapter(f.slug)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
      <div className="term-list">
        {terms.map((t) => (
          <div key={t.id} className="term-card">
            <div className="term-head">
              <strong>{t.term}</strong>
              <span className="badge">{t.chapter_title}</span>
            </div>
            <p>{t.definition}</p>
            {t.example && <p className="hint">예: {t.example}</p>}
          </div>
        ))}
        {terms.length === 0 && <p className="hint">검색 결과가 없습니다.</p>}
      </div>
    </div>
  )
}
