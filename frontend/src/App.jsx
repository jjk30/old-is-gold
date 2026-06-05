import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import ProfileSetup from './pages/ProfileSetup'
import Workout from './pages/Workout'
import Nutrition from './pages/Nutrition'
import Progress from './pages/Progress'
import ProtectedRoute from './ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
      <Route path="/workout" element={<ProtectedRoute><Workout /></ProtectedRoute>} />
      <Route path="/nutrition" element={<ProtectedRoute><Nutrition /></ProtectedRoute>} />
      <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
    </Routes>
  )
}

export default App
