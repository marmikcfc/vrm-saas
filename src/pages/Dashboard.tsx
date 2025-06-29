import React, { useState } from 'react';
import { Phone, Clock, TrendingUp, Users, Plus, ArrowLeft, Play, Pause, Download, MessageSquare, Activity, Lightbulb, Timer, Bot, BookOpen, Server } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useCalls, useAgents, useMetrics, calculatePlatformMetrics } from '../hooks/useBackendData';

export default function Dashboard() {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [showCustomAction, setShowCustomAction] = useState(false);

  // Fetch real data from backend APIs
  const { calls, loading: callsLoading } = useCalls();
  const { agents, loading: agentsLoading } = useAgents();
  const { metrics, createMetric, loading: metricsLoading } = useMetrics();

  // Calculate platform metrics from real data
  const platformMetrics = calculatePlatformMetrics(calls, agents);

  const stats = [
    {
      label: 'Total Calls',
      value: platformMetrics.totalCalls,
      icon: Phone,
      trend: platformMetrics.trends.calls,
    },
    {
      label: 'Average Duration',
      value: platformMetrics.avgDuration,
      icon: Clock,
      trend: platformMetrics.trends.duration,
    },
    {
      label: 'Overall Minutes',
      value: platformMetrics.totalMinutes,
      icon: Timer,
      trend: platformMetrics.trends.minutes,
    },
  ];

  // Transform calls to recent sessions format
  const recentSessions = calls.slice(0, 5).map(call => ({
    id: call.id,
    agent: call.agents?.scenario || 'Unknown Agent',
    customer: call.results?.customer || call.outbound_call_params?.email || 'Unknown Customer',
    duration: call.results?.duration || calculateDuration(call.started_at, call.completed_at),
    status: call.status === 'completed' ? 'Completed' : call.status === 'in-progress' ? 'In Progress' : 'Failed',
    time: formatTimeAgo(call.started_at),
    sentiment: call.results?.sentiment || 'neutral',
    actions: call.results?.actions || 0,
  }));

  // Transform real metrics to display format
  const customMetrics = metrics.map(metric => ({
    id: metric.id,
    name: metric.name,
    count: Math.floor(Math.random() * 50) + 1, // Mock count for now
    trend: `+${Math.floor(Math.random() * 10) + 1} this week`,
    graphData: generateMockGraphData(Math.floor(Math.random() * 20) + 5)
  }));

  const selectedSessionData = recentSessions.find(s => s.id === selectedSession);

  const CustomActionModal = () => {
    const [actionData, setActionData] = useState({
      name: '',
      toolCall: '',
      description: '',
    });

    const handleSave = async () => {
      if (!actionData.name || !actionData.toolCall) return;

      await createMetric({
        name: actionData.name,
        toolCall: actionData.toolCall,
        description: actionData.description,
      });

      setShowCustomAction(false);
      setActionData({ name: '', toolCall: '', description: '' });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Add Custom Metric to Track</h2>
            <button onClick={() => setShowCustomAction(false)}>
              <Plus className="h-5 w-5 text-gray-400 rotate-45" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metric Name
              </label>
              <input
                type="text"
                value={actionData.name}
                onChange={(e) => setActionData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                placeholder="e.g., New Feature Requests, Support Tickets"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tool Call / Identifier
              </label>
              <input
                type="text"
                value={actionData.toolCall}
                onChange={(e) => setActionData(prev => ({ ...prev, toolCall: e.target.value }))}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                placeholder="e.g., createTicket, processRequest, handleInquiry"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={actionData.description}
                onChange={(e) => setActionData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                rows={3}
                placeholder="Describe what this metric tracks..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowCustomAction(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Add Metric
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const DayWiseGraph = ({ data }: { data: Array<{day: string, value: number, label: string}> }) => {
    const maxValue = Math.max(...data.map(d => d.value));

    return (
      <div className="mt-4">
        <div className="flex items-end justify-between h-20 gap-1">
          {data.map((point, index) => {
            const height = maxValue > 0 ? ((point.value / maxValue) * 100) : 0;
            const barHeight = Math.max(height, 8);
            
            return (
              <div key={index} className="flex flex-col items-center flex-1 group">
                <div className="relative flex-1 flex items-end w-full">
                  <div
                    className="w-full bg-brand rounded-t transition-all duration-200 hover:bg-brand-600 relative group-hover:scale-105"
                    style={{ height: `${barHeight}%` }}
                  >
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {point.label}: {point.value}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2 font-medium">
                  {point.day}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>0</span>
          <span className="text-gray-600 font-medium">Last 7 days</span>
          <span>{maxValue}</span>
        </div>
      </div>
    );
  };

  const SessionDetailView = () => {
    if (!selectedSessionData) return null;

    const selectedCall = calls.find(call => call.id === selectedSessionData.id);
    
    const transcript = selectedCall?.results?.transcript || [
      { speaker: 'Agent', message: 'Hello! How can I help you today?', time: '00:00' },
      { speaker: 'Customer', message: 'Hi, I\'m having trouble with my account setup.', time: '00:05' },
      { speaker: 'Agent', message: 'I\'d be happy to help you with that. Can you tell me what specific issue you\'re experiencing?', time: '00:10' },
    ];

    const actions = selectedCall?.results?.actionsTaken || [
      { action: 'Retrieved customer profile', time: '00:12', status: 'success' },
      { action: 'Checked payment methods', time: '00:28', status: 'success' },
    ];

    const insights = selectedCall?.results?.insights || [
      { type: 'sentiment', value: selectedSessionData.sentiment, description: 'Customer sentiment analysis' },
      { type: 'resolution', value: selectedSessionData.status, description: 'Call resolution status' },
      { type: 'satisfaction', value: '4.2/5', description: 'Estimated customer satisfaction score' },
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            icon={ArrowLeft}
            onClick={() => setSelectedSession(null)}
          >
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-fg-high">Session Details</h1>
            <p className="text-gray-500">{selectedSessionData.agent} • {selectedSessionData.customer}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" icon={Download}>
              Export
            </Button>
            <Button size="sm" variant="outline" icon={Play}>
              Play Recording
            </Button>
          </div>
        </div>

        {/* Session Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <div className="text-2xl font-semibold text-fg-high">{selectedSessionData.duration}</div>
              <div className="text-sm text-gray-500">Duration</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <Badge variant={selectedSessionData.sentiment === 'positive' ? 'success' : selectedSessionData.sentiment === 'negative' ? 'danger' : 'default'}>
                {selectedSessionData.sentiment}
              </Badge>
              <div className="text-sm text-gray-500 mt-1">Sentiment</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-semibold text-fg-high">{selectedSessionData.actions}</div>
              <div className="text-sm text-gray-500">Actions Taken</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <Badge variant={selectedSessionData.status === 'Completed' ? 'success' : 'warning'}>
                {selectedSessionData.status}
              </Badge>
              <div className="text-sm text-gray-500 mt-1">Status</div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transcript */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-semibold">Transcript</h2>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {transcript.map((entry, index) => (
                <div key={index} className="flex gap-3">
                  <div className="text-xs text-gray-500 w-12 flex-shrink-0 mt-1">{entry.time}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700">{entry.speaker}</div>
                    <div className="text-sm text-gray-600">{entry.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Actions Done */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-semibold">Actions Done</h2>
            </div>
            <div className="space-y-3">
              {actions.map((action, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 w-12">{action.time}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700">{action.action}</div>
                  </div>
                  <Badge variant={action.status === 'success' ? 'success' : 'danger'} size="sm">
                    {action.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recording & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recording */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Play className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-semibold">Recording</h2>
            </div>
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Button size="sm" icon={Play}>
                  Play
                </Button>
                <Button size="sm" variant="outline" icon={Download}>
                  Download
                </Button>
              </div>
              <div className="text-sm text-gray-500">
                Audio recording • {selectedSessionData.duration} • 2.4 MB
              </div>
            </div>
          </Card>

          {/* Insights */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-semibold">Insights</h2>
            </div>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium capitalize">{insight.type}</span>
                    <span className="text-sm font-semibold text-brand">{insight.value}</span>
                  </div>
                  <div className="text-xs text-gray-600">{insight.description}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  };

  if (selectedSession) {
    return <SessionDetailView />;
  }

  if (callsLoading || agentsLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-fg-high">Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
          />
        ))}
      </div>

      {/* Custom Metrics */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-fg-high">Custom Metrics</h2>
            <p className="text-sm text-gray-500">Track custom actions and metrics specific to your workflow</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            icon={Plus}
            onClick={() => setShowCustomAction(true)}
          >
            Add Custom Metric
          </Button>
        </div>
        
        {customMetrics.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {customMetrics.map((metric) => (
              <div key={metric.id} className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-fg-high group-hover:text-brand transition-colors">
                    {metric.name}
                  </h3>
                  <div className="text-right">
                    <div className="text-2xl font-semibold text-fg-high">{metric.count}</div>
                    <div className="text-xs text-green-600 font-medium">{metric.trend}</div>
                  </div>
                </div>

                <DayWiseGraph data={metric.graphData} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-fg-high mb-2">No custom metrics yet</h3>
            <p className="text-gray-500 mb-6">
              Start tracking custom metrics to monitor specific actions and KPIs in your workflow
            </p>
            <Button 
              icon={Plus}
              onClick={() => setShowCustomAction(true)}
            >
              Add Custom Metrics
            </Button>
          </div>
        )}
      </Card>

      {/* Recent Sessions */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-fg-high">Recent Sessions</h2>
          <Button variant="outline" size="sm">View All</Button>
        </div>
        
        {recentSessions.length > 0 ? (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentSessions.map((session) => (
                  <tr 
                    key={session.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedSession(session.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-fg-high">{session.agent}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{session.customer}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{session.duration}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        session.status === 'Completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{session.actions}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {session.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Phone className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No sessions yet</p>
            <p className="text-sm text-gray-400">Start by creating an agent and making some calls</p>
          </div>
        )}
      </Card>

      {/* Custom Action Modal */}
      {showCustomAction && <CustomActionModal />}
    </div>
  );
}

// Helper functions
function calculateDuration(startedAt: string, completedAt: string | null): string {
  if (!completedAt) return 'In Progress';
  
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const durationMs = end - start;
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatTimeAgo(dateString: string): string {
  const now = new Date().getTime();
  const date = new Date(dateString).getTime();
  const diffMs = now - date;
  
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  
  if (minutes < 60) return `${minutes} mins ago`;
  if (hours < 24) return `${hours} hours ago`;
  return `${days} days ago`;
}

function generateMockGraphData(baseValue: number) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day, index) => ({
    day,
    value: Math.max(0, baseValue + Math.floor(Math.random() * 10) - 5),
    label: `Jan ${15 + index}`
  }));
}