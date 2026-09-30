import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const GRADES = Array.from({ length: 7 }, (_, i) => `Kyu ${7 - i}`)

export default function EditStudents() {
  const navigate = useNavigate()
  const [counts, setCounts] = useState({})

  useEffect(() => {
    fetch('/api/students')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((students) => {
        const c = {}
        for (const s of students) c[s.test_grade] = (c[s.test_grade] || 0) + 1
        setCounts(c)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="page">
      <div className="page-header">
        <h1>Edit the Students</h1>
        <button className="btn" onClick={() => navigate('/')}>Back</button>
      </div>
      <div className="kyu-grid">
        {GRADES.map((kyu) => (
          <button
            key={kyu}
            className="card"
            onClick={() => navigate(`/edit-students/${kyu.split(' ')[1]}`)}
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
              color: 'inherit',
              cursor: 'pointer',
            }}
          >
            {kyu}
            <span style={{ fontSize: 14, fontWeight: 400 }}>
              {counts[kyu] || 0} student{counts[kyu] === 1 ? '' : 's'}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
