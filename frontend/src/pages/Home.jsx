import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.jsx'

const cardStyle = {
  flex: '1 1 260px',
  padding: '64px 24px',
  textAlign: 'center',
  fontSize: 20,
  fontWeight: 600,
  color: 'inherit',
  font: 'inherit',
  cursor: 'pointer',
}

export default function Home() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="page">
      <div className="page-header">
        <h1>Welcome, {user.username}</h1>
        <button className="btn" onClick={logout}>Logout</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginTop: 24 }}>
        <button className="card" style={cardStyle} onClick={() => navigate('/add-students')}>
          Add Students to Belt Test
        </button>
        <button className="card" style={cardStyle} onClick={() => navigate('/grade')}>
          Grade the Students
        </button>
      </div>
    </div>
  )
}
