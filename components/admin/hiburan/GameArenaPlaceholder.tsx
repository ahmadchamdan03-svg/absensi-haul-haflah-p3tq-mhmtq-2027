import Link from 'next/link';
import { ArrowLeft, Gamepad2 } from 'lucide-react';
import GlassCard from '@/components/GlassCard';

interface GameArenaPlaceholderProps {
  title: string;
  subtitle: string;
}

// TODO: Replace placeholder wrapper with live game engine once game mechanics are built.
export default function GameArenaPlaceholder({ title, subtitle }: GameArenaPlaceholderProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 min-h-[calc(100vh-96px)] flex items-center justify-center">
      <GlassCard className="w-full max-w-2xl p-6 sm:p-10 text-center border-2 border-[#D49B5B]/45 bg-white/95 shadow-xl space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[#0F2C59] border-2 border-[#D49B5B] flex items-center justify-center shadow-sm">
          <Gamepad2 className="w-8 h-8 text-[#F5C56B]" aria-hidden="true" />
        </div>

        <div className="space-y-2.5">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-xs font-bold uppercase tracking-wider text-[#92400E]">
            Segera Hadir
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#0F2C59] tracking-tight">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-slate-700 max-w-md mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/admin/hiburan"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-2.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-[0.99] text-white text-sm font-bold shadow-md transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F2C59] focus-visible:ring-offset-2"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Kembali ke Lobby</span>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
