import { useState } from 'react'
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

  return (
    <div>
      <h1 className="mb-6">Event plans</h1>
      <h1 className="mb-6">{API_URL}</h1>
      
      <div className="mb-6">
        <button onClick={() => setShowModal(true)} className="btn-primary">
          New plan
        </button>
      </div>

      {loading && <p className="text-dark-textMuted">Loading…</p>}

      <div className="grid gap-3">
        {plans.map((plan) => {
          const start = new Date(plan.start_date + 'Z').toLocaleDateString()
          const end = new Date(plan.end_date + 'Z').toLocaleDateString()
          return (
            <div
              key={plan.id}
              className="flex items-center justify-between p-4 bg-dark-card border border-dark-border rounded-lg hover:bg-gray-800 transition-colors"
            >
              <div>
                <a
                  href={`#/plan/${plan.share_token}`}
                  onClick={(e) => {
                    e.preventDefault()
                    onOpenPlan(plan.id)
                  }}
                  className="text-success font-medium hover:underline"
                >
                  {plan.name}
                </a>
                <p className="text-dark-textMuted text-sm mt-1">
                  {start} – {end}
                </p>
              </div>
              <button
                onClick={() => onDeletePlan(plan.id)}
                className="btn-danger btn-small"
              >
                Delete
              </button>
            </div>
          )
        })}
      </div>

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

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-10">
      <div className="bg-dark-card border border-dark-border rounded-lg p-8 min-w-80 shadow-xl">
        <h2 className="mb-6">New plan</h2>
        
        <div className="mb-4">
          <label className="block text-dark-textMuted text-sm mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Weekend trip"
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-dark-text placeholder-gray-600 focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <label className="block text-dark-textMuted text-sm mb-2">Start date</label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-dark-text focus:outline-none"
          />
        </div>

        <div className="mb-6">
          <label className="block text-dark-textMuted text-sm mb-2">End date</label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-dark-text focus:outline-none"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={() => onCreate(name, start, end)} className="btn-primary">
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
