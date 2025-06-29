import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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

export interface TestRun {
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

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuthStore();

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
        
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAgents(data || []);
      } catch (err) {
        console.error('Error fetching agents:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch agents');
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [user, isAuthenticated]);

  const createAgent = async (agentData: Partial<Agent>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('agents')
        .insert({
          ...agentData,
          user_id: user.id,
          agent_id: `agent_${Date.now()}`,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      setAgents(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to create agent');
      return null;
    }
  };

  const updateAgent = async (id: string, updates: Partial<Agent>) => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      
      setAgents(prev => prev.map(agent => 
        agent.id === id ? { ...agent, ...data } : agent
      ));
      return data;
    } catch (err) {
      console.error('Error updating agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to update agent');
      return null;
    }
  };

  const deleteAgent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setAgents(prev => prev.filter(agent => agent.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete agent');
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

export function useTestRuns() {
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setTestRuns([]);
      setLoading(false);
      return;
    }

    const fetchTestRuns = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('test_runs')
          .select(`
            *,
            agents(scenario, persona)
          `)
          .eq('user_id', user.id)
          .order('started_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setTestRuns(data || []);
      } catch (err) {
        console.error('Error fetching test runs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch test runs');
        setTestRuns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTestRuns();
  }, [user, isAuthenticated]);

  const createTestRun = async (testRunData: Partial<TestRun>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('test_runs')
        .insert({
          ...testRunData,
          user_id: user.id,
          started_at: new Date().toISOString()
        })
        .select(`
          *,
          agents(scenario, persona)
        `)
        .single();

      if (error) throw error;
      
      setTestRuns(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating test run:', err);
      setError(err instanceof Error ? err.message : 'Failed to create test run');
      return null;
    }
  };

  const updateTestRun = async (id: string, updates: Partial<TestRun>) => {
    try {
      const { data, error } = await supabase
        .from('test_runs')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select(`
          *,
          agents(scenario, persona)
        `)
        .single();

      if (error) throw error;
      
      setTestRuns(prev => prev.map(run => 
        run.id === id ? { ...run, ...data } : run
      ));
      return data;
    } catch (err) {
      console.error('Error updating test run:', err);
      setError(err instanceof Error ? err.message : 'Failed to update test run');
      return null;
    }
  };

  return {
    testRuns,
    loading,
    error,
    createTestRun,
    updateTestRun,
  };
}

export function useMetrics() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuthStore();

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
        
        const { data, error } = await supabase
          .from('metrics')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMetrics(data || []);
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
        setMetrics([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [user, isAuthenticated]);

  const createMetric = async (metricData: Partial<Metric>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('metrics')
        .insert({
          ...metricData,
          user_id: user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      setMetrics(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating metric:', err);
      setError(err instanceof Error ? err.message : 'Failed to create metric');
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

// Helper function to calculate metrics from test runs
export function calculatePlatformMetrics(testRuns: TestRun[], agents: Agent[]) {
  const totalCalls = testRuns.length;
  
  // Calculate average duration
  const completedRuns = testRuns.filter(run => run.completed_at && run.started_at);
  const totalDuration = completedRuns.reduce((sum, run) => {
    const start = new Date(run.started_at).getTime();
    const end = new Date(run.completed_at).getTime();
    return sum + (end - start);
  }, 0);
  
  const avgDurationMs = completedRuns.length > 0 ? totalDuration / completedRuns.length : 0;
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