export interface Plan {
  id: number
  share_token: string
  name: string
  start_date: string
  end_date: string
  created_by: string | null
  created_at: string | null
}

export interface Participant {
  id: number
  plan_id: number
  name: string
}

export interface Availability {
  id: number
  plan_id: number
  participant_id: number
  date: string
  is_available: boolean
}

export interface GridSummary {
  date: string
  count: number
}

export interface PlanGrid {
  plan: Plan
  participants: Participant[]
  start_date: string
  end_date: string
  availabilities: Availability[]
  summary_by_date: GridSummary[]
}

export type PlanCreate = Pick<Plan, 'name' | 'start_date' | 'end_date'> & { created_by?: string }
export type ParticipantCreate = Pick<Participant, 'name'> & { plan_id: number }
export type AvailabilityToggle = { participant_id: number; date: string; is_available: boolean }
