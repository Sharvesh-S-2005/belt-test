import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const HEARTBEAT_MS = 5000

const COLUMNS = [
  { key: 'ex_basics_comb', flag: 'ex_saved', label: 'Ex/Basics/Comb', max: 40 },
  { key: 'kata', flag: 'kata_saved', label: 'Kata', max: 40 },
]
const OTHERS = { key: 'others', label: 'Others', max: 20 }

const str = (v) => (v === null || v === undefined ? '' : String(v))

export default function KyuSheet() {
  const { n } = useParams()
  const kyu = `Kyu ${n}`
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const lockUrl = `/api/kyu-locks/${encodeURIComponent(kyu)}`
  const [rows, setRows] = useState([]) // last state known to be on the server
  const [inputs, setInputs] = useState({}) // { [student_id]: { [column]: string } }
  const [colMsg, setColMsg] = useState({}) // { [column]: { text, ok } }
  const [saving, setSaving] = useState('')
  const [results, setResults] = useState(null) // non-null while the result sheet is shown
  const [resultError, setResultError] = useState('')
  const acquired = useRef(null) // promise of the latest acquire, so release never races ahead of it

  useEffect(() => {
    let active = true
    const acquire = () => fetch(lockUrl, { method: 'POST' })
    acquired.current = acquire().then((res) => {
      if (!active) return
      if (res.ok) setReady(true)
      else navigate('/grade', { replace: true })
    })

    // Heartbeat keeps the lock fresh; a 409 means we lost it
    const hb = setInterval(async () => {
      const res = await acquire().catch(() => null)
      if (active && res && res.status === 409) navigate('/grade', { replace: true })
    }, HEARTBEAT_MS)

    // Best-effort release when the tab is closed (stale-lock cleanup covers the rest)
    const onHide = () => fetch(lockUrl, { method: 'DELETE', keepalive: true })
    window.addEventListener('pagehide', onHide)

    return () => {
      active = false
      clearInterval(hb)
      window.removeEventListener('pagehide', onHide)
      const release = () => fetch(lockUrl, { method: 'DELETE', keepalive: true })
      acquired.current.then(release, release)
    }
  }, [kyu])

  useEffect(() => {
    if (!ready) return
    fetch(`/api/marks/${encodeURIComponent(kyu)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setRows(data)
        setInputs(
          Object.fromEntries(
            data.map((r) => [r.student_id, Object.fromEntries(COLUMNS.map((c) => [c.key, str(r[c.key])]))])
          )
        )
      })
      .catch(() => navigate('/grade', { replace: true }))
  }, [ready, kyu])

  // A column is unsaved if not every student has it saved, or an input differs from the saved value
  const columnSaved = (c) =>
    rows.length > 0 && rows.every((r) => r[c.flag] && inputs[r.student_id]?.[c.key] === str(r[c.key]))
  const allSaved = COLUMNS.every(columnSaved)

  const change = (id, key, max) => (e) => {
    const v = e.target.value
    if (v !== '' && !/^\d+$/.test(v)) return
    if (v !== '' && Number(v) > max) return
    setInputs({ ...inputs, [id]: { ...inputs[id], [key]: v } })
    setColMsg({ ...colMsg, [key]: undefined })
  }

  const saveColumn = async (c) => {
    if (rows.some((r) => inputs[r.student_id][c.key] === '')) {
      setColMsg({ ...colMsg, [c.key]: { text: 'Enter marks for every student', ok: false } })
      return
    }
    setSaving(c.key)
    try {
      const res = await fetch('/api/marks/save-column', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kyu,
          column: c.key,
          values: rows.map((r) => ({ student_id: r.student_id, value: Number(inputs[r.student_id][c.key]) })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setRows(rows.map((r) => ({ ...r, [c.key]: Number(inputs[r.student_id][c.key]), [c.flag]: true })))
      setColMsg({ ...colMsg, [c.key]: { text: 'Saved', ok: true } })
    } catch (err) {
      setColMsg({ ...colMsg, [c.key]: { text: err.message, ok: false } })
    } finally {
      setSaving('')
    }
  }

  const showResult = async () => {
    setResultError('')
    const res = await fetch(`/api/results/${encodeURIComponent(kyu)}`)
    const data = await res.json().catch(() => ({}))
    if (res.ok) setResults(data)
    else setResultError(data.error || 'Could not load results')
  }

  if (!ready) return null

  const th = { border: '1px solid var(--sky-light)', padding: '10px 12px', background: 'var(--sky)', color: '#fff', textAlign: 'left' }
  const td = { border: '1px solid var(--sky-light)', padding: '8px 12px' }

  if (results) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>{kyu} - Result</h1>
          <button className="btn" onClick={() => setResults(null)}>Back to Marks</button>
        </div>
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['S.No', 'Name', 'Total', 'Rank'].map((h) => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r.sno} style={{ background: i % 2 ? 'var(--tint)' : '#fff' }}>
                  <td style={td}>{r.sno}</td>
                  <td style={td}>{r.name}</td>
                  <td style={td}>{r.total}</td>
                  <td style={td}>{r.rank}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 32 }}>
          <button className="btn" onClick={() => navigate('/grade')}>Exit</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{kyu} - Mark Entry</h1>
        <button className="btn" onClick={() => navigate('/grade')}>Exit</button>
      </div>

      {rows.length === 0 ? (
        <p>No students have been added to {kyu}.</p>
      ) : (
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, width: 80 }}>S.No</th>
                <th style={th}>Name</th>
                {COLUMNS.map((c) => (
                  <th key={c.key} style={{ ...th, width: 190 }}>{c.label} <span style={{ fontWeight: 400 }}>(max {c.max})</span></th>
                ))}
                <th style={{ ...th, width: 190 }}>{OTHERS.label} <span style={{ fontWeight: 400 }}>(max {OTHERS.max})</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.student_id} style={{ background: i % 2 ? 'var(--tint)' : '#fff' }}>
                  <td style={td}>{i + 1}</td>
                  <td style={td}>{r.name}</td>
                  {COLUMNS.map((c) => (
                    <td key={c.key} style={td}>
                      <input
                        className="input"
                        inputMode="numeric"
                        value={inputs[r.student_id]?.[c.key] ?? ''}
                        onChange={change(r.student_id, c.key, c.max)}
                        style={{ background: '#fff', padding: '6px 10px' }}
                      />
                    </td>
                  ))}
                  <td style={td}>{str(r.others)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={td} colSpan={2}></td>
                {COLUMNS.map((c) => (
                  <td key={c.key} style={{ ...td, verticalAlign: 'top' }}>
                    <button className="btn" style={{ width: '100%' }} disabled={saving === c.key} onClick={() => saveColumn(c)}>
                      Save
                    </button>
                    <div style={{ fontSize: 13, marginTop: 6, color: columnSaved(c) ? '#2E7D32' : '#8A6D00' }}>
                      {columnSaved(c) ? 'Saved' : 'Not saved'}
                    </div>
                    {colMsg[c.key] && !colMsg[c.key].ok && <p className="error" style={{ marginTop: 2 }}>{colMsg[c.key].text}</p>}
                  </td>
                ))}
                <td style={td}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <button className="btn" disabled={!allSaved} onClick={showResult}>Result</button>
        {resultError && <p className="error">{resultError}</p>}
      </div>
    </div>
  )
}
