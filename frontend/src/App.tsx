import { useState, useEffect } from 'react'
import { PlanListView } from './components/PlanListView'
import { PlanGridView } from './components/PlanGridView'
import type { Plan, PlanGrid } from './types'

// Use VITE_API_URL if set, otherwise use current origin (same domain)
const API_URL = import.meta.env.VITE_API_URL || window.location.origin

type View = 'list' | 'grid'

export default function App() {
  const [currentView, setCurrentView] = useState<View>('list')
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null)
  const [gridData, setGridData] = useState<PlanGrid | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Multi-select state
  const [selectionStart, setSelectionStart] = useState<{ participantId: number; date: string } | null>(null)
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  const [activeStatus, setActiveStatus] = useState<'yes' | 'maybe' | 'no' | 'unknown' | null>(null)

  useEffect(() => {
    const token = getTokenFromHash()
    if (token) {
      openGrid(token)
    } else {
      loadPlans()
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handleHashChange = () => {
    const token = getTokenFromHash()
    if (token) {
      openGrid(token)
    } else {
      setCurrentView('list')
      setCurrentPlanId(null)
      setGridData(null)
      loadPlans()
    }
  }

  const getTokenFromHash = (): string | null => {
    const hash = window.location.hash
    if (hash.startsWith('#/plan/')) {
      const token = hash.slice('#/plan/'.length).split('/')[0]
      return token || null
    }
    return null
  }

  const loadPlans = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/plans`)
      if (!response.ok) throw new Error(await response.text())
      const data = await response.json()
      setPlans(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
    setLoading(false)
  }

  const openGrid = async (tokenOrId: string | number) => {
    setCurrentView('grid')
    setError(null)
    setLoading(true)
    try {
      const url = typeof tokenOrId === 'string'
        ? `${API_URL}/api/plans/by-token/${encodeURIComponent(tokenOrId)}`
        : `${API_URL}/api/plans/${tokenOrId}/grid`
      
      const response = await fetch(url)
      if (!response.ok) throw new Error(await response.text())
      
      if (typeof tokenOrId === 'string') {
        const plan = await response.json()
        setCurrentPlanId(plan.id)
        const gridResponse = await fetch(`${API_URL}/api/plans/${plan.id}/grid`)
        if (!gridResponse.ok) throw new Error(await gridResponse.text())
        const grid = await gridResponse.json()
        setGridData(grid)
        window.location.hash = `#/plan/${plan.share_token}`
      } else {
        const grid = await response.json()
        setCurrentPlanId(tokenOrId as number)
        setGridData(grid)
      }
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setCurrentView('list')
      setCurrentPlanId(null)
      setGridData(null)
      await loadPlans()
    }
    setLoading(false)
  }

  const deletePlan = async (id: number) => {
    if (!confirm('Delete this plan?')) return
    try {
      const response = await fetch(`${API_URL}/api/plans/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(await response.text())
      
      if (currentPlanId === id) {
        setCurrentView('list')
        setCurrentPlanId(null)
        setGridData(null)
        window.location.hash = '#/'
      }
      await loadPlans()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const deleteParticipant = async (participantId: number) => {
    if (!currentPlanId || !confirm('Delete this participant?')) return
    try {
      const response = await fetch(`${API_URL}/api/plans/${currentPlanId}/participants/${participantId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(await response.text())
      
      const gridResponse = await fetch(`${API_URL}/api/plans/${currentPlanId}/grid`)
      const grid = await gridResponse.json()
      setGridData(grid)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const renamePlan = async (newName: string) => {
    if (!currentPlanId || !newName.trim()) return
    try {
      const response = await fetch(`${API_URL}/api/plans/${currentPlanId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      })
      if (!response.ok) throw new Error(await response.text())
      
      const gridResponse = await fetch(`${API_URL}/api/plans/${currentPlanId}/grid`)
      const grid = await gridResponse.json()
      setGridData(grid)
      await loadPlans()
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const renameParticipant = async (participantId: number, newName: string) => {
    if (!currentPlanId || !newName.trim()) return
    try {
      const response = await fetch(`${API_URL}/api/plans/${currentPlanId}/participants/${participantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      })
      if (!response.ok) throw new Error(await response.text())
      
      const gridResponse = await fetch(`${API_URL}/api/plans/${currentPlanId}/grid`)
      const grid = await gridResponse.json()
      setGridData(grid)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      <div className="max-w-8xl mx-auto px-8 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-900 bg-opacity-30 border border-red-700 rounded text-red-400">
            {error}
          </div>
        )}
        
        {currentView === 'list' ? (
          <PlanListView
            plans={plans}
            loading={loading}
            onNewPlan={loadPlans}
            onOpenPlan={(planId) => openGrid(planId)}
            onDeletePlan={deletePlan}
          />
        ) : (
          <PlanGridView
            gridData={gridData}
            loading={loading}
            currentPlanId={currentPlanId}
            selectionStart={selectionStart}
            selectedCells={selectedCells}
            activeStatus={activeStatus}
            onSetActiveStatus={setActiveStatus}
            onBack={() => {
              setCurrentView('list')
              setCurrentPlanId(null)
              setGridData(null)
              window.location.hash = '#/'
              loadPlans()
            }}
            onSelectionStart={(pid, date) => {
              setSelectionStart({ participantId: pid, date })
              setSelectedCells(new Set([`${pid}|${date}`]))
            }}
            onSelectionUpdate={(startCell, endCell) => {
              if (!gridData) return
              const dates = getDatesArray(gridData)
              const startDateIdx = dates.indexOf(startCell.date)
              const endDateIdx = dates.indexOf(endCell.date)
              const minDateIdx = Math.min(startDateIdx, endDateIdx)
              const maxDateIdx = Math.max(startDateIdx, endDateIdx)
              
              // Lock to the starting participant's row
              const pid = startCell.participantId
              
              const newSelected = new Set<string>()
              for (let di = minDateIdx; di <= maxDateIdx; di++) {
                const d = dates[di]
                if (d) newSelected.add(`${pid}|${d}`)
              }
              setSelectedCells(newSelected)
            }}
            onApplySelection={async () => {
              if (!currentPlanId || !gridData || selectedCells.size === 0 || !selectionStart) return
              
              let newStatus: 'yes' | 'maybe' | 'no' | 'unknown'
              
              if (activeStatus !== null) {
                newStatus = activeStatus
              } else {
                const currentCell = gridData.availabilities.find(
                  (a) => a.participant_id === selectionStart.participantId && a.date === selectionStart.date
                )
                const currentStatus = currentCell ? currentCell.status : 'unknown'
                
                if (selectedCells.size === 1) {
                  if (currentStatus === 'unknown') newStatus = 'yes'
                  else if (currentStatus === 'yes') newStatus = 'maybe'
                  else if (currentStatus === 'maybe') newStatus = 'no'
                  else newStatus = 'unknown'
                } else {
                  newStatus = currentStatus
                }
              }
              
              // --- Optimistic update: apply changes to gridData immediately ---
              const previousGridData = gridData
              const updatedAvailabilities = [...gridData.availabilities]

              for (const key of selectedCells) {
                const [pStr, d] = key.split('|')
                const pid = parseInt(pStr)
                const existingIdx = updatedAvailabilities.findIndex(
                  (a) => a.participant_id === pid && a.date === d
                )

                if (newStatus === 'unknown') {
                  // Remove the availability row (sparse model)
                  if (existingIdx !== -1) updatedAvailabilities.splice(existingIdx, 1)
                } else if (existingIdx !== -1) {
                  // Update existing
                  updatedAvailabilities[existingIdx] = { ...updatedAvailabilities[existingIdx], status: newStatus }
                } else {
                  // Add new (use a temporary negative id)
                  updatedAvailabilities.push({
                    id: -(Date.now() + Math.random()),
                    plan_id: currentPlanId,
                    participant_id: pid,
                    date: d,
                    status: newStatus,
                  })
                }
              }

              // Recompute summary_by_date
              const dates = getDatesArray(gridData)
              const summaryMap = new Map<string, { yes: number; maybe: number; no: number }>()
              for (const d of dates) summaryMap.set(d, { yes: 0, maybe: 0, no: 0 })
              for (const a of updatedAvailabilities) {
                const s = summaryMap.get(a.date)
                if (s) {
                  if (a.status === 'yes') s.yes++
                  else if (a.status === 'maybe') s.maybe++
                  else if (a.status === 'no') s.no++
                }
              }
              const updatedSummary = dates.map((d) => {
                const s = summaryMap.get(d)!
                return { date: d, yes_count: s.yes, maybe_count: s.maybe, no_count: s.no }
              })

              setGridData({
                ...gridData,
                availabilities: updatedAvailabilities,
                summary_by_date: updatedSummary,
              })
              setSelectedCells(new Set())

              // --- Fire API call in background ---
              try {
                const payload = Array.from(selectedCells).map((key) => {
                  const [p, d] = key.split('|')
                  return { participant_id: parseInt(p), date: d, status: newStatus }
                })

                const response = await fetch(`${API_URL}/api/plans/${currentPlanId}/availabilities/batch`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                })
                if (!response.ok) throw new Error(await response.text())
                setError(null)
              } catch (e) {
                // Rollback on error
                setGridData(previousGridData)
                setError(e instanceof Error ? e.message : String(e))
              }
            }}
            onSelectionEnd={() => {
              setSelectionStart(null)
              setSelectedCells(new Set())
            }}
            onAddParticipant={async (name) => {
              if (!currentPlanId || !gridData) return
              try {
                const response = await fetch(`${API_URL}/api/plans/${currentPlanId}/participants`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name, plan_id: currentPlanId }),
                })
                if (!response.ok) throw new Error(await response.text())
                const gridResponse = await fetch(`${API_URL}/api/plans/${currentPlanId}/grid`)
                const grid = await gridResponse.json()
                setGridData(grid)
                setError(null)
              } catch (e) {
                setError(e instanceof Error ? e.message : String(e))
              }
            }}
            onDeleteParticipant={deleteParticipant}
            onRenamePlan={renamePlan}
            onRenameParticipant={renameParticipant}
          />
        )}
      </div>
    </div>
  )
}

function getDatesArray(gridData: PlanGrid): string[] {
  const out: string[] = []
  let d = new Date(gridData.start_date + 'Z')
  const end = new Date(gridData.end_date + 'Z')
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() + 1)
  }
  return out
}
