import React, { useState } from 'react';
import { Plus, Upload, Globe, FileText, Video, RefreshCw, X, Save, BookOpen, Users, GraduationCap, Loader2, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useKnowledgeBases, useCreateKnowledgeBase, useUploadToKnowledgeBase, useAddUrlToKnowledgeBase, type KnowledgeBase, type CreateKnowledgeBaseData } from '../hooks/useKnowledgeBases';

export default function KnowledgeBase() {
  const [showCreateKB, setShowCreateKB] = useState(false);
  
  // Real API hooks
  const { data: knowledgeBasesData, isLoading, error, refetch } = useKnowledgeBases();
  const createKBMutation = useCreateKnowledgeBase();
  const uploadFilesMutation = useUploadToKnowledgeBase();
  const addUrlMutation = useAddUrlToKnowledgeBase();
  
  const knowledgeBases: KnowledgeBase[] = Array.isArray(knowledgeBasesData?.data) ? knowledgeBasesData.data : [];
  
  // Helper functions
  const getFileType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'pdf';
      case 'mp4':
      case 'mov':
      case 'avi':
        return 'video';
      default:
        return 'document';
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return '1 day ago';
    return `${Math.floor(diffInHours / 24)} days ago`;
  };
  
  // Get recent documents from all knowledge bases
  const recentDocuments = knowledgeBases
    .flatMap((kb: KnowledgeBase) => 
      (kb.sources || []).map((source: any) => ({
        id: source.id,
        name: source.name,
        type: source.type === 'file' ? getFileType(source.name) : source.type,
        status: source.processed ? 'processed' : 'processing',
        size: source.size ? formatFileSize(source.size) : '-',
        kbName: kb.name
      }))
    )
    .slice(0, 10); // Show only 10 most recent

  // Handler functions
  const handleManageKB = (kbId: string) => {
    // TODO: Navigate to knowledge base management page or open management modal
    console.log('Managing knowledge base:', kbId);
    // For now, just log - you could implement a detailed management modal or route
  };

  const handleAddSources = (kbId: string) => {
    // TODO: Open file upload dialog or URL input modal
    console.log('Adding sources to knowledge base:', kbId);
    // For now, just log - you could implement file upload or URL input functionality
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return FileText;
      case 'video': return Video;
      case 'url': return Globe;
      default: return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'danger';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'product': return BookOpen;
      case 'support': return Users;
      case 'training': return GraduationCap;
      default: return BookOpen;
    }
  };

  const CreateKnowledgeBaseModal = () => {
    const [kbData, setKbData] = useState({
      name: '',
      description: '',
      category: 'product',
      sources: [] as string[],
    });

    const categories = [
      { id: 'product', name: 'Product Documentation', description: 'API docs, feature guides, technical specifications' },
      { id: 'support', name: 'Support Articles', description: 'FAQs, troubleshooting guides, help articles' },
      { id: 'training', name: 'Training Videos', description: 'Video tutorials, onboarding content, demos' },
    ];

    const handleSave = async () => {
      if (!kbData.name.trim()) return;
      
      try {
        await createKBMutation.mutateAsync({
          name: kbData.name.trim(),
          description: kbData.description.trim(),
          category: kbData.category as 'product' | 'support' | 'training',
          sources: [],
          config: {}
        });
        setShowCreateKB(false);
        setKbData({ name: '', description: '', category: 'product', sources: [] });
      } catch (error) {
        console.error('Failed to create knowledge base:', error);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Create Knowledge Base</h2>
            <button onClick={() => setShowCreateKB(false)}>
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Knowledge Base Name
              </label>
              <input
                type="text"
                value={kbData.name}
                onChange={(e) => setKbData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                placeholder="e.g., Customer Support Hub"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={kbData.description}
                onChange={(e) => setKbData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                rows={3}
                placeholder="Describe what this knowledge base contains..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Category
              </label>
              <div className="space-y-3">
                {categories.map((category) => {
                  const IconComponent = getCategoryIcon(category.id);
                  return (
                    <label key={category.id} className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="category"
                        value={category.id}
                        checked={kbData.category === category.id}
                        onChange={(e) => setKbData(prev => ({ ...prev, category: e.target.value }))}
                        className="text-brand focus:ring-brand mt-1"
                      />
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
                        <IconComponent className="h-4 w-4 text-brand" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-fg-high">{category.name}</div>
                        <div className="text-sm text-gray-600">{category.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Initial Sources (Optional)
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a URL or file path..."
                    className="flex-1 rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                  />
                  <Button size="sm" variant="outline">
                    Add
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  You can add more sources after creating the knowledge base
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowCreateKB(false)} disabled={createKBMutation.isPending}>
              Cancel
            </Button>
            <Button 
              icon={createKBMutation.isPending ? Loader2 : Save} 
              onClick={handleSave}
              disabled={createKBMutation.isPending || !kbData.name.trim()}
            >
              {createKBMutation.isPending ? 'Creating...' : 'Create Knowledge Base'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <span className="ml-2 text-gray-600">Loading knowledge bases...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load knowledge bases</h3>
        <p className="text-gray-600 mb-4">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-fg-high">Knowledge Base</h1>
          <p className="text-gray-500">Manage your agent's knowledge sources</p>
        </div>
        <Button 
          icon={Plus} 
          onClick={() => setShowCreateKB(true)}
          disabled={createKBMutation.isPending}
        >
          {createKBMutation.isPending ? 'Creating...' : 'Create Knowledge Base'}
        </Button>
      </div>

      {/* Knowledge Bases */}
      {knowledgeBases.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-fg-high mb-2">No Knowledge Bases Yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Create your first knowledge base to start organizing your documentation, support articles, and training materials.
            </p>
            <Button icon={Plus} onClick={() => setShowCreateKB(true)}>
              Create Your First Knowledge Base
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {knowledgeBases.map((kb) => {
            const CategoryIcon = getCategoryIcon(kb.category);
            return (
              <Card key={kb.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                      <CategoryIcon className="h-5 w-5 text-brand" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-fg-high">{kb.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{kb.description}</p>
                    </div>
                  </div>
                  <Badge variant={kb.status === 'active' ? 'success' : 'warning'}>
                    {kb.status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{kb.sourceCount || kb.sources?.length || 0} sources</span>
                  <span>Updated {formatDate(kb.last_updated)}</span>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleManageKB(kb.id)}>
                    Manage
                  </Button>
                  <Button size="sm" variant="outline" icon={Upload} onClick={() => handleAddSources(kb.id)}>
                    Add Sources
                  </Button>
                  <Button size="sm" variant="outline" icon={RefreshCw} onClick={() => refetch()}>
                    Refresh
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recent Documents */}
      {recentDocuments.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-fg-high">Recent Documents</h2>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>

          <div className="space-y-4">
            {recentDocuments.map((doc: any) => {
              const TypeIcon = getTypeIcon(doc.type);
              return (
                <div key={doc.id} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <TypeIcon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-fg-high">{doc.name}</div>
                    <div className="text-sm text-gray-500">{doc.size} • {doc.kbName}</div>
                  </div>
                  <Badge variant={getStatusColor(doc.status)}>
                    {doc.status}
                  </Badge>
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Upload Zone */}
      {knowledgeBases.length > 0 && (
        <Card>
          <div className="text-center py-8">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-fg-high mb-2">Add New Sources</h3>
            <p className="text-gray-500 mb-6">
              Upload PDFs, add URLs, or link to video content to expand your knowledge base
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" icon={Upload} onClick={() => document.getElementById('file-upload')?.click()}>
                Upload Files
              </Button>
              <Button variant="outline" icon={Globe} onClick={() => console.log('Add URL clicked')}>
                Add URL
              </Button>
              <Button variant="outline" icon={Video} onClick={() => console.log('Add Video clicked')}>
                Add Video
              </Button>
            </div>
            <input
              id="file-upload"
              type="file"
              multiple
              accept=".pdf,.txt,.md,.doc,.docx,.csv,.json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0 && knowledgeBases.length > 0) {
                  // For now, upload to the first knowledge base
                  // In a real app, you'd want to let the user select which KB to upload to
                  uploadFilesMutation.mutate({
                    id: knowledgeBases[0].id,
                    files: e.target.files
                  });
                }
              }}
            />
          </div>
        </Card>
      )}

      {/* Create Knowledge Base Modal */}
      {showCreateKB && <CreateKnowledgeBaseModal />}
    </div>
  );
}