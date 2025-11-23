import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, TestResult, WritingPrompt } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_FAST = 'gemini-2.5-flash';
const MODEL_SMART = 'gemini-3-pro-preview';
const MODEL_IMAGE = 'gemini-2.5-flash-image';

/**
 * Generates a Writing Task prompt.
 */
export const generateWritingTask = async (taskType: 'Task 1' | 'Task 2'): Promise<WritingPrompt> => {
  const prompt = `Generate a realistic IELTS Academic Writing ${taskType} prompt. 
  Output strictly in JSON format.
  For Task 1, provide a detailed visual description of a bar chart, line graph, pie chart, or map in the "imageDescription" field so I can generate an image from it.
  
  JSON Schema:
  {
    "title": "string",
    "instructions": "string",
    "imageDescription": "string (optional, for Task 1 data description)"
  }`;

  try {
    // 1. Generate text prompt
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            instructions: { type: Type.STRING },
            imageDescription: { type: Type.STRING },
          },
          required: ['title', 'instructions']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const taskData = JSON.parse(text) as WritingPrompt;

    // 2. If Task 1, generate the chart image
    if (taskType === 'Task 1' && taskData.imageDescription) {
      try {
        const imageResp = await ai.models.generateContent({
          model: MODEL_IMAGE,
          contents: `Create a clean, high-contrast, professional IELTS Academic Task 1 chart or diagram.
          Based on: ${taskData.imageDescription}.
          Style: Educational textbook, clear white background, legible labels, distinct data points.
          Do not include extra artistic elements.`,
          config: {
            imageConfig: { aspectRatio: '4:3' }
          }
        });

        if (imageResp.candidates?.[0]?.content?.parts) {
          for (const part of imageResp.candidates[0].content.parts) {
            if (part.inlineData) {
              taskData.imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              break;
            }
          }
        }
      } catch (imgError) {
        console.error("Error generating task image:", imgError);
        // Continue without image, UI will fallback to text description
      }
    }

    return taskData;

  } catch (error) {
    console.error("Error generating task:", error);
    return {
      title: "Error Generating Task",
      instructions: "Please try again or check your internet connection.",
    };
  }
};

/**
 * Evaluates the writing submission.
 */
export const evaluateWriting = async (task: WritingPrompt, essay: string): Promise<TestResult> => {
  const parts: any[] = [];

  // Add Image Part if available (for Task 1)
  if (task.imageUrl) {
    const base64Data = task.imageUrl.split(',')[1];
    const mimeType = task.imageUrl.match(/:(.*?);/)?.[1] || 'image/png';
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    });
  }

  const promptText = `
    Act as a strict IELTS Examiner. Evaluate the following essay based on the official IELTS Writing Band Descriptors.
    
    Task Instructions: ${task.instructions}
    ${task.imageDescription ? `Data Reference (Description): ${task.imageDescription}` : ''}
    
    Student Essay: "${essay}"
    
    Return the evaluation in strict JSON format matching this schema:
    {
      "overallBand": number (0-9, 0.5 increments),
      "criteriaScores": [
        { "name": "Task Achievement/Response", "score": number, "description": "short feedback" },
        { "name": "Coherence & Cohesion", "score": number, "description": "short feedback" },
        { "name": "Lexical Resource", "score": number, "description": "short feedback" },
        { "name": "Grammatical Range & Accuracy", "score": number, "description": "short feedback" }
      ],
      "feedbackText": "A comprehensive summary of performance, approx 150 words. Use Markdown for bolding.",
      "corrections": [
        { "original": "text with error", "correction": "corrected text", "explanation": "why it was wrong" }
      ],
      "modelAnswer": "A band 9.0 version of the essay."
    }
  `;

  parts.push({ text: promptText });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_SMART,
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as TestResult;
  } catch (error) {
    console.error("Error evaluating writing:", error);
    throw error;
  }
};

/**
 * Acts as the Speaking Examiner.
 * Generates the NEXT question or examiner response based on the conversation history.
 */
export const getExaminerResponse = async (history: ChatMessage[], currentPart: string): Promise<string> => {
  const systemInstruction = `
    You are an official IELTS Speaking Examiner. Your name is Mr. Gemini.
    Maintain a formal, polite, and neutral tone.
    
    Current Test Phase: ${currentPart}
    
    Rules:
    1. Ask ONE question at a time.
    2. Do NOT give feedback, scores, or corrections during the test.
    3. Wait for the user to answer before moving to the next question.
    4. If the user's answer is too short, you may ask "Why?" or "Can you explain more?" once.
    5. In Part 2, give the topic card text and say "You have 1 minute to prepare."
    6. In Part 3, ask abstract questions related to the Part 2 topic.
    
    If the user says "I'm ready" or "Start", begin with an introduction.
  `;

  const contents = history.map(msg => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.text }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "I didn't catch that. Could you repeat?";
  } catch (error) {
    console.error("Examiner error:", error);
    return "Let's continue to the next question.";
  }
};

/**
 * Evaluates the full speaking transcript.
 */
export const evaluateSpeaking = async (history: ChatMessage[]): Promise<TestResult> => {
  const transcript = history.map(h => `${h.role.toUpperCase()}: ${h.text}`).join('\n');
  
  const prompt = `
    Act as a senior IELTS Examiner. Evaluate this speaking test transcript.
    
    Transcript:
    ${transcript}
    
    Provide feedback in JSON format:
    {
      "overallBand": number,
      "criteriaScores": [
        { "name": "Fluency & Coherence", "score": number, "description": "string" },
        { "name": "Lexical Resource", "score": number, "description": "string" },
        { "name": "Grammatical Range & Accuracy", "score": number, "description": "string" },
        { "name": "Pronunciation", "score": number, "description": "Assume standard clear pronunciation unless indicated by text stumbling (e.g. 'um', 'uh'). Mark neutral if unknown." }
      ],
      "feedbackText": "Detailed feedback summary in Markdown.",
      "corrections": [
         { "original": "phrase used", "correction": "better phrase", "explanation": "reason" }
      ],
      "pronunciationTips": [
         { 
           "word": "word or phrase from transcript", 
           "ipa": "IPA transcription", 
           "error": "Specific error (e.g. Silent 'b' pronounced, Wrong stress)", 
           "tip": "How to fix it" 
         }
      ],
      "modelAnswer": "Pick one specific question from the transcript and provide a Band 9.0 answer for it."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_SMART,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    
    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text) as TestResult;
  } catch (error) {
    console.error("Grading error:", error);
    throw error;
  }
};