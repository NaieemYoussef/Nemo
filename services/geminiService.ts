
import { GoogleGenAI, GenerateContentResponse, GroundingChunk } from "@google/genai";
import { OperationType, GroundingSource } from '../types';
import { GEMINI_MODEL_TEXT, OPERATION_PROMPTS } from '../constants';

// Ensure API_KEY is available in the environment.
const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_API_KEY" });

export interface ProcessTextResult {
  processedText: string;
  sources?: GroundingSource[];
}

interface SdkGoogleDate {
    year?: number;
    month?: number;
    day?: number;
}

interface SdkNewsContent {
    uri?: string;
    title?: string;
    publicationDate?: SdkGoogleDate;
    publisher?: string;
    snippet?: string;
}

interface SdkWebContent {
    uri?: string;
    title?: string;
}


export const processTextWithGemini = async (
  text: string,
  operationType: OperationType
): Promise<ProcessTextResult> => {
  if (!apiKey) {
    return { processedText: "خطأ: مفتاح API غير مهيأ. يرجى التأكد من تعيين متغير البيئة API_KEY." };
  }
  
  const prompt = OPERATION_PROMPTS[operationType](text);
  const isFactCheck = operationType === OperationType.FACT_CHECK;
  const useGoogleSearch = operationType === OperationType.PLAGIARISM_CHECK || isFactCheck;
  
  try {
    let response: GenerateContentResponse;

    let config: any = {};
    if (useGoogleSearch) {
      config.tools = [{ googleSearch: {} }];
    }
    
    if (isFactCheck) {
        config.systemInstruction = "You are an API assistant that responds exclusively with valid JSON strings. Do not include any natural language explanations, introductions, or conclusions outside of the JSON structure itself. Your response must start directly with the JSON content.";
    }


    response = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      ...(Object.keys(config).length > 0 && { config }),
    });
    
    const apiGeneratedText = response.text;
    // Ensure processedText is always a string. If API returns undefined/null for text, default to empty string.
    const processedText = typeof apiGeneratedText === 'string' ? apiGeneratedText : "";
    
    let sources: GroundingSource[] | undefined = undefined;

    if (useGoogleSearch && 
        response.candidates && response.candidates[0]?.groundingMetadata?.groundingChunks) {
      
      console.log(`Raw grounding chunks from API for ${operationType}:`, JSON.stringify(response.candidates[0].groundingMetadata.groundingChunks, null, 2));

      sources = response.candidates[0].groundingMetadata.groundingChunks
        .map((chunk: GroundingChunk): GroundingSource | null => {
          const retrievedContext = chunk.retrievedContext;

          if (retrievedContext) {
            if ('web' in retrievedContext && retrievedContext.web) {
              const sdkWeb = retrievedContext.web as SdkWebContent;
              const uri = sdkWeb.uri?.trim();
              if (uri && (uri.startsWith('http://') || uri.startsWith('https://'))) {
                const appWeb: NonNullable<GroundingSource['web']> = { uri };
                if (sdkWeb.title) {
                  appWeb.title = sdkWeb.title;
                }
                return { web: appWeb };
              }
            }
            
            if ('news' in retrievedContext && retrievedContext.news) {
              const sdkNews = retrievedContext.news as SdkNewsContent;
              const uri = sdkNews.uri?.trim();
              if (uri && (uri.startsWith('http://') || uri.startsWith('https://'))) {
                const appNews: NonNullable<GroundingSource['news']> = { uri };
                if (sdkNews.title) appNews.title = sdkNews.title;
                if (sdkNews.publisher) appNews.publisher = sdkNews.publisher;
                if (sdkNews.snippet) appNews.snippet = sdkNews.snippet;

                if (sdkNews.publicationDate) {
                  const { year, month, day } = sdkNews.publicationDate;
                  if (typeof year === 'number' && typeof month === 'number' && typeof day === 'number') {
                    appNews.publicationDate = { year, month, day };
                  }
                }
                return { news: appNews };
              }
            }
          }
          return null;
        })
        .filter((source): source is GroundingSource => source !== null);
      
      console.log(`Filtered sources to be used for ${operationType}:`, JSON.stringify(sources, null, 2));
    }
    
    return { processedText, sources };

  } catch (error) {
    console.error(`Error calling Gemini API for ${operationType}:`, error);
    let errorMessage = "حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.";
    if (error instanceof Error) {
        if (error.message.includes("API_KEY_INVALID") || error.message.includes("API key not valid")) {
            errorMessage = "خطأ في مفتاح API. يرجى التحقق من صحة المفتاح.";
        } else if (error.message.includes("quota") || error.message.includes("Quota")) {
            errorMessage = "لقد تجاوزت حصتك المسموح بها من استخدام API. يرجى المحاولة لاحقًا أو التحقق من خطة اشتراكك.";
        } else if (isFactCheck && (error.message.toLowerCase().includes("json") || error.message.toLowerCase().includes("unexpected token"))) {
            errorMessage = "خطأ: لم يتمكن النموذج من إرجاع رد بتنسيق JSON صالح. قد يكون بسبب طبيعة النص المدخل أو مشكلة مؤقتة.";
        } else if (error.message.includes("Tool use with a response mime type: 'application/json' is unsupported")) {
            errorMessage = "خطأ في إعدادات API: لا يمكن طلب JSON مع استخدام أدوات البحث. تم تعديل التعليمات لتجاوز هذا.";
        }
    }
    return { processedText: errorMessage, sources: undefined };
  }
};
