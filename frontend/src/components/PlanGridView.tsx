import React, { useEffect, useRef, useState } from 'react'
import type { PlanGrid } from '../types'

interface PlanGridViewProps {
  gridData: PlanGrid | null
  loading: boolean
  currentPlanId: number | null
  selectionStart: { participantId: number; date: string } | null
  selectedCells: Set<string>
  onBack: () => void
  onSelectionStart: (participantId: number, date: string) => void
  onSelectionUpdate: (start: { participantId: number; date: string }, end: { participantId: number; date: string }) => void
  onApplySelection: () => void
  onSelectionEnd: () => void
  onAddParticipant: (name: string) => void
  onDeleteParticipant: (participantId: number) => void
  onRenamePlan: (name: string) => void
  onRenameParticipant: (participantId: number, name: string) => void
}

export function PlanGridView({
  gridData,
  loading,
  selectionStart,
  selectedCells,
  onBack,
  onSelectionStart,
  onSelectionUpdate,
  onApplySelection,
  onSelectionEnd,
  onAddParticipant,
  onDeleteParticipant,
  onRenamePlan,
  onRenameParticipant,
}: PlanGridViewProps) {
  const [participantName, setParticipantName] = useState('')
  const [isEditingPlanName, setIsEditingPlanName] = useState(false)
  const [editPlanName, setEditPlanName] = useState(gridData?.plan.name || '')
  const [editingParticipantId, setEditingParticipantId] = useState<number | null>(null)
  const [editingParticipantName, setEditingParticipantName] = useState('')
  const isDraggingRef = useRef(false)

  useEffect(() => {
    const handleWindowMouseUp = () => endSelection()
    window.addEventListener('mouseup', handleWindowMouseUp)
    return () => window.removeEventListener('mouseup', handleWindowMouseUp)
  }, [selectionStart, selectedCells, onApplySelection, onSelectionEnd])

  if (loading || !gridData) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 overflow-auto flex items-center justify-center">
        <div className="text-center">
          <button
            onClick={() => { onBack() }}
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium mb-4"
          >
            ← Back to plans
          </button>
          {loading && (
            <div className="text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400 border-t-transparent mb-3 mx-auto"></div>
              Loading plan…
            </div>
          )}
        </div>
      </div>
    )
  }

  const dates = getDatesArray(gridData)
  const monthGroups = getMonthGroups(dates)
  const monthBoundaryDates = getMonthBoundaryDates(dates)
  const shareUrl = window.location.origin + window.location.pathname + '#/plan/' + gridData.plan.share_token

  const handleCellMouseDown = (participantId: number, date: string) => {
    isDraggingRef.current = true
    onSelectionStart(participantId, date)
  }

  const handleCellMouseOver = (participantId: number, date: string) => {
    if (selectionStart && isDraggingRef.current) {
      onSelectionUpdate(selectionStart, { participantId, date })
    }
  }

  const endSelection = () => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    if (selectionStart && selectedCells.size > 0) {
      onApplySelection()
    }
    onSelectionEnd()
  }

  const handleMouseUp = () => {
    endSelection()
  }

  const isCellSelected = (participantId: number, date: string) => selectedCells.has(`${participantId}|${date}`)
  const isAvailable = (participantId: number, date: string) =>
    gridData.availabilities.some((a) => a.participant_id === participantId && a.date === date && a.is_available)
  const getSummaryCount = (date: string) => {
    const s = gridData.summary_by_date.find((x) => x.date === date)
    return s ? s.count : 0
  }
  const getSummaryStyle = (date: string): React.CSSProperties => {
    const total = gridData.participants.length
    const free = getSummaryCount(date)
    const ratio = total === 0 ? 0 : Math.max(0, Math.min(1, free / total))
    // Smooth red -> green gradient
    const r = Math.round(220 * (1 - ratio) + 34 * ratio)
    const g = Math.round(38 * (1 - ratio) + 197 * ratio)
    const b = Math.round(38 * (1 - ratio) + 94 * ratio)
    return {
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.25)`,
      color: `rgb(${Math.round(r + 20)}, ${Math.round(g + 20)}, ${Math.round(b + 20)})`,
    }
  }

  return (
    <div onMouseUp={handleMouseUp} className="fixed inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 overflow-auto">
      <div className="max-w-full px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <button
            onClick={() => { onBack() }}
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium mb-4"
          >
            ← Back to plans
          </button>

          {isEditingPlanName ? (
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={editPlanName}
                onChange={(e) => setEditPlanName(e.target.value)}
                className="text-4xl font-bold px-3 py-2 bg-slate-950 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editPlanName.trim()) {
                    onRenamePlan(editPlanName)
                    setIsEditingPlanName(false)
                  } else if (e.key === 'Escape') {
                    setEditPlanName(gridData?.plan.name || '')
                    setIsEditingPlanName(false)
                  }
                }}
              />
              <button
                onClick={() => {
                  if (editPlanName.trim()) {
                    onRenamePlan(editPlanName)
                  }
                  setIsEditingPlanName(false)
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditPlanName(gridData?.plan.name || '')
                  setIsEditingPlanName(false)
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {gridData?.plan.name}
              </h1>
              <button
                onClick={() => setIsEditingPlanName(true)}
                className="text-slate-400 hover:text-blue-400 transition-colors text-xl"
                title="Edit plan name"
              >
                ✎
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="ml-auto px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
              >
                Copy link
              </button>
            </div>
          )}
        </div>

        {/* Add Participant Bar */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5 mb-8">
          <label className="block text-slate-300 text-sm font-semibold mb-3">Add Participant</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && participantName.trim()) {
                  onAddParticipant(participantName)
                  setParticipantName('')
                }
              }}
              placeholder="Enter name..."
              className="flex-1 px-4 py-3 bg-slate-950 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            <button
              onClick={() => {
                if (participantName.trim()) {
                  onAddParticipant(participantName)
                  setParticipantName('')
                }
              }}
              disabled={!participantName.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl overflow-hidden">
          <div className="grid-scrollbar overflow-x-auto select-none">
        <table className="border-separate border-spacing-0 w-full text-sm bg-slate-800">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 px-4 py-3 text-left bg-slate-900 font-semibold border border-slate-700 relative after:absolute after:top-0 after:right-[-1px] after:h-full after:w-[6px] after:bg-slate-900"></th>
              {monthGroups.map((g, i) => (
                <th
                  key={i}
                  colSpan={g.span}
                  className={`bg-slate-900/80 py-2 px-2 text-xs uppercase tracking-wide text-slate-400 font-medium border border-slate-700 min-w-[32px] ${
                    i < monthGroups.length - 1 ? 'border-r-2 border-slate-600' : ''
                  }`}
                >
                  {g.label}
                </th>
              ))}
            </tr>
            <tr>
              <th className="sticky left-0 z-30 py-2 px-4 text-left font-medium text-xs text-slate-300 uppercase tracking-wide border border-slate-700 border-b-2 border-b-blue-500/30 bg-slate-900 relative after:absolute after:top-0 after:right-[-1px] after:h-full after:w-[6px] after:bg-slate-900">Name</th>
              {dates.map((d) => (
                <th
                  key={d}
                  className={`py-2.5 px-2 text-sm font-semibold bg-slate-900/50 text-slate-300 border border-slate-700 border-b-2 border-b-blue-500/30 min-w-[40px] ${
                    monthBoundaryDates.has(d) ? 'border-r-2 border-slate-600' : ''
                  }`}
                >
                  {new Date(d + 'Z').getDate()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gridData.participants.map((p) => (
              <tr key={p.id} className="group hover:bg-slate-700/30 transition-colors">
                <td className="sticky left-0 z-10 px-3 py-3 text-left bg-slate-800 group-hover:bg-slate-700 font-medium border border-slate-700 border-r-2 border-r-blue-500/20 relative after:absolute after:top-0 after:right-[-1px] after:h-full after:w-[6px] after:bg-slate-800 group-hover:after:bg-slate-700 transition-colors">
                  {editingParticipantId === p.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingParticipantName}
                        onChange={(e) => setEditingParticipantName(e.target.value)}
                        className="flex-1 px-2 py-1 bg-slate-950 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && editingParticipantName.trim()) {
                            onRenameParticipant(p.id, editingParticipantName)
                            setEditingParticipantId(null)
                          } else if (e.key === 'Escape') {
                            setEditingParticipantId(null)
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (editingParticipantName.trim()) {
                            onRenameParticipant(p.id, editingParticipantName)
                          }
                          setEditingParticipantId(null)
                        }}
                        className="text-blue-400 hover:text-blue-300 transition-colors text-xs"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingParticipantId(null)}
                        className="text-slate-500 hover:text-red-400 transition-colors text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-100">{p.name}</span>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingParticipantId(p.id)
                            setEditingParticipantName(p.name)
                          }}
                          className="text-slate-500 hover:text-blue-400 transition-colors text-sm"
                          title="Edit participant name"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => onDeleteParticipant(p.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors text-sm"
                          title="Delete participant"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </td>
                {dates.map((d) => {
                  const available = isAvailable(p.id, d)
                  const selected = isCellSelected(p.id, d)
                  return (
                    <td
                      key={d}
                      className={`text-center py-2.5 px-2 border border-slate-700 cursor-pointer transition-colors ${
                        available ? 'bg-blue-500/15 hover:bg-blue-500/25' : 'hover:bg-slate-700/30'
                      } ${
                        monthBoundaryDates.has(d) ? 'border-r-2 border-slate-600' : ''
                      }`}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleCellMouseDown(p.id, d)
                      }}
                      onMouseOver={() => handleCellMouseOver(p.id, d)}
                    >
                      <button
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold transition-all hover:scale-110 ${
                          available
                            ? `bg-success text-white shadow-sm shadow-success/20 ${selected ? 'ring-2 ring-success ring-opacity-60 scale-105' : ''}`
                            : `bg-slate-700 text-slate-400 hover:bg-slate-600 ${selected ? 'ring-2 ring-slate-500 ring-opacity-60 scale-105' : ''}`
                        }`}
                        title={available ? 'Free' : 'Busy'}
                        onContextMenu={(e) => e.preventDefault()}
                      >
                        {available ? '✓' : '○'}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
            <tr className="border-t-2 border-t-blue-500/30">
              <td className="sticky left-0 z-20 px-3 py-2 font-bold text-blue-400 bg-slate-800 whitespace-nowrap border border-slate-700 border-r-2 border-r-blue-500/30 border-t-2 border-t-blue-500/30 relative after:absolute after:top-0 after:right-[-1px] after:h-full after:w-[6px] after:bg-slate-800">
                <div className="flex items-center gap-2">
                  <span>Total</span>
                </div>
              </td>
              {dates.map((d) => (
                <td
                  key={d}
                  style={getSummaryStyle(d)}
                  className={`text-center py-2 px-2 font-extrabold text-base border border-slate-700 border-t-2 border-t-blue-500/30 ${
                    monthBoundaryDates.has(d) ? 'border-r-2 border-slate-600' : ''
                  }`}
                >
                  {getSummaryCount(d)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
          </div>
        </div>
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

function getMonthGroups(dates: string[]): Array<{ label: string; span: number }> {
  const groups: Array<{ label: string; span: number }> = []
  dates.forEach((d) => {
    const label = new Date(d + 'Z').toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    const last = groups[groups.length - 1]
    if (!last || last.label !== label) groups.push({ label, span: 1 })
    else last.span += 1
  })
  return groups
}

function getMonthBoundaryDates(dates: string[]): Set<string> {
  const boundaries = new Set<string>()
  for (let i = 0; i < dates.length; i++) {
    const current = dates[i]
    const next = dates[i + 1]
    if (!next) {
      boundaries.add(current)
      continue
    }
    const currentLabel = new Date(current + 'Z').toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    const nextLabel = new Date(next + 'Z').toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    if (currentLabel !== nextLabel) {
      boundaries.add(current)
    }
  }
  return boundaries
}
