import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiGet, apiDelete } from '../utils/api'
import { useAuth } from '../AuthContext'
import { auth } from '../firebase'
import { deleteUser } from 'firebase/auth'
import logo from '../assets/logo.webp'
import './Progress.css'

const getLocalDateString = (date = new Date()) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function Progress() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
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
      apiGet(`/progress/${userId}`).then(r => r.ok ? r.json() : []),
      apiGet(`/nutrition/${userId}`).then(r => r.ok ? r.json() : [])
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

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Logout error:', err)
    }
    localStorage.clear()
    navigate('/')
  }

  const handleDeleteAccount = async () => {
    // Delete server-side data first; if it fails, don't pretend we succeeded.
    try {
      await apiDelete(`/account/${user.uid}`)
    } catch (err) {
      console.error('Delete account error:', err)
      alert('Could not delete your account. Please try again.')
      return
    }

    // Best-effort removal of the Firebase auth account; fall back to sign-out.
    try {
      await deleteUser(auth.currentUser)
    } catch {
      try { await logout() } catch (_) {}
    }

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
    <div className="progress-page" style={{ '--logo': `url(${logo})` }}>
      <header className="progress-header">
        {/* Brand: coin medallion + wordmark (same medallion pattern as Landing). */}
        <Link to="/" className="brand">
          <span className="medallion brand-mark" aria-hidden="true"></span>
          <span className="wordmark">Old <span className="gold">Is&nbsp;Gold</span></span>
        </Link>
        <nav className="nav-links">
          <Link to="/nutrition">Nutrition</Link>
          <Link to="/workout">Workout</Link>
          <Link to="/progress" className="active">Progress</Link>
          <div className="settings-container" style={{position: 'relative'}}>
            <button className="settings-btn" aria-label="Settings" onClick={() => setShowSettings(!showSettings)}><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.2a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.6l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></svg></button>
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
              <button className="date-btn" onClick={() => changeDate(-1)}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>Prev</button>
              <span className="current-date">{formatDisplayDate(selectedDate)}</span>
              <button className="date-btn" onClick={() => changeDate(1)} disabled={isToday}>Next<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>
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
            <div className="macros-body">
              {/* Left: the three bars (narrower), tinted to each macro color. */}
              <div className="macro-bars">
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
              {/* Right: donut ring showing the protein/carbs/fat split by grams.
                  Computed from the existing totals; no heading. */}
              {(() => {
                const macros = [
                  { key: 'protein', name: 'Protein', grams: totalProtein, color: '#f3e6bb' },
                  { key: 'carbs', name: 'Carbs', grams: totalCarbs, color: '#d6a23f' },
                  { key: 'fat', name: 'Fat', grams: totalFat, color: '#7a5a24' },
                ]
                const macroTotal = totalProtein + totalCarbs + totalFat
                const C = 2 * Math.PI * 50
                const gap = 3
                let cumulative = 0
                const arcs = macros.map((m) => {
                  const frac = macroTotal > 0 ? m.grams / macroTotal : 0
                  const arcLen = frac * C
                  const dash = Math.max(0, arcLen - gap)
                  const arc = { key: m.key, color: m.color, dasharray: `${dash} ${C - dash}`, dashoffset: -cumulative }
                  cumulative += arcLen
                  return arc
                })
                return (
                  <div className="macro-ring-wrap">
                    <div className="macro-ring">
                      <svg viewBox="0 0 128 128" width="128" height="128" aria-hidden="true">
                        <circle cx="64" cy="64" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
                        {macroTotal > 0 && arcs.map((a) => (
                          <circle key={a.key} cx="64" cy="64" r="50" fill="none" stroke={a.color} strokeWidth="14"
                            strokeDasharray={a.dasharray} strokeDashoffset={a.dashoffset} transform="rotate(-90 64 64)" />
                        ))}
                      </svg>
                      <div className="ring-center">
                        <span className="ring-total">{macroTotal}g</span>
                        <span className="ring-sub">logged</span>
                      </div>
                    </div>
                    <div className="macro-legend">
                      {macros.map((m) => {
                        const pct = macroTotal > 0 ? Math.round((m.grams / macroTotal) * 100) : 0
                        return (
                          <div key={m.key} className="legend-row">
                            <span className="legend-swatch" style={{ background: m.color }}></span>
                            <span className="legend-name">{m.name}</span>
                            <span className="legend-pct">{pct}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
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
          <div className="rp-head">
            <h2>Workouts Today</h2>
            {/* Apple-style calendar badge in our gold/black colors. */}
            <div className="cal-badge">
              <div className="cb-top">{today.toLocaleDateString('en-US',{weekday:'short'})}</div>
              <div className="cb-day">{today.getDate()}</div>
            </div>
          </div>
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
                    <span className="workout-status">Completed</span>
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
                    <span className="workout-status">{w.exercises_completed || 0} exercises</span>
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
                    {hasData && <span className="day-dot"></span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay" role="presentation" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-box" role="dialog" aria-modal="true" aria-labelledby="dmTitle" aria-describedby="dmDesc" onClick={(e) => e.stopPropagation()}>
            <h2 id="dmTitle">Are you sure?</h2>
            <p id="dmDesc">This permanently deletes your account and all of your data. This cannot be undone.</p>
            <div className="modal-buttons">
              {/* "No" (cancel) comes first and takes focus by default; "Yes" (delete) is the gold button. */}
              <button className="modal-btn cancel" type="button" onClick={() => setShowDeleteConfirm(false)} autoFocus>No</button>
              <button className="modal-btn delete" type="button" onClick={handleDeleteAccount}>Yes</button>
            </div>
          </div>
        </div>
      )}

      {showGoodbye && (
        <div className="modal-overlay">
          <div className="modal-box goodbye">
            <h2>Goodbye!</h2>
            <p>Thank you for using Old Is Gold. Take care!</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Progress
