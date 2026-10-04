import { supabase } from '@/lib/supabase';
import { getActiveRole } from '@/lib/auth-roles';
import { AksiAudit } from '@/lib/types';

export interface LogAuditParams {
  panitia_id?: string | null;
  panitia_role?: string | null;
  aksi: AksiAudit | string;
  tabel?: string | null;
  kode?: string | null;
  nama?: string | null;
  field?: string | null;
  nilai_lama?: string | null;
  nilai_baru?: string | null;
  detail?: any;
  catatan?: string | null;
}

export async function logAudit({
  panitia_id,
  panitia_role,
  aksi,
  tabel,
  kode,
  nama,
  field,
  nilai_lama,
  nilai_baru,
  detail,
  catatan,
}: LogAuditParams): Promise<void> {
  try {
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : null;
    const activeRole = panitia_role || getActiveRole() || 'PANITIA';
    const activePanitiaId = panitia_id || activeRole || 'PETUGAS';

    const { error } = await supabase.from('audit_log').insert({
      panitia_id: activePanitiaId,
      panitia_role: activeRole,
      aksi,
      tabel,
      kode,
      nama,
      field,
      nilai_lama: nilai_lama !== undefined && nilai_lama !== null ? String(nilai_lama) : null,
      nilai_baru: nilai_baru !== undefined && nilai_baru !== null ? String(nilai_baru) : null,
      detail: detail || null,
      catatan: catatan || null,
      user_agent: userAgent,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('[AuditLog] Insert failed:', error.message);
    }
  } catch (err) {
    console.warn('[AuditLog] Unexpected error:', err);
  }
}
