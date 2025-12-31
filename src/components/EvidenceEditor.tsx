import { useState, useRef } from 'react';
import { FileText, Edit3, Save, Upload, X, FileCheck, ToggleLeft, ToggleRight, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { useEvidence, useAssumeEvidenceExists, useExhibits } from '../hooks/useData';
import type { CriteriaId, Exhibit } from '../types';

interface EvidenceEditorProps {
  criteriaId: CriteriaId;
  criteriaName: string;
  onSave?: (content: string) => void;
}

export function EvidenceEditor({ criteriaId, criteriaName, onSave }: EvidenceEditorProps) {
  const { content, setContent: saveContent, loading } = useEvidence(criteriaId);
  const { assumeExists: assumeEvidenceExists, setAssumeExists: setAssumeEvidenceExists } = useAssumeEvidenceExists(criteriaId);
  const {
    exhibits,
    loading: exhibitsLoading,
    uploading,
    uploadExhibit,
    updateLabel,
    deleteExhibit,
    getExhibitUrl,
    extractExhibitText,
  } = useExhibits(criteriaId);
  const [localContent, setLocalContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [processingExhibits, setProcessingExhibits] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync local content with loaded content
  if (!loading && !initialized) {
    setLocalContent(content);
    setInitialized(true);
  }

  const handleSave = () => {
    saveContent(localContent);
    setIsSaved(true);
    setIsEditing(false);
    onSave?.(localContent);
  };

  const handleChange = (value: string) => {
    setLocalContent(value);
    setIsSaved(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const label = `${criteriaId.charAt(0).toUpperCase()}-${exhibits.length + i + 1}`;
      await uploadExhibit(file, label);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenExhibit = async (filePath: string) => {
    const url = await getExhibitUrl(filePath);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleProcessExhibit = async (exhibit: Exhibit) => {
    setProcessingExhibits(prev => new Set(prev).add(exhibit.id));
    try {
      await extractExhibitText(exhibit);
    } finally {
      setProcessingExhibits(prev => {
        const next = new Set(prev);
        next.delete(exhibit.id);
        return next;
      });
    }
  };

  const placeholder = `Paste your petition evidence for ${criteriaName} here...

Example:
Evidence of Published Material in Major Media

TechBullion
Mr. Qazi has been featured in TechBullion, a major technology and business publication with substantial national and international reach...

The published article discusses [description of how the article covers the beneficiary's work, achievements, and contributions]...

Conclusion
The feature in TechBullion constitutes compelling evidence that published material about the beneficiary's work has appeared in major media...`;

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          Petition Evidence
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
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isEditing ? (
          <textarea
            value={localContent}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-80 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono text-sm resize-none"
          />
        ) : localContent ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-gray-300 text-sm font-sans leading-relaxed">
              {localContent}
            </pre>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-3">No petition evidence added yet</p>
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Paste your petition evidence
            </button>
          </div>
        )}
      </div>

      {/* Assume Evidence Exists Toggle */}
      <div className="px-4 py-3 border-t border-gray-700">
        <button
          onClick={() => setAssumeEvidenceExists(!assumeEvidenceExists)}
          className="flex items-center gap-3 w-full text-left"
        >
          {assumeEvidenceExists ? (
            <ToggleRight className="w-6 h-6 text-emerald-400" />
          ) : (
            <ToggleLeft className="w-6 h-6 text-gray-500" />
          )}
          <div>
            <span className={`text-sm font-medium ${assumeEvidenceExists ? 'text-emerald-400' : 'text-gray-400'}`}>
              Trust referenced exhibits
            </span>
            <p className="text-xs text-gray-500">
              {assumeEvidenceExists
                ? 'ON: AI will assume all referenced exhibits exist and are properly attached'
                : 'OFF: Upload exhibits below for AI to analyze their content'}
            </p>
          </div>
        </button>
      </div>

      {/* Exhibits Section */}
      {!assumeEvidenceExists && (
        <div className="px-4 py-3 border-t border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-400" />
              Attached Exhibits
            </h4>
            <label className={`flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? 'Uploading...' : 'Upload'}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                disabled={uploading}
              />
            </label>
          </div>

          {exhibitsLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : exhibits.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">
              No exhibits attached. Upload PDFs or images to include in AI analysis.
            </p>
          ) : (
            <div className="space-y-2">
              {exhibits.map((exhibit) => (
                <div
                  key={exhibit.id}
                  className="flex items-center gap-3 p-2 bg-gray-900 rounded-lg"
                >
                  <input
                    type="text"
                    value={exhibit.label}
                    onChange={(e) => updateLabel(exhibit.id, e.target.value)}
                    className="w-16 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 focus:outline-none focus:border-blue-500"
                    placeholder="A-1"
                  />
                  <button
                    onClick={() => handleOpenExhibit(exhibit.file_path)}
                    className="flex-1 text-sm text-gray-400 truncate text-left hover:text-blue-400 flex items-center gap-1"
                  >
                    {exhibit.file_name}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </button>
                  <span className="text-xs text-gray-600">
                    {(exhibit.file_size / 1024).toFixed(0)}KB
                  </span>
                  {processingExhibits.has(exhibit.id) ? (
                    <span className="text-xs text-blue-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Processing
                    </span>
                  ) : exhibit.extracted_text ? (
                    <span className="text-xs text-emerald-500">Processed</span>
                  ) : (
                    <button
                      onClick={() => handleProcessExhibit(exhibit)}
                      className="text-xs text-yellow-500 hover:text-yellow-400 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Process
                    </button>
                  )}
                  <button
                    onClick={() => deleteExhibit(exhibit.id)}
                    className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {localContent && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            {assumeEvidenceExists
              ? 'AI will trust that all exhibits and attachments referenced in your text exist and are properly attached to the petition.'
              : exhibits.length > 0
                ? (() => {
                    const processedCount = exhibits.filter(e => e.extracted_text).length;
                    const pendingCount = exhibits.length - processedCount;
                    if (pendingCount > 0) {
                      return `${processedCount} of ${exhibits.length} exhibit(s) processed. Process remaining exhibits before grading for full analysis.`;
                    }
                    return `AI will analyze your petition text plus ${exhibits.length} processed exhibit(s).`;
                  })()
                : 'AI will only evaluate based on what is explicitly written. Upload exhibits above for full analysis.'}
          </p>
        </div>
      )}
    </div>
  );
}
