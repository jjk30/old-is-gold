import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Nutrition.css'

const API_URL = 'https://gy19tatq9g.execute-api.us-east-1.amazonaws.com/prod'

const getLocalDateString = (date = new Date()) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
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
  'nuts': { calories: 607, protein: 20, carbs: 21, fat: 54, unit: 'g', icon: '��' },
  'chocolate': { calories: 546, protein: 5, carbs: 60, fat: 31, unit: 'g', icon: '🍫' },
}

const MEAL_TYPES = [
  { id: 'breakfast', name: 'Breakfast', icon: '🌅' },
  { id: 'lunch', name: 'Lunch', icon: '☀️' },
  { id: 'dinner', name: 'Dinner', icon: '🌙' },
  { id: 'snack', name: 'Snack', icon: '🍪' },
]

function Nutrition() {
  const navigate = useNavigate()
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mealType, setMealType] = useState('breakfast')
  const [searchText, setSearchText] = useState('')
  const [step, setStep] = useState(1)
  const [pickedFood, setPickedFood] = useState(null)
  const [qty, setQty] = useState('')
  
  const userId = localStorage.getItem('userId')
  const userName = localStorage.getItem('userName') || 'Friend'

  useEffect(() => {
    if (!userId) { navigate('/setup'); return }
    fetchMeals()
  }, [userId, navigate])

  const fetchMeals = async () => {
    try {
      const response = await fetch(`${API_URL}/nutrition/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setMeals(data.meals || [])
      }
    } catch (error) {
      console.error('Error fetching meals:', error)
    } finally {
      setLoading(false)
    }
  }

  const today = getLocalDateString()
  const todayMeals = meals.filter(m => m.date === today)
  const todayStats = {
    calories: todayMeals.reduce((sum, m) => sum + (m.calories || 0), 0),
    protein: todayMeals.reduce((sum, m) => sum + (m.protein || 0), 0),
    carbs: todayMeals.reduce((sum, m) => sum + (m.carbs || 0), 0),
    fat: todayMeals.reduce((sum, m) => sum + (m.fat || 0), 0)
  }
  const dailyGoal = 2000
  const remaining = dailyGoal - todayStats.calories

  const suggestions = step === 1 && searchText.trim().length > 0
    ? Object.entries(FOOD_DATABASE).filter(([k]) => k.includes(searchText.toLowerCase())).slice(0, 5).map(([n, d]) => ({ name: n, ...d }))
    : []

  const selectFood = (food) => {
    setPickedFood(food)
    setQty(food.defaultAmount || (food.unit === 'g' || food.unit === 'ml' ? 100 : 1))
    setStep(2)
    setSearchText('')
  }

  const goBackToSearch = () => { setStep(1); setPickedFood(null); setQty('') }

  const nutrition = pickedFood && qty ? {
    calories: Math.round((pickedFood.calories * qty) / (pickedFood.unit === 'g' || pickedFood.unit === 'ml' ? 100 : 1)),
    protein: Math.round((pickedFood.protein * qty) / (pickedFood.unit === 'g' || pickedFood.unit === 'ml' ? 100 : 1)),
    carbs: Math.round((pickedFood.carbs * qty) / (pickedFood.unit === 'g' || pickedFood.unit === 'ml' ? 100 : 1)),
    fat: Math.round((pickedFood.fat * qty) / (pickedFood.unit === 'g' || pickedFood.unit === 'ml' ? 100 : 1))
  } : null

  const addMeal = async () => {
    if (!pickedFood || !qty || !nutrition) return
    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/nutrition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId, date: today, meal_type: mealType,
          food_name: `${pickedFood.name} (${qty} ${pickedFood.unit})`,
          calories: nutrition.calories, protein: nutrition.protein,
          carbs: nutrition.carbs, fat: nutrition.fat
        })
      })
      if (response.ok) { fetchMeals(); setStep(1); setPickedFood(null); setQty(''); setSearchText('') }
    } catch (error) { console.error('Error adding meal:', error) }
    finally { setSaving(false) }
  }

  const deleteMeal = async (mealId) => {
    try {
      await fetch(`${API_URL}/nutrition/${userId}/${mealId}`, { method: 'DELETE' })
      fetchMeals()
    } catch (error) { console.error('Error deleting meal:', error) }
  }

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>

  return (
    <div className="nutrition-page">
      <header className="nutrition-header"><div className="header-content"><Link to="/" className="brand"><span className="logo-og"><span className="logo-o">O</span><span className="logo-g">G</span></span> <span className="brand-old">Old</span> <span className="brand-gold">Is Gold</span></Link><nav className="header-nav"><Link to="/nutrition" className="nav-link active">Nutrition</Link><Link to="/workout" className="nav-link">Workout</Link><Link to="/progress" className="nav-link">Progress</Link></nav></div></header>
      <main className="nutrition-main">
        <div className="container">
          <div className="nutrition-hero"><h1>🍎 Nutrition Tracker</h1><p>Track your meals and stay healthy, {userName}!</p></div>

          <div className="stats-card">
            <div className="stats-header"><h3>Today's Calories</h3>
              <div className="stats-numbers"><span className="consumed">{todayStats.calories}</span><span className="remaining">{remaining}</span><span className="goal">{dailyGoal}</span></div>
              <div className="stats-labels"><span>Consumed</span><span>Remaining</span><span>Goal</span></div>
            </div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.min((todayStats.calories / dailyGoal) * 100, 100)}%` }}></div></div>
          </div>

          <div className="macros-grid">
            <div className="macro-card protein"><span className="macro-icon">🥩</span><span className="macro-value">{todayStats.protein}g</span><span className="macro-label">Protein</span></div>
            <div className="macro-card carbs"><span className="macro-icon">🍞</span><span className="macro-value">{todayStats.carbs}g</span><span className="macro-label">Carbs</span></div>
            <div className="macro-card fat"><span className="macro-icon">🥑</span><span className="macro-value">{todayStats.fat}g</span><span className="macro-label">Fat</span></div>
          </div>

          <div className="meal-type-section">
            <label>Meal Type</label>
            <div className="meal-type-buttons">{MEAL_TYPES.map(t => <button key={t.id} className={`meal-type-btn ${mealType === t.id ? 'active' : ''}`} onClick={() => setMealType(t.id)}><span>{t.icon}</span><span>{t.name}</span></button>)}</div>
          </div>

          <div className="food-input-card">
            {step === 1 && (
              <div className="step-search">
                <label>What did you eat?</label>
                <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Type to search... egg, rice, chicken" className="form-input" autoComplete="off" />
                {suggestions.length > 0 && <div className="suggestions-box">{suggestions.map((s, i) => <button key={i} className="sug-btn" onClick={() => selectFood(s)}><span className="sug-icon">{s.icon}</span><span className="sug-name">{s.name}</span><span className="sug-cal">{s.calories} cal/{s.unit}</span></button>)}</div>}
              </div>
            )}
            {step === 2 && pickedFood && (
              <div className="step-amount">
                <div className="picked-header"><div className="picked-info"><span className="picked-icon">{pickedFood.icon}</span><span className="picked-name">{pickedFood.name}</span></div><button className="back-btn" onClick={goBackToSearch}>← Change</button></div>
                <div className="qty-section"><label>How many {pickedFood.unit}s?</label><div className="qty-row"><input type="number" value={qty} onChange={e => setQty(e.target.value)} className="form-input qty-input" autoFocus /><span className="unit-pill">{pickedFood.unit}</span></div></div>
                {nutrition && <div className="nut-grid"><div className="nut-box cal"><div className="nut-val">{nutrition.calories}</div><div className="nut-lbl">Calories</div></div><div className="nut-box pro"><div className="nut-val">{nutrition.protein}g</div><div className="nut-lbl">Protein</div></div><div className="nut-box carb"><div className="nut-val">{nutrition.carbs}g</div><div className="nut-lbl">Carbs</div></div><div className="nut-box fat"><div className="nut-val">{nutrition.fat}g</div><div className="nut-lbl">Fat</div></div></div>}
              </div>
            )}
            <button className="btn btn-primary add-meal-btn" onClick={addMeal} disabled={step !== 2 || !pickedFood || saving}>{saving ? 'Adding...' : '➕ Add Meal'}</button>
          </div>

          {todayMeals.length > 0 && (
            <div className="meals-list"><h3>Today's Meals</h3>
              {todayMeals.map((meal) => <div key={meal.progress_id} className="meal-item"><div className="meal-icon">🍽️</div><div className="meal-info"><strong>{meal.food_name}</strong><span>{meal.meal_type} • P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g</span></div><div className="meal-calories">{meal.calories} cal</div><button className="delete-btn" onClick={() => deleteMeal(meal.progress_id)}>🗑️</button></div>)}
            </div>
          )}

          <div className="continue-section"><button className="btn btn-primary btn-large" onClick={() => navigate('/workout')}>Continue to Workout →</button></div>
        </div>
      </main>
    </div>
  )
}

export default Nutrition
