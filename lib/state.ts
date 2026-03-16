import { create } from 'zustand'

export type Principal = 'adrian' | 'kev' | 'claude'
export type MessageSource = 'discord' | 'api' | 'heartbeat'

export interface Message {
  id: string
  source: MessageSource
  principal: Principal
  text: string
  timestamp: number
  metadata?: Record<string, any>
}

export interface Decision {
  id: string
  principal: Principal
  question: string
  state: 'pending' | 'active' | 'resolved' | 'archived'
  timestamp: number
  consolidationWindow?: { startMs: number; endMs: number }
  input?: Message[]
  output?: Message[]
}

export interface MeshState {
  messages: Message[]
  decisions: Decision[]
  heartbeat: { lastSync: number; latency: number }
  
  // Actions
  addMessage: (msg: Message) => void
  addDecision: (decision: Decision) => void
  updateDecision: (id: string, partial: Partial<Decision>) => void
  clearMessages: () => void
}

export const useMeshStore = create<MeshState>((set) => ({
  messages: [],
  decisions: [],
  heartbeat: { lastSync: 0, latency: 0 },
  
  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg].slice(-500), // Keep last 500
    })),
  
  addDecision: (decision) =>
    set((state) => ({
      decisions: [...state.decisions, decision],
    })),
  
  updateDecision: (id, partial) =>
    set((state) => ({
      decisions: state.decisions.map((d) =>
        d.id === id ? { ...d, ...partial } : d
      ),
    })),
  
  clearMessages: () =>
    set({ messages: [] }),
}))
