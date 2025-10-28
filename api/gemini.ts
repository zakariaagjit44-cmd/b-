import { GoogleGenAI, Chat, Type, Modality } from "@google/genai";
import type { Message, Sender } from '../src/types';

// This is a Vercel Edge Function
export const config = {
  runtime: 'edge',
};

// Initialize the Gemini AI model
// IMPORTANT: The API key is read from environment variables on the server.
// It is NOT exposed to the client.
// FIX: The GoogleGenAI constructor expects an object with an `apiKey` property.
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY!});

// The main handler for all API requests from the frontend
export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { type, payload } = await request.json();

    switch (type) {
      case 'chat':
        return handleChat(payload);
      case 'evaluate':
        return handleEvaluation(payload);
      case 'speak':
        return handleSpeech(payload);
      default:
        return new Response(JSON.stringify({ error: 'Invalid request type' }), { status: 400 });
    }
  } catch (error: any) {
    console.error(`Error in API handler: ${error.message}`);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), { status: 500 });
  }
}

// Handles streaming chat responses
async function handleChat({ history, newUserMessage }: { history: Message[], newUserMessage: string }) {
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    history: transformHistoryForApi(history),
    config: {
      temperature: 0.7,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 8192,
      systemInstruction: `You are a friendly but professional Telc examiner. Your task is to conduct a speaking practice session in German.
- Start with a simple greeting and a question.
- Keep your responses concise and natural, like in a real conversation.
- Ask follow-up questions based on the user's answers.
- Vary your questions. Cover topics like hobbies, travel, work, or daily life.
- Do not correct the user during the conversation. Save all feedback for the final evaluation.
- All your responses must be in German.`
    },
  });

  const stream = await chat.sendMessageStream({ message: newUserMessage });

  // Pipe the stream from Gemini to the client
  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
          controller.enqueue(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }
      }
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Handles the final evaluation request
async function handleEvaluation({ history }: { history: Message[] }) {
  const conversationText = history
    .map(m => `${m.sender === 'user' ? 'User' : 'Examiner'}: ${m.text}`)
    .join('\n');

  const prompt = `
      Based on the following German conversation from a Telc practice session, please provide a final evaluation.
      The user's speech is marked with "User:".
      
      Conversation:
      ${conversationText}
      
      Your task is to:
      1. Score the user's performance out of 100, considering fluency, grammar, vocabulary, and pronunciation (as inferred from text).
      2. Write a brief, constructive feedback in Arabic, highlighting strengths and areas for improvement.

      Return ONLY the JSON object.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.3,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER, description: "The user's final score out of 100." },
          feedback: { type: Type.STRING, description: "Constructive feedback for the user in Arabic." }
        },
        required: ["score", "feedback"]
      }
    }
  });

  const resultText = response.text;
  if (!resultText) {
    throw new Error("Received an empty text response for final evaluation.");
  }

  return new Response(resultText.trim(), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// Handles the text-to-speech request
async function handleSpeech({ textToSpeak }: { textToSpeak: string }) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: textToSpeak }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("No audio data received from Gemini TTS API.");
  }
  return new Response(JSON.stringify({ audio: base64Audio }), {
    headers: { 'Content-Type': 'application/json' },
  });
}


// Helper to format message history for the Gemini API
function transformHistoryForApi(messages: Message[]) {
    // Filter out the very first welcome message if it's the default one
    const relevantMessages = messages.filter(m => m.id > 1);
    return relevantMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
    }));
}