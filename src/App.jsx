import { useState, useEffect } from 'react'
import './App.css'

const DAYS = ['L', 'M', 'M', 'G', 'V', 'S', 'D']
const FULL_DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']

function App() {
  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem('habits')
    return saved ? JSON.parse(saved) : []
  })
  
  const [history, setHistory] = useState(() => {
    const savedHistory = localStorage.getItem('habits_history')
    return savedHistory ? JSON.parse(savedHistory) : []
  })

  const [inputVal, setInputVal] = useState('')
  const [targetVal, setTargetVal] = useState('')
  const [unitVal, setUnitVal] = useState('')
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits))
  }, [habits])

  useEffect(() => {
    localStorage.setItem('habits_history', JSON.stringify(history))
  }, [history])

  const addHabit = (e) => {
    e.preventDefault()
    if (!inputVal.trim()) return
    const newHabit = {
      id: crypto.randomUUID(),
      title: inputVal.trim(),
      target: targetVal ? Number(targetVal) : null,
      unit: unitVal.trim() || '',
      completedDays: [false, false, false, false, false, false, false]
    }
    setHabits([...habits, newHabit])
    setInputVal('')
    setTargetVal('')
    setUnitVal('')
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

  const archiveAndResetWeek = () => {
    if (window.confirm('Vuoi archiviare questa settimana nello storico e iniziare una nuova?')) {
      const today = new Date()
      const weekRecord = {
        id: crypto.randomUUID(),
        date: today.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }),
        score: progressPercentage
      }
      setHistory([weekRecord, ...history])
      setHabits(habits.map(habit => ({ ...habit, completedDays: Array(7).fill(false) })))
    }
  }

  const totalSlots = habits.length * 7
  const totalCompleted = habits.reduce((acc, habit) => acc + habit.completedDays.filter(Boolean).length, 0)
  const progressPercentage = totalSlots > 0 ? Math.round((totalCompleted / totalSlots) * 100) : 0
  
  const dayCounts = DAYS.map((_, dayIdx) => habits.reduce((acc, habit) => acc + (habit.completedDays[dayIdx] ? 1 : 0), 0))
  const maxCount = Math.max(...dayCounts)
  const bestDayIndex = dayCounts.indexOf(maxCount)
  const bestDayName = (maxCount > 0 && bestDayIndex !== -1) ? FULL_DAYS[bestDayIndex] : '-'

  const formattedDate = now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const formattedTime = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className="app-container">
      <div className="datetime-badge">
        <span>{formattedDate}</span> • <strong>{formattedTime}</strong>
      </div>

      <h1>Habit Tracker</h1>
      <p className="subtitle">Stai monitorando {habits.length} abitudini</p>

      {habits.length > 0 && (
        <>
          <div className="progress-container">
            <div className="progress-header"><span>PROGRESSO SETTIMANA</span><span>{progressPercentage}%</span></div>
            <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }}></div></div>
          </div>
          <div className="stats-bar">
            <div className="stat-item"><span className="stat-label">Completate</span><span className="stat-value">{totalCompleted}</span></div>
            <div className="stat-item"><span className="stat-label">Giorno Top</span><span className="stat-value">{bestDayName}</span></div>
          </div>
        </>
      )}

      <form onSubmit={addHabit} className="habit-form-extended">
        <div className="form-main-row">
          <input 
            type="text" 
            placeholder="Cosa vuoi fare? (es. Bere acqua)" 
            value={inputVal} 
            onChange={(e) => setInputVal(e.target.value)} 
            required 
          />
          <button type="submit">Aggiungi</button>
        </div>
        
        <div className="form-details-row">
          <input 
            type="number" 
            placeholder="Obiettivo (es. 2000)" 
            value={targetVal} 
            onChange={(e) => setTargetVal(e.target.value)} 
          />
          <input 
            type="text" 
            placeholder="Unità (es. ml, pagine, min)" 
            value={unitVal} 
            onChange={(e) => setUnitVal(e.target.value)} 
          />
        </div>
      </form>

      <div className="habit-list">
        {habits.map(habit => (
          <div key={habit.id} className="habit-card">
            <div className="habit-header">
              <div className="title-group">
                <span className="habit-title">{habit.title}</span>
                {habit.target && <span className="target-badge">🎯 {habit.target} {habit.unit}</span>}
              </div>
              <div className="habit-actions">
                <span className="streak-badge">{habit.completedDays.filter(Boolean).length}/7</span>
                <button className="delete-btn" onClick={() => deleteHabit(habit.id)}>✕</button>
              </div>
            </div>
            <div className="week-grid">
              {DAYS.map((day, idx) => (
                <button key={idx} className={`day-btn ${habit.completedDays[idx] ? 'active' : ''}`} onClick={() => toggleDay(habit.id, idx)}>
                  <span className="day-label">{day}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {history.length > 0 && (
        <div className="history-section">
          <h3>📜 Storico Settimane Passate</h3>
          <div className="history-list">
            {history.map(item => (
              <div key={item.id} className="history-item">
                <span>Settimana del {item.date}</span>
                <strong>{item.score}% Completato</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {habits.length > 0 && (
        <button className="reset-btn-large" onClick={archiveAndResetWeek}>
          📦 ARCHIVIA E RESETTA SETTIMANA
        </button>
      )}
    </div>
  )
}

export default App