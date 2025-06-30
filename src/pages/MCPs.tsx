import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { Plus, Server, FileText, ExternalLink, Settings, Play, Code, Book, ArrowLeft, CheckCircle, AlertTriangle, X, Save, Upload, Link as LinkIcon, Edit, Loader2, Square, RefreshCw, Pause, Trash2 } from 'lucide-react';

import clsx from 'clsx';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import CodeEditor from '../components/ui/CodeEditor';
import TextEditor from '../components/ui/TextEditor';
import { useMCPs, useMCP, useMCPTools, useCreateMCPServer, useUploadMCPSpec, useUploadMCPSpecFromUrl, useAddMCPTemplate, useAddMCPPrompt, useStartMCPHosting, useStopMCPHosting, useRestartMCPHosting, useMCPHostingStatus, useDeleteMCPServer, usePauseMCPHosting, useUnpauseMCPHosting, type MCPServer, type MCPTool, type MCPTemplate, type MCPPrompt } from '../hooks/useMCPs';

const tabs = [
  { name: 'Server', icon: Server },
  { name: 'Tools', icon: Code },
  { name: 'Templates', icon: Book },
  { name: 'Prompts', icon: FileText },
];

export default function MCPs() {
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [showAddResource, setShowAddResource] = useState(false);
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const [showConfigureModal, setShowConfigureModal] = useState(false);
  const [showAddRemoteServer, setShowAddRemoteServer] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MCPTemplate | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<MCPPrompt | null>(null);

  // API hooks
  const { data: mcpsData, isLoading, error, refetch } = useMCPs();
  const { data: selectedServerData, isLoading: isServerLoading } = useMCP(selectedServer || '');
  const { data: toolsData } = useMCPTools(selectedServer || '');
  const createServerMutation = useCreateMCPServer();
  const addTemplateMutation = useAddMCPTemplate();
  const addPromptMutation = useAddMCPPrompt();

  // Hosting management mutations
  const startHostingMutation = useStartMCPHosting();
  const stopHostingMutation = useStopMCPHosting();
  const restartHostingMutation = useRestartMCPHosting();
  const pauseHostingMutation = usePauseMCPHosting();
  const unpauseHostingMutation = useUnpauseMCPHosting();
  const deleteServerMutation = useDeleteMCPServer();

  const servers: MCPServer[] = Array.isArray(mcpsData?.data) ? mcpsData.data : [];
  const tools: MCPTool[] = Array.isArray(toolsData?.data) ? toolsData.data : [];
  const currentServer = selectedServerData?.data as MCPServer;
  const templates: MCPTemplate[] = currentServer?.templates || [];
  const prompts: MCPPrompt[] = currentServer?.prompts || [];

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return '1 day ago';
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const getHostingStatusColor = (status?: string) => {
    switch (status) {
      case 'running': return 'text-green-600';
      case 'starting': return 'text-blue-600';
      case 'generating': return 'text-purple-600';
      case 'error': return 'text-red-600';
      case 'stopped': return 'text-yellow-600';
      case 'paused': return 'text-orange-600';
      default: return 'text-gray-500';
    }
  };

  const getHostingStatusIcon = (status?: string) => {
    switch (status) {
      case 'running': return <CheckCircle className="h-4 w-4" />;
      case 'starting': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'generating': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      case 'stopped': return <Square className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      default: return <Pause className="h-4 w-4" />;
    }
  };

  const handleStartHosting = async (mcpId: string) => {
    try {
      await startHostingMutation.mutateAsync(mcpId);
    } catch (error) {
      console.error('Failed to start hosting:', error);
    }
  };

  const handleStopHosting = async (mcpId: string) => {
    try {
      await stopHostingMutation.mutateAsync(mcpId);
    } catch (error) {
      console.error('Failed to stop hosting:', error);
    }
  };

  const handleRestartHosting = async (mcpId: string) => {
    try {
      await restartHostingMutation.mutateAsync(mcpId);
    } catch (error) {
      console.error('Failed to restart hosting:', error);
    }
  };

  const handlePauseHosting = async (mcpId: string) => {
    try {
      await pauseHostingMutation.mutateAsync(mcpId);
    } catch (error) {
      console.error('Failed to pause hosting:', error);
    }
  };

  const handleUnpauseHosting = async (mcpId: string) => {
    try {
      await unpauseHostingMutation.mutateAsync(mcpId);
    } catch (error) {
      console.error('Failed to unpause hosting:', error);
    }
  };

  const handleDeleteServer = async (mcpId: string) => {
    if (window.confirm('Are you sure you want to delete this MCP server? This action cannot be undone.')) {
      try {
        await deleteServerMutation.mutateAsync(mcpId);
      } catch (error) {
        console.error('Failed to delete server:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'draft': return 'warning';
      case 'error': return 'danger';
      default: return 'default';
    }
  };

  const HostingControls = ({ server }: { server: MCPServer }) => {
    const { data: hostingStatus } = useMCPHostingStatus(server.id);
    const status = server.hosting_status || 'inactive';
    const isLoading = startHostingMutation.isPending || stopHostingMutation.isPending || restartHostingMutation.isPending || pauseHostingMutation.isPending || unpauseHostingMutation.isPending;

    return (
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1 ${getHostingStatusColor(status)}`}>
          {getHostingStatusIcon(status)}
          <span className="text-xs font-medium capitalize">
            {status === 'inactive' ? 'Not hosted' : status}
          </span>
        </div>
        
        {server.host_url && (
          <a
            href={server.host_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            :{server.host_port}
          </a>
        )}

        <div className="flex gap-1">
          {status === 'running' ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePauseHosting(server.id)}
                disabled={isLoading}
                className="h-6 w-6 p-0"
                title="Pause server"
              >
                <Pause className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStopHosting(server.id)}
                disabled={isLoading}
                className="h-6 w-6 p-0"
                title="Stop server"
              >
                <Square className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRestartHosting(server.id)}
                disabled={isLoading}
                className="h-6 w-6 p-0"
                title="Restart server"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </>
          ) : status === 'paused' ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUnpauseHosting(server.id)}
                disabled={isLoading}
                className="h-6 w-6 p-0"
                title="Resume server"
              >
                <Play className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStopHosting(server.id)}
                disabled={isLoading}
                className="h-6 w-6 p-0"
                title="Stop server"
              >
                <Square className="h-3 w-3" />
              </Button>
            </>
          ) : status === 'stopped' || status === 'error' || status === 'inactive' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStartHosting(server.id)}
              disabled={isLoading || !server.server_directory}
              className="h-6 w-6 p-0"
              title="Start server"
            >
              <Play className="h-3 w-3" />
            </Button>
          ) : null}
        </div>
      </div>
    );
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
        <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Add New Template</h2>
            <button onClick={() => setShowAddResource(false)}>
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Content
              </label>
              <CodeEditor
                value={resourceData.content}
                onChange={(content) => setResourceData(prev => ({ ...prev, content }))}
                height="400px"
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
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Add New Prompt</h2>
            <button onClick={() => setShowAddPrompt(false)}>
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt Content
              </label>
              <TextEditor
                value={promptData.content}
                onChange={(content) => setPromptData(prev => ({ ...prev, content }))}
                height="400px"
                placeholder="Enter your prompt content here..."
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

  const ConfigureModal = () => {
    const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
    const [uploadData, setUploadData] = useState({
      files: null as FileList | null,
      description: '',
    });
    const [urlData, setUrlData] = useState({
      url: '',
      name: '',
      description: '',
    });

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Configure MCP Server</h2>
            <button onClick={() => setShowConfigureModal(false)}>
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex border border-gray-200 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'upload'
                    ? 'bg-brand text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Upload className="h-4 w-4" />
                Upload Files
              </button>
              <button
                onClick={() => setActiveTab('url')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'url'
                    ? 'bg-brand text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <LinkIcon className="h-4 w-4" />
                Add URL
              </button>
            </div>
          </div>

          {activeTab === 'upload' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Files
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drop files here or click to browse
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".json,.yaml,.yml,.txt,.md"
                    onChange={(e) => setUploadData(prev => ({ ...prev, files: e.target.files }))}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    Choose Files
                  </Button>
                </div>
                {uploadData.files && (
                  <div className="mt-2 text-sm text-gray-600">
                    {uploadData.files.length} file(s) selected
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                  rows={3}
                  placeholder="Describe these configuration files..."
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Configuration URL
                </label>
                <input
                  type="url"
                  value={urlData.url}
                  onChange={(e) => setUrlData(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                  placeholder="https://example.com/mcp-config.json"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={urlData.name}
                  onChange={(e) => setUrlData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                  placeholder="Configuration name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={urlData.description}
                  onChange={(e) => setUrlData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                  rows={3}
                  placeholder="Describe this configuration..."
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowConfigureModal(false)}>
              Cancel
            </Button>
            <Button icon={Save}>
              Save Configuration
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const AddRemoteServerModal = () => {
    const [activeTab, setActiveTab] = useState<'manual' | 'spec'>('manual');
    const [serverData, setServerData] = useState({
      name: '',
      base_url: '',
      description: '',
      authType: 'api_key',
      apiKey: '',
    });
    const [specData, setSpecData] = useState({
      name: '',
      description: '',
      base_url: '',
      specFile: null as File | null,
      specUrl: '',
      uploadMethod: 'file' as 'file' | 'url',
    });
    const [isCreating, setIsCreating] = useState(false);
    
    const createMCPMutation = useCreateMCPServer();
    const uploadSpecMutation = useUploadMCPSpec();
    const uploadSpecFromUrlMutation = useUploadMCPSpecFromUrl();

    const handleManualCreate = async () => {
      if (!serverData.name || !serverData.base_url) return;
      
      setIsCreating(true);
      try {
        await createMCPMutation.mutateAsync({
          name: serverData.name,
          description: serverData.description,
          base_url: serverData.base_url,
          auth_config: {
            type: serverData.authType,
            credentials: serverData.apiKey ? { api_key: serverData.apiKey } : {},
            headers: {}
          }
        });
        setShowAddRemoteServer(false);
      } catch (error) {
        console.error('Failed to create MCP server:', error);
      } finally {
        setIsCreating(false);
      }
    };

    const handleSpecUpload = async () => {
      setIsCreating(true);
      try {
        if (specData.uploadMethod === 'file' && specData.specFile) {
          await uploadSpecMutation.mutateAsync({
            file: specData.specFile,
            additionalData: {
              name: specData.name,
              description: specData.description,
              base_url: specData.base_url,
            }
          });
        } else if (specData.uploadMethod === 'url' && specData.specUrl) {
          await uploadSpecFromUrlMutation.mutateAsync({
            url: specData.specUrl,
            name: specData.name,
            description: specData.description,
            base_url: specData.base_url,
          });
        }
        setShowAddRemoteServer(false);
      } catch (error) {
        console.error('Failed to upload OpenAPI spec:', error);
      } finally {
        setIsCreating(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Add MCP Server</h2>
            <button onClick={() => setShowAddRemoteServer(false)}>
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Tab Selection */}
          <div className="mb-6">
            <div className="flex border border-gray-200 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'manual'
                    ? 'bg-brand text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Server className="h-4 w-4" />
                Remote MCP Setup
              </button>
              <button
                onClick={() => setActiveTab('spec')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'spec'
                    ? 'bg-brand text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FileText className="h-4 w-4" />
                OpenAPI Spec
              </button>
            </div>
          </div>

          {activeTab === 'manual' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Server Name *
                  </label>
                  <input
                    type="text"
                    value={serverData.name}
                    onChange={(e) => setServerData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                    placeholder="e.g., Customer API Server"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base URL *
                  </label>
                  <input
                    type="url"
                    value={serverData.base_url}
                    onChange={(e) => setServerData(prev => ({ ...prev, base_url: e.target.value }))}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                    placeholder="https://api.example.com/v1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={serverData.description}
                  onChange={(e) => setServerData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                  rows={3}
                  placeholder="Describe what this server provides..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Authentication Type
                  </label>
                  <select
                    value={serverData.authType}
                    onChange={(e) => setServerData(prev => ({ ...prev, authType: e.target.value }))}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                  >
                    <option value="api_key">API Key</option>
                    <option value="oauth">OAuth</option>
                    <option value="basic">Basic Auth</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key (Optional)
                  </label>
                  <input
                    type="password"
                    value={serverData.apiKey}
                    onChange={(e) => setServerData(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                    placeholder="Enter API key if required"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Upload Method Selection */}
              <div className="flex border border-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setSpecData(prev => ({ ...prev, uploadMethod: 'file' }))}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    specData.uploadMethod === 'file'
                      ? 'bg-brand text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  Upload File
                </button>
                <button
                  onClick={() => setSpecData(prev => ({ ...prev, uploadMethod: 'url' }))}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    specData.uploadMethod === 'url'
                      ? 'bg-brand text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <LinkIcon className="h-4 w-4" />
                  From URL
                </button>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Server Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={specData.name}
                    onChange={(e) => setSpecData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                    placeholder="Will use spec title if empty"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={specData.base_url}
                    onChange={(e) => setSpecData(prev => ({ ...prev, base_url: e.target.value }))}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                    placeholder="Will use spec servers if empty"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={specData.description}
                  onChange={(e) => setSpecData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                  rows={2}
                  placeholder="Will use spec description if empty"
                />
              </div>

              {/* Upload Content */}
              {specData.uploadMethod === 'file' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OpenAPI Specification File *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".json,.yaml,.yml"
                      onChange={(e) => setSpecData(prev => ({ ...prev, specFile: e.target.files?.[0] || null }))}
                      className="hidden"
                      id="spec-file-input"
                    />
                    <label htmlFor="spec-file-input" className="cursor-pointer">
                      <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 mb-2">
                        {specData.specFile ? specData.specFile.name : 'Click to select OpenAPI spec file'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports JSON and YAML formats
                      </p>
                    </label>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OpenAPI Specification URL *
                  </label>
                  <input
                    type="url"
                    value={specData.specUrl}
                    onChange={(e) => setSpecData(prev => ({ ...prev, specUrl: e.target.value }))}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                    placeholder="https://api.example.com/openapi.json"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL must be publicly accessible and return a valid OpenAPI specification
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowAddRemoteServer(false)}>
              Cancel
            </Button>
            <Button 
              onClick={activeTab === 'manual' ? handleManualCreate : handleSpecUpload}
              loading={isCreating}
              disabled={
                activeTab === 'manual' 
                  ? !serverData.name || !serverData.base_url
                  : specData.uploadMethod === 'file' 
                    ? !specData.specFile
                    : !specData.specUrl
              }
            >
              {activeTab === 'manual' ? 'Create Server' : 'Import from Spec'}
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
            <h1 className="text-2xl font-semibold text-fg-high">{currentServer?.name}</h1>
            <p className="text-gray-500">{currentServer?.description}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" icon={ExternalLink}>
              View Docs
            </Button>
            <Button size="sm" variant="outline" icon={Settings} onClick={() => setShowConfigureModal(true)}>
              Configure
            </Button>
          </div>
        </div>

        {/* Server Overview Card */}
        <Card>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Version:</span>
              <span className="ml-2 font-medium">v{currentServer?.version}</span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <div className="ml-2">
                <Badge variant={getStatusColor(currentServer?.status || 'default')} size="sm">
                  {currentServer?.status}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Endpoints:</span>
              <span className="ml-2 font-medium">{Array.isArray(currentServer?.endpoints) ? currentServer.endpoints.length : 0}</span>
            </div>
            <div>
              <span className="text-gray-500">Last Updated:</span>
              <span className="ml-2">{currentServer?.updated_at ? formatDate(currentServer.updated_at) : 'N/A'}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-sm">
              <span className="text-gray-500">Base URL:</span>
              <span className="ml-2 font-mono text-xs">{currentServer?.base_url}</span>
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
                        <div className="text-2xl font-semibold text-green-600">{currentServer?.uptime || 'N/A'}</div>
                        <div className="text-sm text-gray-600">Uptime</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-semibold text-blue-600">{currentServer?.responseTime || 'N/A'}</div>
                        <div className="text-sm text-gray-600">Avg Response</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-semibold text-gray-600">{Array.isArray(currentServer?.endpoints) ? currentServer.endpoints.length : 0}</div>
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
                        <Server className="h-8 w-8 text-gray-400 mx-auto mb-2" />
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
                        <Badge variant={tool.enabled ? 'success' : 'default'} size="sm">
                          {tool.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
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
                        <Button size="sm" variant="outline" icon={Edit} onClick={() => setEditingTemplate(template)}>
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
                          <Button size="sm" variant="outline" icon={Edit} onClick={() => setEditingPrompt(prompt)}>
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
        {showConfigureModal && <ConfigureModal />}
        {editingTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Edit Template: {editingTemplate.name}</h2>
                <button onClick={() => setEditingTemplate(null)}>
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <CodeEditor
                value={editingTemplate.content || ''}
                onChange={() => {}}
                height="500px"
              />
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                  Cancel
                </Button>
                <Button icon={Save}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}
        {editingPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Edit Prompt: {editingPrompt.name}</h2>
                <button onClick={() => setEditingPrompt(null)}>
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <TextEditor
                value={editingPrompt.content || ''}
                onChange={() => {}}
                height="400px"
                placeholder="Enter your prompt content here..."
              />
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setEditingPrompt(null)}>
                  Cancel
                </Button>
                <Button icon={Save}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}
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
        <div className="flex gap-2">
          <Button 
            icon={Plus}
            onClick={() => setShowAddRemoteServer(true)}
          >
            Add MCP Server
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="text-center py-12">
          <Loader2 className="h-8 w-8 text-brand mx-auto mb-4 animate-spin" />
          <p className="text-gray-500">Loading MCP servers...</p>
        </Card>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="text-center py-12">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-fg-high mb-2">Failed to load MCP servers</h3>
          <p className="text-gray-500 mb-4">
            {error.message || 'An error occurred while fetching servers'}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
        </Card>
      )}

      {/* Servers Table */}
      {!isLoading && !error && (
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
                          <div className="mt-1">
                            <HostingControls server={server} />
                          </div>
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
                      <div className="text-sm text-gray-700">{Array.isArray(server.endpoints) ? server.endpoints.length : 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm text-gray-700">{server.uptime || 'N/A'}</div>
                        {server.uptime && typeof server.uptime === 'string' && parseFloat(server.uptime.replace('%', '')) > 99 ? (
                          <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                        ) : server.uptime && typeof server.uptime === 'string' ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-500 ml-2" />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {server.updated_at ? formatDate(server.updated_at) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2 justify-end">
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
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteServer(server.id);
                          }}
                          disabled={deleteServerMutation.isPending}
                          className="text-red-600 hover:text-red-800 hover:border-red-300"
                          icon={Trash2}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && servers.length === 0 && (
        <Card className="text-center py-12">
          <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-fg-high mb-2">No MCP servers yet</h3>
          <p className="text-gray-500 mb-6">Add an MCP server to get started</p>
          <Button 
            icon={Plus}
            onClick={() => setShowAddRemoteServer(true)}
          >
            Add MCP Server
          </Button>
        </Card>
      )}

    {/* Remote Server Modal */}
    {showAddRemoteServer && <AddRemoteServerModal />}
  </div>
);
}