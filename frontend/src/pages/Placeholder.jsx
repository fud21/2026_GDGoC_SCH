import { Link } from 'react-router-dom'

export default function Placeholder({ title, note }) {
  return (
    <div className="placeholder-page">
      <h1>{title}</h1>
      <p className="hint">{note}</p>
      <Link to="/">← 홈으로</Link>
    </div>
  )
}
