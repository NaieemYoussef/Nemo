import React, { useState, useCallback } from 'react';
import { OperationType, GroundingSource } from './types';
import { OPERATION_LABELS, CUSTOM_COPY_LABELS } from './constants';
import { processTextWithGemini, ProcessTextResult } from './services/geminiService';
import TextAreaInput from './components/TextAreaInput';
import ActionButton from './components/ActionButton';
import ResultDisplay from './components/ResultDisplay';
import LoadingSpinner from './components/LoadingSpinner';

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeOperation, setActiveOperation] = useState<OperationType | null>(null);

  // States for single operations (Fact Check, Rephrase)
  const [singleOpOutputText, setSingleOpOutputText] = useState<string | null>(null);
  const [singleOpGroundingSources, setSingleOpGroundingSources] = useState<GroundingSource[] | undefined>(undefined);

  // States for COMPREHENSIVE_CHECK results
  const [plagiarismResultText, setPlagiarismResultText] = useState<string | null>(null);
  const [plagiarismResultSources, setPlagiarismResultSources] = useState<GroundingSource[] | undefined>(undefined);
  const [enhancementResultText, setEnhancementResultText] = useState<string | null>(null);

  const clearAllResults = () => {
    setSingleOpOutputText(null);
    setSingleOpGroundingSources(undefined);
    setPlagiarismResultText(null);
    setPlagiarismResultSources(undefined);
    setEnhancementResultText(null);
  };

  const handleOperation = useCallback(async (operationType: OperationType) => {
    if (!inputText.trim()) {
      setError("الرجاء إدخال نص للمعالجة.");
      clearAllResults();
      setActiveOperation(null);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setActiveOperation(operationType);
    clearAllResults();

    if (operationType === OperationType.COMPREHENSIVE_CHECK) {
      try {
        const plagiarismPromise = processTextWithGemini(inputText, OperationType.PLAGIARISM_CHECK);
        
        const enhancementChainPromise = async (): Promise<ProcessTextResult> => {
          const linguisticRes = await processTextWithGemini(inputText, OperationType.LINGUISTIC_CHECK);
          if (linguisticRes.processedText.startsWith("خطأ:") || linguisticRes.processedText.startsWith("حدث خطأ")) {
            return { processedText: `التدقيق اللغوي: ${linguisticRes.processedText}` };
          }
          const phrasingRes = await processTextWithGemini(linguisticRes.processedText, OperationType.IMPROVE_PHRASING);
          if (phrasingRes.processedText.startsWith("خطأ:") || phrasingRes.processedText.startsWith("حدث خطأ")) {
             return { processedText: `تحسين الصياغة: ${phrasingRes.processedText}` };
          }
          return phrasingRes;
        };

        const [plagiarismOutcome, enhancementOutcome] = await Promise.allSettled([
          plagiarismPromise,
          enhancementChainPromise()
        ]);

        let aggregatedErrorMessages = "";

        if (plagiarismOutcome.status === 'fulfilled') {
          const res = plagiarismOutcome.value;
          if (res.processedText.startsWith("خطأ:") || res.processedText.startsWith("حدث خطأ")) {
            aggregatedErrorMessages += `فحص الانتحال: ${res.processedText}\n`;
          } else {
            setPlagiarismResultText(res.processedText);
            if (res.sources) setPlagiarismResultSources(res.sources);
          }
        } else {
          aggregatedErrorMessages += `فحص الانتحال: ${plagiarismOutcome.reason?.message || 'فشل غير معروف'}\n`;
        }

        if (enhancementOutcome.status === 'fulfilled') {
          const res = enhancementOutcome.value;
           if (res.processedText.startsWith("خطأ:") || res.processedText.startsWith("حدث خطأ") || res.processedText.startsWith("التدقيق اللغوي:") || res.processedText.startsWith("تحسين الصياغة:")) {
             aggregatedErrorMessages += `${res.processedText}\n`;
           } else {
             setEnhancementResultText(res.processedText);
           }
        } else {
          aggregatedErrorMessages += `التدقيق والتحسين: ${enhancementOutcome.reason?.message || 'فشل غير معروف'}\n`;
        }

        if (aggregatedErrorMessages) {
          setError(aggregatedErrorMessages.trim());
        }

      } catch (e) {
        console.error("Comprehensive check failed unexpectedly:", e);
        const errorMessage = e instanceof Error ? e.message : "حدث خطأ غير متوقع في التدقيق الشامل.";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    } else { 
      try {
        const result = await processTextWithGemini(inputText, operationType);
        if (result.processedText.startsWith("خطأ:") || result.processedText.startsWith("حدث خطأ")) {
          setError(result.processedText);
          setSingleOpOutputText(null); 
        } else {
          setSingleOpOutputText(result.processedText);
        }
        if (result.sources) {
          setSingleOpGroundingSources(result.sources);
        }
      } catch (e) {
        console.error("Operation failed:", e);
        const errorMessage = e instanceof Error ? e.message : "حدث خطأ غير متوقع.";
        setError(`فشل ${OPERATION_LABELS[operationType]}: ${errorMessage}`);
        setSingleOpOutputText(null);
      } finally {
        setIsLoading(false);
      }
    }
  }, [inputText]);

  const handleClear = () => {
    setInputText('');
    setError(null);
    setActiveOperation(null);
    clearAllResults();
    // setIsLoading(false); // isLoading is controlled by operations, not by clear
  };

  const availableOperations = [
    OperationType.COMPREHENSIVE_CHECK,
    OperationType.FACT_CHECK,
    OperationType.REPHRASE,
  ];

  return (
    <div className="min-h-screen container mx-auto px-4 py-8 flex flex-col items-center">
      <header className="mb-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-cyan-300">
          نيمو | الديسك الذكي
        </h1>
        <p className="mt-3 text-lg text-teal-100">
          أداتك المتكاملة لتحسين كتاباتك باللغة العربية
        </p>
      </header>

      <main className="w-full max-w-4xl bg-teal-700 shadow-2xl rounded-xl p-6 sm:p-10">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-cyan-200 mb-4">أدخل النص هنا:</h2>
          <TextAreaInput
            value={inputText}
            onChange={setInputText}
            placeholder="اكتب أو الصق النص الذي ترغب في معالجته..."
            disabled={isLoading}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-cyan-200 mb-4">اختر الإجراء:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {availableOperations.map((opType) => (
              <ActionButton
                key={opType}
                label={OPERATION_LABELS[opType]}
                onClick={() => handleOperation(opType)}
                isLoading={isLoading && activeOperation === opType}
                isActive={activeOperation === opType && !isLoading}
              />
            ))}
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="w-full text-sm sm:text-base text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-75 bg-slate-500 hover:bg-slate-600 focus:ring-slate-300 disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label="مسح الكل والبدء من جديد"
            >
              مسح والبدء من جديد
            </button>
          </div>
        </section>

        {isLoading && <LoadingSpinner />}

        {error && !isLoading && (
          <div className="mt-6 p-4 bg-red-500 bg-opacity-90 border border-red-400 text-white rounded-lg whitespace-pre-line">
            <h3 className="font-semibold text-red-100">حدث خطأ:</h3>
            <p>{error}</p>
          </div>
        )}

        {!isLoading && activeOperation === OperationType.COMPREHENSIVE_CHECK && (
          <>
            {(plagiarismResultText || (plagiarismResultSources && plagiarismResultSources.length > 0)) && (
              <ResultDisplay
                title="نتيجة فحص الانتحال وتحديد التشابه:"
                text={plagiarismResultText}
                sources={plagiarismResultSources}
                operationLabel={OPERATION_LABELS[OperationType.PLAGIARISM_CHECK]}
              />
            )}
            {enhancementResultText && (
              <ResultDisplay
                title="نتيجة التدقيق اللغوي وتحسين الصياغة:"
                text={enhancementResultText}
                operationLabel={CUSTOM_COPY_LABELS.LINGUISTIC_AND_PHRASING}
              />
            )}
          </>
        )}
        
        {!isLoading && 
          activeOperation && 
          activeOperation !== OperationType.COMPREHENSIVE_CHECK &&
          (singleOpOutputText || (singleOpGroundingSources && singleOpGroundingSources.length > 0)) && 
        (
          <ResultDisplay
            title={`نتيجة ${OPERATION_LABELS[activeOperation]}:`}
            text={singleOpOutputText}
            sources={singleOpGroundingSources}
            operationLabel={OPERATION_LABELS[activeOperation]}
          />
        )}
      </main>

      <footer className="mt-12 text-center text-teal-200 text-sm">
        <p>مدعوم بواسطة Google Gemini API</p>
        <p>&copy; {new Date().getFullYear()} نيمو | الديسك الذكي</p>
      </footer>
    </div>
  );
};

export default App;
