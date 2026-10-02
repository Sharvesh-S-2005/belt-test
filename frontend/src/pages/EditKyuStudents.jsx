import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const GRADES = Array.from({ length: 7 }, (_, i) => `Kyu ${7 - i}`)

const toForm = (s) => ({
  name: s.name,
  age: String(s.age),
  others_marks: String(s.others_marks),
  class: s.class ?? '',
  test_grade: s.test_grade,
})

// Same rules as the Add Students page
const validate = (form) => {
  const e = {}
  if (!form.name.trim()) e.name = 'Name is required'
  if (form.age === '' || !(Number(form.age) > 0) || !Number.isInteger(Number(form.age)))
    e.age = 'Enter a valid age'
  if (
    form.others_marks === '' ||
    !Number.isInteger(Number(form.others_marks)) ||
    Number(form.others_marks) < 0 ||
    Number(form.others_marks) > 20
  )
    e.others_marks = 'Enter a whole number from 0 to 20'
  if (!form.test_grade) e.test_grade = 'Select a test grade'
  return e
}

export default function EditKyuStudents() {
  const { n } = useParams()
  const kyu = `Kyu ${n}`
  const navigate = useNavigate()
  const [students, setStudents] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})
  const [deletingId, setDeletingId] = useState(null) // row awaiting delete confirmation
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState({ text: '', ok: true })

  useEffect(() => {
    if (!GRADES.includes(kyu)) {
      navigate('/edit-students', { replace: true })
      return
    }
    fetch(`/api/students?test_grade=${encodeURIComponent(kyu)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setStudents)
      .catch(() => setMessage({ text: 'Could not load students', ok: false }))
  }, [kyu])

  const startEdit = (s) => {
    setEditingId(s.id)
    setForm(toForm(s))
    setErrors({})
    setDeletingId(null)
    setMessage({ text: '', ok: true })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(null)
    setErrors({})
  }

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
    setErrors({ ...errors, [field]: undefined })
  }

  const save = async () => {
    const e = validate(form)
    setErrors(e)
    if (Object.keys(e).length) return
    setBusy(true)
    try {
      const res = await fetch(`/api/students/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (data.errors) setErrors(data.errors)
        else setMessage({ text: data.error || 'Save failed', ok: false })
        return
      }
      // A student moved to another Kyu leaves this list; otherwise keep the grading-sheet order (age, id)
      const rest = students.filter((s) => s.id !== data.id)
      setStudents(
        data.test_grade === kyu
          ? [...rest, data].sort((a, b) => a.age - b.age || a.id - b.id)
          : rest
      )
      setMessage({
        text: data.test_grade === kyu ? `Saved ${data.name}` : `Saved ${data.name} and moved to ${data.test_grade}`,
        ok: true,
      })
      cancelEdit()
    } catch {
      setMessage({ text: 'Save failed', ok: false })
    } finally {
      setBusy(false)
    }
  }

  const remove = async (s) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/students/${s.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      setStudents(students.filter((x) => x.id !== s.id))
      setMessage({ text: `Deleted ${s.name}`, ok: true })
    } catch (err) {
      setMessage({ text: err.message, ok: false })
    } finally {
      setDeletingId(null)
      setBusy(false)
    }
  }

  const th = { border: '1px solid var(--sky-light)', padding: '10px 12px', background: 'var(--sky)', color: '#fff', textAlign: 'left' }
  const td = { border: '1px solid var(--sky-light)', padding: '8px 12px', verticalAlign: 'top' }
  const cellInput = { background: '#fff', padding: '6px 10px' }
  const smallBtn = { padding: '6px 16px', minHeight: 36 }
  const dangerBtn = { ...smallBtn, background: '#C0392B' }

  const editCell = (key, input) => (
    <td style={td}>
      {input}
      {errors[key] && <p className="error">{errors[key]}</p>}
    </td>
  )

  return (
    <div className="page">
      <div className="page-header">
        <h1>{kyu} - Edit Students</h1>
        <button className="btn" onClick={() => navigate('/edit-students')}>Back</button>
      </div>

      {message.text && <p style={{ color: message.ok ? '#2E7D32' : '#C0392B', marginTop: 0 }}>{message.text}</p>}

      {students === null ? null : students.length === 0 ? (
        <p>No students have been added to {kyu}.</p>
      ) : (
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, width: 70 }}>S.No</th>
                <th style={th}>Name</th>
                <th style={{ ...th, width: 100 }}>Age</th>
                <th style={{ ...th, width: 130 }}>Others Marks</th>
                <th style={th}>Branch</th>
                <th style={{ ...th, width: 130 }}>Test Grade</th>
                <th style={{ ...th, width: 200 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => {
                const bg = { background: i % 2 ? 'var(--tint)' : '#fff' }
                if (s.id === editingId) {
                  return (
                    <tr key={s.id} style={bg}>
                      <td style={td}>{i + 1}</td>
                      {editCell('name', <input className="input" style={cellInput} value={form.name} onChange={set('name')} />)}
                      {editCell('age', <input className="input" style={cellInput} type="number" inputMode="numeric" min="1" value={form.age} onChange={set('age')} />)}
                      {editCell(
                        'others_marks',
                        <input className="input" style={cellInput} type="number" inputMode="numeric" min="0" max="20" value={form.others_marks} onChange={set('others_marks')} />
                      )}
                      {editCell('class', <input className="input" style={cellInput} value={form.class} onChange={set('class')} />)}
                      {editCell(
                        'test_grade',
                        <select className="input" style={cellInput} value={form.test_grade} onChange={set('test_grade')}>
                          {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                      )}
                      <td style={td}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button className="btn" style={smallBtn} disabled={busy} onClick={save}>Save</button>
                          <button className="btn" style={smallBtn} disabled={busy} onClick={cancelEdit}>Cancel</button>
                        </div>
                      </td>
                    </tr>
                  )
                }
                return (
                  <tr key={s.id} style={bg}>
                    <td style={td}>{i + 1}</td>
                    <td style={td}>{s.name}</td>
                    <td style={td}>{s.age}</td>
                    <td style={td}>{s.others_marks}</td>
                    <td style={td}>{s.class ?? ''}</td>
                    <td style={td}>{s.test_grade}</td>
                    <td style={td}>
                      {deletingId === s.id ? (
                        <div>
                          <div style={{ fontSize: 14, marginBottom: 6 }}>Delete {s.name}?</div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button className="btn" style={dangerBtn} disabled={busy} onClick={() => remove(s)}>Yes, Delete</button>
                            <button className="btn" style={smallBtn} disabled={busy} onClick={() => setDeletingId(null)}>No</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button className="btn" style={smallBtn} disabled={busy || editingId !== null} onClick={() => startEdit(s)}>Edit</button>
                          <button
                            className="btn"
                            style={editingId !== null ? smallBtn : dangerBtn}
                            disabled={busy || editingId !== null}
                            onClick={() => { setDeletingId(s.id); setMessage({ text: '', ok: true }) }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
