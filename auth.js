/* ============================================================
   Ragebaiters – Zentraler Supabase-Client + Navigations-Helfer
   ============================================================ */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY ||
    window.SUPABASE_URL.includes('DEIN-PROJEKT')) {
  console.warn('[Ragebaiters] Bitte config.js mit deinen Supabase-Daten füllen.');
}

export const supabase = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// Macht den Client auch ohne Import auf allen Seiten verfügbar
window.supabase = supabase;

/* ----- Session-Helfer ----- */
export async function getSessionUser() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user || null;
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, role')
    .eq('id', userId)
    .maybeSingle();
  if (error) { console.error(error); return null; }
  return data;
}

/* ----- SVG-Icons ----- */
const ICON_DASHBOARD = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="3" y="3"  width="7" height="9"  rx="1.2"/>
    <rect x="14" y="3" width="7" height="5"  rx="1.2"/>
    <rect x="14" y="12" width="7" height="9" rx="1.2"/>
    <rect x="3" y="16" width="7" height="5"  rx="1.2"/>
  </svg>`;

const ICON_LOGOUT = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>`;

/* ----- Navigation + Footer dynamisch ----- */
export async function renderAuthNav(active = '') {
  const nav    = document.querySelector('.nav-links');
  const footer = document.querySelector('.footer');

  // Alte dynamische Einträge entfernen
  document.querySelectorAll('[data-auth-link]').forEach(el => el.remove());

  const user = await getSessionUser();

  if (nav && user) {
    const firstSocial = nav.querySelector('.social-icon');
      const wrap = document.createElement('div');
      wrap.dataset.authLink = '1';
      wrap.className = 'floating-login-wrap';
      wrap.innerHTML = `
        <a class="floating-login" href="login.html" title="Interner Login" aria-label="Interner Login">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span class="sr-only">Interner Login</span>
        </a>`;
      document.body.appendChild(wrap);
    const logout = document.createElement('a');
    logout.href = '#';
    logout.className = 'social-icon';
    logout.dataset.authLink = '1';
    logout.title = 'Abmelden';
    logout.setAttribute('aria-label', 'Abmelden');
    logout.innerHTML = ICON_LOGOUT;
    logout.addEventListener('click', async (e) => {
      e.preventDefault();
      await supabase.auth.signOut();
      location.href = 'index.html';
    });
    nav.insertBefore(logout, firstSocial);
  }

  if (footer && !user) {
    // Kompakter Login-CTA im Footer
    const wrap = document.createElement('div');
    wrap.dataset.authLink = '1';
    wrap.className = 'footer-auth';
    wrap.innerHTML = `
      <a class="footer-login-link" href="login.html" title="Interner Login" aria-label="Interner Login">
        <span class="footer-login-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </span>
        <span class="footer-login-copy">
          <strong>Mitglieder-Login</strong>
          <span>Zum internen Bereich</span>
        </span>
      </a>`;
    footer.appendChild(wrap);
  }
}

/* ----- Auto-Init ----- */
export async function initPage(active = '') {
  await renderAuthNav(active);
  supabase.auth.onAuthStateChange(() => renderAuthNav(active));
}
