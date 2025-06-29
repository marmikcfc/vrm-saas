import React, { useState } from 'react';
import { Plus, Bot, Play, Edit, ArrowLeft, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useAgents } from '../hooks/useBackendData';

export default function Agents() {
  const navigate = useNavigate();
  const { agents, loading, error, createAgent, updateAgent, deleteAgent } = useAgents();
  const [testingAgent, setTestingAgent] = useState<string | null>(null);

  const TestAgentModal = ({ agentId, onClose }: { agentId: string; onClose: () => void }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [testMessage, setTestMessage] = useState('');
    const [conversation, setConversation] = useState([
      { speaker: 'Agent', message: 'Hello! I\'m your sales assistant. How can I help you today?', time: new Date() },
    ]);

    const agent = agents.find(a => a.id === agentId);

    const handleSendMessage = () => {
      if (!testMessage.trim()) return;

      // Add user message
      setConversation(prev => [...prev, {
        speaker: 'You',
        message: testMessage,
        time: new Date()
      }]);

      // Simulate agent response
      setTimeout(() => {
        const responses = [
          "That's a great question! Let me help you with that.",
          "I understand your concern. Here's what I can do for you...",
          "Perfect! I can definitely assist you with that request.",
          "Let me check that information for you right away.",
        ];
        
        setConversation(prev => [...prev, {
          speaker: 'Agent',
          message: responses[Math.floor(Math.random() * responses.length)],
          time: new Date()
        }]);
      }, 1000);

      setTestMessage('');
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Test Agent</h2>
              <p className="text-gray-500">{agent?.scenario} • {agent?.connection_details?.voice || 'Default Voice'}</p>
            </div>
            <button onClick={onClose}>
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Test Interface */}
          <div className="space-y-4">
            {/* Conversation */}
            <div className="border border-gray-200 rounded-lg p-4 h-64 overflow-y-auto bg-gray-50">
              <div className="space-y-3">
                {conversation.map((msg, index) => (
                  <div key={index} className={`flex ${msg.speaker === 'You' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-3 py-2 rounded-lg ${
                      msg.speaker === 'You' 
                        ? 'bg-brand text-white' 
                        : 'bg-white border border-gray-200'
                    }`}>
                      <div className="text-sm">{msg.message}</div>
                      <div className={`text-xs mt-1 ${
                        msg.speaker === 'You' ? 'text-brand-100' : 'text-gray-500'
                      }`}>
                        {msg.time.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Voice Test */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <Button
                size="sm"
                variant={isRecording ? "danger" : "primary"}
                icon={Play}
                onClick={() => setIsRecording(!isRecording)}
              >
                {isRecording ? 'Stop Recording' : 'Start Voice Test'}
              </Button>
              <span className="text-sm text-gray-600">
                {isRecording ? 'Recording... Speak now' : 'Test voice interaction with your agent'}
              </span>
            </div>

            {/* Text Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message to test your agent..."
                className="flex-1 rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
              />
              <Button onClick={handleSendMessage} disabled={!testMessage.trim()}>
                Send
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose}>
              Close Test
            </Button>
          </div>
        </div>
      </div>
    );
  };

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
        <div className="text-red-600 mb-4">Error loading agents: {error}</div>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-fg-high">AI Agents</h1>
          <p className="text-gray-500">Create and manage your voice-enabled agents</p>
        </div>
        <Button 
          icon={Plus} 
          onClick={() => navigate('/agents/wizard')}
        >
          Create Agent
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Card key={agent.id} className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <h3 className="font-semibold text-fg-high">{agent.scenario || 'Untitled Agent'}</h3>
                  <Badge variant="success">
                    active
                  </Badge>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">{agent.persona || 'No description available'}</p>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>0 calls</span>
              <span>{agent.connection_details?.voice || 'Default Voice'}</span>
            </div>

            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                icon={Play}
                onClick={() => setTestingAgent(agent.id)}
              >
                Test
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                icon={Edit}
                onClick={() => navigate(`/agents/wizard?edit=${agent.id}`)}
              >
                Edit
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty state if no agents */}
      {agents.length === 0 && (
        <Card className="text-center py-12">
          <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-fg-high mb-2">No agents yet</h3>
          <p className="text-gray-500 mb-6">Get started by creating your first voice-enabled agent</p>
          <Button 
            icon={Plus}
            onClick={() => navigate('/agents/wizard')}
          >
            Create Your First Agent
          </Button>
        </Card>
      )}

      {/* Test Agent Modal */}
      {testingAgent && (
        <TestAgentModal 
          agentId={testingAgent} 
          onClose={() => setTestingAgent(null)} 
        />
      )}
    </div>
  );
}