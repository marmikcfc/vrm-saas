import React, { useState } from 'react';
import { Search, Filter, Download, ArrowLeft, Play, MessageSquare, Activity, Lightbulb, Timer } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useCalls } from '../hooks/useBackendData';

export default function Calls() {
  const [selectedCall, setSelectedCall] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');

  const { calls, loading, error } = useCalls();

  // Transform calls to display format
  const transformedCalls = calls.map(call => ({
    id: call.id,
    agent: call.agents?.scenario || 'Unknown Agent',
    customer: call.results?.customer || call.outbound_call_params?.email || 'Unknown Customer',
    duration: calculateDuration(call.started_at, call.completed_at),
    status: call.status,
    sentiment: call.results?.sentiment || 'neutral',
    timestamp: formatTimestamp(call.started_at),
    actions: call.results?.actions || 0,
  }));

  // Filter calls based on search and filters
  const filteredCalls = transformedCalls.filter(call => {
    const matchesSearch = searchTerm === '' || 
      call.agent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.customer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || call.status === statusFilter;
    const matchesAgent = agentFilter === 'all' || call.agent === agentFilter;
    
    return matchesSearch && matchesStatus && matchesAgent;
  });

  const selectedCallData = filteredCalls.find(c => c.id === selectedCall);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'failed': return 'danger';
      default: return 'default';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'success';
      case 'negative': return 'danger';
      case 'neutral': return 'default';
      default: return 'default';
    }
  };

  const CallDetailView = () => {
    if (!selectedCallData) return null;

    const selectedCallRecord = calls.find(call => call.id === selectedCallData.id);
    
    const transcript = selectedCallRecord?.results?.transcript || [
      { speaker: 'Agent', message: 'Hello! How can I help you today?', time: '00:00' },
      { speaker: 'Customer', message: 'Hi, I\'m having trouble with my account setup.', time: '00:05' },
      { speaker: 'Agent', message: 'I\'d be happy to help you with that. Can you tell me what specific issue you\'re experiencing?', time: '00:10' },
      { speaker: 'Customer', message: 'I can\'t seem to connect my payment method.', time: '00:18' },
      { speaker: 'Agent', message: 'Let me check your account settings and help you resolve this.', time: '00:25' },
      { speaker: 'Customer', message: 'That would be great, thank you!', time: '00:30' },
      { speaker: 'Agent', message: 'I can see the issue. Let me guide you through the correct process.', time: '00:35' },
    ];

    const actions = selectedCallRecord?.results?.actionsTaken || [
      { action: 'Retrieved customer profile', time: '00:12', status: 'success' },
      { action: 'Checked payment methods', time: '00:28', status: 'success' },
      { action: 'Created support ticket #12345', time: '00:45', status: 'success' },
    ];

    const insights = selectedCallRecord?.results?.insights || [
      { type: 'sentiment', value: selectedCallData.sentiment, description: 'Overall conversation sentiment analysis' },
      { type: 'resolution', value: selectedCallData.status === 'completed' ? 'Resolved' : 'In Progress', description: 'Call resolution status' },
      { type: 'satisfaction', value: '4.2/5', description: 'Estimated customer satisfaction score' },
      { type: 'efficiency', value: 'High', description: 'Agent handled the call efficiently' },
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            icon={ArrowLeft}
            onClick={() => setSelectedCall(null)}
          >
            Back to Calls
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-fg-high">Call Details</h1>
            <p className="text-gray-500">{selectedCallData.agent} • {selectedCallData.customer}</p>
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

        {/* Call Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <div className="text-2xl font-semibold text-fg-high">{selectedCallData.duration}</div>
              <div className="text-sm text-gray-500">Duration</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <Badge variant={getSentimentColor(selectedCallData.sentiment)}>
                {selectedCallData.sentiment}
              </Badge>
              <div className="text-sm text-gray-500 mt-1">Sentiment</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-semibold text-fg-high">{selectedCallData.actions}</div>
              <div className="text-sm text-gray-500">Actions Taken</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <Badge variant={getStatusColor(selectedCallData.status)}>
                {selectedCallData.status}
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
                Audio recording • {selectedCallData.duration} • 3.2 MB
              </div>
            </div>
          </Card>

          {/* Insights */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-semibold">Call Insights</h2>
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

  if (selectedCall) {
    return <CallDetailView />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading calls: {error}</div>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  // Get unique agents for filter
  const uniqueAgents = [...new Set(transformedCalls.map(call => call.agent))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-fg-high">Calls</h1>
          <p className="text-gray-500">Monitor and analyze agent conversations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={Download}>
            Export
          </Button>
          <Button variant="outline" icon={Filter}>
            Filter
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search calls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-brand focus:outline-none"
            />
          </div>
          <select 
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand focus:outline-none"
          >
            <option value="all">All Agents</option>
            {uniqueAgents.map(agent => (
              <option key={agent} value={agent}>{agent}</option>
            ))}
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="in-progress">In Progress</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </Card>

      {/* Calls Table */}
      <Card padding={false}>
        {filteredCalls.length > 0 ? (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
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
                    Sentiment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCalls.map((call) => (
                  <tr 
                    key={call.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedCall(call.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-fg-high">{call.agent}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{call.customer}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{call.duration}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusColor(call.status)}>
                        {call.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getSentimentColor(call.sentiment)}>
                        {call.sentiment}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{call.actions}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {call.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Timer className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No calls found</p>
            <p className="text-sm text-gray-400">
              {searchTerm || statusFilter !== 'all' || agentFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Start by creating an agent and making some calls'
              }
            </p>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {filteredCalls.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {filteredCalls.length} of {transformedCalls.length} results
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      )}
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

function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}