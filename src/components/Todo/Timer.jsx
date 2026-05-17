import { useState } from 'react'
import { useCountdownTimer, formatTime } from '../../hooks/useCountdownTimer.js'
import './Timer.css'

export function Timer({ itemId, timerSeconds, timerRemaining, timerRunning, onChange }) {
  const [editing, setEditing] = useState(false)
  const [inputMin, setInputMin] = useState(Math.floor((timerSeconds || 0) / 60))
  const [inputSec, setInputSec] = useState((timerSeconds || 0) % 60)

  const { remaining, isRunning, start, pause, reset } = useCountdownTimer({
    initialRemaining: timerRemaining ?? timerSeconds ?? 0,
    initialRunning: timerRunning ?? false,
    onTick: (rem, done) => {
      onChange({ timerRemaining: rem, timerRunning: !done })
    }
  })

  function handleSetTimer() {
    const total = (parseInt(inputMin) || 0) * 60 + (parseInt(inputSec) || 0)
    onChange({ timerSeconds: total, timerRemaining: total, timerRunning: false })
    reset(total)
    setEditing(false)
  }

  function handleStart() {
    start()
    onChange({ timerRunning: true })
  }

  function handlePause() {
    pause()
    onChange({ timerRunning: false, timerRemaining: remaining })
  }

  function handleReset() {
    reset(timerSeconds || 0)
    onChange({ timerRemaining: timerSeconds || 0, timerRunning: false })
  }

  const pct = timerSeconds > 0 ? Math.max(0, remaining / timerSeconds) : 0
  const isFinished = timerSeconds > 0 && remaining === 0

  return (
    <div className={`timer ${isRunning ? 'timer--running' : ''} ${isFinished ? 'timer--finished' : ''}`}>
      {editing ? (
        <div className="timer__edit">
          <input
            type="number" min="0" max="99" value={inputMin}
            onChange={e => setInputMin(e.target.value)}
            className="timer__input"
            placeholder="mm"
          />
          <span>:</span>
          <input
            type="number" min="0" max="59" value={inputSec}
            onChange={e => setInputSec(e.target.value)}
            className="timer__input"
            placeholder="ss"
          />
          <button className="timer__btn timer__btn--set" onClick={handleSetTimer}>Set</button>
          <button className="timer__btn" onClick={() => setEditing(false)}>✕</button>
        </div>
      ) : (
        <div className="timer__display">
          <div className="timer__ring">
            <svg viewBox="0 0 28 28" className="timer__svg">
              <circle cx="14" cy="14" r="11" className="timer__track" />
              <circle
                cx="14" cy="14" r="11"
                className="timer__fill"
                strokeDasharray={`${2 * Math.PI * 11}`}
                strokeDashoffset={`${2 * Math.PI * 11 * (1 - pct)}`}
              />
            </svg>
            <span className="timer__time">
              {timerSeconds > 0 ? formatTime(remaining) : '--:--'}
            </span>
          </div>
          <div className="timer__controls">
            {timerSeconds > 0 && !isRunning && remaining > 0 && (
              <button className="timer__btn timer__btn--start" onClick={handleStart} title="Start">▶</button>
            )}
            {isRunning && (
              <button className="timer__btn timer__btn--pause" onClick={handlePause} title="Pause">⏸</button>
            )}
            {timerSeconds > 0 && (
              <button className="timer__btn" onClick={handleReset} title="Reset">↺</button>
            )}
            <button className="timer__btn" onClick={() => setEditing(true)} title="Set timer">⏱</button>
          </div>
        </div>
      )}
    </div>
  )
}
