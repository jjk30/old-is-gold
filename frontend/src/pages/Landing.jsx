import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.webp'
import './Landing.css'

function Landing() {
  // Source of truth for logged-in vs logged-out stays exactly as before:
  // the presence of a userId in localStorage (set by the Login flow).
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuWrapRef = useRef(null)

  const userName = localStorage.getItem('userName') || 'Friend'

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    setIsLoggedIn(!!userId)
  }, [])

  // Close the "My Workouts" dropdown on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e) => {
      if (menuWrapRef.current && !menuWrapRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  // Expose the extracted logo asset to CSS so .medallion can paint it.
  const pageStyle = { '--logo': `url(${logo})` }

  return (
    <div className="landing-page" style={pageStyle}>
      <div className="shell">
        <header className="topbar">
          <Link className="brand" to="/">
            <span className="medallion brand-mark" aria-hidden="true"></span>
            <span className="wordmark">Old <span className="gold">Is&nbsp;Gold</span></span>
          </Link>

          {isLoggedIn ? (
            <nav className="main-nav" aria-label="Primary">
              <div className="menu-wrap" ref={menuWrapRef}>
                <button
                  className="menu-trigger"
                  id="menuBtn"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-controls="workouts-menu"
                  onClick={() => setMenuOpen((o) => !o)}
                >
                  My Workouts
                  <svg className="caret" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                </button>
                <div className={`menu${menuOpen ? ' open' : ''}`} id="workouts-menu" role="menu" aria-labelledby="menuBtn">
                  <div className="menu-user">
                    <span className="medallion" aria-hidden="true"></span>
                    <div className="who">
                      <span className="name">{userName}</span>
                      <span className="meta">Signed in</span>
                    </div>
                  </div>
                  <div className="menu-sep"></div>
                  <Link className="menu-item" role="menuitem" to="/progress" onClick={() => setMenuOpen(false)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18" /><path d="M6 20v-7" /><path d="M11 20V6" /><path d="M16 20v-10" /></svg>
                    My Progress
                  </Link>
                  <Link className="menu-item" role="menuitem" to="/nutrition" onClick={() => setMenuOpen(false)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11h16a8 8 0 0 1-16 0z" /><path d="M9 7c0-1.4.9-2.4.9-2.4M13.5 7c0-1.4.9-2.4.9-2.4" /><path d="M4 20h16" /></svg>
                    Nutrition
                  </Link>
                </div>
              </div>
              <Link className="nav-link" to="/settings">Settings</Link>
            </nav>
          ) : (
            <nav className="main-nav" aria-label="Primary">
              <Link className="login-pill" to="/login">Log in</Link>
            </nav>
          )}
        </header>

        <main>
          {isLoggedIn ? (
            <>
              {/* No large center medallion when logged in — the header wordmark carries the brand. */}
              <p className="eyebrow reveal d1">Welcome back</p>
              <p className="tagline reveal d2">A fitness program made just for you.</p>
              <p className="subline reveal d2">Your next session is ready when you are.</p>
              <Link className="btn-primary reveal d3" to="/workout">Continue Workout</Link>
              <p className="sub-cta reveal d4">Pick up right where you left off.</p>
            </>
          ) : (
            <>
              <span className="medallion hero-logo reveal d1" role="img" aria-label="Old Is Gold"></span>
              <p className="tagline reveal d2">A fitness program made just for you.</p>
              <p className="subline reveal d2">Simple moves, big buttons, and workouts that respect your pace. Made for ages 55 and up.</p>
              <Link className="btn-primary reveal d3" to="/login">Get Started Free</Link>
              <p className="sub-cta reveal d4">Already a member? <Link className="text-link" to="/login">Log in</Link></p>
            </>
          )}
        </main>
      </div>

      <footer>
        <p className="fmark">Old <span className="gold">Is Gold</span>. Strength and balance for every stage of life.</p>
      </footer>
    </div>
  )
}

export default Landing
