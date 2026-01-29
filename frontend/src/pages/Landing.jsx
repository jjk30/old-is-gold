import { Link } from 'react-router-dom'

function Landing() {
  return (
    <div className="page">
      <div className="container">
        <div className="hero">
          <div className="hero-emoji">🌟</div>
          <h1>Old Is Gold</h1>
          <p>
            A fitness program designed just for you. 
            Simple exercises, big buttons, and workouts that respect your body.
          </p>
          <Link to="/setup" className="btn btn-primary btn-large">
            🚀 Get Started
          </Link>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">5 min</div>
            <div className="stat-label">Quick Setup</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">15 min</div>
            <div className="stat-label">Daily Workouts</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">100%</div>
            <div className="stat-label">Your Pace</div>
          </div>
        </div>

        <div className="card">
          <h2>✨ Why Old Is Gold?</h2>
          <p style={{ fontSize: '22px', lineHeight: '1.8' }}>
            <strong>Safe exercises</strong> designed for seniors with clear instructions. 
            Workouts adapt to your mobility level — whether you prefer seated exercises 
            or standing routines. Track your progress and stay motivated!
          </p>
        </div>

        <div className="card">
          <h3>🎯 What You'll Get</h3>
          <ul style={{ fontSize: '20px', lineHeight: '2', paddingLeft: '24px' }}>
            <li>Personalized workout plans based on your abilities</li>
            <li>Clear, step-by-step exercise instructions</li>
            <li>Progress tracking to celebrate your wins</li>
            <li>Big, easy-to-read interface</li>
          </ul>
        </div>

        <div className="text-center mt-lg">
          <Link to="/setup" className="btn btn-primary btn-large">
            Start Your Journey →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Landing
