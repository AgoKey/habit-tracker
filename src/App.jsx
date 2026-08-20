import { useState, useEffect } from 'react'
import './App.css'

const DAYS = ['L', 'M', 'M', 'G', 'V', 'S', 'D']
const FULL_DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']

const CATEGORIES = [
  { name: 'Generale', color: '#0d3b66' },
  { name: 'Salute', color: '#2a9d8f' },
  { name: 'Studio', color: '#9c89b8' },
  { name: 'Lavoro', color: '#f4a261' },
  { name: 'Personal', color: '#e76f51' }
]

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
  const [categoryVal, setCategoryVal] = useState('Generale')
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
      category: categoryVal,
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

  // Funzioni Backup (Esporta/Importa)
  const exportData = () => {
    const data = JSON.stringify({ habits, history }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `habit_tracker_backup_${new Date().toISOString().slice(0, 10)}.json`
    link.click()
  }

  const importData = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result)
        if (parsed.habits && parsed.history) {
          setHabits(parsed.habits)
          setHistory(parsed.history)
          alert('Dati importati con successo!')
        } else {
          alert('File non valido.')
        }
      } catch {
        alert('Errore durante la lettura del file.')
      }
    }
    reader.readAsText(file)
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
            placeholder="Unità (es. ml)" 
            value={unitVal} 
            onChange={(e) => setUnitVal(e.target.value)} 
          />
          <select value={categoryVal} onChange={(e) => setCategoryVal(e.target.value)} className="category-select">
            {CATEGORIES.map(cat => (
              <option key={cat.name} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
      </form>

      <div className="habit-list">
        {habits.map(habit => {
          const categoryObj = CATEGORIES.find(c => c.name === habit.category) || CATEGORIES[0]
          return (
            <div key={habit.id} className="habit-card" style={{ borderLeft: `5px solid ${categoryObj.color}` }}>
              <div className="habit-header">
                <div className="title-group">
                  <span className="habit-title">{habit.title}</span>
                  <span className="category-badge" style={{ background: `${categoryObj.color}20`, color: categoryObj.color }}>
                    {habit.category || 'Generale'}
                  </span>
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
          )
        })}
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
           ARCHIVIA E RESETTA SETTIMANA
        </button>
      )}

      {/* Sezione Backup */}
      <div className="backup-actions">
        <button className="backup-btn" onClick={exportData}>📥 Esporta Backup</button>
        <label className="backup-btn">
          📤 Importa Backup
          <input type="file" accept=".json" onChange={importData} hidden />
        </label>
      </div>
    </div>
  )
}

export default App