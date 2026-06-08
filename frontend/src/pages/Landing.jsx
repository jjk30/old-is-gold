import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { apiDelete } from '../utils/api'
import { auth } from '../firebase'
import { deleteUser } from 'firebase/auth'
import logo from '../assets/logo.webp'
import './Landing.css'

// How long the full-screen logout / goodbye screens stay up before we clear
// local state and land on the logged-out home. Tune here.
const LOGOUT_MS = 5000
const DELETE_MS = 5000

function Landing() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // Source of truth for logged-in vs logged-out stays exactly as before:
  // the presence of a userId in localStorage (set by the Login flow).
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  // Which header dropdown is open: 'workouts' | 'settings' | null.
  // A single value means opening one closes the other for free.
  const [openMenu, setOpenMenu] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  // Full-screen overlay: 'logout' | 'delete' | null.
  const [loadScreen, setLoadScreen] = useState(null)
  const navRef = useRef(null)

  const userName = localStorage.getItem('userName') || 'Friend'

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    setIsLoggedIn(!!userId)
  }, [])

  // Close any open dropdown on outside click or Escape.
  useEffect(() => {
    if (!openMenu) return
    const onClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenMenu(null)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpenMenu(null)
    }
    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [openMenu])

  const toggleMenu = (name) => setOpenMenu((cur) => (cur === name ? null : name))

  // --- Account handlers, moved verbatim from the old Settings page ---------
  // Their core logic is unchanged; they are only wrapped with the full-screen
  // loading/goodbye overlay before local state is cleared.

  // Logout: show the signing-out screen, perform the real Firebase signOut
  // while it's up, then after LOGOUT_MS clear local state and land logged-out.
  const handleLogout = async () => {
    setOpenMenu(null)
    setLoadScreen('logout')
    try {
      await logout()
    } catch (err) {
      console.error('Logout error:', err)
    }
    setTimeout(() => {
      localStorage.clear()
      setIsLoggedIn(false)
      setLoadScreen(null)
      navigate('/')
    }, LOGOUT_MS)
  }

  // Delete: owner-checked server delete FIRST; on failure alert and return
  // without proceeding (never fake success). Only on success do the best-effort
  // Firebase account removal and show the goodbye screen for DELETE_MS.
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
    setLoadScreen('delete')

    setTimeout(() => {
      localStorage.clear()
      setIsLoggedIn(false)
      setLoadScreen(null)
      navigate('/')
    }, DELETE_MS)
  }

  // Copy for the active full-screen overlay.
  const loadCopy = {
    logout: {
      title: 'Signing you out',
      sub: 'Just a moment, keeping your data safe.',
    },
    delete: {
      title: 'Your account has been deleted',
      sub: 'Thank you for being part of Old Is Gold. You are always welcome back.',
    },
  }
  const loadMs = loadScreen === 'delete' ? DELETE_MS : LOGOUT_MS

  // Expose the extracted logo asset to CSS so .medallion can paint it.
  const pageStyle = { '--logo': `url(${logo})` }

  return (
    <div className="landing-page" style={pageStyle}>
      {/* Full-width header: brand hard-left, nav hard-right. */}
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="medallion brand-mark" aria-hidden="true"></span>
          <span className="wordmark">Old <span className="gold">Is&nbsp;Gold</span></span>
        </Link>

        <nav className="main-nav" aria-label="Primary" ref={navRef}>
          {isLoggedIn ? (
            <>
              {/* My Workouts dropdown — unchanged contents. */}
              <div className="menu-wrap">
                <button
                  className="menu-trigger"
                  aria-haspopup="menu"
                  aria-expanded={openMenu === 'workouts'}
                  aria-controls="menu-workouts"
                  onClick={() => toggleMenu('workouts')}
                >
                  My Workouts
                  <svg className="caret" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                </button>
                <div className={`menu${openMenu === 'workouts' ? ' open' : ''}`} id="menu-workouts" role="menu">
                  <div className="menu-user">
                    <span className="medallion" aria-hidden="true"></span>
                    <div className="who">
                      <span className="name">{userName}</span>
                      <span className="meta">Signed in</span>
                    </div>
                  </div>
                  <div className="menu-sep"></div>
                  <Link className="menu-item" role="menuitem" to="/progress" onClick={() => setOpenMenu(null)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18" /><path d="M6 20v-7" /><path d="M11 20V6" /><path d="M16 20v-10" /></svg>
                    My Progress
                  </Link>
                  <Link className="menu-item" role="menuitem" to="/nutrition" onClick={() => setOpenMenu(null)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11h16a8 8 0 0 1-16 0z" /><path d="M9 7c0-1.4.9-2.4.9-2.4M13.5 7c0-1.4.9-2.4.9-2.4" /><path d="M4 20h16" /></svg>
                    Nutrition
                  </Link>
                </div>
              </div>

              {/* Settings dropdown — Logout + Delete Account (replaces the old page). */}
              <div className="menu-wrap">
                <button
                  className="menu-trigger"
                  aria-haspopup="menu"
                  aria-expanded={openMenu === 'settings'}
                  aria-controls="menu-settings"
                  onClick={() => toggleMenu('settings')}
                >
                  Settings
                  <svg className="caret" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                </button>
                <div className={`menu${openMenu === 'settings' ? ' open' : ''}`} id="menu-settings" role="menu">
                  <p className="menu-cap">Account</p>
                  <button className="menu-item" role="menuitem" type="button" onClick={handleLogout}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" /><path d="M18 15l3-3-3-3" /><path d="M9 12h12" /></svg>
                    Logout
                  </button>
                  <div className="menu-sep"></div>
                  <button className="menu-item danger" role="menuitem" type="button" onClick={() => { setOpenMenu(null); setShowDeleteConfirm(true) }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /></svg>
                    Delete Account
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link className="login-link" to="/aboutus">About us</Link>
              <Link className="login-link" to="/login">Log in</Link>
            </>
          )}
        </nav>
      </header>

      <main>
        {isLoggedIn ? (
          <section>
            <p className="eyebrow reveal d1">Welcome back</p>
            <p className="tagline reveal d2">A fitness program made just for you.</p>
            <p className="subline reveal d2">Your next session is ready when you are.</p>
            <Link className="btn-primary reveal d3" to="/workout">Continue Workout</Link>
            <p className="sub-cta reveal d4">Pick up right where you left off.</p>
          </section>
        ) : (
          <section>
            <span className="medallion hero-logo reveal d1" role="img" aria-label="Old Is Gold"></span>
            <p className="tagline reveal d2">A fitness program made just for you.</p>
            <p className="subline reveal d3">Simple moves, big buttons, and workouts that respect your pace. Made for ages 55 and up.</p>
            <Link className="btn-primary reveal d4" to="/login">Get Started Free</Link>
            <p className="sub-cta reveal d4">Already a member? <Link to="/login">Log in</Link></p>
          </section>
        )}
      </main>

      <footer>
        <p className="fmark">Old <span className="gold">Is Gold</span>. Strength and balance for every stage of life.</p>
      </footer>

      {/* Delete confirm dialog */}
      {showDeleteConfirm && (
        <div className="modal-overlay show" role="presentation" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-box" role="dialog" aria-modal="true" aria-labelledby="dmTitle" onClick={(e) => e.stopPropagation()}>
            <h2 id="dmTitle">Delete account?</h2>
            <p>This permanently removes your account and all of your data. This cannot be undone.</p>
            <div className="modal-buttons">
              <button className="modal-btn cancel" type="button" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="modal-btn delete" type="button" onClick={handleDeleteAccount}>Yes, delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen loading / goodbye overlay (logout + delete) */}
      {loadScreen && (
        <div className="load-screen show" style={{ '--load-ms': `${loadMs}ms` }} role="status" aria-live="polite">
          <div className="lo-ring">
            <span className="spin" aria-hidden="true"></span>
            <span className="medallion" aria-hidden="true"></span>
          </div>
          <p className="lo-title">{loadCopy[loadScreen].title}</p>
          <p className="lo-sub">{loadCopy[loadScreen].sub}</p>
          <div className="lo-bar"><i></i></div>
        </div>
      )}
    </div>
  )
}

export default Landing
