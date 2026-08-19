import { useState, useEffect } from 'react'
import './App.css'

const DAYS = ['L', 'M', 'M', 'G', 'V', 'S', 'D']

function App() {
  const [habits, setHabits] = useState(() => {
    const savedHabits = localStorage.getItem('habits')
    return savedHabits ? JSON.parse(savedHabits) : []
  })
  
  const [inputVal, setInputVal] = useState('')

  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits))
  }, [habits])

  const addHabit = (e) => {
    e.preventDefault()
    if (!inputVal.trim()) return

    const newHabit = {
      id: Date.now(),
      title: inputVal.trim(),
      completedDays: [false, false, false, false, false, false, false]
    }

    setHabits([...habits, newHabit])
    setInputVal('')
  }

  const toggleDay = (habitId, dayIndex) => {
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const updatedDays = [...habit.completedDays]
        updatedDays[dayIndex] = !updatedDays[dayIndex]
        return { ...habit, completedDays: updatedDays }
      }
      return habit
    }))
  }

  const deleteHabit = (id) => {
    setHabits(habits.filter(habit => habit.id !== id))
  }

  const resetWeek = () => {
    if (window.confirm('Vuoi davvero azzerare i progressi di questa settimana?')) {
      setHabits(habits.map(habit => ({
        ...habit,
        completedDays: [false, false, false, false, false, false, false]
      })))
    }
  }

  // Calcolo Percentuale Totale
  const totalSlots = habits.length * 7
  const totalCompleted = habits.reduce((acc, habit) => {
    return acc + habit.completedDays.filter(Boolean).length
  }, 0)
  
  const progressPercentage = totalSlots > 0 
    ? Math.round((totalCompleted / totalSlots) * 100) 
    : 0

  return (
    <div className="app-container">
      <h1>Habit Tracker</h1>

      {/* Sezione Barra di Progresso */}
      {habits.length > 0 && (
        <div className="progress-container">
          <div className="progress-header">
            <span>PROGRESSO SETTIMANALE</span>
            <span className="progress-percentage">{progressPercentage}%</span>
          </div>
          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      )}

      <form onSubmit={addHabit} className="habit-form">
        <input
          type="text"
          placeholder="Nuova abitudine..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
        />
        <button type="submit">Aggiungi</button>
      </form>

      <div className="habit-list">
        {habits.length === 0 ? (
          <p className="empty-msg">Nessuna abitudine inserita. Inizia aggiungendone una!</p>
        ) : (
          habits.map(habit => {
            const completedCount = habit.completedDays.filter(Boolean).length
            return (
              <div key={habit.id} className="habit-card">
                <div className="habit-header">
                  <span className="habit-title">{habit.title}</span>
                  <div className="habit-actions">
                    <span className="streak-badge">{completedCount}/7</span>
                    <button className="delete-btn" onClick={() => deleteHabit(habit.id)}>✕</button>
                  </div>
                </div>

                <div className="week-grid">
                  {DAYS.map((day, idx) => (
                    <button
                      key={idx}
                      className={`day-btn ${habit.completedDays[idx] ? 'active' : ''}`}
                      onClick={() => toggleDay(habit.id, idx)}
                    >
                      <span className="day-label">{day}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pulsante Reset in Basso */}
      {habits.length > 0 && (
        <button className="reset-btn-large" onClick={resetWeek}>
          ↺ RESETTA SETTIMANA
        </button>
      )}
    </div>
  )
}

export default App