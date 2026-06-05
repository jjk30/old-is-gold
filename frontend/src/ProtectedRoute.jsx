import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

// Guards routes that require a signed-in user. AuthProvider only renders its
// children once Firebase has resolved the auth state, so by the time this runs
// `user` is either a real user or null.
function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default ProtectedRoute
