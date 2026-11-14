import { supabase } from '@/lib/supabase/client';

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  floor: number;
  created_at: string;
}

export async function saveScore(
  name: string,
  score: number,
  floor: number
): Promise<{ ok: boolean; error?: string }> {
  const sanitizedName = name.trim().slice(0, 20);
  if (!sanitizedName) {
    return { ok: false, error: 'Nama wajib diisi.' };
  }

  const { error } = await supabase.from('city_bloxx_leaderboard').insert({
    name: sanitizedName,
    score: Math.max(0, Math.round(score)),
    floor: Math.max(0, Math.round(floor)),
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function getTopScores(limit = 5): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('city_bloxx_leaderboard')
    .select('id, name, score, floor, created_at')
    .order('score', { ascending: false })
    .order('floor', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data as LeaderboardEntry[];
}
