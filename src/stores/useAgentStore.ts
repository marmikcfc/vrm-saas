import { create } from 'zustand';

interface Agent {
  id: string;
  name: string;
  identity: string;
  avatar: string;
  voice: string;
  status: 'active' | 'draft' | 'inactive';
  calls: number;
  createdAt: string;
  updatedAt: string;
}

interface AgentStore {
  agents: Agent[];
  selectedAgentId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setAgents: (agents: Agent[]) => void;
  setSelectedAgent: (id: string | null) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: [],
  selectedAgentId: null,
  isLoading: false,
  error: null,

  setAgents: (agents) => set({ agents }),
  
  setSelectedAgent: (id) => set({ selectedAgentId: id }),
  
  addAgent: (agent) => set((state) => ({
    agents: [...state.agents, agent]
  })),
  
  updateAgent: (id, updates) => set((state) => ({
    agents: state.agents.map(agent => 
      agent.id === id ? { ...agent, ...updates } : agent
    )
  })),
  
  deleteAgent: (id) => set((state) => ({
    agents: state.agents.filter(agent => agent.id !== id),
    selectedAgentId: state.selectedAgentId === id ? null : state.selectedAgentId
  })),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
}));