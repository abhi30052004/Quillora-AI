/**
 * Quillora AI — Frontend API Client
 */

const RAW_API_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = RAW_API_URL ? `${RAW_API_URL.replace(/\/$/, '')}/api` : '/api';

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      status: 'offline',
      knowledge_loaded: false,
      groq_configured: false,
      error: err.message,
    };
  }
}

export async function checkWriting(text, englishVariant = 'American') {
  const res = await fetch(`${API_BASE}/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, english_variant: englishVariant }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message = data.detail || `Server error (HTTP ${res.status})`;
    throw new Error(message);
  }

  return await res.json();
}

export async function enhanceWords(text, tone = 'neutral') {
  const res = await fetch(`${API_BASE}/enhance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, tone }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message = data.detail || `Server error (HTTP ${res.status})`;
    throw new Error(message);
  }

  return await res.json();
}

export async function reloadKnowledge() {
  const res = await fetch(`${API_BASE}/reload-knowledge`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reload knowledge base');
  return await res.json();
}
