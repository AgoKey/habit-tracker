import { useState, useEffect } from 'react'
import './App.css'

const DAYS = ['L', 'M', 'M', 'G', 'V', 'S', 'D']
const FULL_DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']

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

  const toggleAll = (habitId) => {
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const allChecked = habit.completedDays.every(Boolean);
        return { ...habit, completedDays: Array(7).fill(!allChecked) };
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

  const totalSlots = habits.length * 7
  const totalCompleted = habits.reduce((acc, habit) => {
    return acc + habit.completedDays.filter(Boolean).length
  }, 0)
  
  const progressPercentage = totalSlots > 0 ? Math.round((totalCompleted / totalSlots) * 100) : 0

  const dayCounts = DAYS.map((_, dayIdx) => {
    return habits.reduce((acc, habit) => acc + (habit.completedDays[dayIdx] ? 1 : 0), 0)
  })

  const maxCount = Math.max(...dayCounts)
  const bestDayIndex = dayCounts.indexOf(maxCount)
  const bestDayName = (maxCount > 0 && bestDayIndex !== -1) ? FULL_DAYS[bestDayIndex] : '-'

  const getMotivationalMessage = () => {
    if (habits.length === 0) return 'Inizia aggiungendo la tua prima abitudine!'
    if (progressPercentage === 0) return 'Pronto a partire? Fai la tua prima spunta!'
    if (progressPercentage < 30) return 'Un passo alla volta. L\'importante è cominciare!'
    if (progressPercentage < 60) return 'Buon ritmo! Continua così.'
    if (progressPercentage < 90) return 'Ottimo lavoro, stai costruendo una grande costanza!'
    if (progressPercentage < 100) return 'Quasi perfetto! Manca davvero pochissimo!'
    return '100% completato! Sei imbattibile questa settimana! 🎉'
  }

  return (
    <div className="app-container">
      <h1>Habit Tracker</h1>
      <p className="subtitle">Stai monitorando {habits.length} abitudini</p>
      <p className="motivational-quote">{getMotivationalMessage()}</p>

      {habits.length > 0 && (
        <>
          <div className="progress-container">
            <div className="progress-header">
              <span>PROGRESSO SETTIMANALE</span>
              <span className="progress-percentage">{progressPercentage}%</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>

          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-label">Completate:</span>
              <span className="stat-value">{totalCompleted}</span>
            </div>
            <div className="stat-divider">•</div>
            <div className="stat-item">
              <span className="stat-label">Giorno migliore:</span>
              <span className="stat-value">{bestDayName}</span>
            </div>
          </div>
        </>
      )}

      <form onSubmit={addHabit} className="habit-form">
        <input type="text" placeholder="Nuova abitudine..." value={inputVal} onChange={(e) => setInputVal(e.target.value)} />
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
                <div className="habit-header" onClick={() => toggleAll(habit.id)} style={{ cursor: 'pointer' }}>
                  <span className="habit-title">{habit.title}</span>
                  <div className="habit-actions">
                    <span className="streak-badge">{completedCount}/7</span>
                    <button className="delete-btn" onClick={(e) => { e.stopPropagation(); deleteHabit(habit.id) }}>✕</button>
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

      {habits.length > 0 && (
        <button className="reset-btn-large" onClick={resetWeek}>
          ↺  RESET SETTIMANA
        </button>
      )}
    </div>
  )
}

export default App