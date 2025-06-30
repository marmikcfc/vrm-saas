import React, { useState } from 'react';
import { Type, Bold, Italic, List, Minus, Quote, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  showFormatting?: boolean;
}

export default function TextEditor({ 
  value, 
  onChange, 
  placeholder = 'Enter your prompt content...', 
  height = '300px',
  showFormatting = true 
}: TextEditorProps) {
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const insertText = (textToInsert: string, wrapSelection = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let newText;
    if (wrapSelection && selectedText) {
      newText = value.substring(0, start) + textToInsert + selectedText + textToInsert + value.substring(end);
    } else {
      newText = value.substring(0, start) + textToInsert + value.substring(end);
    }
    
    onChange(newText);
    
    // Set cursor position after insertion
    setTimeout(() => {
      const newCursorPos = start + textToInsert.length + (wrapSelection && selectedText ? selectedText.length : 0);
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  const insertAtNewLine = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const beforeCursor = value.substring(0, start);
    const afterCursor = value.substring(start);
    
    // Check if we're at the beginning of a line
    const atLineStart = start === 0 || beforeCursor.endsWith('\n');
    const prefix = atLineStart ? '' : '\n';
    
    const newText = beforeCursor + prefix + textToInsert + '\n' + afterCursor;
    onChange(newText);
    
    setTimeout(() => {
      const newCursorPos = start + prefix.length + textToInsert.length + 1;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  const formatButtons = [
    {
      icon: Bold,
      label: 'Bold',
      action: () => insertText('**', true),
    },
    {
      icon: Italic,
      label: 'Italic',
      action: () => insertText('*', true),
    },
    {
      icon: Quote,
      label: 'Quote',
      action: () => insertAtNewLine('> '),
    },
    {
      icon: List,
      label: 'Bullet List',
      action: () => insertAtNewLine('- '),
    },
    {
      icon: Minus,
      label: 'Divider',
      action: () => insertAtNewLine('---'),
    },
  ];

  const quickInserts = [
    { label: 'Variable', text: '{{variable_name}}' },
    { label: 'User Input', text: '{{user_input}}' },
    { label: 'Context', text: '{{context}}' },
    { label: 'System Time', text: '{{current_time}}' },
    { label: 'User Name', text: '{{user_name}}' },
  ];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {showFormatting && (
        <div className="bg-gray-50 border-b border-gray-200 p-2">
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center gap-1 mr-4">
              <Type className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Format:</span>
            </div>
            {formatButtons.map((button, index) => (
              <button
                key={index}
                onClick={button.action}
                className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                title={button.label}
              >
                <button.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-sm text-gray-600 mr-2">Quick insert:</span>
            {quickInserts.map((insert, index) => (
              <button
                key={index}
                onClick={() => insertText(insert.text)}
                className="px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
              >
                {insert.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={(e) => {
            const target = e.target as HTMLTextAreaElement;
            setCursorPosition(target.selectionStart);
          }}
          placeholder={placeholder}
          className="w-full p-4 border-0 resize-none focus:outline-none focus:ring-0 font-mono text-sm leading-relaxed"
          style={{ height }}
          spellCheck={true}
        />
        
        {/* Line counter */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          {value.split('\n').length} lines • {value.length} chars
        </div>
      </div>
      
      {/* Preview section for markdown-like content */}
      {value && showFormatting && (
        <div className="border-t border-gray-200 bg-gray-50 p-3">
          <div className="text-xs text-gray-600 mb-2">Preview:</div>
          <div className="text-sm text-gray-800 bg-white p-3 rounded border max-h-32 overflow-y-auto">
            {value.split('\n').map((line, index) => (
              <div key={index} className="mb-1 last:mb-0">
                {line.startsWith('> ') ? (
                  <div className="border-l-4 border-gray-300 pl-3 italic text-gray-600">
                    {line.substring(2)}
                  </div>
                ) : line.startsWith('- ') ? (
                  <div className="flex items-start gap-2">
                    <span>•</span>
                    <span>{line.substring(2)}</span>
                  </div>
                ) : line === '---' ? (
                  <hr className="my-2 border-gray-200" />
                ) : (
                  <span>{line || '\u00A0'}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 