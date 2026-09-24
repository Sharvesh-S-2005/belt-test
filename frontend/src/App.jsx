import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth.jsx'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import AddStudents from './pages/AddStudents.jsx'
import Grade from './pages/Grade.jsx'
import KyuSheet from './pages/KyuSheet.jsx'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return null

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<Protected><Home /></Protected>} />
      <Route path="/add-students" element={<Protected><AddStudents /></Protected>} />
      <Route path="/grade" element={<Protected><Grade /></Protected>} />
      <Route path="/grade/:n" element={<Protected><KyuSheet /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
