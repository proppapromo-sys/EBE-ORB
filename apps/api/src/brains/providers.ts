/**
 * providers.ts — thin clients for the three model providers behind the council.
 *
 * Each client degrades gracefully: with no API key it returns a clearly-labelled placeholder
 * (ok: false) instead of throwing, so the whole council runs end-to-end before any key is wired.
 * OpenAI uses the installed SDK; Anthropic and Gemini use their REST APIs over fetch (no extra deps).
 */
import 'dotenv/config';
import { getOpenAI } from '../services/openai.js';
import { getPlatformKey } from '../services/platformKeys.js';
import type { BrainProvider, BrainProviderClient } from './types.js';

type CompleteOpts = { model: string; system: string; user: string; images?: string[]; maxTokens?: number };

function stub(provider: BrainProvider, envVar: string): { text: string; ok: boolean; note: string } {
  return {
    text: `[${provider} not configured] Add your ${provider} key in Settings to enable this brain. (Council ran in degraded mode.)`,
    ok: false,
    note: `${envVar} missing`
  };
}

const openaiClient: BrainProviderClient = {
  provider: 'openai',
  get configured() { return Boolean(getPlatformKey('OPENAI_API_KEY')); },
  async complete({ model, system, user, images, maxTokens }: CompleteOpts) {
    const client = getOpenAI();
    if (!client) return stub('openai', 'OPENAI_API_KEY');
    // GPT models read images too — pass them as image_url parts (data URLs work directly), so Vision
    // works whether the configured vision model is Gemini or OpenAI.
    const content = (images && images.length)
      ? [{ type: 'text' as const, text: user }, ...images.map((u) => ({ type: 'image_url' as const, image_url: { url: u } }))]
      : user;
    const res = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: content as never }
      ],
      temperature: 0.2,
      ...(maxTokens ? { max_tokens: maxTokens } : {})
    });
    return { text: res.choices[0]?.message?.content ?? '', ok: true };
  }
};

const anthropicClient: BrainProviderClient = {
  provider: 'anthropic',
  get configured() { return Boolean(getPlatformKey('ANTHROPIC_API_KEY')); },
  async complete({ model, system, user, maxTokens }: CompleteOpts) {
    const key = getPlatformKey('ANTHROPIC_API_KEY');
    if (!key) return stub('anthropic', 'ANTHROPIC_API_KEY');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens ?? 1500,
        system,
        messages: [{ role: 'user', content: user }]
      })
    });
    if (!res.ok) return { text: '', ok: false, note: `anthropic ${res.status}: ${await res.text()}` };
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? []).map((b) => b.text ?? '').join('').trim();
    return { text, ok: true };
  }
};

const geminiClient: BrainProviderClient = {
  provider: 'gemini',
  get configured() { return Boolean(getPlatformKey('GEMINI_API_KEY') ?? getPlatformKey('GOOGLE_API_KEY')); },
  async complete({ model, system, user, images, maxTokens }: CompleteOpts) {
    const key = getPlatformKey('GEMINI_API_KEY') ?? getPlatformKey('GOOGLE_API_KEY');
    if (!key) return stub('gemini', 'GEMINI_API_KEY');
    const parts: Record<string, unknown>[] = [{ text: user }];
    for (const img of images ?? []) {
      // data URL → inline base64; otherwise pass as a text reference (URL fetch is the caller's job)
      const m = /^data:(.+);base64,(.*)$/.exec(img);
      if (m) parts.push({ inline_data: { mime_type: m[1], data: m[2] } });
      else parts.push({ text: `image: ${img}` });
    }
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts }],
          ...(maxTokens ? { generationConfig: { maxOutputTokens: maxTokens } } : {})
        })
      }
    );
    if (!res.ok) return { text: '', ok: false, note: `gemini ${res.status}: ${await res.text()}` };
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = (data.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? '')
      .join('')
      .trim();
    return { text, ok: true };
  }
};

const CLIENTS: Record<BrainProvider, BrainProviderClient> = {
  openai: openaiClient,
  anthropic: anthropicClient,
  gemini: geminiClient
};

export function getProviderClient(provider: BrainProvider): BrainProviderClient {
  return CLIENTS[provider];
}
