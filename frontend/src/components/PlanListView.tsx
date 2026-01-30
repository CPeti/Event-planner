import { useState, useEffect } from 'react'
import type { Plan } from '../types'

const API_URL = import.meta.env.VITE_API_URL || window.location.origin

interface PlanListViewProps {
  plans: Plan[]
  loading: boolean
  onNewPlan: () => void
  onOpenPlan: (planId: number) => void
  onDeletePlan: (planId: number) => void
}

export function PlanListView({ plans, loading, onOpenPlan, onDeletePlan }: PlanListViewProps) {
  const [showModal, setShowModal] = useState(false)
  const [participantCounts, setParticipantCounts] = useState<Record<number, number>>({})

  useEffect(() => {
    plans.forEach((plan) => {
      if (!(plan.id in participantCounts)) {
        fetch(`${API_URL}/api/plans/${plan.id}/grid`)
          .then((res) => res.json())
          .then((data) => {
            setParticipantCounts((prev) => ({
              ...prev,
              [plan.id]: data.participants.length,
            }))
          })
          .catch(() => {
            setParticipantCounts((prev) => ({
              ...prev,
              [plan.id]: 0,
            }))
          })
      }
    })
  }, [plans])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 overflow-auto">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Your Events
          </h1>
          <p className="text-slate-400">Organize and coordinate your plans with ease</p>
        </div>

        {/* Create Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-200"
          >
            <span className="text-lg">+</span> Create New Plan
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400 border-t-transparent mb-3 mx-auto"></div>
              Loading your plans…
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && plans.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-xl text-slate-300 mb-2">No plans yet</p>
            <p className="text-slate-400 mb-6">Create your first plan to get started</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-200"
            >
              <span className="text-lg">+</span> Create Plan
            </button>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const start = new Date(plan.start_date + 'Z')
            const end = new Date(plan.end_date + 'Z')
            const daysUntil = Math.ceil((start.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            
            return (
              <div
                key={plan.id}
                className="group relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl overflow-hidden transition-all duration-300"
              >
                {/* Card Background Gradient on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-cyan-600/0 group-hover:from-blue-600/5 group-hover:to-cyan-600/5 transition-all duration-300"></div>

                <div className="relative p-6">
                  {/* Plan Name */}
                  <button
                    onClick={() => onOpenPlan(plan.id)}
                    className="block w-full text-left group/name"
                  >
                    <h3 className="text-xl font-bold text-white group-hover/name:text-blue-400 transition-colors duration-200 mb-2 truncate">
                      {plan.name}
                    </h3>
                  </button>

                  {/* Date Range */}
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                    <span className="text-base">📅</span>
                    <span>{start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>

                  {/* Participants Count */}
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                    <span className="text-base">👥</span>
                    <span>{participantCounts[plan.id] ?? 0} participant{participantCounts[plan.id] !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Days Until */}
                  <div className="mb-4">
                    {daysUntil > 0 ? (
                      <span className="inline-block px-3 py-1 bg-blue-900/50 border border-blue-700 text-blue-300 text-xs font-semibold rounded-full">
                        In {daysUntil} day{daysUntil !== 1 ? 's' : ''}
                      </span>
                    ) : daysUntil === 0 ? (
                      <span className="inline-block px-3 py-1 bg-amber-900/50 border border-amber-700 text-amber-300 text-xs font-semibold rounded-full">
                        Today
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-slate-700/50 border border-slate-600 text-slate-400 text-xs font-semibold rounded-full">
                        {Math.abs(daysUntil)} day{Math.abs(daysUntil) !== 1 ? 's' : ''} ago
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-slate-700">
                    <button
                      onClick={() => onOpenPlan(plan.id)}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors duration-200"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => onDeletePlan(plan.id)}
                      className="px-4 py-2 bg-slate-700 hover:bg-red-600 text-slate-200 hover:text-white font-medium rounded-lg transition-colors duration-200"
                      title="Delete plan"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Modal */}
        {showModal && (
          <NewPlanModal
            onClose={() => setShowModal(false)}
            onCreate={async (name, start, end) => {
              try {
                const response = await fetch(`${API_URL}/api/plans`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name, start_date: start, end_date: end }),
                })
                if (!response.ok) throw new Error(await response.text())
                const plan = await response.json()
                setShowModal(false)
                window.location.hash = `#/plan/${plan.share_token}`
                onOpenPlan(plan.id)
              } catch (e) {
                console.error(e)
              }
            }}
          />
        )}
      </div>
    </div>
  )
}

interface NewPlanModalProps {
  onClose: () => void
  onCreate: (name: string, start: string, end: string) => void
}

function NewPlanModal({ onClose, onCreate }: NewPlanModalProps) {
  const [name, setName] = useState('')
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10))
  const [end, setEnd] = useState(new Date().toISOString().slice(0, 10))
  const [error, setError] = useState('')
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)

  const handleCreate = () => {
    setError('')

    // Validate name
    if (!name.trim()) {
      setError('Plan name is required')
      return
    }

    if (name.trim().length < 2) {
      setError('Plan name must be at least 2 characters')
      return
    }

    // Validate dates
    if (!start || !end) {
      setError('Both start and end dates are required')
      return
    }

    const startDate = new Date(start + 'Z')
    const endDate = new Date(end + 'Z')
    const currentYear = new Date().getFullYear()

    // Validate years are reasonable
    if (startDate.getFullYear() < 1900) {
      setError('Start year must be 1900 or later')
      return
    }

    if (endDate.getFullYear() < 1900) {
      setError('End year must be 1900 or later')
      return
    }

    if (startDate.getFullYear() > currentYear + 100) {
      setError('Start year cannot be more than 100 years in the future')
      return
    }

    if (endDate.getFullYear() > currentYear + 100) {
      setError('End year cannot be more than 100 years in the future')
      return
    }

    if (endDate < startDate) {
      setError('End date must be after or equal to start date')
      return
    }

    // Check date range max 1 year
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > 365) {
      setError('Date range cannot exceed 1 year (365 days)')
      return
    }

    onCreate(name, start, end)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-8 min-w-96">
        <h2 className="text-3xl font-bold text-white mb-6">Create New Plan</h2>
        
        {error && (
          <div className="mb-5 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-5">
          <div>
            <label className="block text-slate-300 text-sm font-semibold mb-2">Plan Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer Vacation"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-semibold mb-2">Start Date</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowStartPicker(!showStartPicker)
                  setShowEndPicker(false)
                }}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-left"
              >
                {new Date(start + 'Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </button>
              {showStartPicker && (
                <CalendarPicker
                  date={start}
                  onChange={(newDate) => {
                    setStart(newDate)
                    setShowStartPicker(false)
                  }}
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-semibold mb-2">End Date</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowEndPicker(!showEndPicker)
                  setShowStartPicker(false)
                }}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-left"
              >
                {new Date(end + 'Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </button>
              {showEndPicker && (
                <CalendarPicker
                  date={end}
                  onChange={(newDate) => {
                    setEnd(newDate)
                    setShowEndPicker(false)
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-200"
          >
            Create Plan
          </button>
        </div>
      </div>
    </div>
  )
}

interface CalendarPickerProps {
  date: string
  onChange: (date: string) => void
}

function CalendarPicker({ date, onChange }: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(date + 'Z'))

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const days = Array.from({ length: daysInMonth(currentMonth) }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDayOfMonth(currentMonth) }, () => null)
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="absolute top-full left-0 mt-2 bg-slate-900 border border-slate-600 rounded-lg p-4 z-50 shadow-lg min-w-72">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
          className="text-slate-400 hover:text-white"
        >
          ←
        </button>
        <span className="text-white font-semibold text-sm">{monthName}</span>
        <button
          type="button"
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
          className="text-slate-400 hover:text-white"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-3">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-slate-500 text-xs font-semibold py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => {
          const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isSelected = dateStr === date

          return (
            <button
              key={day}
              type="button"
              onClick={() => onChange(dateStr)}
              className={`py-2 rounded text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
