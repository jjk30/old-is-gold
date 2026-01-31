import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import ProfileSetup from './pages/ProfileSetup'
import Workout from './pages/Workout'
import Nutrition from './pages/Nutrition'
import Progress from './pages/Progress'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/setup" element={<ProfileSetup />} />
      <Route path="/workout" element={<Workout />} />
      <Route path="/nutrition" element={<Nutrition />} />
      <Route path="/progress" element={<Progress />} />
    </Routes>
  )
}

export default App
