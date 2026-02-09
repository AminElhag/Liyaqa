import { create } from 'zustand'

interface ImpersonationState {
  active: boolean
  facilityName: string
  startTime: number | null
  start: (facilityName: string) => void
  end: () => void
}

export const useImpersonationStore = create<ImpersonationState>((set) => ({
  active: false,
  facilityName: '',
  startTime: null,
  start: (facilityName) =>
    set({ active: true, facilityName, startTime: Date.now() }),
  end: () =>
    set({ active: false, facilityName: '', startTime: null }),
}))
