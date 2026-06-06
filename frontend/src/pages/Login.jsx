import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { auth } from '../firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { apiGet } from '../utils/api'
import logo from '../assets/logo.webp'
import './Login.css'

const googleProvider = new GoogleAuthProvider()

function Login() {
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  // Presentation-only: toggles the password input's `type` between
  // 'password' and 'text'. Does NOT touch the password value or onChange.
  const [showPassword, setShowPassword] = useState(false)

  // Returns one of: 'has' (profile exists), 'none' (genuinely no profile),
  // or 'error' (transient failure — cold start, network blip, 429, 5xx, etc.)
  const checkUserProfile = async (userId) => {
    try {
      const res = await apiGet(`/profile/${userId}`)
      if (res.ok) {
        const profile = await res.json()
        return profile && profile.user_id ? 'has' : 'none'
      }
      if (res.status === 404) {
        return 'none'
      }
      return 'error'
    } catch {
      return 'error'
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const uid = result.user.uid
      const userName = result.user.displayName || result.user.email.split('@')[0]

      localStorage.setItem('userId', uid)
      localStorage.setItem('userName', userName)

      // Check if user has a profile
      let profileState = await checkUserProfile(uid)
      if (profileState === 'error') {
        // Retry once — covers a slow first request or token settling
        await new Promise((r) => setTimeout(r, 800))
        profileState = await checkUserProfile(uid)
      }

      if (profileState === 'none') {
        navigate('/setup')
      } else {
        // 'has', or still 'error' — never dump an existing user into setup
        // on a transient failure
        localStorage.setItem('profileComplete', 'true')
        navigate('/workout')
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (isSignUp) {
      if (!allPasswordChecksPass) {
        setError('Please meet all the password requirements below.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
    }
    setLoading(true)
    try {
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password)
        localStorage.setItem('userId', result.user.uid)
        localStorage.setItem('userName', name || email.split('@')[0])
        navigate('/setup')
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password)
        localStorage.setItem('userId', result.user.uid)
        localStorage.setItem('userName', email.split('@')[0])

        // Check if user has a profile
        let profileState = await checkUserProfile(result.user.uid)
        if (profileState === 'error') {
          // Retry once — covers a slow first request or token settling
          await new Promise((r) => setTimeout(r, 800))
          profileState = await checkUserProfile(result.user.uid)
        }

        if (profileState === 'none') {
          navigate('/setup')
        } else {
          // 'has', or still 'error' — never dump an existing user into setup
          // on a transient failure
          localStorage.setItem('profileComplete', 'true')
          navigate('/workout')
        }
      }
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found. Please sign up.')
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // Live sign-up password rules — recomputed every render (i.e. every
  // keystroke) so the checklist below stays in sync with the field.
  const passwordChecks = [
    { label: 'At least 12 characters', met: password.length >= 12 },
    { label: 'At least one letter', met: /[A-Za-z]/.test(password) },
    { label: 'At least one number', met: /[0-9]/.test(password) },
    { label: 'At least one symbol (like ! ? # @)', met: /[^A-Za-z0-9]/.test(password) },
  ]
  const allPasswordChecksPass = passwordChecks.every(c => c.met)

  // Expose the extracted logo asset to CSS so .medallion can paint it
  // (same pattern Landing uses; lets Vite hash the asset).
  const pageStyle = { '--logo': `url(${logo})` }

  return (
    <div className="login-page" style={pageStyle}>
      <div className="login-container reveal">
        {/* Brand: round coin medallion above the wordmark, linking home. */}
        <Link to="/" className="login-brand">
          <span className="medallion brand-mark" aria-hidden="true"></span>
          <span className="wordmark">Old <span className="gold">Is&nbsp;Gold</span></span>
        </Link>

        <div className="login-card">
          <h1 className="login-title">{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
          <p className="login-subtitle">{isSignUp ? 'Start your fitness journey today.' : 'Continue your fitness journey.'}</p>

          {error && <div className="error-message" role="alert">{error}</div>}

          <button className="btn-google" onClick={handleGoogleSignIn} disabled={loading}>
            <span className="g-tile" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </span>
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          <div className="divider"><span>or</span></div>

          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <div className="form-group">
                <label htmlFor="login-name">Your Name</label>
                <input id="login-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" className="form-input" />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="form-input" required />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              {/* Wrapper positions the eye toggle inside the field. */}
              <div className="password-field">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="form-input"
                  required
                  minLength={6}
                />
                {/* Presentation-only show/hide toggle. Flips input type only;
                    never changes the password value or submit logic. */}
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <path d="M1 1l22 22" />
                    </svg>
                  )}
                </button>
              </div>
              {isSignUp && (
                <div className="reqs">
                  {passwordChecks.map((c, i) => (
                    <div key={i} className={`req ${c.met ? 'met' : ''}`}>
                      <span className="ic">
                        {c.met && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4 4 10-10" /></svg>
                        )}
                      </span>
                      {c.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {isSignUp && (
              <div className="form-group">
                <label htmlFor="login-confirm">Confirm Password</label>
                <div className="password-field">
                  <input
                    id="login-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="form-input"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showConfirmPassword}
                  >
                    {showConfirmPassword ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><path d="M1 1l22 22" /></svg>
                    )}
                  </button>
                </div>
              </div>
            )}
            <button type="submit" className="btn-primary btn-full" disabled={loading}>
              {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="login-switch">
            {isSignUp ? (
              <p>Already have an account? <button type="button" onClick={() => setIsSignUp(false)}>Sign In</button></p>
            ) : (
              <p>Don't have an account? <button type="button" onClick={() => setIsSignUp(true)}>Sign Up</button></p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
