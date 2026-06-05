import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { apiDelete } from '../utils/api'
import { auth } from '../firebase'
import { deleteUser } from 'firebase/auth'
import logo from '../assets/logo.webp'
import './Settings.css'

function Settings() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showGoodbye, setShowGoodbye] = useState(false)

  const userName = localStorage.getItem('userName') || 'Friend'

  // Existing logout handler (real Firebase signOut), moved here unchanged.
  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Logout error:', err)
    }
    localStorage.clear()
    navigate('/')
  }

  // Existing delete-account handler, moved here unchanged: owner-checked
  // apiDelete('/account/{uid}') first, then best-effort Firebase account removal.
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
      setShowGoodbye(false)
      navigate('/')
    }, 3000)
  }

  const pageStyle = { '--logo': `url(${logo})` }

  return (
    <div className="settings-page" style={pageStyle}>
      <div className="shell">
        <header className="topbar">
          <Link className="brand" to="/">
            <span className="medallion brand-mark" aria-hidden="true"></span>
            <span className="wordmark">Old <span className="gold">Is&nbsp;Gold</span></span>
          </Link>
          <Link className="nav-link" to="/">Home</Link>
        </header>

        <main>
          <div className="settings-card">
            <div className="settings-id">
              <span className="medallion" aria-hidden="true"></span>
              <div className="who">
                <span className="name">{userName}</span>
                <span className="meta">Signed in</span>
              </div>
            </div>

            <h1 className="settings-title">Settings</h1>

            {/* Logout — reuses the existing handler. */}
            <button className="settings-row" type="button" onClick={handleLogout}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" /><path d="M18 15l3-3-3-3" /><path d="M9 12h12" /></svg>
              Logout
            </button>

            <div className="settings-sep"></div>

            {/* Delete Account — destructive, reuses the existing handler. */}
            <div className="danger-zone">
              <button className="settings-row danger" type="button" onClick={() => setShowDeleteConfirm(true)}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /></svg>
                Delete Account
              </button>
              <p className="danger-note">This permanently removes your account and all of your data. This cannot be undone.</p>
            </div>
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>Delete account?</h2>
            <p>This permanently removes your account and all of your data. This cannot be undone.</p>
            <div className="modal-buttons">
              <button className="modal-btn cancel" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="modal-btn delete" onClick={handleDeleteAccount}>Yes, delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Goodbye Modal */}
      {showGoodbye && (
        <div className="modal-overlay">
          <div className="modal-box goodbye">
            <span className="medallion goodbye-mark" aria-hidden="true"></span>
            <h2>Thank you for being with us</h2>
            <p>Your account has been removed. You are always welcome back.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
