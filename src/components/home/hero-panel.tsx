import React from 'react';

const ZONES = Array.from({ length: 8 }, (_, index) => index + 1);
const ALARM_ZONE = 3;

export function HeroPanel() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:shadow-red-500/10"
    >
      {/* خلفية جمالية: صورة سينمائية مع طبقة بلورية (Glassmorphism) */}
      <div 
        className="absolute inset-0 -z-10 bg-cover bg-center opacity-15 mix-blend-overlay"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1000&auto=format&fit=crop')`, // صورة خوادم وأنظمة حديثة
        }}
      />

      {/* توهج خلفية لإعطاء طابع متطور (Ambient Glow) */}
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-red-500/10 blur-3xl" />
      <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* الهيدر العلوي: شاشة القراءة الرقمية (LCD Display Bar) */}
      <div className="mb-5 rounded-lg border border-slate-800 bg-slate-900/90 p-3 shadow-inner">
        <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-300">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="font-mono text-slate-200">FIRE ALARM PANEL</span>
          </div>
          <span className="rounded bg-emerald-950/80 px-2 py-0.5 font-mono text-[10px] text-emerald-400 border border-emerald-800/50">
            SYSTEM NORMAL
          </span>
        </div>
      </div>

      {/* شبكة المناطق (Zone Grid) */}
      <div className="grid grid-cols-4 gap-2.5">
        {ZONES.map((zone) => {
          const alarm = zone === ALARM_ZONE;
          return (
            <div
              key={zone}
              className={`relative flex items-center justify-between rounded-lg px-2.5 py-3 text-[11px] font-bold font-mono transition-all duration-200 ${
                alarm
                  ? 'border border-red-500/40 bg-red-950/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  : 'border border-slate-800/80 bg-slate-900/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    alarm
                      ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)] animate-pulse'
                      : 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]'
                  }`}
                />
                <span>{alarm ? 'ALARM' : 'ZONE'}</span>
              </div>
              <span className="text-slate-300 font-semibold">{String(zone).padStart(2, '0')}</span>
            </div>
          );
        })}
      </div>

      {/* شريط المؤشرات السفلي (Status Footer) */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-4 text-[11px] font-mono font-bold text-slate-400">
        <div className="flex items-center gap-2 rounded-md bg-slate-900/50 px-2 py-1 border border-slate-800/50">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
          <span>POWER</span>
        </div>

        <div className="flex items-center gap-2 rounded-md bg-slate-900/50 px-2 py-1 border border-slate-800/50">
          <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
          <span>BATTERY</span>
        </div>

        <div className="rounded-md bg-slate-900/80 px-2.5 py-1 text-slate-300 border border-slate-800/80 shadow-inner">
          24V DC
        </div>
      </div>
    </div>
  );
}