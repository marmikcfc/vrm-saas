import React, { useState } from 'react';
import { Code, Eye, EyeOff } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: 'html' | 'css' | 'javascript';
  placeholder?: string;
  height?: string;
}

export default function CodeEditor({ 
  value, 
  onChange, 
  language = 'html', 
  placeholder = 'Enter your code here...', 
  height = '400px' 
}: CodeEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'html' | 'css'>('html');
  const [htmlContent, setHtmlContent] = useState(value);
  const [cssContent, setCssContent] = useState('');

  const handleHTMLChange = (newValue: string) => {
    setHtmlContent(newValue);
    onChange(newValue);
  };

  const handleCSSChange = (newValue: string) => {
    setCssContent(newValue);
    // Combine HTML and CSS for the onChange callback
    const combined = `${htmlContent}\n<style>\n${newValue}\n</style>`;
    onChange(combined);
  };

  const getPreviewContent = () => {
    if (cssContent) {
      return `${htmlContent}\n<style>\n${cssContent}\n</style>`;
    }
    return htmlContent;
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-50 px-3 py-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Template Editor</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50"
          >
            {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>
      </div>

      <div className="flex" style={{ height }}>
        {/* Editor Side */}
        <div className={`${showPreview ? 'w-1/2' : 'w-full'} flex flex-col`}>
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('html')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'html'
                  ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                  : 'bg-gray-50 text-gray-600 hover:text-gray-800'
              }`}
            >
              HTML
            </button>
            <button
              onClick={() => setActiveTab('css')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'css'
                  ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                  : 'bg-gray-50 text-gray-600 hover:text-gray-800'
              }`}
            >
              CSS
            </button>
          </div>

          {/* Code Area */}
          <div className="flex-1">
            {activeTab === 'html' ? (
              <textarea
                value={htmlContent}
                onChange={(e) => handleHTMLChange(e.target.value)}
                placeholder="<div class='container'>\n  <h1>Hello World</h1>\n  <p>Your HTML content here...</p>\n</div>"
                className="w-full h-full p-4 font-mono text-sm border-0 resize-none focus:outline-none focus:ring-0"
                spellCheck={false}
              />
            ) : (
              <textarea
                value={cssContent}
                onChange={(e) => handleCSSChange(e.target.value)}
                placeholder=".container {\n  max-width: 800px;\n  margin: 0 auto;\n  padding: 20px;\n}\n\nh1 {\n  color: #333;\n  font-size: 2rem;\n}"
                className="w-full h-full p-4 font-mono text-sm border-0 resize-none focus:outline-none focus:ring-0"
                spellCheck={false}
              />
            )}
          </div>
        </div>

        {/* Preview Side */}
        {showPreview && (
          <div className="w-1/2 border-l border-gray-200">
            <div className="bg-gray-100 px-3 py-2 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700">Preview</span>
            </div>
            <div className="h-full bg-white p-4 overflow-auto">
              <div
                dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
                className="prose prose-sm max-w-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 