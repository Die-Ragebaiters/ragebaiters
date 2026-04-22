import { supabase } from './auth.js';

const PENDING_REGISTRATION_KEY = 'ragebaiters_pending_registration';

function functionsBaseUrl() {
  return `${String(window.SUPABASE_URL || '').replace(/\/+$/, '')}/functions/v1`;
}

async function authHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    apikey: window.SUPABASE_ANON_KEY,
  };

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) headers.Authorization = `Bearer ${token}`;

  return headers;
}

export async function callEdgeFunction(name, payload) {
  const response = await fetch(`${functionsBaseUrl()}/${name}`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(payload || {}),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `Edge Function ${name} fehlgeschlagen.`);
  }

  return data;
}

export async function inviteCheck(invite, captchaToken = '') {
  return callEdgeFunction('invite-api', {
    action: 'check',
    invite,
    captchaToken,
  });
}

export async function completeRegistration(invite, username) {
  return callEdgeFunction('invite-api', {
    action: 'complete-registration',
    invite,
    username,
  });
}

export async function mediaAction(action, payload = {}) {
  return callEdgeFunction('media-api', { action, ...payload });
}

export function savePendingRegistration(invite, username) {
  localStorage.setItem(PENDING_REGISTRATION_KEY, JSON.stringify({ invite, username }));
}

export function loadPendingRegistration() {
  try {
    const raw = localStorage.getItem(PENDING_REGISTRATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingRegistration() {
  localStorage.removeItem(PENDING_REGISTRATION_KEY);
}
