/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GenerateBackdropResponse {
  imageUrl: string;
  prompt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

/**
 * Calls server-side Gemini image generation API to generate a custom background backdrop.
 */
export async function generateAiBackdrop(
  prompt: string,
  aspectRatio: string = '16:9'
): Promise<GenerateBackdropResponse> {
  const response = await fetch('/api/gemini/generate-backdrop', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, aspectRatio }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate backdrop with AI.');
  }

  return data;
}

/**
 * Calls server-side Gemini Chat API for in-app help assistance.
 */
export async function sendChatMessage(
  message: string,
  history: ChatMessage[] = []
): Promise<string> {
  const payloadHistory = history.map((msg) => ({
    role: msg.role,
    text: msg.text,
  }));

  const response = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      history: payloadHistory,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to get answer from AI assistant.');
  }

  return data.reply;
}
