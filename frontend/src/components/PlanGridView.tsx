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
  currentPlanId,
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
  const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 })
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
      <div>
        <a href="#/" onClick={(e) => { e.preventDefault(); onBack() }} className="text-success font-medium hover:underline">
          ← Plans
        </a>
        {loading && <p className="text-dark-textMuted mt-4">Loading grid…</p>}
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
    <div onMouseUp={handleMouseUp}>
      <div className="flex justify-between items-center mb-8">
        <div className="flex-1">
          <a href="#/" onClick={(e) => { e.preventDefault(); onBack() }} className="text-success font-medium hover:underline">
            ← Plans
          </a>
          {isEditingPlanName ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={editPlanName}
                onChange={(e) => setEditPlanName(e.target.value)}
                className="text-2xl font-bold px-2 py-1 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:border-success"
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
                className="btn-primary btn-small"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditPlanName(gridData?.plan.name || '')
                  setIsEditingPlanName(false)
                }}
                className="btn-secondary btn-small"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 mt-2">
              <h1 className="m-0 text-2xl font-bold">{gridData?.plan.name}</h1>
              <button
                onClick={() => setIsEditingPlanName(true)}
                className="text-gray-400 hover:text-success transition-colors"
                title="Edit plan name"
              >
                ✎
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(shareUrl)}
          className="btn-secondary btn-small"
        >
          Copy link
        </button>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-lg p-4 mb-6">
        <div className="flex gap-3 flex-wrap items-center">
          <label className="text-sm font-medium text-dark-textMuted">Add participant:</label>
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
            className="flex-1 min-w-[200px] px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-dark-text placeholder-gray-500 focus:outline-none focus:border-success focus:ring-1 focus:ring-success transition-colors"
          />
          <button
            onClick={() => {
              if (participantName.trim()) {
                onAddParticipant(participantName)
                setParticipantName('')
              }
            }}
            disabled={!participantName.trim()}
            className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Add
          </button>
        </div>
      </div>

      <div
        className="grid-scrollbar overflow-x-auto bg-dark-table rounded-lg border border-dark-border shadow-lg select-none"
        onScroll={(e) => setScrollPos({ left: e.currentTarget.scrollLeft, top: e.currentTarget.scrollTop })}
      >
        <table className="border-separate border-spacing-0 w-full text-sm border border-dark-border bg-dark-table">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 px-4 py-3 text-left bg-dark-bg font-semibold border border-dark-border relative after:absolute after:top-0 after:right-[-1px] after:h-full after:w-[6px] after:bg-dark-bg"></th>
              {monthGroups.map((g, i) => (
                <th
                  key={i}
                  colSpan={g.span}
                  className={`bg-gray-900 py-2 px-2 text-xs uppercase tracking-wide text-dark-textMuted font-medium border border-dark-border min-w-[32px] ${
                    i < monthGroups.length - 1 ? 'border-r-2 border-dark-border' : ''
                  }`}
                >
                  {g.label}
                </th>
              ))}
            </tr>
            <tr>
              <th className="sticky left-0 z-30 py-2 px-4 text-left font-medium text-xs text-gray-400 uppercase tracking-wide border border-dark-border border-b-2 border-b-success/30 bg-dark-bg relative after:absolute after:top-0 after:right-[-1px] after:h-full after:w-[6px] after:bg-dark-bg">Name</th>
              {dates.map((d) => (
                <th
                  key={d}
                  className={`py-2.5 px-2 text-sm font-semibold bg-gray-900/50 text-gray-300 border border-dark-border border-b-2 border-b-success/30 min-w-[40px] ${
                    monthBoundaryDates.has(d) ? 'border-r-2 border-dark-border' : ''
                  }`}
                >
                  {new Date(d + 'Z').getDate()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gridData.participants.map((p) => (
              <tr key={p.id} className="group hover:bg-dark-card transition-colors">
                <td className="sticky left-0 z-10 px-3 py-3 text-left bg-dark-table group-hover:bg-dark-card font-medium border border-dark-border border-r-2 border-r-success/20 relative after:absolute after:top-0 after:right-[-1px] after:h-full after:w-[6px] after:bg-dark-table group-hover:after:bg-dark-card transition-colors">
                  {editingParticipantId === p.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingParticipantName}
                        onChange={(e) => setEditingParticipantName(e.target.value)}
                        className="flex-1 px-2 py-1 bg-dark-bg border border-dark-border rounded text-dark-text focus:outline-none focus:border-success text-sm"
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
                        className="text-success hover:text-success/70 transition-colors text-xs"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingParticipantId(null)}
                        className="text-gray-500 hover:text-red-400 transition-colors text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-200">{p.name}</span>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingParticipantId(p.id)
                            setEditingParticipantName(p.name)
                          }}
                          className="text-gray-500 hover:text-success transition-colors text-sm"
                          title="Edit participant name"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => onDeleteParticipant(p.id)}
                          className="text-gray-500 hover:text-red-400 transition-colors text-sm"
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
                      className={`text-center py-2.5 px-2 border border-dark-border cursor-pointer transition-colors ${
                        available ? 'bg-success/10 hover:bg-success/20' : 'hover:bg-gray-800/30'
                      } ${
                        monthBoundaryDates.has(d) ? 'border-r-2 border-dark-border' : ''
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
                            ? `bg-success text-dark-bg shadow-sm shadow-success/20 ${selected ? 'ring-2 ring-success ring-opacity-60 scale-105' : ''}`
                            : `bg-gray-700 text-gray-400 hover:bg-gray-600 ${selected ? 'ring-2 ring-gray-500 ring-opacity-60 scale-105' : ''}`
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
            <tr className="border-t-2 border-t-success/30">
              <td className="sticky left-0 z-20 px-3 py-2 font-bold text-success bg-gradient-to-r from-dark-table to-dark-card whitespace-nowrap border border-dark-border border-r-2 border-r-success/30 border-t-2 border-t-success/30 relative after:absolute after:top-0 after:right-[-1px] after:h-full after:w-[6px] after:bg-dark-table shadow-sm">
                <div className="flex items-center gap-2">
                  <span>Total</span>
                </div>
              </td>
              {dates.map((d) => (
                <td
                  key={d}
                  style={getSummaryStyle(d)}
                  className={`text-center py-2 px-2 font-extrabold text-base border border-dark-border border-t-2 border-t-success/30 shadow-inner ${
                    monthBoundaryDates.has(d) ? 'border-r-2 border-dark-border' : ''
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
