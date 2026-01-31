import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Landing.css'

function Landing() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showGoodbye, setShowGoodbye] = useState(false)
  
  const userName = localStorage.getItem('userName') || 'Friend'

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    setIsLoggedIn(!!userId)
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    setIsLoggedIn(false)
    setShowSettings(false)
  }

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(false)
    setShowGoodbye(true)
    
    setTimeout(() => {
      localStorage.clear()
      setIsLoggedIn(false)
      setShowGoodbye(false)
    }, 3000)
  }

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="logo">Old <span className="gold">Is Gold</span></div>
        <nav className="nav-buttons">
          {isLoggedIn ? (
            <>
              <Link to="/workout" className="nav-btn primary">My Workouts</Link>
              <button className="nav-btn settings-trigger" onClick={() => setShowSettings(!showSettings)}>
                Settings
              </button>
            </>
          ) : (
            <Link to="/login" className="nav-btn">Login</Link>
          )}
        </nav>
      </header>

      {/* Settings Dropdown */}
      {showSettings && (
        <div className="settings-dropdown">
          <div className="settings-header">
            <span className="settings-user">👤 {userName}</span>
          </div>
          <Link to="/progress" className="settings-option" onClick={() => setShowSettings(false)}>
            📊 My Progress
          </Link>
          <Link to="/nutrition" className="settings-option" onClick={() => setShowSettings(false)}>
            🍽️ Nutrition
          </Link>
          <button className="settings-option" onClick={handleLogout}>
            🚪 Logout
          </button>
          <button className="settings-option danger" onClick={() => { setShowSettings(false); setShowDeleteConfirm(true); }}>
            🗑️ Delete Account
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>⚠️ Delete Account?</h2>
            <p>Are you sure you want to delete your account? Your local data will be cleared, but you can always come back and login again!</p>
            <div className="modal-buttons">
              <button className="modal-btn cancel" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="modal-btn delete" onClick={handleDeleteAccount}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Goodbye Modal */}
      {showGoodbye && (
        <div className="modal-overlay">
          <div className="modal-box goodbye">
            <span className="goodbye-icon">💛</span>
            <h2>Thank You for Using Us!</h2>
            <p>We will wait for you to come back again!</p>
            <p className="goodbye-sub">Take care of yourself! 🌟</p>
          </div>
        </div>
      )}

      <main className="landing-main">
        <h1 className="main-title">Old <span className="gold">Is Gold</span></h1>
        <p className="subtitle">
          A fitness program designed just for you. Simple exercises,<br />
          big buttons, and workouts that respect your body.
        </p>
        <Link to={isLoggedIn ? "/workout" : "/login"} className="cta-button">
          {isLoggedIn ? "Continue Workout" : "Get Started Free"}
        </Link>
      </main>

      <footer className="landing-footer">
        <p>Made with ❤️ for seniors</p>
      </footer>
    </div>
  )
}

export default Landing
