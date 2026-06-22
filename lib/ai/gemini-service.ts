import { GoogleGenerativeAI } from '@google/generative-ai';

import { GEMINI_MODEL, getGeminiApiKey, isGeminiConfigured } from '@/lib/ai/config';

export interface NoteSummaryResult {
  summary: string;
  keyPoints: string[];
  source: 'gemini' | 'offline';
}

export interface TitleGenerationResult {
  title: string;
  source: 'gemini' | 'offline';
}

function buildNoteContent(body: string, transcript?: string): string {
  const parts = [body.trim()];
  if (transcript?.trim()) {
    parts.push(`Transcript:\n${transcript.trim()}`);
  }
  return parts.filter(Boolean).join('\n\n');
}

function parseJsonResponse<T>(text: string): T | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;

  try {
    return JSON.parse(candidate) as T;
  } catch {
    return null;
  }
}

function offlineSummary(body: string, transcript?: string): NoteSummaryResult {
  const content = buildNoteContent(body, transcript);
  if (!content) {
    return {
      summary: 'No content to summarize.',
      keyPoints: [],
      source: 'offline',
    };
  }

  const sentences = content
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const summary = sentences.slice(0, 4).join(' ') || content.slice(0, 280);
  const paragraphs = content
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);

  const keyPoints = (paragraphs.length > 0 ? paragraphs : sentences)
    .slice(0, 5)
    .map((line) => line.replace(/^[-•*]\s*/, '').slice(0, 120));

  return { summary, keyPoints, source: 'offline' };
}

function offlineTitle(body: string, transcript?: string): TitleGenerationResult {
  const content = buildNoteContent(body, transcript);
  const firstLine =
    content
      .split('\n')
      .map((line) => line.trim())
      .find(Boolean) ?? '';

  if (!firstLine) return { title: 'Untitled', source: 'offline' };

  // Get the first sentence or clause
  const firstSentence = firstLine.split(/[.!?]/)[0].trim();

  // Limit to maximum 6 words
  const words = firstSentence.split(/\s+/);
  let title = words.slice(0, 6).join(' ');
  if (words.length > 6) {
    title += '...';
  }

  title = title.trim() || 'Untitled';
  return { title, source: 'offline' };
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key is not configured.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

export async function summarizeNote(
  body: string,
  transcript?: string
): Promise<NoteSummaryResult> {
  const content = buildNoteContent(body, transcript);
  if (!content) {
    return {
      summary: 'Add some text or a transcript before summarizing.',
      keyPoints: [],
      source: 'offline',
    };
  }

  if (!isGeminiConfigured()) {
    return offlineSummary(body, transcript);
  }

  try {
    const prompt = `You are a concise note-taking assistant. Summarize the note below.

Return ONLY valid JSON with this shape:
{
  "summary": "3 to 5 short lines as a single string",
  "keyPoints": ["bullet one", "bullet two", "up to 6 bullets"]
}

Note:
${content}`;

    const text = await callGemini(prompt);
    const parsed = parseJsonResponse<{ summary?: string; keyPoints?: string[] }>(text);

    if (parsed?.summary) {
      return {
        summary: parsed.summary.trim(),
        keyPoints: Array.isArray(parsed.keyPoints)
          ? parsed.keyPoints.map((p) => String(p).trim()).filter(Boolean)
          : [],
        source: 'gemini',
      };
    }
  } catch {
    // Fall through to offline summary.
  }

  return offlineSummary(body, transcript);
}

export async function generateNoteTitle(
  body: string,
  transcript?: string
): Promise<TitleGenerationResult> {
  const content = buildNoteContent(body, transcript);
  if (!content) {
    return { title: 'Untitled', source: 'offline' };
  }

  if (!isGeminiConfigured()) {
    return offlineTitle(body, transcript);
  }

  try {
    const prompt = `Generate a short, clear, and highly concise title (3 to 5 words) that captures the core subject of this note. Do not repeat the first sentence. Return ONLY the plain title text, with no quotes, markdown formatting, or ending punctuation.

Note:
${content.slice(0, 4000)}`;

    const title = (await callGemini(prompt)).replace(/^["']|["']$/g, '').trim();
    if (title) {
      return { title: title.slice(0, 80), source: 'gemini' };
    }
  } catch {
    // Fall through to offline title.
  }

  return offlineTitle(body, transcript);
}
