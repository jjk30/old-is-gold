import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:8000'

function TodaysWorkout() {
  const navigate = useNavigate()
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [completedExercises, setCompletedExercises] = useState([])
  const [workoutComplete, setWorkoutComplete] = useState(false)
  const [saving, setSaving] = useState(false)

  const userId = localStorage.getItem('userId')
  const userName = localStorage.getItem('userName')

  useEffect(() => {
    if (!userId) {
      navigate('/setup')
      return
    }
    fetchTodaysPlan()
  }, [userId])

  const fetchTodaysPlan = async () => {
    try {
      const response = await fetch(`${API_URL}/plans/${userId}`)
      if (!response.ok) throw new Error('No plan found')
      const data = await response.json()
      setPlan(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleExercise = (index) => {
    setCompletedExercises(prev => 
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const completeWorkout = async () => {
    setSaving(true)
    try {
      await fetch(`${API_URL}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          workout_completed: true,
          duration_minutes: plan.duration_minutes,
          notes: `Completed ${completedExercises.length} of ${plan.exercises.length} exercises`
        })
      })
      setWorkoutComplete(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const allComplete = plan && completedExercises.length === plan.exercises.length

  if (loading) {
    return (
      <div className="page">
        <div className="container text-center">
          <h1>⏳ Loading your workout...</h1>
        </div>
      </div>
    )
  }

  if (workoutComplete) {
    return (
      <div className="page">
        <nav className="nav">
          <Link to="/" className="nav-brand">🌟 Old Is Gold</Link>
          <div className="nav-links">
            <Link to="/progress" className="nav-link">📊 Progress</Link>
          </div>
        </nav>
        <div className="container text-center">
          <div className="hero" style={{ background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)' }}>
            <div className="hero-emoji">🎉</div>
            <h1>Amazing Work, {userName}!</h1>
            <p>You completed today's workout. Your body thanks you!</p>
            <div className="stats-grid" style={{ marginTop: '32px' }}>
              <div className="stat-card">
                <div className="stat-value">{completedExercises.length}</div>
                <div className="stat-label">Exercises Done</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{plan.duration_minutes}</div>
                <div className="stat-label">Minutes Active</div>
              </div>
            </div>
            <div className="flex gap-md justify-center" style={{ marginTop: '32px', flexWrap: 'wrap' }}>
              <Link to="/progress" className="btn btn-primary">
                📊 View My Progress
              </Link>
              <button onClick={() => window.location.reload()} className="btn btn-secondary">
                🔄 Do Another Workout
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <nav className="nav">
        <Link to="/" className="nav-brand">🌟 Old Is Gold</Link>
        <div className="nav-links">
          <Link to="/workout" className="nav-link active">Today</Link>
          <Link to="/progress" className="nav-link">Progress</Link>
        </div>
      </nav>

      <div className="container">
        <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
          <div>
            <h1>👋 Hello, {userName}!</h1>
            <p style={{ margin: 0 }}>Here's your workout for today</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="flex justify-between items-center">
            <span style={{ fontSize: '20px', fontWeight: '600' }}>
              Progress: {completedExercises.length} / {plan?.exercises.length}
            </span>
            <span style={{ fontSize: '18px', color: '#666' }}>
              ~{plan?.duration_minutes} minutes
            </span>
          </div>
          <div style={{
            marginTop: '12px',
            height: '12px',
            background: '#e9ecef',
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(completedExercises.length / (plan?.exercises.length || 1)) * 100}%`,
              height: '100%',
              background: 'var(--primary)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Exercise List */}
        {plan?.exercises.map((exercise, index) => (
          <div
            key={index}
            className={`exercise-card ${completedExercises.includes(index) ? 'completed' : ''}`}
            onClick={() => toggleExercise(index)}
            style={{ cursor: 'pointer' }}
          >
            <div className="flex justify-between items-center">
              <div className="exercise-name">
                {completedExercises.includes(index) ? '✅ ' : `${index + 1}. `}
                {exercise.name}
              </div>
              <button
                className={`btn ${completedExercises.includes(index) ? 'btn-success' : 'btn-secondary'}`}
                style={{ minHeight: '48px', padding: '12px 20px' }}
              >
                {completedExercises.includes(index) ? 'Done!' : 'Mark Done'}
              </button>
            </div>
            <div className="exercise-meta">
              <span>⏱️ {exercise.duration}</span>
              <span>🔄 {exercise.reps}</span>
            </div>
            <div className="exercise-instructions">
              💡 {exercise.instructions}
            </div>
          </div>
        ))}

        {/* Complete Button */}
        <div style={{ marginTop: '32px' }}>
          {allComplete ? (
            <button
              onClick={completeWorkout}
              className="btn btn-success btn-large"
              disabled={saving}
            >
              {saving ? '⏳ Saving...' : '🎉 Complete Workout!'}
            </button>
          ) : (
            <div className="alert alert-info">
              👆 Tap each exercise to mark it complete, then finish your workout!
            </div>
          )}
        </div>

        {/* Safety Notice */}
        <div className="card" style={{ marginTop: '32px', background: '#fff9e6', borderColor: '#ffc107' }}>
          <h3>⚠️ Safety First</h3>
          <p style={{ margin: 0, fontSize: '18px' }}>
            Listen to your body. Stop if you feel pain, dizziness, or shortness of breath. 
            It's okay to skip exercises or take breaks. Your safety matters most!
          </p>
        </div>
      </div>
    </div>
  )
}

export default TodaysWorkout
