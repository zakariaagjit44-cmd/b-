import { Message } from '../types';

/**
 * Sends a new message and the conversation history to the backend API
 * and returns a readable stream for the AI's response.
 * @param history - The current conversation history.
 * @param newUserMessage - The new message from the user.
 * @returns An async generator that yields the text chunks of the AI's response.
 */
export async function* getAiResponseStream(
  history: Message[],
  newUserMessage: string
): AsyncGenerator<string> {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'chat',
      payload: { history, newUserMessage },
    }),
  });

  if (!response.ok || !response.body) {
    const errorText = await response.text();
    console.error('Error from chat API:', errorText);
    throw new Error(`Failed to get AI response: ${errorText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    const chunk = decoder.decode(value);
    // SSE format is "data: { ... }\n\n"
    const lines = chunk.split('\n\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.substring(6);
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.text) {
            yield parsed.text;
          }
        } catch (e) {
          console.error("Failed to parse stream chunk:", jsonStr);
        }
      }
    }
  }
}

/**
 * Sends text to the backend to be converted to speech.
 * @param textToSpeak - The text to synthesize.
 * @returns A base64 encoded string of the audio data.
 */
export const getAiSpeech = async (textToSpeak: string): Promise<string> => {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'speak',
          payload: { textToSpeak },
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to get AI speech.");
    }
    const data = await response.json();
    return data.audio;
};

/**
 * Sends the conversation history to the backend for final evaluation.
 * @param history - The complete conversation history.
 * @returns An object containing the score and feedback.
 */
export const getFinalEvaluation = async (history: Message[]): Promise<{ score: number; feedback: string }> => {
  try {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'evaluate',
          payload: { history },
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Evaluation request failed: ${errorText}`);
    }
    return await response.json();

  } catch (error) {
      console.error('Error in getFinalEvaluation:', error);
      return {
          score: 0,
          feedback: "عذرًا، حدث خطأ أثناء إنشاء التقييم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى."
      };
  }
};