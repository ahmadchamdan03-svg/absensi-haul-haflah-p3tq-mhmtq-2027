import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

// Content Security Policy
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
  "script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' blob:",
  "script-src-attr 'self' 'unsafe-inline'",
  "worker-src 'self' blob:",
  "child-src 'self' blob: https://*.supabase.co",
  "frame-src 'self' https://*.supabase.co blob: data:",
  "object-src 'self' https://*.supabase.co blob: data:",
  "media-src 'self' https://*.supabase.co",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.fonnte.com https://generativelanguage.googleapis.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ');

// In-Memory Rate Limiting Cache
// Map<ip, { count: number; expiresAt: number }>
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ip: string, limit: number, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.expiresAt) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}

// Background fire-and-forget unauthorized access audit logging
async function logUnauthorizedAccess(ip: string, path: string, role: string | null, reason: string) {
  try {
    await supabase.from('audit_log').insert({
      panitia_id: 'SYSTEM_GUARD',
      panitia_role: role || 'UNKNOWN',
      aksi: 'AKSES_TIDAK_SAH',
      tabel: 'route_protection',
      field: path,
      nilai_lama: reason,
      nilai_baru: `IP: ${ip}`,
      catatan: `Percobaan akses terlarang ke ${path} dengan role: ${role || 'TIDAK_LOGIN'}`,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Silent fail in middleware
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rawUrl = request.url;

  // 1. CEGAH PATH TRAVERSAL & URL MANIPULASI
  // Cek apakah ada pattern '..' atau encoded '%2e%2e' / '%2E%2E'
  const decodedPath = decodeURIComponent(rawUrl);
  if (
    pathname.includes('..') ||
    rawUrl.toLowerCase().includes('%2e%2e') ||
    decodedPath.includes('..')
  ) {
    return new NextResponse('Bad Request: Invalid Path Traversal', { status: 400 });
  }

  // Ambil Client IP
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown-ip';

  // 2. RATE LIMITING
  // Admin routes: 200 req/min | Public routes & API: 60 req/min
  const isAdminRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/scan') ||
    pathname.startsWith('/rekon') ||
    pathname.startsWith('/dasbor') ||
    pathname.startsWith('/penerima-tamu') ||
    pathname.startsWith('/pimpinan');

  const rateLimitMax = isAdminRoute ? 200 : 60;
  const isAllowed = checkRateLimit(clientIp, rateLimitMax);

  if (!isAllowed) {
    return new NextResponse('Too Many Requests. Silakan tunggu 1 menit.', {
      status: 429,
      headers: {
        'Retry-After': '60',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  // 3. ROUTE PROTECTION & ROLE GUARD
  // Path publik yang bebas diakses: /, /u, /u/[token], /beli, /denah, /game, /api, static assets
  if (isAdminRoute) {
    const roleCookie =
      request.cookies.get('haflah_active_role_session')?.value ||
      request.cookies.get('user_role')?.value;

    const validRoles = ['ADMIN', 'PENERIMA_TAMU', 'PIMPINAN', 'PENJAGA_GERBANG'];

    // Jika tidak login atau role WALI / di luar whitelist petugas
    if (!roleCookie || !validRoles.includes(roleCookie) || roleCookie === 'WALI') {
      // Catat ke audit log
      logUnauthorizedAccess(clientIp, pathname, roleCookie || null, 'Unauthorized access attempted');

      // Redirect ke beranda utama
      const redirectUrl = new URL('/', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Role-specific granular checks:
    // PENJAGA_GERBANG hanya boleh akses /scan, /dasbor, /penerima-tamu, /admin/verifikasi (tidak boleh /admin/peserta, /admin/audit-log, /admin/laporan)
    if (roleCookie === 'PENJAGA_GERBANG') {
      const allowedForGate = ['/scan', '/dasbor', '/penerima-tamu', '/admin/verifikasi'];
      const isAllowedGatePath = allowedForGate.some((p) => pathname.startsWith(p));
      if (!isAllowedGatePath) {
        logUnauthorizedAccess(clientIp, pathname, roleCookie, 'Penjaga gerbang route privilege violation');
        return NextResponse.redirect(new URL('/scan', request.url));
      }
    }

    // PIMPINAN hanya boleh akses /pimpinan, /dasbor, /admin/dasbor
    if (roleCookie === 'PIMPINAN') {
      const allowedForPimpinan = ['/pimpinan', '/dasbor', '/admin/dasbor'];
      const isAllowedPimpinanPath = allowedForPimpinan.some((p) => pathname.startsWith(p));
      if (!isAllowedPimpinanPath) {
        logUnauthorizedAccess(clientIp, pathname, roleCookie, 'Pimpinan route privilege violation');
        return NextResponse.redirect(new URL('/pimpinan', request.url));
      }
    }

    // PENERIMA_TAMU hanya boleh akses /penerima-tamu, /dasbor, /admin/dasbor
    if (roleCookie === 'PENERIMA_TAMU') {
      const allowedForPt = ['/penerima-tamu', '/dasbor', '/admin/dasbor'];
      const isAllowedPtPath = allowedForPt.some((p) => pathname.startsWith(p));
      if (!isAllowedPtPath) {
        logUnauthorizedAccess(clientIp, pathname, roleCookie, 'Penerima tamu route privilege violation');
        return NextResponse.redirect(new URL('/penerima-tamu', request.url));
      }
    }
  }

  // 4. SECURITY HEADERS RESPONSE
  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', CSP);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|audio|icons|manifest.json).*)',
  ],
};
