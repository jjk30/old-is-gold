import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:8000'

function Progress() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)

  const userId = localStorage.getItem('userId')
  const userName = localStorage.getItem('userName')

  useEffect(() => {
    if (!userId) {
      navigate('/setup')
      return
    }
    fetchProgress()
  }, [userId])

  const fetchProgress = async () => {
    try {
      const response = await fetch(`${API_URL}/progress/${userId}`)
      if (!response.ok) throw new Error('Failed to fetch progress')
      const data = await response.json()
      setProgress(data)
    } catch (err) {
      console.error(err)
      setProgress({ entries: [], stats: { total_workouts: 0, total_minutes: 0, streak: 0 } })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="container text-center">
          <h1>⏳ Loading your progress...</h1>
        </div>
      </div>
    )
  }

  const motivationalMessages = [
    "Every step counts! 🌟",
    "You're doing amazing! 💪",
    "Consistency is key! 🔑",
    "Keep up the great work! 🎉",
    "Your future self thanks you! 🙏"
  ]

  const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]

  return (
    <div className="page">
      <nav className="nav">
        <Link to="/" className="nav-brand">🌟 Old Is Gold</Link>
        <div className="nav-links">
          <Link to="/workout" className="nav-link">Today</Link>
          <Link to="/progress" className="nav-link active">Progress</Link>
        </div>
      </nav>

      <div className="container">
        <h1>📊 Your Progress</h1>
        <p>{randomMessage}</p>

        {/* Stats Overview */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{progress?.stats?.total_workouts || 0}</div>
            <div className="stat-label">Workouts Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{progress?.stats?.total_minutes || 0}</div>
            <div className="stat-label">Total Minutes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">🔥 {progress?.stats?.streak || 0}</div>
            <div className="stat-label">Day Streak</div>
          </div>
        </div>

        {/* Achievements */}
        <div className="card card-highlight">
          <h2>🏆 Achievements</h2>
          <div className="option-grid" style={{ marginTop: '16px' }}>
            <div className={`stat-card ${progress?.stats?.total_workouts >= 1 ? '' : 'locked'}`}
                 style={{ opacity: progress?.stats?.total_workouts >= 1 ? 1 : 0.4 }}>
              <div style={{ fontSize: '32px' }}>🎯</div>
              <div className="stat-label">First Workout</div>
            </div>
            <div className={`stat-card ${progress?.stats?.total_workouts >= 5 ? '' : 'locked'}`}
                 style={{ opacity: progress?.stats?.total_workouts >= 5 ? 1 : 0.4 }}>
              <div style={{ fontSize: '32px' }}>⭐</div>
              <div className="stat-label">5 Workouts</div>
            </div>
            <div className={`stat-card ${progress?.stats?.total_workouts >= 10 ? '' : 'locked'}`}
                 style={{ opacity: progress?.stats?.total_workouts >= 10 ? 1 : 0.4 }}>
              <div style={{ fontSize: '32px' }}>🏅</div>
              <div className="stat-label">10 Workouts</div>
            </div>
            <div className={`stat-card ${progress?.stats?.total_minutes >= 100 ? '' : 'locked'}`}
                 style={{ opacity: progress?.stats?.total_minutes >= 100 ? 1 : 0.4 }}>
              <div style={{ fontSize: '32px' }}>💎</div>
              <div className="stat-label">100 Minutes</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2>📅 Recent Activity</h2>
          {progress?.entries && progress.entries.length > 0 ? (
            <div style={{ marginTop: '16px' }}>
              {progress.entries.slice().reverse().map((entry, index) => (
                <div key={index} className="exercise-card" style={{ borderLeftColor: entry.completed ? 'var(--success)' : 'var(--warning)' }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '18px' }}>
                        {entry.completed ? '✅ Workout Completed' : '⏸️ Partial Workout'}
                      </div>
                      <div style={{ color: '#666', fontSize: '16px' }}>
                        {new Date(entry.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                    <div className="stat-card" style={{ margin: 0, padding: '12px 20px' }}>
                      <div className="stat-value" style={{ fontSize: '24px' }}>{entry.duration}</div>
                      <div className="stat-label">minutes</div>
                    </div>
                  </div>
                  {entry.notes && (
                    <div style={{ marginTop: '12px', color: '#666', fontSize: '16px' }}>
                      📝 {entry.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="alert alert-info" style={{ marginTop: '16px' }}>
              No workouts recorded yet. Complete your first workout to see your progress here!
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-lg">
          <Link to="/workout" className="btn btn-primary btn-large">
            💪 Start Today's Workout
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Progress
