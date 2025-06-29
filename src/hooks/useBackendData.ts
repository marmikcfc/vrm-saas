import { useState, useEffect } from 'react';
import { apiClient, agentApi, callsApi, metricsApi } from '../lib/api';
import { useAuthStore } from '../stores/useAuthStore';

export interface Agent {
  id: string;
  agent_id: string;
  agent_type: string;
  connection_details: any;
  direction: string;
  persona: string;
  scenario: string;
  user_id: string;
  created_at: string;
}

export interface Call {
  id: string;
  user_id: string;
  agent_id: string;
  test_case_ids: any;
  time_limit: number;
  outbound_call_params: any;
  status: string;
  started_at: string;
  completed_at: string;
  results: any;
  error: string;
  agents?: {
    scenario: string;
    persona: string;
  };
}

export interface Metric {
  id: string;
  name: string;
  prompt: string;
  user_id: string;
  created_at: string;
}

// Set up API token when user changes
export function useApiToken() {
  const { user } = useAuthStore();
  
  useEffect(() => {
    // In a real implementation, you'd get the JWT token from the auth store
    // For now, we'll use a placeholder or get it from localStorage
    const token = localStorage.getItem('auth_token');
    apiClient.setToken(token);
  }, [user]);
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuthStore();

  useApiToken();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setAgents([]);
      setLoading(false);
      return;
    }

    const fetchAgents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await agentApi.list();
        setAgents(response.data || []);
      } catch (err: any) {
        console.error('Error fetching agents:', err);
        setError(err.message || 'Failed to fetch agents');
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [user, isAuthenticated]);

  const createAgent = async (agentData: Partial<Agent>) => {
    try {
      const response = await agentApi.create(agentData);
      const newAgent = response.data;
      
      setAgents(prev => [newAgent, ...prev]);
      return newAgent;
    } catch (err: any) {
      console.error('Error creating agent:', err);
      setError(err.message || 'Failed to create agent');
      return null;
    }
  };

  const updateAgent = async (id: string, updates: Partial<Agent>) => {
    try {
      const response = await agentApi.update(id, updates);
      const updatedAgent = response.data;
      
      setAgents(prev => prev.map(agent => 
        agent.id === id ? { ...agent, ...updatedAgent } : agent
      ));
      return updatedAgent;
    } catch (err: any) {
      console.error('Error updating agent:', err);
      setError(err.message || 'Failed to update agent');
      return null;
    }
  };

  const deleteAgent = async (id: string) => {
    try {
      await agentApi.delete(id);
      setAgents(prev => prev.filter(agent => agent.id !== id));
      return true;
    } catch (err: any) {
      console.error('Error deleting agent:', err);
      setError(err.message || 'Failed to delete agent');
      return false;
    }
  };

  return {
    agents,
    loading,
    error,
    createAgent,
    updateAgent,
    deleteAgent,
  };
}

export function useCalls() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuthStore();

  useApiToken();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setCalls([]);
      setLoading(false);
      return;
    }

    const fetchCalls = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await callsApi.list();
        setCalls(response.data || []);
      } catch (err: any) {
        console.error('Error fetching calls:', err);
        setError(err.message || 'Failed to fetch calls');
        setCalls([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCalls();
  }, [user, isAuthenticated]);

  const startCall = async (agentId: string, customerInfo?: any) => {
    try {
      const response = await callsApi.start({ agentId, customerInfo });
      const newCall = response.data;
      
      setCalls(prev => [newCall, ...prev]);
      return newCall;
    } catch (err: any) {
      console.error('Error starting call:', err);
      setError(err.message || 'Failed to start call');
      return null;
    }
  };

  const endCall = async (id: string) => {
    try {
      const response = await callsApi.end(id);
      const updatedCall = response.data;
      
      setCalls(prev => prev.map(call => 
        call.id === id ? { ...call, ...updatedCall } : call
      ));
      return updatedCall;
    } catch (err: any) {
      console.error('Error ending call:', err);
      setError(err.message || 'Failed to end call');
      return null;
    }
  };

  return {
    calls,
    loading,
    error,
    startCall,
    endCall,
  };
}

export function useMetrics() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuthStore();

  useApiToken();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setMetrics([]);
      setLoading(false);
      return;
    }

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await metricsApi.list();
        setMetrics(response.data || []);
      } catch (err: any) {
        console.error('Error fetching metrics:', err);
        setError(err.message || 'Failed to fetch metrics');
        setMetrics([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [user, isAuthenticated]);

  const createMetric = async (metricData: Partial<Metric>) => {
    try {
      const response = await metricsApi.create(metricData);
      const newMetric = response.data;
      
      setMetrics(prev => [newMetric, ...prev]);
      return newMetric;
    } catch (err: any) {
      console.error('Error creating metric:', err);
      setError(err.message || 'Failed to create metric');
      return null;
    }
  };

  return {
    metrics,
    loading,
    error,
    createMetric,
  };
}

// Helper function to calculate metrics from calls
export function calculatePlatformMetrics(calls: Call[], agents: Agent[]) {
  const totalCalls = calls.length;
  
  // Calculate average duration
  const completedCalls = calls.filter(call => call.completed_at && call.started_at);
  const totalDuration = completedCalls.reduce((sum, call) => {
    const start = new Date(call.started_at).getTime();
    const end = new Date(call.completed_at).getTime();
    return sum + (end - start);
  }, 0);
  
  const avgDurationMs = completedCalls.length > 0 ? totalDuration / completedCalls.length : 0;
  const avgDurationMinutes = Math.round(avgDurationMs / 1000 / 60 * 100) / 100;
  
  // Calculate total minutes
  const totalMinutes = Math.round(totalDuration / 1000 / 60);
  
  // Calculate trends (mock for now - would need historical data)
  const callsTrend = Math.floor(Math.random() * 20) + 5; // 5-25%
  const durationTrend = Math.floor(Math.random() * 20) + 5; // 5-25%
  const minutesTrend = Math.floor(Math.random() * 20) + 5; // 5-25%

  return {
    totalCalls: totalCalls.toLocaleString(),
    avgDuration: avgDurationMinutes > 0 
      ? `${Math.floor(avgDurationMinutes)}:${String(Math.round((avgDurationMinutes % 1) * 60)).padStart(2, '0')}`
      : '0:00',
    totalMinutes: totalMinutes.toLocaleString(),
    trends: {
      calls: { value: callsTrend, label: 'this month' },
      duration: { value: durationTrend, label: 'this month' },
      minutes: { value: minutesTrend, label: 'this month' }
    }
  };
}