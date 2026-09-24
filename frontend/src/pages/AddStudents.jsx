import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const GRADES = Array.from({ length: 7 }, (_, i) => `Kyu ${7 - i}`)
const EMPTY = { name: '', age: '', others_marks: '', class: '', test_grade: '' }

export default function AddStudents() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false) // at least one successful save
  const [justSaved, setJustSaved] = useState(false) // current form already saved
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
    setErrors({ ...errors, [field]: undefined })
    setJustSaved(false)
    setMessage('')
  }

  const validate = () => {
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

  const save = async () => {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return
    setBusy(true)
    setMessage('')
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (data.errors) setErrors(data.errors)
        else setMessage(data.error || 'Save failed')
        return
      }
      setSaved(true)
      setJustSaved(true)
      setMessage(`Saved ${data.name}`)
    } catch {
      setMessage('Save failed')
    } finally {
      setBusy(false)
    }
  }

  const addAnother = () => {
    setForm(EMPTY)
    setErrors({})
    setJustSaved(false)
    setMessage('')
  }

  const field = (label, key, input) => (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', marginBottom: 6 }}>{label}</label>
      {input}
      {errors[key] && <p className="error">{errors[key]}</p>}
    </div>
  )

  return (
    <div className="page">
      <h1>Add Students to Belt Test</h1>
      <div className="add-student-row">
        <div>
          <button className="btn" onClick={() => navigate('/')}>Exit</button>
        </div>

        <div className="add-student-form">
          {field('Name *', 'name', <input className="input" value={form.name} onChange={set('name')} />)}
          {field('Age *', 'age', <input className="input" type="number" inputMode="numeric" min="1" value={form.age} onChange={set('age')} />)}
          {field(
            'Others Marks *',
            'others_marks',
            <input className="input" type="number" inputMode="numeric" min="0" max="20" value={form.others_marks} onChange={set('others_marks')} />
          )}
          {field('Class', 'class', <input className="input" value={form.class} onChange={set('class')} />)}
          {field(
            'Test Grade *',
            'test_grade',
            <select className="input" value={form.test_grade} onChange={set('test_grade')}>
              <option value="">Select grade</option>
              {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          )}
          {message && <p style={{ color: justSaved ? '#2E7D32' : '#C0392B' }}>{message}</p>}
        </div>

        <div className="add-student-actions">
          <button className="btn" onClick={save} disabled={busy || justSaved}>Save</button>
          {saved && <button className="btn" onClick={addAnother}>Add Another Student</button>}
        </div>
      </div>
    </div>
  )
}
