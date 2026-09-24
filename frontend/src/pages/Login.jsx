import { useState } from 'react'
import { useAuth } from '../auth.jsx'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(username.trim(), password)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="page" style={{ maxWidth: 420, paddingTop: 120 }}>
      <h1>Karate Belt Grading</h1>
      <form onSubmit={submit} className="card" style={{ padding: 24 }}>
        <label>
          Username
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            style={{ marginTop: 6, marginBottom: 16, background: '#fff' }}
          />
        </label>
        <label>
          Password
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginTop: 6, background: '#fff' }}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit" disabled={busy} style={{ marginTop: 20, width: '100%' }}>
          Login
        </button>
      </form>
    </div>
  )
}
