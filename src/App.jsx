import { useEffect, useState } from 'react';
import './App.css';

const DAYS_OF_WEEK = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

const EMPTY_WEEK = () => Array(7).fill(false);

function App() {
  const [habits, setHabits] = useState(() => {
    try {
      const savedHabits = localStorage.getItem('habits');

      if (!savedHabits) {
        return [];
      }

      const parsedHabits = JSON.parse(savedHabits);

      return Array.isArray(parsedHabits) ? parsedHabits : [];
    } catch (error) {
      console.error(
        'Errore durante il caricamento delle abitudini:',
        error
      );

      return [];
    }
  });

  const [inputTitle, setInputTitle] = useState('');
  const [inputTarget, setInputTarget] = useState(7);
  const [inputCategory, setInputCategory] = useState('Generale');

  /*
   * Salvataggio automatico nel localStorage
   */
  useEffect(() => {
    try {
      localStorage.setItem('habits', JSON.stringify(habits));
    } catch (error) {
      console.error(
        'Errore durante il salvataggio delle abitudini:',
        error
      );
    }
  }, [habits]);

  /*
   * Aggiunta nuova abitudine
   */
  const addHabit = (event) => {
    event.preventDefault();

    const title = inputTitle.trim();
    const category = inputCategory.trim() || 'Generale';
    const target = Number(inputTarget);

    if (!title) {
      return;
    }

    const newHabit = {
      id: Date.now(),
      title,
      target:
        Number.isInteger(target) && target >= 1 && target <= 7
          ? target
          : 7,
      category,
      completedDays: EMPTY_WEEK(),
    };

    setHabits((previousHabits) => [
      ...previousHabits,
      newHabit,
    ]);

    setInputTitle('');
  };

  /*
   * Selezione/deselezione giorno
   */
  const toggleDay = (habitId, dayIndex) => {
    setHabits((previousHabits) =>
      previousHabits.map((habit) => {
        if (habit.id !== habitId) {
          return habit;
        }

        const completedDays = Array.isArray(habit.completedDays)
          ? [...habit.completedDays]
          : EMPTY_WEEK();

        completedDays[dayIndex] = !completedDays[dayIndex];

        return {
          ...habit,
          completedDays,
        };
      })
    );
  };

  /*
   * Eliminazione abitudine
   */
  const deleteHabit = (habitId) => {
    setHabits((previousHabits) =>
      previousHabits.filter(
        (habit) => habit.id !== habitId
      )
    );
  };

  /*
   * Reset settimana
   */
  const resetWeek = () => {
    const confirmed = window.confirm(
      'Sei sicuro di voler resettare i progressi della settimana?'
    );

    if (!confirmed) {
      return;
    }

    setHabits((previousHabits) =>
      previousHabits.map((habit) => ({
        ...habit,
        completedDays: EMPTY_WEEK(),
      }))
    );
  };

  /*
   * Esportazione backup
   */
  const exportBackup = () => {
    try {
      const jsonData = JSON.stringify(habits, null, 2);

      const blob = new Blob([jsonData], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);

      const downloadAnchor = document.createElement('a');

      downloadAnchor.href = url;
      downloadAnchor.download = `habits_backup_${new Date()
        .toISOString()
        .slice(0, 10)}.json`;

      document.body.appendChild(downloadAnchor);

      downloadAnchor.click();
      downloadAnchor.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        'Errore durante la creazione del backup:',
        error
      );

      window.alert(
        'Si è verificato un errore durante la creazione del backup.'
      );
    }
  };

  /*
   * Importazione backup
   */
  const importBackup = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const fileReader = new FileReader();

    fileReader.onload = (readerEvent) => {
      try {
        const parsedData = JSON.parse(
          readerEvent.target?.result
        );

        if (!Array.isArray(parsedData)) {
          throw new Error(
            'Il contenuto del backup non è un array.'
          );
        }

        /*
         * Normalizziamo i dati importati.
         * In questo modo anche vecchi backup continuano
         * a funzionare.
         */
        const normalizedHabits = parsedData
          .filter(
            (habit) =>
              habit &&
              typeof habit === 'object' &&
              typeof habit.title === 'string'
          )
          .map((habit, index) => {
            const completedDays =
              Array.isArray(habit.completedDays)
                ? Array.from(
                    { length: 7 },
                    (_, dayIndex) =>
                      Boolean(
                        habit.completedDays[dayIndex]
                      )
                  )
                : EMPTY_WEEK();

            const target = Number(habit.target);

            return {
              id:
                habit.id ??
                `${Date.now()}-${index}`,
              title: habit.title.trim(),
              category:
                typeof habit.category === 'string' &&
                habit.category.trim()
                  ? habit.category.trim()
                  : 'Generale',
              target:
                Number.isInteger(target) &&
                target >= 1 &&
                target <= 7
                  ? target
                  : 7,
              completedDays,
            };
          });

        setHabits(normalizedHabits);

        window.alert(
          'Backup importato con successo!'
        );
      } catch (error) {
        console.error(
          'Errore durante l’importazione:',
          error
        );

        window.alert(
          'Il file selezionato non contiene un backup valido.'
        );
      } finally {
        /*
         * Permette di riselezionare anche lo stesso file.
         */
        event.target.value = '';
      }
    };

    fileReader.onerror = () => {
      window.alert(
        'Errore durante la lettura del file.'
      );

      event.target.value = '';
    };

    fileReader.readAsText(file, 'UTF-8');
  };

  /*
   * Statistiche
   */

  const totalCompletions = habits.reduce(
    (total, habit) => {
      if (!Array.isArray(habit.completedDays)) {
        return total;
      }

      return (
        total +
        habit.completedDays.filter(Boolean).length
      );
    },
    0
  );

  const totalTarget = habits.reduce(
    (total, habit) =>
      total + (Number(habit.target) || 0),
    0
  );

  /*
   * Per il progresso settimanale contiamo al massimo
   * il target di ogni singola abitudine.
   *
   * Esempio:
   * target = 3
   * giorni selezionati = 5
   * contributo al progresso = 3, non 5.
   */
  const completedTowardTarget = habits.reduce(
    (total, habit) => {
      const completed = Array.isArray(
        habit.completedDays
      )
        ? habit.completedDays.filter(Boolean).length
        : 0;

      const target = Number(habit.target) || 0;

      return total + Math.min(completed, target);
    },
    0
  );

  const progressPercentage =
    totalTarget > 0
      ? Math.min(
          100,
          Math.round(
            (completedTowardTarget / totalTarget) *
              100
          )
        )
      : 0;

  const formattedDate = new Date().toLocaleDateString(
    'it-IT',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }
  );

  return (
    <main className="app-container">
      {/* DATA */}
      <div className="datetime-badge">
        {formattedDate}
      </div>

      {/* HEADER */}
      <h1>Habit Tracker</h1>

      <p className="subtitle">
        Costruisci la tua routine giorno dopo giorno
      </p>

      {/* PROGRESSO */}
      <section className="progress-container">
        <div className="progress-header">
          <span>Obiettivo settimanale</span>
          <span>{progressPercentage}%</span>
        </div>

        <div className="progress-bar-bg">
          <div
            className="progress-bar-fill"
            style={{
              width: `${progressPercentage}%`,
            }}
          />
        </div>
      </section>

      {/* STATISTICHE */}
      <section className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">
            Abitudini
          </span>

          <span className="stat-value">
            {habits.length}
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-label">
            Completate
          </span>

          <span className="stat-value">
            {totalCompletions}
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-label">
            Obiettivo
          </span>

          <span className="stat-value">
            {totalTarget}
          </span>
        </div>
      </section>

      {/* FORM AGGIUNTA ABITUDINE */}
      <form
        onSubmit={addHabit}
        className="habit-form-extended"
      >
        <div className="form-main-row">
          <input
            type="text"
            placeholder="Nuova abitudine..."
            value={inputTitle}
            onChange={(event) =>
              setInputTitle(event.target.value)
            }
            maxLength={60}
          />

          <button type="submit">
            Aggiungi
          </button>
        </div>

        <div className="form-details-row">
          <select
            value={inputTarget}
            onChange={(event) =>
              setInputTarget(
                Number(event.target.value)
              )
            }
            aria-label="Obiettivo settimanale"
          >
            {[1, 2, 3, 4, 5, 6, 7].map(
              (number) => (
                <option
                  key={number}
                  value={number}
                >
                  {number}{' '}
                  {number === 1
                    ? 'giorno'
                    : 'giorni'}{' '}
                  / sett
                </option>
              )
            )}
          </select>

          <input
            type="text"
            placeholder="Categoria (es. Salute)"
            value={inputCategory}
            onChange={(event) =>
              setInputCategory(
                event.target.value
              )
            }
            maxLength={30}
          />
        </div>
      </form>

      {/* LISTA ABITUDINI */}
      <section className="habit-list">
        {habits.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              ✓
            </span>

            <p>
              Non hai ancora aggiunto
              abitudini.
            </p>

            <small>
              Inserisci la prima abitudine
              qui sopra.
            </small>
          </div>
        ) : (
          habits.map((habit) => {
            const currentCount =
              Array.isArray(
                habit.completedDays
              )
                ? habit.completedDays.filter(
                    Boolean
                  ).length
                : 0;

            const targetValue =
              Number(habit.target) || 7;

            const goalReached =
              currentCount >= targetValue;

            return (
              <article
                key={habit.id}
                className={`habit-card ${
                  goalReached
                    ? 'goal-reached'
                    : ''
                }`}
              >
                <div className="habit-header">
                  <div className="title-group">
                    <span className="habit-title">
                      {habit.title}
                    </span>

                    <span className="target-badge">
                      {habit.category ||
                        'Generale'}
                    </span>
                  </div>

                  <div className="habit-actions">
                    <span
                      className={`streak-badge ${
                        goalReached
                          ? 'completed'
                          : ''
                      }`}
                    >
                      🎯 {currentCount}/
                      {targetValue}
                    </span>

                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() =>
                        deleteHabit(
                          habit.id
                        )
                      }
                      aria-label={`Elimina ${habit.title}`}
                      title="Elimina abitudine"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="week-grid">
                  {DAYS_OF_WEEK.map(
                    (day, index) => {
                      const isCompleted =
                        Boolean(
                          habit
                            .completedDays?.[
                            index
                          ]
                        );

                      return (
                        <button
                          key={index}
                          type="button"
                          className={`day-btn ${
                            isCompleted
                              ? 'active'
                              : ''
                          }`}
                          onClick={() =>
                            toggleDay(
                              habit.id,
                              index
                            )
                          }
                          aria-pressed={
                            isCompleted
                          }
                        >
                          {day}
                        </button>
                      );
                    }
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* RESET SETTIMANA */}
      {habits.length > 0 && (
        <button
          type="button"
          className="reset-btn-large"
          onClick={resetWeek}
        >
          RESETTA SETTIMANA
        </button>
      )}

      {/* BACKUP */}
      <section className="backup-section">
        <button
          type="button"
          className="backup-btn"
          onClick={exportBackup}
          disabled={habits.length === 0}
        >
          <span>📥</span>
          Esporta Backup
        </button>

        <label
          htmlFor="import-file"
          className="backup-btn import-btn"
        >
          <span>📤</span>
          Importa Backup
        </label>

        <input
          type="file"
          id="import-file"
          className="import-file-input"
          onChange={importBackup}
          accept=".json,application/json"
        />
      </section>
    </main>
  );
}

export default App;