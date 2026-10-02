import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { downloadTablePdf } from '../pdf.js'

const GRADES = Array.from({ length: 7 }, (_, i) => `Kyu ${7 - i}`)

export default function ViewKyuStudents() {
  const { n } = useParams()
  const kyu = `Kyu ${n}`
  const navigate = useNavigate()
  const [students, setStudents] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!GRADES.includes(kyu)) {
      navigate('/view-students', { replace: true })
      return
    }
    // Same order as the grading sheet (age, id), so the S.No matches on paper and on screen
    fetch(`/api/students?test_grade=${encodeURIComponent(kyu)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setStudents)
      .catch(() => setError('Could not load students'))
  }, [kyu])

  // Ex/Basics/Comb and Kata are left blank so the printed sheet can be filled in by hand
  const downloadPdf = () =>
    downloadTablePdf({
      title: `${kyu} - Students`,
      head: ['S.No', 'Name', 'Branch', 'Ex/Basics/Comb', 'Kata', 'Others'],
      body: students.map((s, i) => [i + 1, s.name, s.class ?? '', '', '', s.others_marks]),
      widths: { 0: 14, 3: 32, 4: 22, 5: 20 },
      minCellHeight: 10,
      filename: `${kyu.replace(' ', '-')}-students.pdf`,
    })

  const th = { border: '1px solid var(--sky-light)', padding: '10px 12px', background: 'var(--sky)', color: '#fff', textAlign: 'left' }
  const td = { border: '1px solid var(--sky-light)', padding: '8px 12px' }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{kyu} - Students</h1>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn" disabled={!students?.length} onClick={downloadPdf}>Download PDF</button>
          <button className="btn" onClick={() => navigate('/view-students')}>Back</button>
        </div>
      </div>

      {error && <p className="error" style={{ marginTop: 0 }}>{error}</p>}

      {students === null ? null : students.length === 0 ? (
        <p>No students have been added to {kyu}.</p>
      ) : (
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, width: 70 }}>S.No</th>
                <th style={th}>Name</th>
                <th style={th}>Branch</th>
                <th style={{ ...th, width: 160 }}>Ex/Basics/Comb</th>
                <th style={{ ...th, width: 110 }}>Kata</th>
                <th style={{ ...th, width: 110 }}>Others</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s.id} style={{ background: i % 2 ? 'var(--tint)' : '#fff' }}>
                  <td style={td}>{i + 1}</td>
                  <td style={td}>{s.name}</td>
                  <td style={td}>{s.class ?? ''}</td>
                  <td style={td}></td>
                  <td style={td}></td>
                  <td style={td}>{s.others_marks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
