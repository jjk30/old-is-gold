import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import ProfileSetup from './pages/ProfileSetup'
import TodaysWorkout from './pages/TodaysWorkout'
import Progress from './pages/Progress'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/setup" element={<ProfileSetup />} />
        <Route path="/workout" element={<TodaysWorkout />} />
        <Route path="/progress" element={<Progress />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
