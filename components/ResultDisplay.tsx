import React, { useState } from 'react';
import { GroundingSource, OperationType, FactCheckItem } from '../types';
import { OPERATION_LABELS, CUSTOM_COPY_LABELS } from '../constants';
import FactCheckResultCard from './FactCheckResultCard'; // Import the new component

interface ResultDisplayProps {
  title: string;
  text: string | null; // For FACT_CHECK, this will be a JSON string
  sources?: GroundingSource[];
  operationLabel?: string;
}

const renderHighlightedText = (text: string): (string | JSX.Element)[] => {
  const parts = text.split(/(%%HIGHLIGHT_START%%|%%HIGHLIGHT_END%%)/g);
  const elements: (string | JSX.Element)[] = [];
  let isHighlighted = false;
  let keyIndex = 0;

  for (const part of parts) {
    if (part === '%%HIGHLIGHT_START%%') {
      isHighlighted = true;
    } else if (part === '%%HIGHLIGHT_END%%') {
      isHighlighted = false;
    } else if (part) {
      if (isHighlighted) {
        elements.push(
          <mark
            key={`highlight-${keyIndex++}`}
            className="bg-yellow-400 text-slate-900 px-1 py-0.5 rounded"
            aria-label="Highlighted-text"
          >
            {part}
          </mark>
        );
      } else {
        elements.push(part);
      }
    }
  }
  return elements;
};

const ResultDisplay: React.FC<ResultDisplayProps> = ({ title, text, sources, operationLabel }) => {
  const [copyButtonText, setCopyButtonText] = useState<string>("نسخ");

  let factCheckData: FactCheckItem[] | null = null;
  let parseError: string | null = null;

  if (operationLabel === OPERATION_LABELS[OperationType.FACT_CHECK] && text) {
    try {
      let jsonStrToParse = text.trim();
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStrToParse.match(fenceRegex);
      if (match && match[2]) {
        jsonStrToParse = match[2].trim();
      }
      const parsed = JSON.parse(jsonStrToParse);
      if (Array.isArray(parsed)) {
        factCheckData = parsed as FactCheckItem[];
      } else {
        parseError = "البيانات المستلمة ليست مصفوفة صالحة.";
      }
    } catch (e) {
      console.error("Failed to parse fact check JSON:", e);
      parseError = "فشل في تحليل بيانات التحقق من المعلومات المستلمة من النموذج. قد يكون النص الأصلي بتنسيق غير متوقع.";
    }
  }
  
  const noContentToDisplay = !text && (!sources || sources.length === 0) && !factCheckData;
  if (noContentToDisplay && !parseError) {
    // If we expect sources for this operation but none were found (and no other content),
    // this will be handled by the "expectsSources" logic below.
    // If it's not an operation that expects sources, and no text/data, then return null.
    const expectsSourcesForNullRender = operationLabel === OPERATION_LABELS[OperationType.PLAGIARISM_CHECK] ||
                                    operationLabel === OPERATION_LABELS[OperationType.FACT_CHECK];
    if (!expectsSourcesForNullRender) {
        return null;
    }
  }


  const handleCopy = async () => {
    // For fact check, we don't copy the JSON, but the raw text if it was non-JSON for some reason
    const textToCopy = (operationLabel === OPERATION_LABELS[OperationType.FACT_CHECK] && parseError) ? text : text;
    if (textToCopy) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        setCopyButtonText("تم النسخ!");
        setTimeout(() => setCopyButtonText("نسخ"), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
        setCopyButtonText("فشل النسخ");
        setTimeout(() => setCopyButtonText("نسخ"), 2000);
      }
    }
  };

  const knownLabelsForCopy = [
    OPERATION_LABELS[OperationType.LINGUISTIC_CHECK],
    CUSTOM_COPY_LABELS.LINGUISTIC_AND_PHRASING,
    OPERATION_LABELS[OperationType.IMPROVE_PHRASING], 
    OPERATION_LABELS[OperationType.REPHRASE], 
  ];
  
  const showCopyButton = text && operationLabel && 
    (knownLabelsForCopy.includes(operationLabel) || (operationLabel === OPERATION_LABELS[OperationType.FACT_CHECK] && parseError));

  const expectsSources = operationLabel === OPERATION_LABELS[OperationType.PLAGIARISM_CHECK] ||
                        operationLabel === OPERATION_LABELS[OperationType.FACT_CHECK];

  return (
    <div className="mt-6 p-6 bg-teal-800 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-3 border-b-2 border-teal-600 pb-2">
        <h3 className="text-xl font-semibold text-cyan-300">{title}</h3>
        {showCopyButton && (
          <button
            onClick={handleCopy}
            className="px-3 py-1 text-sm bg-cyan-500 hover:bg-cyan-600 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-300"
            aria-label="نسخ النص الناتج"
          >
            {copyButtonText}
          </button>
        )}
      </div>

      {operationLabel === OPERATION_LABELS[OperationType.FACT_CHECK] ? (
        <>
          {parseError && (
            <div className="whitespace-pre-wrap text-slate-100 bg-red-700 p-4 rounded-md text-sm sm:text-base leading-relaxed">
              <p className="font-semibold">خطأ في عرض النتائج:</p>
              <p>{parseError}</p>
              <p className="mt-2">النص الخام المستلم:</p>
              <pre className="mt-1 text-xs">{text}</pre>
            </div>
          )}
          {factCheckData && (
            <div className="space-y-4">
              {factCheckData.map((item, index) => (
                <FactCheckResultCard key={index} item={item} />
              ))}
            </div>
          )}
        </>
      ) : (
        text && (
          <div className="whitespace-pre-wrap text-slate-100 bg-teal-700 p-4 rounded-md text-sm sm:text-base leading-relaxed">
            {renderHighlightedText(text).map((part, i) => <React.Fragment key={i}>{part}</React.Fragment>)}
          </div>
        )
      )}
      
      {sources && sources.length > 0 ? (
        <div className="mt-4">
          <h4 className="text-lg font-semibold text-cyan-400 mb-2">المصادر المرجعية:</h4>
          <ul className="list-disc ps-5 space-y-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            {sources.map((source, index) => (
              <li key={index} className="text-teal-100 text-sm break-words">
                {source.web?.uri && (
                  <a
                    href={source.web.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-cyan-300 underline transition-colors"
                  >
                    {source.web.title || source.web.uri}
                  </a>
                )}
                 {source.news?.uri && (
                  <a
                    href={source.news.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-cyan-300 underline transition-colors"
                  >
                    {source.news.title || source.news.uri}
                    {source.news.publisher && ` (${source.news.publisher})`}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        expectsSources && (!text && !factCheckData && !parseError) && ( 
          // Show this message if sources were expected, AND no other content (text or factCheckData) is present, and no parse error.
          // This implies the operation was solely to get sources, or other content failed but wasn't a parse error for sources.
          <div className="mt-4">
            <p className="text-teal-200 text-sm">لم يتم إرجاع مصادر مرجعية لهذه العملية من قبل النموذج.</p>
          </div>
        )
      )}
    </div>
  );
};

export default ResultDisplay;