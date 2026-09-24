import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const POLL_MS = 4000

export default function Grade() {
  const navigate = useNavigate()
  const [locks, setLocks] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = () =>
      fetch('/api/kyu-locks')
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d) => active && setLocks(d))
        .catch(() => {})
    load()
    const id = setInterval(load, POLL_MS)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  const open = async (kyu) => {
    setError('')
    const res = await fetch(`/api/kyu-locks/${encodeURIComponent(kyu)}`, { method: 'POST' })
    if (res.ok) {
      navigate(`/grade/${kyu.split(' ')[1]}`)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Could not open Kyu')
      fetch('/api/kyu-locks').then((r) => r.json()).then(setLocks).catch(() => {})
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Grade the Students</h1>
        <button className="btn" onClick={() => navigate('/')}>Back</button>
      </div>
      {error && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}
      <div className="kyu-grid">
        {locks.map(({ kyu, locked }) => (
          <button
            key={kyu}
            className="card"
            disabled={locked}
            onClick={() => open(kyu)}
            style={{
              height: 140,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              font: 'inherit',
              fontSize: 20,
              fontWeight: 600,
              color: locked ? '#8A939B' : 'inherit',
              background: locked ? '#EEEEEE' : undefined,
              borderColor: locked ? '#CCCCCC' : undefined,
              cursor: locked ? 'not-allowed' : 'pointer',
            }}
          >
            {kyu}
            <span style={{ fontSize: 14, fontWeight: 400, visibility: locked ? 'visible' : 'hidden' }}>In Use</span>
          </button>
        ))}
      </div>
    </div>
  )
}
