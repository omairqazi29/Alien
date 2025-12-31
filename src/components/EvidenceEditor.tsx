import { useState, useEffect } from 'react';
import { FileText, Eye, Edit3, Save } from 'lucide-react';
import type { CriteriaId } from '../types';
import { storage } from '../lib/storage';

interface EvidenceEditorProps {
  criteriaId: CriteriaId;
  criteriaName: string;
}

export function EvidenceEditor({ criteriaId, criteriaName }: EvidenceEditorProps) {
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    const saved = storage.getEvidence(criteriaId);
    setContent(saved);
  }, [criteriaId]);

  const handleSave = () => {
    storage.setEvidence(criteriaId, content);
    setIsSaved(true);
    setIsEditing(false);
  };

  const handleChange = (value: string) => {
    setContent(value);
    setIsSaved(false);
  };

  const placeholder = `# ${criteriaName} Evidence

## Summary
Briefly describe how you meet this criterion...

## Evidence Items

### Item 1: [Title]
- Description
- Supporting metrics/data
- Links or references

### Item 2: [Title]
...

## Supporting Documentation
List any letters, articles, or other documents that support this criterion.
`;

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          Evidence Documentation
        </h3>
        <div className="flex items-center gap-2">
          {!isSaved && (
            <span className="text-xs text-yellow-400">Unsaved changes</span>
          )}
          {isEditing ? (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors text-sm"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
          )}
          {!isEditing && content && (
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-80 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono text-sm resize-none"
          />
        ) : content ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-gray-300 text-sm font-sans leading-relaxed">
              {content}
            </pre>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-3">No evidence documented yet</p>
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Add your evidence documentation
            </button>
          </div>
        )}
      </div>

      {content && (
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-500">
            This content will be sent to the AI grader for evaluation. Use markdown formatting for better structure.
          </p>
        </div>
      )}
    </div>
  );
}
