/**
 * Helper pencarian gambar web gratis tanpa API key (Web Image Search).
 * Mencakup Query Builder kontekstual, filter anti-logo, prioritas foto lanskap (.jpg/.png),
 * verifikasi Content-Type gambar, dan caption jujur bila hasil terindikasi logo.
 */

export interface ImageCandidate {
  url: string;
  title: string;
  width?: number;
  height?: number;
  source: 'duckduckgo' | 'bing' | 'wikimedia' | 'wikipedia' | 'fallback';
}

export interface ImageSearchResult {
  url: string;
  title?: string;
  isPossibleLogo: boolean;
  isLandscape: boolean;
  resolvedQuery: string;
  caption: string;
  source: 'duckduckgo' | 'bing' | 'wikimedia' | 'wikipedia' | 'fallback';
}

const BROKEN_CRAWLER_HOST_PATTERNS = [
  'lookaside.fbsbx.com',
  'lookaside.instagram.com',
  'tiktok.com/api/img',
];

const LOGO_OR_ICON_REGEX =
  /(\b|[-_/])(logo|logos|icon|icons|ico|vektor|vector|clipart|emblem|lambang|badge|avatar|watermark|favicon|siluet|silhouette)(\b|[-_.])|\.svg($|\?)/i;

const USER_AGENT_CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export function buildImageSearchQueries(rawQuery: string): {
  cleanSubject: string;
  searchQueries: string[];
} {
  const cleanSubject =
    rawQuery
      .replace(/^(tolong|mohon|coba|bisa|tolongkan|silakan)\s+/gi, '')
      .replace(
        /(carikan|cari|tampilkan|lihatkan|minta|lihat|temukan|buatkan|bikinkan|bikin|generate)\s+(gambar|foto|potret|citra|pemandangan)?/gi,
        ''
      )
      .replace(/(gambar|foto|potret|citra)\s*(tentang|dari|suasana|mengenai)?/gi, '')
      .replace(/\s+(di|dari|pada)\s+(internet|google|web|bing|online)/gi, '')
      .replace(/[?!.,;:]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || rawQuery.trim();

  const qLower = cleanSubject.toLowerCase();
  const hasPanggung = /\bpanggung\b/.test(qLower);
  const hasHaflah = /\bhaflah\b/.test(qLower);
  const hasAulaOrMuktamar = /\b(aula|muktamar)\b/.test(qLower);
  const hasLirboyo = /\blirboyo\b/.test(qLower);

  const queries: string[] = [];

  if (hasPanggung) {
    if (hasAulaOrMuktamar) {
      queries.push('panggung aula al muktamar lirboyo');
      queries.push(hasLirboyo ? cleanSubject : `${cleanSubject} lirboyo`);
      queries.push('panggung haul haflah lirboyo');
    } else if (hasHaflah || /\b(haul|p3tq|mhmtq|pesantren|pondok|lirboyo)\b/.test(qLower)) {
      queries.push('panggung haul haflah lirboyo');
      queries.push('panggung aula al muktamar lirboyo');
      queries.push('panggung haul haflah p3tq');
    } else {
      queries.push('panggung aula al muktamar lirboyo');
      queries.push('panggung haul haflah p3tq');
      queries.push(`${cleanSubject} acara lirboyo`);
    }
  } else if (
    hasHaflah &&
    !hasAulaOrMuktamar &&
    !/\b(masjid|gerbang|rusunawa|santri|kitab|jadwal)\b/.test(qLower)
  ) {
    // Jika user hanya mengetik "haflah", perkaya agar lebih spesifik ke suasana/panggung Haflah P3TQ
    queries.push('suasana haflah p3tq');
    queries.push('panggung haul haflah p3tq');
    queries.push('haul haflah pondok pesantren lirboyo');
  } else if (hasAulaOrMuktamar) {
    queries.push('aula al muktamar lirboyo kediri');
    queries.push('aula muktamar lirboyo');
    queries.push(hasLirboyo ? cleanSubject : `${cleanSubject} lirboyo`);
    queries.push('aula al muktamar pondok pesantren lirboyo kediri');
  } else if (/\b(pondok|pesantren|masjid|gerbang|santri|rusunawa)\b/.test(qLower)) {
    queries.push(hasLirboyo ? cleanSubject : `${cleanSubject} lirboyo`);
    queries.push(cleanSubject);
  } else {
    queries.push(cleanSubject);
  }

  return {
    cleanSubject,
    searchQueries: Array.from(new Set(queries.filter((q) => q.trim().length > 0))),
  };
}

export function isBrokenCrawlerUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return BROKEN_CRAWLER_HOST_PATTERNS.some((host) => lower.includes(host));
}

export function isLogoOrIconCandidate(url: string, title: string = ''): boolean {
  const urlWithoutQuery = url.split('?')[0].toLowerCase();
  return LOGO_OR_ICON_REGEX.test(urlWithoutQuery) || LOGO_OR_ICON_REGEX.test(url.toLowerCase()) || LOGO_OR_ICON_REGEX.test(title.toLowerCase());
}

function getExtensionScore(url: string): number {
  const pathOnly = url.split('?')[0].split('#')[0].toLowerCase();
  if (pathOnly.endsWith('.jpg') || pathOnly.endsWith('.jpeg')) return 35;
  if (pathOnly.endsWith('.png')) return 25;
  if (pathOnly.endsWith('.webp')) return 8;
  return -10;
}

function scoreImageCandidate(
  candidate: ImageCandidate,
  cleanSubject: string,
  enrichedQuery: string
): number {
  let score = getExtensionScore(candidate.url);

  const w = candidate.width || 0;
  const h = candidate.height || 0;
  if (w > 0 && h > 0) {
    if (w < 360 || h < 200) {
      score -= 55;
    } else if (w > h) {
      score += 35;
      if (w >= 720 && w / h >= 1.25) {
        score += 15;
      }
    } else if (Math.abs(w - h) <= 24) {
      score -= 30;
    } else {
      score -= 45;
    }
  }

  const hay = `${candidate.title} ${candidate.url}`.toLowerCase();
  const stopWords = new Set(['al', 'dan', 'atau', 'yang', 'untuk', 'foto', 'gambar']);
  const subjectTokens = Array.from(
    new Set(
      cleanSubject
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length >= 3 && !stopWords.has(t))
    )
  );
  const extraTokens = Array.from(
    new Set(
      enrichedQuery
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length >= 3 && !stopWords.has(t) && !subjectTokens.includes(t))
    )
  );

  let tokenHits = 0;
  for (const tok of subjectTokens) {
    if (hay.includes(tok)) {
      tokenHits++;
      score += 26;
    }
  }
  for (const tok of extraTokens) {
    if (hay.includes(tok)) {
      tokenHits++;
      score += 10;
    }
  }

  const domainAnchors = ['lirboyo', 'muktamar', 'haflah', 'p3tq', 'mhmtq', 'panggung', 'aula', 'pesantren'];
  const anchorHits = domainAnchors.filter((a) => hay.includes(a)).length;
  score += anchorHits * 8;

  const isVideoThumbnail =
    candidate.url.toLowerCase().includes('i.ytimg.com') ||
    candidate.title.toLowerCase().endsWith('- youtube');
  if (isVideoThumbnail) {
    score -= 22;
  }

  if (tokenHits > 0) {
    const venuePhotoSignals = ['suasana', 'gedung', 'dekorasi', 'malam-puncak', 'malam puncak', 'puncak haul', 'panggung'];
    score += venuePhotoSignals.filter((sig) => hay.includes(sig)).length * 10;
  }

  const isPlaceOrEventQuery = /\b(panggung|aula|muktamar|haflah|masjid|gerbang|gedung|suasana)\b/i.test(cleanSubject);
  if (isPlaceOrEventQuery) {
    const offTopicSignals = ['kitab', 'al-hikam', 'terjemah', 'pengajian kitab', 'polemik', 'said aqil', 'wali kota', 'biaya', 'pdf'];
    if (offTopicSignals.some((sig) => hay.includes(sig))) {
      score -= 32;
    }
  }

  if (tokenHits === 0 && anchorHits === 0) {
    score -= 60;
  }

  return score;
}

async function verifyImageReachable(url: string): Promise<boolean> {
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  if (isBrokenCrawlerUrl(url)) return false;

  const checkMethod = async (method: 'HEAD' | 'GET', headers?: Record<string, string>) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2800);
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'User-Agent': USER_AGENT_CHROME,
          Accept: 'image/avif,image/webp,image/apng,image/jpeg,image/png,image/*,*/*;q=0.8',
          ...(headers || {}),
        },
        signal: controller.signal,
      });
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      return { ok: res.ok, status: res.status, contentType };
    } catch {
      return { ok: false, status: 0, contentType: '' };
    } finally {
      clearTimeout(timer);
    }
  };

  const headRes = await checkMethod('HEAD');
  if (headRes.ok && headRes.contentType.startsWith('image/')) {
    return true;
  }
  if (headRes.status === 405 || headRes.status === 403 || headRes.status === 0) {
    const getRes = await checkMethod('GET', { Range: 'bytes=0-64' });
    if (getRes.ok && getRes.contentType.startsWith('image/')) {
      return true;
    }
  }
  return false;
}

let ddgBlockedUntil = 0;

async function fetchDuckDuckGoCandidates(searchQuery: string): Promise<ImageCandidate[]> {
  if (Date.now() < ddgBlockedUntil) return [];
  try {
    const origError = console.error;
    console.error = () => {};
    try {
      const ddg = require('duckduckgo-images-api');
      const results = await Promise.race([
        ddg.image_search({ query: searchQuery, moderate: false }),
        new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error('DDG timeout')), 900)),
      ]);
      if (!Array.isArray(results) || results.length === 0) {
        ddgBlockedUntil = Date.now() + 5 * 60 * 1000;
        return [];
      }
      return results
        .filter((r: any) => typeof r?.image === 'string' && r.image.startsWith('http'))
        .slice(0, 15)
        .map((r: any) => ({
          url: String(r.image),
          title: String(r.title || ''),
          width: typeof r.width === 'number' ? r.width : undefined,
          height: typeof r.height === 'number' ? r.height : undefined,
          source: 'duckduckgo' as const,
        }));
    } finally {
      console.error = origError;
    }
  } catch {
    ddgBlockedUntil = Date.now() + 5 * 60 * 1000;
    return [];
  }
}

async function fetchBingAsyncCandidates(searchQuery: string): Promise<ImageCandidate[]> {
  try {
    const bingUrl = `https://www.bing.com/images/async?q=${encodeURIComponent(
      searchQuery
    )}&first=0&count=18&mmasync=1`;
    const res = await fetch(bingUrl, {
      headers: {
        'User-Agent': USER_AGENT_CHROME,
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return [];
    const html = await res.text();
    const blocks = html.split('<div class="imgpt"').slice(1);
    const out: ImageCandidate[] = [];

    for (const block of blocks) {
      const mMatch = block.match(/m="([^"]+)"/);
      if (!mMatch) continue;
      try {
        const jsonStr = mMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        const parsed = JSON.parse(jsonStr);
        const murl = String(parsed.murl || '').replace(/&amp;/g, '&').trim();
        if (!murl.startsWith('http')) continue;

        const wMatch = block.match(/expw=(\d+)/);
        const hMatch = block.match(/exph=(\d+)/);

        out.push({
          url: murl,
          title: String(parsed.t || ''),
          width: wMatch ? Number(wMatch[1]) : undefined,
          height: hMatch ? Number(hMatch[1]) : undefined,
          source: 'bing',
        });
      } catch {}
    }

    return out;
  } catch (err: any) {
    console.warn('[Image-Search] Bing image search gagal:', err?.message || err);
    return [];
  }
}

async function fetchWikimediaCandidates(searchQuery: string): Promise<ImageCandidate[]> {
  try {
    const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
      searchQuery
    )}&gsrlimit=8&prop=imageinfo&iiprop=url|size|mime&format=json&origin=*`;
    const res = await fetch(wikiUrl, {
      headers: {
        'User-Agent': 'HaflahP3TQApp/4.2 (contact@haflahp3tq.site)',
      },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const data: any = await res.json();
    const pages = Object.values(data.query?.pages || {}) as any[];
    const out: ImageCandidate[] = [];

    for (const page of pages) {
      const info = page.imageinfo?.[0];
      const url = info?.url;
      const mime = String(info?.mime || '').toLowerCase();
      if (url && url.startsWith('http') && (mime === 'image/jpeg' || mime === 'image/png' || mime === 'image/webp')) {
        out.push({
          url,
          title: String(page.title || ''),
          width: typeof info?.width === 'number' ? info.width : undefined,
          height: typeof info?.height === 'number' ? info.height : undefined,
          source: 'wikimedia',
        });
      }
    }
    return out;
  } catch {
    return [];
  }
}

function buildCaption(cleanSubject: string, isPossibleLogo: boolean): string {
  const subjLower = cleanSubject.toLowerCase();
  if (isPossibleLogo) {
    if (subjLower.includes('panggung')) {
      return 'Ini gambar yang saya temukan di internet, Us, meskipun mungkin ini masih berupa logo dan bukan foto panggung secara langsung:';
    }
    return `Ini gambar yang saya temukan di internet, Us, meskipun mungkin ini masih berupa logo dan bukan foto ${subjLower}:`;
  }
  return 'Ini Us, gambar yang saya temukan di internet:';
}

export async function searchWebImagesDetailed(query: string): Promise<ImageSearchResult | null> {
  const { cleanSubject, searchQueries } = buildImageSearchQueries(query);
  const logoFallbackPool: { candidate: ImageCandidate; resolvedQuery: string; score: number }[] = [];

  for (const enrichedQuery of searchQueries) {
    // 1. DuckDuckGo & Bing /images/async dijalankan paralel (DDG otomatis cooldown jika terblokir ISP)
    // 2. Wikimedia Commons & fallback lokal dipakai bila semua pencarian web gagal
    const [ddgCandidates, bingCandidates] = await Promise.all([
      fetchDuckDuckGoCandidates(enrichedQuery),
      fetchBingAsyncCandidates(enrichedQuery),
    ]);
    const combinedRaw = [...ddgCandidates, ...bingCandidates];

    const validCandidates = combinedRaw.filter((c) => !isBrokenCrawlerUrl(c.url));
    const nonLogoCandidates = validCandidates.filter((c) => !isLogoOrIconCandidate(c.url, c.title));
    const logoCandidates = validCandidates.filter((c) => isLogoOrIconCandidate(c.url, c.title));

    const scoredNonLogo = nonLogoCandidates
      .map((candidate) => ({
        candidate,
        score: scoreImageCandidate(candidate, cleanSubject, enrichedQuery),
      }))
      .sort((a, b) => b.score - a.score);

    for (const item of scoredNonLogo.slice(0, 6)) {
      if (item.score < -35) continue;
      const reachable = await verifyImageReachable(item.candidate.url);
      if (reachable) {
        const w = item.candidate.width || 0;
        const h = item.candidate.height || 0;
        return {
          url: item.candidate.url,
          title: item.candidate.title,
          isPossibleLogo: false,
          isLandscape: w > 0 && h > 0 ? w > h : true,
          resolvedQuery: enrichedQuery,
          caption: buildCaption(cleanSubject, false),
          source: item.candidate.source,
        };
      }
    }

    for (const candidate of logoCandidates) {
      logoFallbackPool.push({
        candidate,
        resolvedQuery: enrichedQuery,
        score: scoreImageCandidate(candidate, cleanSubject, enrichedQuery),
      });
    }
  }

  // Coba Wikimedia Commons jika semua query DDG & Bing gagal menemukan gambar relevan
  for (const enrichedQuery of searchQueries) {
    const wikiCandidates = await fetchWikimediaCandidates(enrichedQuery);
    const nonLogoWiki = wikiCandidates
      .filter((c) => !isLogoOrIconCandidate(c.url, c.title))
      .map((candidate) => ({
        candidate,
        score: scoreImageCandidate(candidate, cleanSubject, enrichedQuery),
      }))
      .sort((a, b) => b.score - a.score);

    for (const item of nonLogoWiki.slice(0, 3)) {
      if (item.score < -35) continue;
      if (await verifyImageReachable(item.candidate.url)) {
        const w = item.candidate.width || 0;
        const h = item.candidate.height || 0;
        return {
          url: item.candidate.url,
          title: item.candidate.title,
          isPossibleLogo: false,
          isLandscape: w > 0 && h > 0 ? w > h : true,
          resolvedQuery: enrichedQuery,
          caption: buildCaption(cleanSubject, false),
          source: 'wikimedia',
        };
      }
    }
  }

  // Jika hasil yang tersisa dari API web ternyata masih berupa logo, tampilkan caption jujur
  if (logoFallbackPool.length > 0) {
    logoFallbackPool.sort((a, b) => b.score - a.score);
    for (const item of logoFallbackPool.slice(0, 3)) {
      if (await verifyImageReachable(item.candidate.url)) {
        return {
          url: item.candidate.url,
          title: item.candidate.title,
          isPossibleLogo: true,
          isLandscape:
            item.candidate.width && item.candidate.height
              ? item.candidate.width > item.candidate.height
              : false,
          resolvedQuery: item.resolvedQuery,
          caption: buildCaption(cleanSubject, true),
          source: item.candidate.source,
        };
      }
    }
  }

  // Fallback Foto Dokumentasi Resmi Lokal apabila seluruh jaringan pencarian internet terputus
  const qLower = cleanSubject.toLowerCase();
  if (qLower.includes('panggung') || qLower.includes('haflah')) {
    return {
      url: '/images/panggung-haul-haflah.jpg',
      title: 'Ilustrasi Panggung Haul & Haflah P3TQ & MHMTQ',
      isPossibleLogo: false,
      isLandscape: true,
      resolvedQuery: searchQueries[0] || cleanSubject,
      caption: buildCaption(cleanSubject, false),
      source: 'fallback',
    };
  }
  if (qLower.includes('aula') || qLower.includes('muktamar') || qLower.includes('dekorasi')) {
    return {
      url: '/images/panggung-aula.jpg',
      title: 'Ilustrasi Panggung Aula Al-Muktamar',
      isPossibleLogo: false,
      isLandscape: true,
      resolvedQuery: searchQueries[0] || cleanSubject,
      caption: buildCaption(cleanSubject, false),
      source: 'fallback',
    };
  }

  return null;
}

export async function searchWebImages(query: string): Promise<string | null> {
  const result = await searchWebImagesDetailed(query);
  return result?.url || null;
}
