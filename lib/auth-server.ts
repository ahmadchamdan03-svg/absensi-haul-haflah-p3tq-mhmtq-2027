import { NextRequest } from 'next/server';

export const VALID_PANITIA_ROLES = ['ADMIN', 'PENERIMA_TAMU', 'PIMPINAN', 'PENJAGA_GERBANG'] as const;
export type PanitiaRole = (typeof VALID_PANITIA_ROLES)[number];

/**
 * Validasi cookie sesi panitia resmi dari request
 */
export function getSessionRole(req: NextRequest): PanitiaRole | null {
  const role =
    req.cookies.get('haflah_active_role_session')?.value ||
    req.cookies.get('user_role')?.value;

  if (role && (VALID_PANITIA_ROLES as readonly string[]).includes(role)) {
    return role as PanitiaRole;
  }
  return null;
}
