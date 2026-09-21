import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Guard route berdasarkan role.
 * @param {string[]} allowedRoles - Role yang boleh mengakses route ini
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isLoggedIn } = useAuth()

  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }
  return children
}
