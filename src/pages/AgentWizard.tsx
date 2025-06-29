import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Github } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAgents } from '../hooks/useBackendData';

const steps = [
  { id: 1, name: 'Basics', description: 'Name, identity, and voice' },
  { id: 2, name: 'Prompts', description: 'Configure conversation prompts' },
  { id: 3, name: 'Deploy', description: 'Review and deploy your agent' },
];

const voices = [
  { id: 'sarah', name: 'Sarah', description: 'Professional, clear' },
  { id: 'alex', name: 'Alex', description: 'Friendly, approachable' },
  { id: 'emma', name: 'Emma', description: 'Warm, empathetic' },
  { id: 'james', name: 'James', description: 'Confident, authoritative' },
];

export default function AgentWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditing = !!editId;
  
  const { agents, createAgent, updateAgent } = useAgents();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    identity: '',
    voice: 'sarah',
    systemPrompt: '',
    introPrompt: '',
    fallbackPrompt: '',
    githubDeploy: false,
    repo: '',
  });

  // Load existing agent data if editing
  useEffect(() => {
    if (isEditing && editId && agents.length > 0) {
      const agentToEdit = agents.find(agent => agent.id === editId);
      if (agentToEdit) {
        setFormData({
          name: agentToEdit.scenario || '',
          identity: agentToEdit.persona || '',
          voice: agentToEdit.connection_details?.voice || 'sarah',
          systemPrompt: agentToEdit.connection_details?.systemPrompt || '',
          introPrompt: agentToEdit.connection_details?.introPrompt || '',
          fallbackPrompt: agentToEdit.connection_details?.fallbackPrompt || '',
          githubDeploy: false,
          repo: '',
        });
      }
    }
  }, [isEditing, editId, agents]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    
    try {
      const agentData = {
        scenario: formData.name,
        persona: formData.identity,
        agent_type: 'voice',
        connection_details: {
          voice: formData.voice,
          systemPrompt: formData.systemPrompt,
          introPrompt: formData.introPrompt,
          fallbackPrompt: formData.fallbackPrompt
        },
        direction: 'outbound'
      };

      if (isEditing && editId) {
        await updateAgent(editId, agentData);
      } else {
        await createAgent(agentData);
      }

      navigate('/agents');
    } catch (error) {
      console.error('Error saving agent:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          size="sm" 
          icon={ArrowLeft}
          onClick={() => navigate('/agents')}
        >
          Back to Agents
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-fg-high">
            {isEditing ? 'Edit Agent' : 'Create New Agent'}
          </h1>
          <p className="text-gray-500">
            {isEditing ? 'Update your voice-enabled AI assistant' : 'Set up your voice-enabled AI assistant'}
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              currentStep >= step.id 
                ? 'bg-brand border-brand text-white' 
                : 'border-gray-300 text-gray-300'
            }`}>
              {currentStep > step.id ? (
                <Check className="h-4 w-4" />
              ) : (
                step.id
              )}
            </div>
            <div className="ml-2 mr-8">
              <div className={`text-sm font-medium ${
                currentStep >= step.id ? 'text-brand' : 'text-gray-500'
              }`}>
                {step.name}
              </div>
              <div className="text-xs text-gray-500">{step.description}</div>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-px mr-8 ${
                currentStep > step.id ? 'bg-brand' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>

      <Card>
        {/* Step 1: Basics */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Basic Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent Name
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                placeholder="e.g., Sales Assistant"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Identity & Role
              </label>
              <textarea
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                rows={3}
                placeholder="Describe your agent's role and personality..."
                value={formData.identity}
                onChange={(e) => updateFormData('identity', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voice
              </label>
              <div className="space-y-2">
                {voices.map((voice) => (
                  <label key={voice.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="voice"
                      value={voice.id}
                      checked={formData.voice === voice.id}
                      onChange={(e) => updateFormData('voice', e.target.value)}
                      className="text-brand focus:ring-brand"
                    />
                    <div>
                      <div className="font-medium">{voice.name}</div>
                      <div className="text-sm text-gray-500">{voice.description}</div>
                    </div>
                    <Button size="sm" variant="outline" className="ml-auto">
                      Preview
                    </Button>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Prompts */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Conversation Prompts</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Prompt
              </label>
              <textarea
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                rows={4}
                placeholder="You are a helpful assistant that..."
                value={formData.systemPrompt}
                onChange={(e) => updateFormData('systemPrompt', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Introduction Prompt
              </label>
              <textarea
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                rows={3}
                placeholder="Hi! I'm here to help you..."
                value={formData.introPrompt}
                onChange={(e) => updateFormData('introPrompt', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fallback Prompt
              </label>
              <textarea
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                rows={3}
                placeholder="I'm sorry, I didn't understand that..."
                value={formData.fallbackPrompt}
                onChange={(e) => updateFormData('fallbackPrompt', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 3: Deploy */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">
              {isEditing ? 'Update Your Agent' : 'Deploy Your Agent'}
            </h2>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Agent Summary</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Name:</strong> {formData.name || 'Untitled Agent'}</div>
                <div><strong>Voice:</strong> {voices.find(v => v.id === formData.voice)?.name}</div>
                <div><strong>Identity:</strong> {formData.identity || 'No identity specified'}</div>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.githubDeploy}
                  onChange={(e) => updateFormData('githubDeploy', e.target.checked)}
                  className="text-brand focus:ring-brand"
                />
                <Github className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Create a PR</span>
              </label>
              <p className="text-sm text-gray-500 mt-1">
                Create a pull request with the widget code in your repository
              </p>
            </div>

            {formData.githubDeploy && (
              <div className="space-y-4 pl-6 border-l-2 border-brand/20">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Repository
                  </label>
                  <select
                    className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                    value={formData.repo}
                    onChange={(e) => updateFormData('repo', e.target.value)}
                  >
                    <option value="">Select repository...</option>
                    <option value="myorg/website">myorg/website</option>
                    <option value="myorg/app">myorg/app</option>
                    <option value="myorg/docs">myorg/docs</option>
                  </select>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-1">Automated Workflow</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div>• Create a new feature branch automatically</div>
                    <div>• Pull latest code from main branch</div>
                    <div>• Add widget integration code</div>
                    <div>• Create pull request for review</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          {currentStep < steps.length ? (
            <Button onClick={nextStep} icon={ArrowRight}>
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleFinish} 
              icon={Check}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {isEditing ? 'Update Agent' : 'Create Agent'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}