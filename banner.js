import { supabase } from './auth.js?v=2026-04-23-1';

const banners = [...document.querySelectorAll('.top-banner')];
if (banners.length) {
  loadSharedBanner().catch(error => {
    console.error('[Ragebaiters] Aktives Banner konnte nicht geladen werden:', error);
  });
}

async function loadSharedBanner() {
  const [pathResult, aspectResult] = await Promise.all([
    supabase.rpc('get_homepage_banner_custom_path'),
    // The local Supabase wrapper exposes RPC builders as thenables, but not
    // necessarily as Promises with `.catch()`. Handle failures around `await`
    // so an optional aspect lookup cannot abort loading the banner itself.
    getBannerAspect()
  ]);

  if (pathResult.error) throw pathResult.error;

  const path = String(pathResult.data || '').trim();
  const aspect = String(aspectResult.data || '16:9').trim();
  const aspectMatch = aspect.match(/^(?:custom:)?([1-9]\d{0,3}):([1-9]\d{0,3})$/);
  const ratio = aspectMatch ? `${aspectMatch[1]} / ${aspectMatch[2]}` : '16 / 9';

  let imageUrl = 'images/banner2.png';
  let alt = 'die Ragebaiters Team Banner';

  // Der gespeicherte Pfad ist die Quelle der Wahrheit für alle öffentlichen
  // Seiten. Das Dashboard speichert ihn beim Upload direkt; ein veralteter
  // Variant-Schalter darf deshalb nicht dazu führen, dass Seiten weiterhin
  // das Team-Standardbild anzeigen.
  if (path) {
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

async function getBannerAspect() {
  try {
    return await supabase.rpc('get_homepage_banner_aspect');
  } catch (error) {
    console.warn('[Ragebaiters] Banner-Seitenverhältnis konnte nicht geladen werden:', error);
    return { data: '16:9', error: null };
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
