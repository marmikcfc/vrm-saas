import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { Plus, Server, FileText, ExternalLink, Settings, Play, Code, Book, ArrowLeft, Globe, CheckCircle, AlertTriangle, X, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const tabs = [
  { name: 'Server', icon: Server },
  { name: 'Tools', icon: Code },
  { name: 'Templates', icon: Book },
  { name: 'Prompts', icon: FileText },
];

export default function MCPs() {
  const navigate = useNavigate();
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [showAddResource, setShowAddResource] = useState(false);
  const [showAddPrompt, setShowAddPrompt] = useState(false);

  const servers = [
    {
      id: 'crm-api',
      name: 'CRM API',
      description: 'Customer relationship management operations',
      version: '1.2.0',
      status: 'active',
      lastUpdated: '2 days ago',
      url: 'https://api.crm.example.com',
      endpoints: 12,
      uptime: '99.9%',
      responseTime: '45ms',
    },
    {
      id: 'payment-gateway',
      name: 'Payment Gateway',
      description: 'Process payments and manage subscriptions',
      version: '2.1.0',
      status: 'draft',
      lastUpdated: '1 week ago',
      url: 'https://api.payments.example.com',
      endpoints: 8,
      uptime: '98.5%',
      responseTime: '120ms',
    },
    {
      id: 'analytics-api',
      name: 'Analytics API',
      description: 'Track user behavior and generate insights',
      version: '3.0.0',
      status: 'active',
      lastUpdated: '3 hours ago',
      url: 'https://api.analytics.example.com',
      endpoints: 15,
      uptime: '99.8%',
      responseTime: '32ms',
    },
  ];

  const tools = [
    { id: 1, name: 'createCustomer', description: 'Create a new customer record', enabled: true },
    { id: 2, name: 'getCustomer', description: 'Retrieve customer information', enabled: true },
    { id: 3, name: 'updateCustomer', description: 'Update customer details', enabled: false },
    { id: 4, name: 'deleteCustomer', description: 'Remove customer account', enabled: false },
    { id: 5, name: 'listOrders', description: 'Get customer order history', enabled: true },
  ];

  const templates = [
    { id: 1, name: 'Customer Onboarding', type: 'prompt', description: 'Welcome new customers', linkedPrompt: 'Welcome Prompt' },
    { id: 2, name: 'Order Summary Card', type: 'ui', description: 'Display order information', linkedPrompt: null },
    { id: 3, name: 'Payment Form', type: 'ui', description: 'Collect payment details', linkedPrompt: 'Payment Confirmation' },
  ];

  const prompts = [
    {
      id: 1,
      name: 'System Prompt',
      content: 'You are a helpful assistant that can help users manage their CRM data...',
      lastUpdated: '2 days ago',
      linkedTemplates: ['Customer Onboarding'],
    },
    {
      id: 2,
      name: 'Tool Usage Prompt',
      content: 'When using CRM tools, always confirm the action with the user first...',
      lastUpdated: '1 week ago',
      linkedTemplates: [],
    },
    {
      id: 3,
      name: 'Welcome Prompt',
      content: 'Welcome to our CRM system! I can help you manage your customer data...',
      lastUpdated: '3 days ago',
      linkedTemplates: ['Customer Onboarding'],
    },
    {
      id: 4,
      name: 'Payment Confirmation',
      content: 'Your payment has been processed successfully. Here are the details...',
      lastUpdated: '1 day ago',
      linkedTemplates: ['Payment Form'],
    },
  ];

  const selectedServerData = servers.find(s => s.id === selectedServer);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'draft': return 'warning';
      case 'error': return 'danger';
      default: return 'default';
    }
  };

  const AddResourceModal = () => {
    const [resourceData, setResourceData] = useState({
      name: '',
      type: 'ui',
      description: '',
      linkedPrompt: '',
      content: '',
    });

    const availablePrompts = prompts.map(p => p.name);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Add New Template</h2>
            <button onClick={() => setShowAddResource(false)}>
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={resourceData.name}
                onChange={(e) => setResourceData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                placeholder="e.g., Customer Profile Card"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={resourceData.type}
                onChange={(e) => setResourceData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
              >
                <option value="ui">UI Component</option>
                <option value="prompt">Prompt Template</option>
                <option value="workflow">Workflow</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={resourceData.description}
                onChange={(e) => setResourceData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                rows={3}
                placeholder="Describe what this template does..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Linked Prompt (Optional)
              </label>
              <select
                value={resourceData.linkedPrompt}
                onChange={(e) => setResourceData(prev => ({ ...prev, linkedPrompt: e.target.value }))}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
              >
                <option value="">Select a prompt...</option>
                {availablePrompts.map(prompt => (
                  <option key={prompt} value={prompt}>{prompt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Content
              </label>
              <textarea
                value={resourceData.content}
                onChange={(e) => setResourceData(prev => ({ ...prev, content: e.target.value }))}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none font-mono text-xs"
                rows={8}
                placeholder="Enter your template content (HTML, JSON, etc.)..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowAddResource(false)}>
              Cancel
            </Button>
            <Button icon={Save}>
              Save Template
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const AddPromptModal = () => {
    const [promptData, setPromptData] = useState({
      name: '',
      content: '',
      linkedTemplates: [] as string[],
      category: 'system',
    });

    const availableTemplates = templates.map(t => t.name);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Add New Prompt</h2>
            <button onClick={() => setShowAddPrompt(false)}>
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt Name
              </label>
              <input
                type="text"
                value={promptData.name}
                onChange={(e) => setPromptData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                placeholder="e.g., Customer Service Greeting"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={promptData.category}
                onChange={(e) => setPromptData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
              >
                <option value="system">System Prompt</option>
                <option value="user">User Interaction</option>
                <option value="tool">Tool Usage</option>
                <option value="error">Error Handling</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Linked Templates (Optional)
              </label>
              <div className="space-y-2">
                {availableTemplates.map(template => (
                  <label key={template} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={promptData.linkedTemplates.includes(template)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPromptData(prev => ({
                            ...prev,
                            linkedTemplates: [...prev.linkedTemplates, template]
                          }));
                        } else {
                          setPromptData(prev => ({
                            ...prev,
                            linkedTemplates: prev.linkedTemplates.filter(t => t !== template)
                          }));
                        }
                      }}
                      className="text-brand focus:ring-brand"
                    />
                    <span className="text-sm">{template}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt Content
              </label>
              <textarea
                value={promptData.content}
                onChange={(e) => setPromptData(prev => ({ ...prev, content: e.target.value }))}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                rows={8}
                placeholder="Enter your prompt content..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowAddPrompt(false)}>
              Cancel
            </Button>
            <Button icon={Save}>
              Save Prompt
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (selectedServer && selectedServerData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            icon={ArrowLeft}
            onClick={() => setSelectedServer(null)}
          >
            Back to MCPs
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-fg-high">{selectedServerData.name}</h1>
            <p className="text-gray-500">{selectedServerData.description}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" icon={ExternalLink}>
              View Docs
            </Button>
            <Button size="sm" variant="outline" icon={Settings}>
              Configure
            </Button>
          </div>
        </div>

        {/* Server Overview Card */}
        <Card>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Version:</span>
              <span className="ml-2 font-medium">v{selectedServerData.version}</span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <Badge variant={getStatusColor(selectedServerData.status)} size="sm" className="ml-2">
                {selectedServerData.status}
              </Badge>
            </div>
            <div>
              <span className="text-gray-500">Endpoints:</span>
              <span className="ml-2 font-medium">{selectedServerData.endpoints}</span>
            </div>
            <div>
              <span className="text-gray-500">Last Updated:</span>
              <span className="ml-2">{selectedServerData.lastUpdated}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-sm">
              <span className="text-gray-500">Base URL:</span>
              <span className="ml-2 font-mono text-xs">{selectedServerData.url}</span>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Card padding={false}>
          <Tab.Group selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex}>
            <Tab.List className="flex border-b border-border">
              {tabs.map((tab) => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    clsx(
                      'flex items-center gap-2 px-6 py-4 text-sm font-medium focus:outline-none',
                      selected
                        ? 'border-b-2 border-brand text-brand'
                        : 'text-gray-500 hover:text-fg-high'
                    )
                  }
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.name}
                </Tab>
              ))}
            </Tab.List>

            <Tab.Panels>
              {/* Server Tab */}
              <Tab.Panel className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Server Health</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-semibold text-green-600">{selectedServerData.uptime}</div>
                        <div className="text-sm text-gray-600">Uptime</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-semibold text-blue-600">{selectedServerData.responseTime}</div>
                        <div className="text-sm text-gray-600">Avg Response</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-semibold text-gray-600">{selectedServerData.endpoints}</div>
                        <div className="text-sm text-gray-600">Endpoints</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Environment Variables</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <span className="font-mono text-sm">API_KEY</span>
                        <Badge variant="success">Set</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <span className="font-mono text-sm">DATABASE_URL</span>
                        <Badge variant="success">Set</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <span className="font-mono text-sm">WEBHOOK_SECRET</span>
                        <Badge variant="warning">Missing</Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">API Documentation</h3>
                    <div className="border border-gray-200 rounded-lg h-96 bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <Globe className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Swagger UI will load here</p>
                        <Button variant="outline" size="sm" className="mt-2" icon={ExternalLink}>
                          Open in New Tab
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Tab.Panel>

              {/* Tools Tab */}
              <Tab.Panel className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Available Tools</h3>
                    <Button variant="outline" size="sm">
                      Refresh Tools
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {tools.map((tool) => (
                      <div key={tool.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={tool.enabled}
                            onChange={() => {}}
                            className="text-brand focus:ring-brand"
                          />
                          <div>
                            <div className="font-medium text-fg-high">{tool.name}</div>
                            <div className="text-sm text-gray-600">{tool.description}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" icon={Play}>
                            Test
                          </Button>
                          <Button size="sm" variant="outline" icon={Settings}>
                            Configure
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {tools.length === 0 && (
                    <div className="text-center py-8">
                      <Code className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No tools available</p>
                    </div>
                  )}
                </div>
              </Tab.Panel>

              {/* Templates Tab */}
              <Tab.Panel className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">MCP Templates</h3>
                    <Button variant="outline" size="sm" icon={Plus} onClick={() => setShowAddResource(true)}>
                      Add Template
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {templates.map((template) => (
                      <div key={template.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                          {template.type === 'prompt' ? (
                            <FileText className="h-5 w-5 text-gray-600" />
                          ) : (
                            <Code className="h-5 w-5 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-fg-high">{template.name}</div>
                          <div className="text-sm text-gray-600">{template.description}</div>
                          {template.linkedPrompt && (
                            <div className="text-xs text-brand mt-1">
                              Linked to: {template.linkedPrompt}
                            </div>
                          )}
                        </div>
                        <Badge variant="default" size="sm">
                          {template.type}
                        </Badge>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </div>
                    ))}
                  </div>

                  {templates.length === 0 && (
                    <div className="text-center py-8">
                      <Book className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No templates yet</p>
                    </div>
                  )}
                </div>
              </Tab.Panel>

              {/* Prompts Tab */}
              <Tab.Panel className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Prompts</h3>
                    <Button variant="outline" size="sm" icon={Plus} onClick={() => setShowAddPrompt(true)}>
                      Add Prompt
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {prompts.map((prompt) => (
                      <div key={prompt.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{prompt.name}</h4>
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {prompt.content}
                        </p>
                        {prompt.linkedTemplates.length > 0 && (
                          <div className="text-xs text-brand mb-2">
                            Linked templates: {prompt.linkedTemplates.join(', ')}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Last updated {prompt.lastUpdated}
                        </div>
                      </div>
                    ))}
                  </div>

                  {prompts.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No prompts yet</p>
                    </div>
                  )}
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </Card>

        {/* Modals */}
        {showAddResource && <AddResourceModal />}
        {showAddPrompt && <AddPromptModal />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-fg-high">MCPs</h1>
          <p className="text-gray-500">Model-Context-Protocol specifications and tools</p>
        </div>
        <Button 
          icon={Plus}
          onClick={() => navigate('/upload-specification')}
        >
          Upload Specification
        </Button>
      </div>

      {/* Servers Table */}
      <Card padding={false}>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Server
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Endpoints
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uptime
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {servers.map((server) => (
                <tr 
                  key={server.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedServer(server.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                        <Server className="h-5 w-5 text-brand" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-fg-high">{server.name}</div>
                        <div className="text-sm text-gray-500">{server.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">v{server.version}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStatusColor(server.status)}>
                      {server.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{server.endpoints}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-700">{server.uptime}</div>
                      {parseFloat(server.uptime) > 99 ? (
                        <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500 ml-2" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {server.lastUpdated}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedServer(server.id);
                      }}
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Empty State */}
      {servers.length === 0 && (
        <Card className="text-center py-12">
          <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-fg-high mb-2">No API servers yet</h3>
          <p className="text-gray-500 mb-6">Upload an OpenAPI specification to get started</p>
          <Button 
            icon={Plus}
            onClick={() => navigate('/upload-specification')}
          >
            Upload Your First Specification
          </Button>
        </Card>
      )}
    </div>
  );
}