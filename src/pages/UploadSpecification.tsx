import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Globe, AlertCircle, CheckCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

interface SpecFile {
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function UploadSpecification() {
  const navigate = useNavigate();
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [url, setUrl] = useState('');
  const [files, setFiles] = useState<SpecFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/json': ['.json'],
      'application/x-yaml': ['.yaml', '.yml'],
      'text/yaml': ['.yaml', '.yml'],
    },
    multiple: true,
    onDrop: (acceptedFiles) => {
      const newFiles = acceptedFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        status: 'pending' as const,
      }));
      setFiles(prev => [...prev, ...newFiles]);
    },
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    setIsUploading(true);
    
    // Simulate upload process
    for (let i = 0; i < files.length; i++) {
      setFiles(prev => prev.map((file, index) => 
        index === i ? { ...file, status: 'uploading' } : file
      ));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate success/error
      const success = Math.random() > 0.2; // 80% success rate
      setFiles(prev => prev.map((file, index) => 
        index === i ? { 
          ...file, 
          status: success ? 'success' : 'error',
          error: success ? undefined : 'Invalid OpenAPI specification format'
        } : file
      ));
    }
    
    setIsUploading(false);
    
    // Navigate to MCPs page after successful upload
    setTimeout(() => {
      navigate('/mcps');
    }, 1000);
  };

  const uploadFromUrl = async () => {
    if (!url) return;
    
    setIsUploading(true);
    
    // Simulate URL fetch and upload
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsUploading(false);
    navigate('/mcps');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          size="sm" 
          icon={ArrowLeft}
          onClick={() => navigate('/mcps')}
        >
          Back to MCPs
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-fg-high">Upload API Specification</h1>
          <p className="text-gray-500">Upload OpenAPI/Swagger specifications to generate tools</p>
        </div>
      </div>

      {/* Upload Method Selection */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Choose Upload Method</h2>
        <div className="flex gap-4 mb-6">
          <button
            className={`flex-1 p-4 border rounded-lg text-left transition-colors ${
              uploadMethod === 'file' 
                ? 'border-brand bg-brand/5 text-brand' 
                : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => setUploadMethod('file')}
          >
            <Upload className="h-5 w-5 mb-2" />
            <div className="font-medium">Upload Files</div>
            <div className="text-sm text-gray-500">Upload JSON or YAML files</div>
          </button>
          
          <button
            className={`flex-1 p-4 border rounded-lg text-left transition-colors ${
              uploadMethod === 'url' 
                ? 'border-brand bg-brand/5 text-brand' 
                : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => setUploadMethod('url')}
          >
            <Globe className="h-5 w-5 mb-2" />
            <div className="font-medium">From URL</div>
            <div className="text-sm text-gray-500">Import from a public URL</div>
          </button>
        </div>

        {uploadMethod === 'file' && (
          <div className="space-y-4">
            {/* File Drop Zone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-brand bg-brand/5' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-4" />
              {isDragActive ? (
                <p className="text-brand">Drop the files here...</p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-2">
                    Drag & drop OpenAPI specification files here, or click to select
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports JSON and YAML formats
                  </p>
                </div>
              )}
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Selected Files</h3>
                {files.map((fileItem, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    {getStatusIcon(fileItem.status)}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{fileItem.file.name}</div>
                      <div className="text-xs text-gray-500">
                        {(fileItem.file.size / 1024).toFixed(1)} KB
                      </div>
                      {fileItem.error && (
                        <div className="text-xs text-red-600 mt-1">{fileItem.error}</div>
                      )}
                    </div>
                    {fileItem.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {files.length > 0 && (
              <div className="flex justify-end">
                <Button
                  onClick={uploadFiles}
                  loading={isUploading}
                  disabled={files.every(f => f.status !== 'pending')}
                >
                  Upload Specifications
                </Button>
              </div>
            )}
          </div>
        )}

        {uploadMethod === 'url' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specification URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/openapi.json"
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL must be publicly accessible and return a valid OpenAPI specification
              </p>
            </div>
            
            <div className="flex justify-end">
              <Button
                onClick={uploadFromUrl}
                loading={isUploading}
                disabled={!url}
              >
                Import from URL
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Help Section */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Specification Requirements</h2>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong>OpenAPI 3.0+</strong> - We support OpenAPI 3.0 and 3.1 specifications
            </div>
          </div>
          <div className="flex gap-3">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Valid Schema</strong> - Specification must be valid JSON or YAML
            </div>
          </div>
          <div className="flex gap-3">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Operation IDs</strong> - Each endpoint should have a unique operationId for tool generation
            </div>
          </div>
          <div className="flex gap-3">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Authentication</strong> - Include security schemes for API authentication
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}