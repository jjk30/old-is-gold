import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:8000'

function ProfileSetup() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    mobility_level: 'medium',
    goals: [],
    health_conditions: []
  })

  const goals = [
    { id: 'strength', label: '💪 Build Strength', icon: '💪' },
    { id: 'flexibility', label: '🧘 Improve Flexibility', icon: '🧘' },
    { id: 'balance', label: '⚖️ Better Balance', icon: '⚖️' },
    { id: 'cardio', label: '❤️ Heart Health', icon: '❤️' }
  ]

  const mobilityLevels = [
    { id: 'low', label: '🪑 Seated Exercises', description: 'I prefer to exercise while sitting' },
    { id: 'medium', label: '🚶 Light Standing', description: 'I can stand with support' },
    { id: 'high', label: '🏃 Active Movement', description: 'I can move freely' }
  ]

  const toggleGoal = (goalId) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter(g => g !== goalId)
        : [...prev.goals, goalId]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.name || !formData.age || formData.goals.length === 0) {
      setError('Please fill in your name, age, and select at least one goal.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          age: parseInt(formData.age)
        })
      })

      if (!response.ok) throw new Error('Failed to create profile')
      
      const user = await response.json()
      localStorage.setItem('userId', user.user_id)
      localStorage.setItem('userName', user.name)
      navigate('/workout')
    } catch (err) {
      setError('Could not save profile. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <nav className="nav">
        <Link to="/" className="nav-brand">🌟 Old Is Gold</Link>
      </nav>

      <div className="container">
        <h1>👋 Let's Get To Know You</h1>
        <p>We'll create a workout plan just for you. This takes about 2 minutes.</p>

        {error && <div className="alert alert-warning">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="form-group">
            <label htmlFor="name">What should we call you?</label>
            <input
              type="text"
              id="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Age */}
          <div className="form-group">
            <label htmlFor="age">Your Age</label>
            <input
              type="number"
              id="age"
              placeholder="Enter your age"
              min="50"
              max="120"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            />
          </div>

          {/* Mobility Level */}
          <div className="form-group">
            <label>How would you describe your mobility?</label>
            <div className="flex flex-col gap-md">
              {mobilityLevels.map((level) => (
                <div
                  key={level.id}
                  className={`option-card ${formData.mobility_level === level.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, mobility_level: level.id })}
                >
                  <input
                    type="radio"
                    name="mobility"
                    checked={formData.mobility_level === level.id}
                    onChange={() => {}}
                  />
                  <div>
                    <div className="option-label">{level.label}</div>
                    <div style={{ fontSize: '16px', color: '#666' }}>{level.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div className="form-group">
            <label>What are your fitness goals? (Select all that apply)</label>
            <div className="option-grid">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className={`option-card ${formData.goals.includes(goal.id) ? 'selected' : ''}`}
                  onClick={() => toggleGoal(goal.id)}
                >
                  <input
                    type="checkbox"
                    checked={formData.goals.includes(goal.id)}
                    onChange={() => {}}
                  />
                  <span className="option-label">{goal.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={loading}
          >
            {loading ? '⏳ Creating Your Plan...' : '✨ Create My Workout Plan'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ProfileSetup
