/**
 * functions/api/chat.ts — Cloudflare Pages Function
 *
 * This is the plug-in point for your LLM layer.
 * Currently returns stub responses so the UI is fully functional.
 *
 * ── TO CONNECT YOUR SOUL ────────────────────────────────────────
 *
 *   1. Add ANTHROPIC_API_KEY (or your provider's key) to CF Pages secrets.
 *   2. Uncomment the Env interface field below.
 *   3. Replace the STUB BLOCK with your real LLM call.
 *
 *   Example with Anthropic SDK (add "anthropic" to package.json first):
 *
 *     import Anthropic from "@anthropic-ai/sdk";
 *
 *     const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
 *     const aiRes  = await client.messages.create({
 *       model:      "claude-opus-4-8",
 *       max_tokens: 1024,
 *       system:     SOUL_PROMPT, // import from your second-brain project
 *       messages:   body.messages,
 *     });
 *     const content = aiRes.content[0].type === "text" ? aiRes.content[0].text : "";
 *     return jsonResponse({ role: "assistant", content });
 *
 * ── STREAMING ───────────────────────────────────────────────────
 *
 *   For streaming, switch the client to stream mode and return a
 *   ReadableStream via:
 *
 *     const stream = await client.messages.stream({ ... });
 *     return new Response(stream.toReadableStream(), {
 *       headers: { "Content-Type": "text/event-stream", ... }
 *     });
 *
 *   Then update chatbot.ts to consume SSE with EventSource / getReader().
 *
 * ────────────────────────────────────────────────────────────────
 */

export interface Env {
  // ANTHROPIC_API_KEY: string;
  // Add other bindings (KV, D1, etc.) here as your architecture grows.
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: Message[];
}

interface ChatResponse {
  role: 'assistant';
  content: string;
}

// ── Stub responses (remove once LLM is wired) ──────────────────
const STUBS = [
  "I'm still finding my voice — come back when I'm more awake.",
  "That's worth sitting with. I'll have more to say soon.",
  "The soul hasn't fully loaded yet. Try again.",
  "Good question. I'm turning it over.",
  "Not sure yet. But I will be.",
];

function stub(): ChatResponse {
  return {
    role: 'assistant',
    content: STUBS[Math.floor(Math.random() * STUBS.length)],
  };
}

// ── Helpers ────────────────────────────────────────────────────
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function isValidRequest(body: unknown): body is ChatRequest {
  return (
    typeof body === 'object' &&
    body !== null &&
    Array.isArray((body as ChatRequest).messages) &&
    (body as ChatRequest).messages.every(
      (m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
    )
  );
}

// ── POST /api/chat ─────────────────────────────────────────────
export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  if (!isValidRequest(body)) {
    return jsonResponse({ error: 'Bad request: messages array required' }, 400);
  }

  // ── STUB BLOCK — replace with real LLM call ──────────────────
  const response = stub();
  // ─────────────────────────────────────────────────────────────

  return jsonResponse(response);
};

// ── OPTIONS (CORS preflight) ───────────────────────────────────
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
