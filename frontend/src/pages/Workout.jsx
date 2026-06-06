import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { searchExerciseVideo } from '../utils/youtubeApi'
import { apiGet, apiPost } from '../utils/api'
import logo from '../assets/logo.webp'
import FoodIcon, { DefaultFoodIcon } from '../components/FoodIcon'
import './Workout.css'

const getLocalDateString = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const EXERCISE_CALORIES = {
  "Seated Arm Raises": 15, "Ankle Circles": 8, "Seated Marching": 20,
  "Neck Stretches": 5, "Wrist Rotations": 5, "Standing Leg Raises": 25,
  "Wall Push-ups": 30, "Heel-to-Toe Walk": 20, "Seated Twists": 15,
  "Calf Raises": 25, "Squats with Chair": 40, "Standing Marches": 35,
  "Side Steps": 30, "Arm Circles": 20, "Standing Balance": 15
}

const FOOD_DATABASE = {
  'chicken': { calories: 165, protein: 31, carbs: 0, fat: 4, unit: 'g', icon: '🍗' },
  'beef': { calories: 250, protein: 26, carbs: 0, fat: 15, unit: 'g', icon: '🥩' },
  'fish': { calories: 136, protein: 20, carbs: 0, fat: 6, unit: 'g', icon: '🐟' },
  'salmon': { calories: 208, protein: 20, carbs: 0, fat: 13, unit: 'g', icon: '🐟' },
  'tuna': { calories: 130, protein: 29, carbs: 0, fat: 1, unit: 'g', icon: '🐟' },
  'shrimp': { calories: 85, protein: 18, carbs: 0, fat: 1, unit: 'g', icon: '🦐' },
  'pork': { calories: 242, protein: 27, carbs: 0, fat: 14, unit: 'g', icon: '🥓' },
  'turkey': { calories: 135, protein: 30, carbs: 0, fat: 1, unit: 'g', icon: '🦃' },
  'lamb': { calories: 294, protein: 25, carbs: 0, fat: 21, unit: 'g', icon: '🍖' },
  'tofu': { calories: 76, protein: 8, carbs: 2, fat: 5, unit: 'g', icon: '🧈' },
  'egg': { calories: 78, protein: 6, carbs: 1, fat: 5, unit: 'piece', defaultAmount: 1, icon: '🥚' },
  'boiled egg': { calories: 78, protein: 6, carbs: 1, fat: 5, unit: 'piece', defaultAmount: 1, icon: '🥚' },
  'fried egg': { calories: 90, protein: 6, carbs: 1, fat: 7, unit: 'piece', defaultAmount: 1, icon: '🍳' },
  'scrambled egg': { calories: 91, protein: 6, carbs: 1, fat: 7, unit: 'piece', defaultAmount: 1, icon: '🍳' },
  'omelette': { calories: 154, protein: 11, carbs: 1, fat: 12, unit: 'piece', defaultAmount: 1, icon: '🍳' },
  'rice': { calories: 130, protein: 3, carbs: 28, fat: 0, unit: 'g', icon: '🍚' },
  'white rice': { calories: 130, protein: 3, carbs: 28, fat: 0, unit: 'g', icon: '🍚' },
  'brown rice': { calories: 112, protein: 3, carbs: 24, fat: 1, unit: 'g', icon: '🍚' },
  'bread': { calories: 79, protein: 3, carbs: 15, fat: 1, unit: 'slice', defaultAmount: 1, icon: '🍞' },
  'toast': { calories: 79, protein: 3, carbs: 15, fat: 1, unit: 'slice', defaultAmount: 1, icon: '🍞' },
  'pasta': { calories: 131, protein: 5, carbs: 25, fat: 1, unit: 'g', icon: '🍝' },
  'noodles': { calories: 138, protein: 5, carbs: 25, fat: 2, unit: 'g', icon: '🍜' },
  'potato': { calories: 77, protein: 2, carbs: 17, fat: 0, unit: 'g', icon: '🥔' },
  'sweet potato': { calories: 86, protein: 2, carbs: 20, fat: 0, unit: 'g', icon: '🍠' },
  'oatmeal': { calories: 68, protein: 2, carbs: 12, fat: 1, unit: 'g', icon: '🥣' },
  'chapati': { calories: 120, protein: 3, carbs: 18, fat: 4, unit: 'piece', defaultAmount: 1, icon: '🫓' },
  'roti': { calories: 120, protein: 3, carbs: 18, fat: 4, unit: 'piece', defaultAmount: 1, icon: '🫓' },
  'paratha': { calories: 260, protein: 5, carbs: 30, fat: 13, unit: 'piece', defaultAmount: 1, icon: '🫓' },
  'dosa': { calories: 133, protein: 4, carbs: 19, fat: 5, unit: 'piece', defaultAmount: 1, icon: '🫓' },
  'idli': { calories: 39, protein: 2, carbs: 8, fat: 0, unit: 'piece', defaultAmount: 2, icon: '🥟' },
  'apple': { calories: 95, protein: 0, carbs: 25, fat: 0, unit: 'piece', defaultAmount: 1, icon: '🍎' },
  'banana': { calories: 105, protein: 1, carbs: 27, fat: 0, unit: 'piece', defaultAmount: 1, icon: '🍌' },
  'orange': { calories: 62, protein: 1, carbs: 15, fat: 0, unit: 'piece', defaultAmount: 1, icon: '🍊' },
  'mango': { calories: 150, protein: 1, carbs: 35, fat: 1, unit: 'piece', defaultAmount: 1, icon: '🥭' },
  'milk': { calories: 61, protein: 3, carbs: 5, fat: 3, unit: 'ml', icon: '🥛' },
  'cheese': { calories: 402, protein: 25, carbs: 1, fat: 33, unit: 'g', icon: '🧀' },
  'yogurt': { calories: 59, protein: 10, carbs: 4, fat: 0, unit: 'g', icon: '🥛' },
  'paneer': { calories: 265, protein: 18, carbs: 1, fat: 21, unit: 'g', icon: '🧀' },
  'coffee': { calories: 2, protein: 0, carbs: 0, fat: 0, unit: 'cup', defaultAmount: 1, icon: '☕' },
  'tea': { calories: 2, protein: 0, carbs: 0, fat: 0, unit: 'cup', defaultAmount: 1, icon: '🍵' },
  'sandwich': { calories: 250, protein: 10, carbs: 30, fat: 10, unit: 'piece', defaultAmount: 1, icon: '🥪' },
  'burger': { calories: 354, protein: 17, carbs: 29, fat: 19, unit: 'piece', defaultAmount: 1, icon: '🍔' },
  'pizza': { calories: 266, protein: 11, carbs: 33, fat: 10, unit: 'slice', defaultAmount: 1, icon: '🍕' },
  'biryani': { calories: 200, protein: 8, carbs: 25, fat: 8, unit: 'g', icon: '🍛' },
  'dal': { calories: 104, protein: 7, carbs: 18, fat: 1, unit: 'g', icon: '🥘' },
  'samosa': { calories: 262, protein: 4, carbs: 24, fat: 17, unit: 'piece', defaultAmount: 1, icon: '🥟' },
  'nuts': { calories: 607, protein: 20, carbs: 21, fat: 54, unit: 'g', icon: '🥜' },
  'chocolate': { calories: 546, protein: 5, carbs: 60, fat: 31, unit: 'g', icon: '🍫' },
}

const MEAL_TYPES = [
  { id: 'breakfast', name: 'Breakfast', icon: '🌅' },
  { id: 'lunch', name: 'Lunch', icon: '☀️' },
  { id: 'dinner', name: 'Dinner', icon: '🌙' },
  { id: 'snack', name: 'Snack', icon: '🍪' },
]

const YouTubeIcon = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>

// Small line-icons for the workout view. stroke=currentColor so each inherits
// its gold coin / text color; CSS sets a fixed pixel size (never width 100%).
const LineIcon = ({ d, className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: d }} />
)
const FlameIcon = (p) => <LineIcon {...p} d='<path d="M12 3c1.2 3 4 4.2 4 7.2a4 4 0 0 1-8 0c0-1.1.5-2.1 1.1-2.8C10.2 6.6 11.3 4.8 12 3z"/>' />
const ClockIcon = (p) => <LineIcon {...p} d='<circle cx="12" cy="12" r="8.2"/><path d="M12 7.6V12l3 1.8"/>' />
const CheckIcon = (p) => <LineIcon {...p} d='<path d="M5 12.5l4.5 4.5L19 7.5"/>' />
const RepeatIcon = (p) => <LineIcon {...p} d='<path d="M4 9.5a5 5 0 0 1 5-5h6M20 14.5a5 5 0 0 1-5 5H9"/><path d="M14 1.5l3 3-3 3M10 22.5l-3-3 3-3"/>' />
const WarnIcon = (p) => <LineIcon {...p} d='<path d="M12 4.5 21 20H3z"/><path d="M12 10.5v4M12 17.4h.01"/>' />
const XIcon = (p) => <LineIcon {...p} d='<path d="M6 6l12 12M18 6 6 18"/>' />

const LazyYouTube = ({ exerciseName }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoData, setVideoData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { searchExerciseVideo(exerciseName).then(d => { setVideoData(d); setLoading(false) }) }, [exerciseName])
  if (loading) return <div className="video-loading"><div className="spinner"></div></div>
  if (!isPlaying) return <div className="video-thumbnail" onClick={() => setIsPlaying(true)}><img src={videoData.thumbnail} alt={exerciseName} /><div className="play-overlay"><div className="play-button"><svg viewBox="0 0 68 48" width="68" height="48"><path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#f00"/><path d="M 45,24 27,14 27,34" fill="#fff"/></svg></div></div></div>
  return <iframe src={`https://www.youtube.com/embed/${videoData.videoId}?autoplay=1`} title={exerciseName} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
}

function Workout() {
  const navigate = useNavigate()
  const [plan, setPlan] = useState(null)
  const [completedExercises, setCompletedExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedVideo, setExpandedVideo] = useState(null)
  
  const [screen, setScreen] = useState('meals')
  const [step, setStep] = useState(1)
  const [meals, setMeals] = useState([])
  const [mealType, setMealType] = useState('breakfast')
  const [searchText, setSearchText] = useState('')
  const [pickedFood, setPickedFood] = useState(null)
  const [qty, setQty] = useState('')

  const userName = localStorage.getItem('userName') || 'Friend'
  const userId = localStorage.getItem('userId')

  useEffect(() => {
    if (!userId) { navigate('/setup'); return }
    apiGet(`/plans/${userId}`).then(r => r.ok ? r.json() : null).then(setPlan).finally(() => setLoading(false))
  }, [userId, navigate])

  const suggestions = step === 1 && searchText.trim().length > 0
    ? Object.entries(FOOD_DATABASE).filter(([k]) => k.includes(searchText.toLowerCase())).slice(0, 5).map(([n, d]) => ({ name: n, ...d }))
    : []

  const selectFood = (food) => {
    setPickedFood(food)
    setQty(food.defaultAmount?.toString() || (food.unit === 'g' || food.unit === 'ml' ? '100' : '1'))
    setSearchText('')
    setStep(2)
  }

  const goBackToSearch = () => { setPickedFood(null); setQty(''); setStep(1) }

  const calcNutrition = () => {
    if (!pickedFood) return null
    const amount = parseFloat(qty) || 1
    const mult = (pickedFood.unit === 'g' || pickedFood.unit === 'ml') ? amount / 100 : amount
    return { calories: Math.round(pickedFood.calories * mult), protein: Math.round(pickedFood.protein * mult), carbs: Math.round(pickedFood.carbs * mult), fat: Math.round(pickedFood.fat * mult), amount }
  }

  const nutrition = calcNutrition()

  const addMealToList = () => {
    if (!pickedFood || !nutrition) return
    setMeals([...meals, { type: mealType, food: pickedFood.name, amount: `${nutrition.amount} ${pickedFood.unit}`, icon: pickedFood.icon, calories: nutrition.calories, protein: nutrition.protein, carbs: nutrition.carbs, fat: nutrition.fat }])
    setPickedFood(null); setQty(''); setStep(1)
  }

  const removeMeal = (i) => setMeals(meals.filter((_, j) => j !== i))

  const saveMealsAndGo = async () => {
    if (meals.length === 0) {
      setScreen('workout')
      return
    }
    
    setSaving(true)
    const localDate = getLocalDateString()
    
    for (const m of meals) {
      const payload = {
        user_id: userId,
        date: localDate,
        meal_type: m.type,
        food: m.food,
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat
      }
      
      try {
        await apiPost('/nutrition', payload)
      } catch (error) {
        console.error('Error saving meal:', error)
      }
    }
    
    setSaving(false)
    setScreen('workout')
  }

  const totals = meals.reduce((a, m) => ({ calories: a.calories + m.calories, protein: a.protein + m.protein, carbs: a.carbs + m.carbs, fat: a.fat + m.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const toggleEx = (i) => setCompletedExercises(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])
  const getCal = (n) => EXERCISE_CALORIES[n] || 15
  const burned = plan?.exercises?.reduce((t, e, i) => completedExercises.includes(i) ? t + getCal(e.name) : t, 0) || 0
  const prog = plan?.exercises ? Math.round((completedExercises.length / plan.exercises.length) * 100) : 0

  const finishWorkout = async () => {
    setSaving(true)
    const localDate = getLocalDateString()
    
    try {
      await apiPost('/progress', {
        user_id: userId,
        date: localDate,
        type: 'workout',
        workout_completed: true,
        exercises_completed: completedExercises.length,
        total_exercises: plan?.exercises?.length || 0,
        duration: plan?.duration_minutes || 15,
        calories_burned: burned,
        exercises: plan?.exercises?.filter((_, i) => completedExercises.includes(i)).map(e => e.name)
      })
    } catch (error) {
      console.error('Error saving workout:', error)
    }
    
    setSaving(false)
    navigate('/progress')
  }

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>

  if (screen === 'meals') {
    return (
      <div className="workout-page log-meals" style={{ '--logo': `url(${logo})` }}>
        {/* Brand header: coin medallion + wordmark (same medallion pattern as Landing). */}
        <header className="workout-header">
          <div className="header-content">
            <Link to="/" className="brand">
              <span className="medallion brand-mark" aria-hidden="true"></span>
              <span className="wordmark">Old <span className="gold">Is&nbsp;Gold</span></span>
            </Link>
            <nav className="header-nav">
              <Link to="/workout" className="nav-link active">Today</Link>
              <Link to="/nutrition" className="nav-link">Nutrition</Link>
              <Link to="/progress" className="nav-link">Progress</Link>
            </nav>
          </div>
        </header>
        <main className="workout-main">
          <div className="container">
            {/* Heading: fork-and-knife default icon in a gold coin, then title + subtitle. */}
            <div className="meal-header">
              <span className="meal-heading-coin food-coin" aria-hidden="true"><DefaultFoodIcon /></span>
              <h1>Log your meals</h1>
              <p>Tell us what you ate and we'll estimate the nutrition</p>
            </div>
            <div className="meal-type-section">
              <label>Meal Type</label>
              <div className="meal-type-buttons">
                {MEAL_TYPES.map(t => <button key={t.id} className={`meal-type-btn ${mealType === t.id ? 'active' : ''}`} onClick={() => setMealType(t.id)}><span>{t.name}</span></button>)}
              </div>
            </div>
            <div className="food-input-card">
              {step === 1 && (
                <div className="step-search">
                  <label>What did you eat?</label>
                  <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Type to search... egg, rice, chicken" className="form-input" autoComplete="off" />
                  {suggestions.length > 0 && (
                    <div className="suggestions-box">
                      {suggestions.map((s, i) => (
                        <button key={i} className="sug-btn" onClick={() => selectFood(s)}>
                          <span className="sug-icon food-coin" aria-hidden="true"><FoodIcon name={s.name} /></span>
                          <span className="sug-name">{s.name}</span>
                          <span className="sug-cal">{s.calories} cal/{s.unit}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {step === 2 && pickedFood && (
                <div className="step-amount">
                  <div className="picked-header">
                    <div className="picked-info"><span className="picked-icon food-coin" aria-hidden="true"><FoodIcon name={pickedFood.name} /></span><span className="picked-name">{pickedFood.name}</span></div>
                    <button className="back-btn" onClick={goBackToSearch}>Change</button>
                  </div>
                  <div className="qty-section">
                    <label>How many {pickedFood.unit}s?</label>
                    <div className="qty-row">
                      <input type="number" value={qty} onChange={e => setQty(e.target.value)} className="form-input qty-input" autoFocus />
                      <span className="unit-pill">{pickedFood.unit}</span>
                    </div>
                  </div>
                  {nutrition && (
                    <div className="nut-grid">
                      <div className="nut-box cal"><div className="nut-val">{nutrition.calories}</div><div className="nut-lbl">Calories</div></div>
                      <div className="nut-box pro"><div className="nut-val">{nutrition.protein}g</div><div className="nut-lbl">Protein</div></div>
                      <div className="nut-box carb"><div className="nut-val">{nutrition.carbs}g</div><div className="nut-lbl">Carbs</div></div>
                      <div className="nut-box fat"><div className="nut-val">{nutrition.fat}g</div><div className="nut-lbl">Fat</div></div>
                    </div>
                  )}
                </div>
              )}
              <button className="btn btn-primary add-meal-btn" onClick={addMealToList} disabled={step !== 2 || !pickedFood}>Add to Meals</button>
            </div>
            {meals.length > 0 && (
              <div className="meals-summary">
                <h3>Today's Meals</h3>
                {meals.map((m, i) => (
                  <div key={i} className="meal-row">
                    <span className="mr-icon food-coin" aria-hidden="true"><FoodIcon name={m.food} /></span>
                    <div className="mr-info"><strong>{m.food}</strong><span>{MEAL_TYPES.find(t => t.id === m.type)?.name} • {m.amount}</span></div>
                    <div className="mr-nut"><span className="mr-cal">{m.calories} cal</span><span className="mr-mac">P:{m.protein}g C:{m.carbs}g F:{m.fat}g</span></div>
                    <button className="mr-del" onClick={() => removeMeal(i)} aria-label={`Remove ${m.food}`}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
                    </button>
                  </div>
                ))}
                <div className="totals-bar">
                  <span>Total:</span>
                  <span className="tot-cal">{totals.calories} cal</span>
                  <span className="tot-mac">P:{totals.protein}g C:{totals.carbs}g F:{totals.fat}g</span>
                </div>
              </div>
            )}
            <div className="meal-actions">
              <button className="btn btn-secondary" onClick={() => setScreen('workout')}>Skip</button>
              <button className="btn btn-primary" onClick={saveMealsAndGo} disabled={saving}>{saving ? 'Saving...' : 'Continue to Workout'}</button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="workout-page workout-screen" style={{ '--logo': `url(${logo})` }}>
      {/* Brand header: coin medallion + wordmark (same medallion pattern as Landing). */}
      <header className="workout-header">
        <div className="header-content">
          <Link to="/" className="brand">
            <span className="medallion brand-mark" aria-hidden="true"></span>
            <span className="wordmark">Old <span className="gold">Is&nbsp;Gold</span></span>
          </Link>
          <nav className="header-nav">
            <Link to="/workout" className="nav-link active">Today</Link>
            <Link to="/nutrition" className="nav-link">Nutrition</Link>
            <Link to="/progress" className="nav-link">Progress</Link>
          </nav>
        </div>
      </header>
      <main className="workout-main">
        <div className="container">
          <div className="welcome-section"><h1>Hello, {userName}</h1><p>Here's your workout for today.</p></div>
          {/* Stat cards: dark coin + line icon, value, muted label (no emoji). */}
          <div className="stats-row">
            <div className="mini-stat-card"><span className="stat-coin" aria-hidden="true"><FlameIcon /></span><div><span className="mini-stat-value">{burned}</span><span className="mini-stat-label">Burned</span></div></div>
            <div className="mini-stat-card"><span className="stat-coin" aria-hidden="true"><ClockIcon /></span><div><span className="mini-stat-value">{plan?.duration_minutes || 15}</span><span className="mini-stat-label">Minutes</span></div></div>
            <div className="mini-stat-card"><span className="stat-coin" aria-hidden="true"><CheckIcon /></span><div><span className="mini-stat-value">{completedExercises.length}/{plan?.exercises?.length || 0}</span><span className="mini-stat-label">Done</span></div></div>
          </div>
          <div className="progress-card"><div className="progress-header"><div><h2>Today's Progress</h2><p>{completedExercises.length} of {plan?.exercises?.length || 0} exercises</p></div><div className="progress-percentage">{prog}%</div></div><div className="progress-bar"><div className="progress-fill" style={{ width: `${prog}%` }}></div></div></div>
          {/* Safety strip: quiet gold-tinted banner with the warn icon (no emoji). */}
          <div className="alert alert-warning"><span className="safety-icon" aria-hidden="true"><WarnIcon /></span><div><strong>Safety First</strong><p>Listen to your body. Stop if you feel pain.</p></div></div>
          <div className="exercises-section">
            <h2>Your Exercises</h2>
            <div className="exercises-list">
              {plan?.exercises?.map((ex, i) => (
                <div key={i} className={`exercise-card ${completedExercises.includes(i) ? 'completed' : ''} ${expandedVideo === i ? 'expanded' : ''}`}>
                  <div className="exercise-main">
                    <div className="exercise-left" onClick={() => toggleEx(i)}>
                      <div className="exercise-checkbox">{completedExercises.includes(i) ? <CheckIcon className="check-icon" /> : null}</div>
                      <div className="exercise-content"><h3>{ex.name}</h3><p className="exercise-details"><span><RepeatIcon /> {ex.reps}</span><span><ClockIcon /> {ex.duration}</span><span className="calories">{getCal(ex.name)} cal</span></p><p className="exercise-instructions">{ex.instructions}</p></div>
                    </div>
                    <button className={`youtube-btn ${expandedVideo === i ? 'active' : ''}`} onClick={() => setExpandedVideo(expandedVideo === i ? null : i)}>{expandedVideo === i ? <><XIcon className="yt-hide-icon" /><span>Hide</span></> : <><YouTubeIcon /><span className="yt-text"><span className="yt-label">Tutorial</span><span className="yt-sub">Watch</span></span></>}</button>
                  </div>
                  {expandedVideo === i && <div className="exercise-video"><LazyYouTube exerciseName={ex.name} /></div>}
                </div>
              ))}
            </div>
          </div>
          {completedExercises.length > 0 && <div className="finish-section"><button className="btn btn-primary btn-large" onClick={finishWorkout} disabled={saving}>{saving ? 'Saving...' : `Finish Workout (${burned} cal burned)`}</button></div>}
        </div>
      </main>
    </div>
  )
}

export default Workout
