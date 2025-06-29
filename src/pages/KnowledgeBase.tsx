import React, { useState } from 'react';
import { Plus, Upload, Globe, FileText, Video, RefreshCw, X, Save, BookOpen, Users, GraduationCap } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

export default function KnowledgeBase() {
  const [showCreateKB, setShowCreateKB] = useState(false);

  // For now, keeping mock data since we don't have knowledge_bases table yet
  // In a real implementation, you would create a useKnowledgeBases hook
  const knowledgeBases = [
    {
      id: 1,
      name: 'Product Documentation',
      description: 'Complete product guides and API documentation',
      sources: 23,
      lastUpdated: '2 hours ago',
      status: 'active',
      category: 'product',
    },
    {
      id: 2,
      name: 'Support Articles',
      description: 'Customer support knowledge base and FAQs',
      sources: 45,
      lastUpdated: '1 day ago',
      status: 'active',
      category: 'support',
    },
    {
      id: 3,
      name: 'Training Videos',
      description: 'Video tutorials and onboarding content',
      sources: 12,
      lastUpdated: '3 days ago',
      status: 'processing',
      category: 'training',
    },
  ];

  const recentDocuments = [
    { id: 1, name: 'API Integration Guide', type: 'pdf', status: 'processed', size: '2.4 MB' },
    { id: 2, name: 'Getting Started Video', type: 'video', status: 'processing', size: '156 MB' },
    { id: 3, name: 'Product Tour', type: 'url', status: 'processed', size: '-' },
    { id: 4, name: 'Feature Walkthrough', type: 'pdf', status: 'failed', size: '1.8 MB' },
  ];

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
      // TODO: Implement knowledge base creation with Supabase
      console.log('Creating knowledge base:', kbData);
      setShowCreateKB(false);
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
            <Button variant="outline" onClick={() => setShowCreateKB(false)}>
              Cancel
            </Button>
            <Button icon={Save} onClick={handleSave}>
              Create Knowledge Base
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-fg-high">Knowledge Base</h1>
          <p className="text-gray-500">Manage your agent's knowledge sources</p>
        </div>
        <Button icon={Plus} onClick={() => setShowCreateKB(true)}>
          Create Knowledge Base
        </Button>
      </div>

      {/* Knowledge Bases */}
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
                <span>{kb.sources} sources</span>
                <span>Updated {kb.lastUpdated}</span>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  Manage
                </Button>
                <Button size="sm" variant="outline" icon={Upload}>
                  Add Sources
                </Button>
                <Button size="sm" variant="outline" icon={RefreshCw}>
                  Refresh
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Documents */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-fg-high">Recent Documents</h2>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>

        <div className="space-y-4">
          {recentDocuments.map((doc) => {
            const TypeIcon = getTypeIcon(doc.type);
            return (
              <div key={doc.id} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <TypeIcon className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-fg-high">{doc.name}</div>
                  <div className="text-sm text-gray-500">{doc.size}</div>
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

      {/* Upload Zone */}
      <Card>
        <div className="text-center py-8">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-fg-high mb-2">Add New Sources</h3>
          <p className="text-gray-500 mb-6">
            Upload PDFs, add URLs, or link to video content to expand your knowledge base
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" icon={Upload}>
              Upload Files
            </Button>
            <Button variant="outline" icon={Globe}>
              Add URL
            </Button>
            <Button variant="outline" icon={Video}>
              Add Video
            </Button>
          </div>
        </div>
      </Card>

      {/* Create Knowledge Base Modal */}
      {showCreateKB && <CreateKnowledgeBaseModal />}
    </div>
  );
}