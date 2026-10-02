import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
  "script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' blob:",
  "script-src-attr 'self' 'unsafe-inline'",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.fonnte.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ');

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', CSP);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|favicon.ico).*)',
    '/_next/image',
  ],
};
