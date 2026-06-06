import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPost } from '../utils/api'
import './ProfileSetup.css'

const SETUP_ICONS = {
  diabetes: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c3 4 5 6.5 5 9a5 5 0 0 1-10 0c0-2.5 2-5 5-9z"/></svg>),
  hypertension: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 13a8 8 0 0 1 16 0"/><path d="M12 13l3.5-3.5"/><circle cx="12" cy="13" r="1.1"/></svg>),
  cholesterol: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20s-7-4.5-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.5-7 9-7 9z"/></svg>),
  arthritis: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="2.4"/><circle cx="16" cy="16" r="2.4"/><path d="M10 10l4 4"/></svg>),
  heart_disease: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20s-7-4.5-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.5-7 9-7 9z"/><path d="M7.5 12h2l1.5-2.5 2 5 1.5-2.5h2"/></svg>),
  osteoporosis: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6a2 2 0 1 0-2.6 1.9c.7.3 1.1 1 1.1 1.7v4.8c0 .7-.4 1.4-1.1 1.7A2 2 0 1 0 8 18a2 2 0 1 0 2.6 1.9 2 2 0 0 0 2.8 0A2 2 0 1 0 16 18a2 2 0 1 0 1.6-2.9c-.7-.3-1.1-1-1.1-1.7V8.6c0-.7.4-1.4 1.1-1.7A2 2 0 1 0 16 6a2 2 0 1 0-2.6-1.9 2 2 0 0 0-2.8 0A2 2 0 1 0 8 6z"/></svg>),
  back_pain: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"/><path d="M9 6h6M9 10h6M9 14h6M9 18h6"/></svg>),
  obesity: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v15M5 19h14"/><path d="M12 6l-6 2M12 6l6 2"/><path d="M3 13a3 3 0 0 0 6 0M15 13a3 3 0 0 0 6 0"/></svg>),
  none: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg>),
  beginner: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21v-7"/><path d="M12 14c-3 0-5-2-5-5 3 0 5 2 5 5z"/><path d="M12 12c0-2.4 1.8-4 4.2-4-.2 2.4-1.8 4-4.2 4z"/></svg>),
  intermediate: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21V8"/><path d="M12 12c-3.2 0-5.5-2.3-5.5-5.5C9.7 6.5 12 8.8 12 12z"/><path d="M12 10c0-2.8 2-5 4.8-5C16.8 7.8 14.8 10 12 10z"/></svg>),
  advanced: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21v-6"/><path d="M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"/><path d="M9 9l3 3 3-3"/></svg>),
  weight_loss: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="15" cy="14" r="6.3"/><circle cx="15" cy="14" r="2.7"/><path d="M10.2 10 4.4 4.6"/><path d="M12.1 8.3 6.3 2.9"/><path d="M4.4 4.6 3.3 3.4 5.2 1.7 6.3 2.9"/><path d="M8.2 8.1l1.1-1M6.6 6.65l1.1-1"/></svg>),
  strength: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9.5v5M6.5 7v10M17.5 7v10M20 9.5v5M6.5 12h11"/></svg>),
  flexibility: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="4.5" r="1.8"/><path d="M12 7c-3 2-5 5-5 9"/><path d="M12 7c3 2 5 5 5 9"/></svg>),
  balance: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 18h16"/><path d="M12 18l-3.5-8h7z"/><path d="M3 12h6M15 12h6"/></svg>),
  endurance: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h4l2-6 4 13 2-7h6"/></svg>),
  pain_relief: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4-3 7-7 9-4-2-7-5-7-9V6z"/><path d="M12 9v6M9 12h6"/></svg>),
  mobility: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="13" cy="4.5" r="1.8"/><path d="M13 7l-1.5 5 2.5 2.5 1 5"/><path d="M11.5 12L8 13"/><path d="M14 14.5l3.5-1"/></svg>),
  energy: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M13 3L5 13h5l-1 8 8-11h-5z"/></svg>),
}

function ProfileSetup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: localStorage.getItem('userName') || '',
    age: '',
    gender: '',
    height: '',
    heightUnit: 'cm',
    weight: '',
    weightUnit: 'kg',
    healthConditions: [],
    customCondition: '',
    fitnessLevel: '',
    goals: [],
    customGoal: ''
  })

  const healthConditionOptions = [
    { id: 'diabetes', label: 'Diabetes', emoji: '🩸' },
    { id: 'hypertension', label: 'High Blood Pressure', emoji: '❤️' },
    { id: 'cholesterol', label: 'High Cholesterol', emoji: '🫀' },
    { id: 'arthritis', label: 'Arthritis', emoji: '🦴' },
    { id: 'heart_disease', label: 'Heart Disease', emoji: '💗' },
    { id: 'osteoporosis', label: 'Osteoporosis', emoji: '��' },
    { id: 'back_pain', label: 'Back Pain', emoji: '🩻' },
    { id: 'obesity', label: 'Obesity', emoji: '⚖️' },
    { id: 'none', label: 'None of the above', emoji: '✅' }
  ]

  const fitnessLevelOptions = [
    { id: 'beginner', label: 'Beginner', desc: 'New to exercise or returning after a long break', emoji: '🌱' },
    { id: 'intermediate', label: 'Intermediate', desc: 'Exercise occasionally, some experience', emoji: '🌿' },
    { id: 'advanced', label: 'Advanced', desc: 'Exercise regularly, good fitness base', emoji: '🌳' }
  ]

  const goalOptions = [
    { id: 'weight_loss', label: 'Lose Weight', emoji: '⚖️' },
    { id: 'strength', label: 'Build Strength', emoji: '💪' },
    { id: 'flexibility', label: 'Improve Flexibility', emoji: '🧘' },
    { id: 'balance', label: 'Better Balance', emoji: '🎯' },
    { id: 'endurance', label: 'Increase Endurance', emoji: '🏃' },
    { id: 'pain_relief', label: 'Reduce Pain', emoji: '🩹' },
    { id: 'mobility', label: 'Improve Mobility', emoji: '🚶' },
    { id: 'energy', label: 'More Energy', emoji: '⚡' }
  ]

  const calculateBMI = () => {
    let heightM = parseFloat(formData.height)
    let weightKg = parseFloat(formData.weight)
    if (formData.heightUnit === 'ft') heightM = heightM * 0.3048
    else heightM = heightM / 100
    if (formData.weightUnit === 'lbs') weightKg = weightKg * 0.453592
    if (heightM > 0 && weightKg > 0) return (weightKg / (heightM * heightM)).toFixed(1)
    return null
  }

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { label: 'Underweight', color: '#9fb4cc' }
    if (bmi < 25) return { label: 'Normal', color: '#8fc99b' }
    if (bmi < 30) return { label: 'Overweight', color: '#e0b964' }
    return { label: 'Obese', color: '#e08274' }
  }

  const toggleCondition = (id) => {
    if (id === 'none') {
      setFormData({ ...formData, healthConditions: ['none'] })
    } else {
      const conditions = formData.healthConditions.filter(c => c !== 'none')
      if (conditions.includes(id)) {
        setFormData({ ...formData, healthConditions: conditions.filter(c => c !== id) })
      } else {
        setFormData({ ...formData, healthConditions: [...conditions, id] })
      }
    }
  }

  const toggleGoal = (id) => {
    if (formData.goals.includes(id)) {
      setFormData({ ...formData, goals: formData.goals.filter(g => g !== id) })
    } else {
      setFormData({ ...formData, goals: [...formData.goals, id] })
    }
  }

  const addCustomCondition = () => {
    if (formData.customCondition.trim()) {
      setFormData({
        ...formData,
        healthConditions: [...formData.healthConditions.filter(c => c !== 'none'), formData.customCondition.trim()],
        customCondition: ''
      })
    }
  }

  const addCustomGoal = () => {
    if (formData.customGoal.trim()) {
      setFormData({ ...formData, goals: [...formData.goals, formData.customGoal.trim()], customGoal: '' })
    }
  }

  const nextStep = () => {
    setError('')
    if (step === 1 && (!formData.name || !formData.age || !formData.gender || parseInt(formData.age) < 55 || parseInt(formData.age) > 95)) { setError('Please fill in all fields. Age must be between 55-95.'); return }
    if (step === 2 && (!formData.height || !formData.weight)) { setError('Please enter your height and weight'); return }
    if (step === 3 && formData.healthConditions.length === 0) { setError('Please select at least one option'); return }
    if (step === 4 && !formData.fitnessLevel) { setError('Please select your fitness level'); return }
    if (step === 5 && formData.goals.length === 0) { setError('Please select at least one goal'); return }
    setStep(step + 1)
  }

  const prevStep = () => { setError(''); setStep(step - 1) }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    const userId = localStorage.getItem('userId')
    if (!userId) { setError('User not logged in'); setLoading(false); return }

    try {
      const profileData = {
        user_id: userId,
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        height: parseFloat(formData.height),
        height_unit: formData.heightUnit,
        weight: parseFloat(formData.weight),
        weight_unit: formData.weightUnit,
        bmi: calculateBMI(),
        health_conditions: formData.healthConditions,
        fitness_level: formData.fitnessLevel,
        goals: formData.goals,
        created_at: new Date().toISOString()
      }

      const response = await apiPost('/profile', profileData)

      if (response.ok) {
        localStorage.setItem('userName', formData.name)
        localStorage.setItem('profileComplete', 'true')
        navigate('/workout')
      } else {
        throw new Error('Failed to save profile')
      }
    } catch (err) {
      setError('Failed to save profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const bmi = calculateBMI()
  const bmiCategory = bmi ? getBMICategory(parseFloat(bmi)) : null

  return (
    <div className="setup-page">
      <div className="setup-container">
        <div className="setup-header">
          <h1><span className="brand-old">Old</span> <span className="brand-gold">Is Gold</span></h1>
          <div className="step-circles">
            {[1, 2, 3, 4, 5].map(s => (
              <div key={s} className={`step-circle ${step > s ? 'completed' : ''} ${step === s ? 'active' : ''}`}>
                {step > s ? '✓' : s}
              </div>
            ))}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="setup-card">
          {step === 1 && (
            <div className="step-content">
              <h2>Let's get to know you</h2>
              <p className="step-description">Basic information to personalize your experience</p>
              
              <div className="form-group">
                <label>Your Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter your full name" className="form-input" />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Age</label>
                  <input type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} placeholder="55-95" className="form-input" min="55" max="95" />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="form-select">
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-content">
              <h2>Your Measurements</h2>
              <p className="step-description">We'll calculate your BMI to personalize workouts</p>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Height</label>
                  <div className="input-with-unit">
                    <input type="number" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} placeholder="165" className="form-input" />
                    <select value={formData.heightUnit} onChange={(e) => setFormData({ ...formData, heightUnit: e.target.value })} className="unit-select">
                      <option value="cm">cm</option>
                      <option value="ft">ft</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Weight</label>
                  <div className="input-with-unit">
                    <input type="number" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} placeholder="70" className="form-input" />
                    <select value={formData.weightUnit} onChange={(e) => setFormData({ ...formData, weightUnit: e.target.value })} className="unit-select">
                      <option value="kg">kg</option>
                      <option value="lbs">lbs</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {bmi && (
                <div className="bmi-result">
                  <span className="bmi-label">Your BMI</span>
                  <span className="bmi-value" style={{ color: bmiCategory.color }}>{bmi}</span>
                  <span className="bmi-category" style={{ background: bmiCategory.color }}>{bmiCategory.label}</span>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="step-content">
              <h2>Health Conditions</h2>
              <p className="step-description">Select any conditions so we can adjust exercises for safety</p>
              
              <div className="condition-grid">
                {healthConditionOptions.map(condition => (
                  <button key={condition.id} className={`condition-card ${formData.healthConditions.includes(condition.id) ? 'selected' : ''}`} onClick={() => toggleCondition(condition.id)}>
                    <span className="condition-emoji">{SETUP_ICONS[condition.id]}</span>
                    <span className="condition-label">{condition.label}</span>
                  </button>
                ))}
              </div>
              
              <div className="custom-input-row">
                <input type="text" value={formData.customCondition} onChange={(e) => setFormData({ ...formData, customCondition: e.target.value })} placeholder="Other condition..." className="form-input" />
                <button className="add-btn" onClick={addCustomCondition}>Add</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="step-content">
              <h2>Fitness Level</h2>
              <p className="step-description">How would you describe your current activity level?</p>
              
              <div className="fitness-options">
                {fitnessLevelOptions.map(level => (
                  <button key={level.id} className={`fitness-card ${formData.fitnessLevel === level.id ? 'selected' : ''}`} onClick={() => setFormData({ ...formData, fitnessLevel: level.id })}>
                    <span className="fitness-emoji">{SETUP_ICONS[level.id]}</span>
                    <div className="fitness-info">
                      <span className="fitness-label">{level.label}</span>
                      <span className="fitness-desc">{level.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="step-content">
              <h2>Your Goals</h2>
              <p className="step-description">What would you like to achieve? Select all that apply.</p>
              
              <div className="goals-grid">
                {goalOptions.map(goal => (
                  <button key={goal.id} className={`goal-card ${formData.goals.includes(goal.id) ? 'selected' : ''}`} onClick={() => toggleGoal(goal.id)}>
                    <span className="goal-emoji">{SETUP_ICONS[goal.id]}</span>
                    <span className="goal-label">{goal.label}</span>
                  </button>
                ))}
              </div>
              
              <div className="custom-input-row">
                <input type="text" value={formData.customGoal} onChange={(e) => setFormData({ ...formData, customGoal: e.target.value })} placeholder="Add custom goal..." className="form-input" />
                <button className="add-btn" onClick={addCustomGoal}>Add</button>
              </div>
            </div>
          )}

          <div className="setup-footer">
            {step > 1 && <button className="back-btn" onClick={prevStep}>← Back</button>}
            {step < 5 ? (
              <button className="next-btn" onClick={nextStep}>Continue →</button>
            ) : (
              <button className="submit-btn" onClick={handleSubmit} disabled={loading}>{loading ? 'Saving...' : '✓ Complete Setup'}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileSetup
