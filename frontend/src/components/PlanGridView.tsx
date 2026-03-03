import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { PlanGrid } from '../types'

interface PlanGridViewProps {
  gridData: PlanGrid | null
  loading: boolean
  currentPlanId: number | null
  selectionStart: { participantId: number; date: string } | null
  selectedCells: Set<string>
  activeStatus: 'yes' | 'maybe' | 'no' | 'unknown' | null
  onSetActiveStatus: (status: 'yes' | 'maybe' | 'no' | 'unknown' | null) => void
  onBack: () => void
  onSelectionStart: (participantId: number, date: string) => void
  onSelectionUpdate: (start: { participantId: number; date: string }, end: { participantId: number; date: string }) => void
  onApplySelection: () => void
  onSelectionEnd: () => void
  onAddParticipant: (name: string) => void
  onDeleteParticipant: (participantId: number) => void
  onRenamePlan: (name: string) => void
  onRenameParticipant: (participantId: number, name: string) => void
  onRefresh: () => void
}

export function PlanGridView({
  gridData,
  loading,
  selectionStart,
  selectedCells,
  activeStatus,
  onSetActiveStatus,
  onBack,
  onSelectionStart,
  onSelectionUpdate,
  onApplySelection,
  onSelectionEnd,
  onAddParticipant,
  onDeleteParticipant,
  onRenamePlan,
  onRenameParticipant,
  onRefresh,
}: PlanGridViewProps) {
  const [participantName, setParticipantName] = useState('')
  const [isEditingPlanName, setIsEditingPlanName] = useState(false)
  const [editPlanName, setEditPlanName] = useState(gridData?.plan.name || '')
  const [editingParticipantId, setEditingParticipantId] = useState<number | null>(null)
  const [editingParticipantName, setEditingParticipantName] = useState('')
  const isDraggingRef = useRef(false)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const [refreshSortVersion, setRefreshSortVersion] = useState(0)

  // Sort participants once on initial load, or when participants change, or when manually refreshed
  const participantIds = gridData?.participants.map((p) => p.id).join(',') ?? ''
  const sortedParticipants = useMemo(() => {
    if (!gridData) return []
    return [...gridData.participants].sort((a, b) => {
      const aCount = gridData.availabilities.filter((av) => av.participant_id === a.id).length
      const bCount = gridData.availabilities.filter((av) => av.participant_id === b.id).length
      return bCount - aCount
    })
  }, [participantIds, refreshSortVersion])

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
  const getAvailability = (participantId: number, date: string) => {
    const a = gridData.availabilities.find((a) => a.participant_id === participantId && a.date === date)
    return a ? a.status : 'unknown'
  }
  
  const getSummaryScore = (date: string) => {
    const s = gridData.summary_by_date.find((x) => x.date === date)
    if (!s) return 0
    return s.yes_count + (s.maybe_count * 0.5) // Score for coloring
  }
  const getSummaryDisplayValue = (date: string) => {
    const s = gridData.summary_by_date.find((x) => x.date === date)
    return s ? s.yes_count + (s.maybe_count * 0.5) : 0
  }

  const maxSummaryScore = Math.max(0, ...dates.map((d) => getSummaryScore(d)))
  const getSummaryStyle = (date: string): React.CSSProperties => {
    const score = getSummaryScore(date)
    const ratio = maxSummaryScore === 0 ? 0 : Math.max(0, Math.min(1, score / maxSummaryScore))
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
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => {
                    onRefresh()
                    setRefreshSortVersion(v => v + 1)
                  }}
                  className="px-4 py-2 bg-slate-700 border border-slate-600 hover:border-slate-500 hover:bg-slate-600 active:bg-slate-800 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Refresh
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(shareUrl)}
                  className="px-4 py-2 bg-slate-700 border border-slate-600 hover:border-slate-500 hover:bg-slate-600 active:bg-slate-800 text-white font-medium rounded-lg transition-colors"
                >
                  Copy link
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-fit mx-auto">
          {/* Add Participant Bar */}
          <div className="flex items-center gap-3 mb-6 w-full">
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
              placeholder="Add participant..."
              className="px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all w-64"
            />
            <button
              onClick={() => {
                if (participantName.trim()) {
                  onAddParticipant(participantName)
                  setParticipantName('')
                }
              }}
              disabled={!participantName.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              Add
            </button>
            <div className="ml-auto flex items-center gap-2 border border-slate-700 py-1.5 px-2 rounded-lg bg-slate-900">
              <span className="text-sm font-medium text-slate-400 px-2 mr-1">Paint:</span>
              <button
                onClick={() => onSetActiveStatus(null)}
                className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-1.5 ${
                  activeStatus === null 
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-white scale-105' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Click
              </button>
              <button
                onClick={() => onSetActiveStatus('yes')}
                className={`w-8 h-8 rounded-md transition-all flex items-center justify-center ${
                  activeStatus === 'yes' 
                    ? 'bg-green-500 text-white shadow-sm shadow-green-500/20 ring-2 ring-white scale-105' 
                    : 'bg-green-500/15 text-green-500 hover:bg-green-500/25'
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center bg-green-500 text-white rounded text-xs font-bold select-none shadow-sm pb-[1px]">✓</span>
              </button>
              <button
                onClick={() => onSetActiveStatus('maybe')}
                className={`w-8 h-8 rounded-md transition-all flex items-center justify-center ${
                  activeStatus === 'maybe' 
                    ? 'bg-yellow-500 text-white shadow-sm shadow-yellow-500/20 ring-2 ring-white scale-105' 
                    : 'bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/25'
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center bg-yellow-500 text-white rounded text-xs font-bold select-none shadow-sm pb-[1px]">?</span>
              </button>
              <button
                onClick={() => onSetActiveStatus('no')}
                className={`w-8 h-8 rounded-md transition-all flex items-center justify-center ${
                  activeStatus === 'no' 
                    ? 'bg-red-500 text-white shadow-sm shadow-red-500/20 ring-2 ring-white scale-105' 
                    : 'bg-red-500/15 text-red-500 hover:bg-red-500/25'
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center bg-red-500 text-white rounded text-xs font-bold select-none shadow-sm pb-[1px]">✕</span>
              </button>
              <button
                onClick={() => onSetActiveStatus('unknown')}
                className={`w-8 h-8 rounded-md transition-all flex items-center justify-center ${
                  activeStatus === 'unknown' 
                    ? 'bg-slate-600 text-white shadow-sm shadow-slate-600/20 ring-2 ring-white scale-105' 
                    : 'bg-slate-700/30 text-slate-400 hover:bg-slate-700/50'
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center bg-slate-700 text-slate-400 rounded text-xs font-bold select-none shadow-sm pb-[1px]">○</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl overflow-hidden">
            <div className="grid-scrollbar overflow-x-auto select-none">
        <table className="border-separate border-spacing-0 w-auto text-sm bg-slate-800">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 px-4 py-3 text-left bg-slate-900 font-semibold border border-slate-700 relative after:absolute after:top-0 after:right-[-1px] after:h-full after:w-[6px] after:bg-slate-900 rounded-tl-xl"></th>
              {monthGroups.map((g, i) => (
                <th
                  key={i}
                  colSpan={g.span}
                  className={`bg-slate-900/80 py-2 px-2 text-xs uppercase tracking-wide text-slate-400 font-medium border border-slate-700 min-w-[32px] ${
                    i < monthGroups.length - 1 ? 'border-r-2 border-slate-600' : ''
                  } ${i === monthGroups.length - 1 ? 'rounded-tr-xl' : ''}`}
                >
                  {g.label}
                </th>
              ))}
            </tr>
            <tr>
              <th className="sticky left-0 z-30 py-2 px-4 text-left font-medium text-xs text-slate-300 uppercase tracking-wide border border-slate-700 border-b-2 border-b-blue-500/30 bg-slate-900 relative after:absolute after:top-0 after:right-[-1px] after:h-full after:w-[6px] after:bg-slate-900">Name</th>
              {dates.map((d) => {
                const dayOfWeek = new Date(d + 'T00:00:00Z').getUTCDay()
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                return (
                <th
                  key={d}
                  className={`py-2.5 px-2 text-sm font-semibold bg-slate-900/50 border border-slate-700 border-b-2 border-b-blue-500/30 w-[48px] min-w-[48px] max-w-[48px] transition-colors ${
                    isWeekend ? 'text-blue-400' : 'text-slate-300'
                  } ${
                    monthBoundaryDates.has(d) ? 'border-r-2 border-slate-600' : ''
                  } ${
                    hoveredDate === d ? 'bg-slate-700/40' : ''
                  }`}
                >
                  {new Date(d + 'Z').getDate()}
                </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sortedParticipants.map((p) => (
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
                  const availability = getAvailability(p.id, d)
                  const selected = isCellSelected(p.id, d)
                  const isColHovered = hoveredDate === d
                  return (
                    <td
                      key={d}
                      className={`text-center align-middle border border-slate-700 cursor-pointer transition-colors w-[48px] min-w-[48px] max-w-[48px] h-[48px] ${
                        availability === 'yes' ? (isColHovered ? 'bg-green-500/25' : 'bg-green-500/15 hover:bg-green-500/25') :
                        availability === 'maybe' ? (isColHovered ? 'bg-yellow-500/25' : 'bg-yellow-500/15 hover:bg-yellow-500/25') :
                        availability === 'no' ? (isColHovered ? 'bg-red-500/25' : 'bg-red-500/15 hover:bg-red-500/25') :
                        (isColHovered ? 'bg-slate-700/30' : 'hover:bg-slate-700/30')
                      } ${
                        monthBoundaryDates.has(d) ? 'border-r-2 border-slate-600' : ''
                      }`}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleCellMouseDown(p.id, d)
                      }}
                      onMouseOver={() => { handleCellMouseOver(p.id, d); setHoveredDate(d) }}
                      onMouseLeave={() => setHoveredDate(null)}
                    >
                      <button
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold transition-all hover:scale-110 mx-auto ${
                          availability === 'yes' ? 'bg-green-500 text-white shadow-sm shadow-green-500/20' :
                          availability === 'maybe' ? 'bg-yellow-500 text-white shadow-sm shadow-yellow-500/20' :
                          availability === 'no' ? 'bg-red-500 text-white shadow-sm shadow-red-500/20' :
                          'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        } ${selected ? 'ring-2 ring-white ring-opacity-100 scale-105' : ''}`}
                        title={availability === 'yes' ? 'Yes' : availability === 'maybe' ? 'Maybe' : availability === 'no' ? 'No' : 'Unknown'}
                        onContextMenu={(e) => e.preventDefault()}
                      >
                        {availability === 'yes' ? '✓' : availability === 'maybe' ? '?' : availability === 'no' ? '✕' : '○'}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
            <tr className="border-t-2 border-t-blue-500/30">
              <td className="sticky left-0 z-20 px-3 py-2 font-bold text-blue-400 bg-slate-800 whitespace-nowrap border border-slate-700 border-r-2 border-r-blue-500/30 border-t-2 border-t-blue-500/30 relative after:absolute after:top-0 after:right-[-1px] after:h-full after:w-[6px] after:bg-slate-800 rounded-bl-xl">
                <div className="flex items-center gap-2">
                  <span>Total</span>
                </div>
              </td>
              {dates.map((d, i) => (
                <td
                  key={d}
                  style={getSummaryStyle(d)}
                  className={`text-center py-2 px-2 font-extrabold text-base border border-slate-700 border-t-2 border-t-blue-500/30 w-[48px] min-w-[48px] max-w-[48px] transition-colors ${
                    monthBoundaryDates.has(d) ? 'border-r-2 border-slate-600' : ''
                  } ${i === dates.length - 1 ? 'rounded-br-xl' : ''} ${
                    hoveredDate === d ? 'brightness-125' : ''
                  }`}
                >
                  {getSummaryDisplayValue(d)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

function getDatesArray(gridData: PlanGrid): string[] {
  const out: string[] = []
  let d = new Date(gridData.start_date + 'T00:00:00Z')
  const end = new Date(gridData.end_date + 'T00:00:00Z')
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10))
    d.setUTCDate(d.getUTCDate() + 1)
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
