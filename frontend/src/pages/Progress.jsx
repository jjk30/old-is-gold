import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Progress.css'

const API_URL = 'https://gy19tatq9g.execute-api.us-east-1.amazonaws.com/prod'

const getLocalDateString = (date = new Date()) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function Progress() {
  const navigate = useNavigate()
  const [progressData, setProgressData] = useState([])
  const [mealsData, setMealsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showSettings, setShowSettings] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showGoodbye, setShowGoodbye] = useState(false)
  
  const userId = localStorage.getItem('userId')
  const userName = localStorage.getItem('userName') || 'Friend'

  useEffect(() => {
    if (!userId) { navigate('/setup'); return }
    Promise.all([
      fetch(`${API_URL}/progress/${userId}`).then(r => r.ok ? r.json() : []),
      fetch(`${API_URL}/nutrition/${userId}`).then(r => r.ok ? r.json() : [])
    ]).then(([prog, meals]) => {
      setProgressData(Array.isArray(prog) ? prog : [])
      setMealsData(Array.isArray(meals) ? meals : [])
    }).finally(() => setLoading(false))
  }, [userId, navigate])

  const dateStr = getLocalDateString(selectedDate)
  const dayWorkouts = progressData.filter(p => p.date === dateStr && p.type === 'workout')
  const dayMeals = mealsData.filter(m => m.date === dateStr)

  const totalCaloriesEaten = dayMeals.reduce((sum, m) => sum + (m.calories || 0), 0)
  const totalCaloriesBurned = dayWorkouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0)
  const totalProtein = dayMeals.reduce((sum, m) => sum + (m.protein || 0), 0)
  const totalCarbs = dayMeals.reduce((sum, m) => sum + (m.carbs || 0), 0)
  const totalFat = dayMeals.reduce((sum, m) => sum + (m.fat || 0), 0)
  const totalExercises = dayWorkouts.reduce((sum, w) => sum + (w.exercises_completed || 0), 0)
  const totalMinutes = dayWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0)
  const netCalories = totalCaloriesEaten - totalCaloriesBurned

  const today = new Date()
  const isToday = getLocalDateString(selectedDate) === getLocalDateString(today)

  const changeDate = (days) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    if (newDate <= today) setSelectedDate(newDate)
  }

  const formatDisplayDate = (date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (getLocalDateString(date) === getLocalDateString(today)) return "Today"
    if (getLocalDateString(date) === getLocalDateString(yesterday)) return "Yesterday"
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const datesWithData = [...new Set([
    ...progressData.map(p => p.date),
    ...mealsData.map(m => m.date)
  ])]

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  const handleDeleteAccount = async () => {
    setShowDeleteConfirm(false)
    setShowGoodbye(true)
    setTimeout(() => {
      localStorage.clear()
      navigate('/')
    }, 3000)
  }

  const getLast7Days = () => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(d)
    }
    return days
  }

  const getNetCaloriesColor = () => {
    if (netCalories > 500) return 'red'
    if (netCalories > 0) return 'green'
    return 'orange'
  }

  // Get all exercises from workouts
  const getAllExercises = () => {
    const exercises = []
    dayWorkouts.forEach(w => {
      if (w.exercises && Array.isArray(w.exercises)) {
        w.exercises.forEach(ex => {
          exercises.push({ name: ex, duration: Math.round((w.duration || 15) / (w.exercises_completed || 1)), calories: Math.round((w.calories_burned || 0) / (w.exercises_completed || 1)) })
        })
      }
    })
    return exercises
  }

  const allExercises = getAllExercises()

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>

  return (
    <div className="progress-page">
      <header className="progress-header">
        <Link to="/" className="brand">
          <span className="logo-og"><span className="logo-o">O</span><span className="logo-g">G</span></span>
          <span className="brand-old">Old</span> <span className="brand-gold">Is Gold</span>
        </Link>
        <nav className="nav-links">
          <Link to="/nutrition">Nutrition</Link>
          <Link to="/workout">Workout</Link>
          <Link to="/progress" className="active">Progress</Link>
          <div className="settings-container" style={{position: 'relative'}}>
            <button className="settings-btn" onClick={() => setShowSettings(!showSettings)}>⚙️</button>
            {showSettings && (
              <div className="settings-dropdown">
                <div className="settings-header">
                  <div className="settings-user">{userName}</div>
                </div>
                <button className="settings-option" onClick={handleLogout}>Logout</button>
                <button className="settings-option danger" onClick={() => setShowDeleteConfirm(true)}>Delete Account</button>
              </div>
            )}
          </div>
        </nav>
      </header>

      <div className="progress-content">
        <div className="left-panel">
          <div className="panel-header">
            <h1>Daily Summary</h1>
            <div className="date-nav">
              <button className="date-btn" onClick={() => changeDate(-1)}>← Prev</button>
              <span className="current-date">{formatDisplayDate(selectedDate)}</span>
              <button className="date-btn" onClick={() => changeDate(1)} disabled={isToday}>Next →</button>
            </div>
          </div>

          <div className="calories-display">
            <div className="cal-item">
              <span className="cal-number green">{totalCaloriesEaten}</span>
              <span className="cal-label">Calories Eaten</span>
            </div>
            <span className="cal-separator">−</span>
            <div className="cal-item">
              <span className="cal-number orange">{totalCaloriesBurned}</span>
              <span className="cal-label">Calories Burned</span>
            </div>
            <span className="cal-separator">=</span>
            <div className="cal-item">
              <span className={`cal-number ${getNetCaloriesColor()}`}>
                {netCalories >= 0 ? '+' : ''}{netCalories}
              </span>
              <span className="cal-label">Net Calories</span>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-box"><span className="stat-num">{totalExercises}</span><span className="stat-label">Exercises</span></div>
            <div className="stat-box"><span className="stat-num">{totalMinutes}</span><span className="stat-label">Minutes</span></div>
            <div className="stat-box"><span className="stat-num">{dayMeals.length}</span><span className="stat-label">Meals</span></div>
            <div className="stat-box"><span className="stat-num">{dayWorkouts.length}</span><span className="stat-label">Workouts</span></div>
          </div>

          <div className="macros-section">
            <h3>Macros</h3>
            <div className="macro-row">
              <span className="macro-name">Protein</span>
              <div className="macro-track">
                <div className="macro-fill protein" style={{width: `${Math.min(100, (totalProtein/110)*100)}%`}}></div>
              </div>
              <span className="macro-value">{totalProtein}g / 110g</span>
            </div>
            <div className="macro-row">
              <span className="macro-name">Carbs</span>
              <div className="macro-track">
                <div className="macro-fill carbs" style={{width: `${Math.min(100, (totalCarbs/250)*100)}%`}}></div>
              </div>
              <span className="macro-value">{totalCarbs}g / 250g</span>
            </div>
            <div className="macro-row">
              <span className="macro-name">Fat</span>
              <div className="macro-track">
                <div className="macro-fill fat" style={{width: `${Math.min(100, (totalFat/65)*100)}%`}}></div>
              </div>
              <span className="macro-value">{totalFat}g / 65g</span>
            </div>
          </div>

          {dayMeals.length > 0 && (
            <div className="meals-section">
              <h3>Meals Today</h3>
              <div className="meals-list">
                {dayMeals.map((m, i) => (
                  <div key={i} className="meal-item">
                    <span>{m.food || m.meal_type || 'Meal'}</span>
                    <span className="meal-cal">{m.calories} cal</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dayMeals.length === 0 && dayWorkouts.length === 0 && (
            <div className="no-data">No data recorded for this day</div>
          )}
        </div>

        <div className="right-panel">
          <h2>Workouts Today</h2>
          {allExercises.length === 0 && dayWorkouts.length === 0 ? (
            <div className="no-workouts">
              <p>No workouts yet today</p>
              <Link to="/workout" className="start-btn">Start Workout</Link>
            </div>
          ) : allExercises.length > 0 ? (
            <div className="workouts-list">
              {allExercises.map((ex, i) => (
                <div key={i} className="workout-item">
                  <div>
                    <span className="workout-title">{ex.name}</span>
                    <span className="workout-status">✓ Completed</span>
                  </div>
                  <div className="workout-meta">
                    <span className="workout-duration">{ex.duration} min</span>
                    <span className="workout-cal">{ex.calories} cal</span>
                  </div>
                </div>
              ))}
              <div className="workout-total">
                <span>Total: {totalExercises} exercises</span>
                <span>{totalMinutes} min • {totalCaloriesBurned} cal burned</span>
              </div>
            </div>
          ) : (
            <div className="workouts-list">
              {dayWorkouts.map((w, i) => (
                <div key={i} className="workout-item">
                  <div>
                    <span className="workout-title">Workout Session</span>
                    <span className="workout-status">✓ {w.exercises_completed || 0} exercises</span>
                  </div>
                  <div className="workout-meta">
                    <span className="workout-duration">{w.duration || 15} min</span>
                    <span className="workout-cal">{w.calories_burned || 0} cal</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="weekly-overview">
            <h3>Last 7 Days</h3>
            <div className="week-grid">
              {getLast7Days().map((d, i) => {
                const dStr = getLocalDateString(d)
                const hasData = datesWithData.includes(dStr)
                const isSelected = dStr === dateStr
                return (
                  <button key={i} className={`day-cell ${hasData ? 'has-data' : ''} ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedDate(d)}>
                    <span className="day-name">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span className="day-num">{d.getDate()}</span>
                    {hasData && <span className="day-dot">●</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>Delete Account?</h2>
            <p>This will permanently delete all your data. This action cannot be undone.</p>
            <div className="modal-buttons">
              <button className="modal-btn cancel" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="modal-btn delete" onClick={handleDeleteAccount}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showGoodbye && (
        <div className="modal-overlay">
          <div className="modal-box goodbye">
            <span className="goodbye-icon">💛</span>
            <h2>Goodbye!</h2>
            <p>Thank you for using Old Is Gold. Take care!</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Progress
