import { supabase } from './auth.js?v=2026-04-23-1';

const banners = [...document.querySelectorAll('.top-banner')];
if (banners.length) {
  loadSharedBanner().catch(error => {
    console.error('[Ragebaiters] Aktives Banner konnte nicht geladen werden:', error);
  });
}

async function loadSharedBanner() {
  const [variantResult, pathResult, aspectResult] = await Promise.all([
    supabase.rpc('get_homepage_banner'),
    supabase.rpc('get_homepage_banner_custom_path'),
    supabase.rpc('get_homepage_banner_aspect').catch(() => ({ data: '16:9', error: null }))
  ]);

  if (variantResult.error) throw variantResult.error;
  if (pathResult.error) throw pathResult.error;

  const variant = String(variantResult.data || 'team').trim().toLowerCase();
  const path = String(pathResult.data || '').trim();
  const aspect = String(aspectResult.data || '16:9').trim();
  const aspectMatch = aspect.match(/^(?:custom:)?([1-9]\d{0,3}):([1-9]\d{0,3})$/);
  const ratio = aspectMatch ? `${aspectMatch[1]} / ${aspectMatch[2]}` : '16 / 9';

  let imageUrl = 'images/banner2.png';
  let alt = 'die Ragebaiters Team Banner';

  if (variant === 'custom' && path) {
    imageUrl = resolveBannerUrl(path);
    alt = 'die Ragebaiters eigenes Banner';
  }

  for (const banner of banners) {
    banner.style.setProperty('--banner-aspect-ratio', ratio);
    const image = banner.querySelector('img');
    if (!image) continue;
    // Banner-Dateien werden beim Upload teils unter demselben Storage-Pfad
    // überschrieben. Ein URL-Parameter verhindert, dass der Browser auf der
    // Startseite noch eine ältere, zwischengespeicherte Version zeigt.
    image.src = withCacheBuster(imageUrl);
    image.alt = alt;
  }
}

function withCacheBuster(url) {
  const parsedUrl = new URL(url, document.baseURI);
  parsedUrl.searchParams.set('rb_banner', String(Date.now()));
  return parsedUrl.toString();
}

function resolveBannerUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('__local__/')) return path.replace('__local__/', '');
  return supabase.storage.from('photos').getPublicUrl(path).data.publicUrl;
}
