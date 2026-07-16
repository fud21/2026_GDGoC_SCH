import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api } from '../api/client'
import { useAuth } from '../context/useAuth'
import QuizRunner from '../components/QuizRunner'

export default function AdvMaterial() {
  const { id } = useParams()
  const { refresh } = useAuth()
  const [material, setMaterial] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api(`/adv/materials/${id}`).then(setMaterial).catch((e) => setError(e.message))
  }, [id])

  if (error) return <p className="error">{error}</p>
  if (!material) return <p className="hint">불러오는 중…</p>

  return (
    <div>
      <header className="page-header">
        <Link to="/adv">←</Link>
        <h1>{material.title}</h1>
      </header>
      <p className="hint">{material.typeLabel}</p>

      <article className="lesson-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{material.body}</ReactMarkdown>
      </article>

      <section className="lesson-quiz">
        <h2>이해도 점검 (80점 이상 통과)</h2>
        <QuizRunner
          questions={material.questions}
          submit={(answers) =>
            api(`/adv/materials/${id}/quiz`, { method: 'POST', body: { answers } })
          }
          onDone={refresh}
        />
      </section>
    </div>
  )
}
