import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { CriteriaInfo } from '../types';

interface PolicyGuidanceProps {
  criteria: CriteriaInfo;
}

export function PolicyGuidance({ criteria }: PolicyGuidanceProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <span className="font-semibold text-white">USCIS Policy Guidance</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Official Title */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Official Regulatory Language
            </h4>
            <p className="text-gray-300 text-sm italic">"{criteria.officialTitle}"</p>
          </div>

          {/* Examples */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Evidence Examples
            </h4>
            <ul className="space-y-1">
              {criteria.examples.map((example, index) => (
                <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-amber-400 mt-1">•</span>
                  {example}
                </li>
              ))}
            </ul>
          </div>

          {/* Key Guidance */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Key Guidance
            </h4>
            <p className="text-sm text-gray-300">{criteria.keyGuidance}</p>
          </div>

          {/* Link to Policy Manual */}
          <a
            href={criteria.policyManualRef}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View USCIS Policy Manual
          </a>
        </div>
      )}
    </div>
  );
}
