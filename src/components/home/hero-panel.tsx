/**
 * Decorative hero illustration — a stylized fire control panel.
 * `aria-hidden`: graphics only; every glyph is a technical device code
 * (ZONE / ALARM / 24V DC) in the universal language of real panels (D-039),
 * not translatable UI copy.
 *
 * `dir="ltr"` is intentional: a physical panel never mirrors in RTL pages.
 */

const ZONES = Array.from({ length: 8 }, (_, index) => index + 1);
const ALARM_ZONE = 3;

export function HeroPanel() {
  return (
    <div
      aria-hidden="true"
      dir="ltr"
      className="pointer-events-none mx-auto w-full max-w-md select-none rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,#111a2e_0%,#0b1220_100%)] p-5 shadow-[0_24px_60px_-18px_rgba(11,18,32,0.75),inset_0_1px_0_rgba(255,255,255,0.06)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 text-[11px] font-black tracking-[0.16em]">
        <span className="text-slate-200">FIRE ALARM PANEL</span>
        <span className="flex items-center gap-1.5 rounded-full bg-fire-600/15 px-2.5 py-1 text-fire-200 ring-1 ring-fire-600/40">
          <span className="h-1.5 w-1.5 rounded-full bg-fire-600 motion-safe:animate-pulse" />
          ALARM
        </span>
      </div>

      {/* LCD readout */}
      <div className="mt-4 rounded-xl border border-white/10 bg-black/40 px-3.5 py-3 font-mono shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between text-[10px] tracking-[0.14em] text-slate-500">
          <span>EVENT 001/001</span>
          <span className="phone">12:47</span>
        </div>
        <div className="mt-1.5 text-[13px] font-bold tracking-[0.1em] text-fire-200">
          ZONE {String(ALARM_ZONE).padStart(2, '0')} · SMOKE DETECTOR
        </div>
      </div>

      {/* Zones */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {ZONES.map((zone) => {
          const alarm = zone === ALARM_ZONE;
          return (
            <div
              key={zone}
              className={`flex items-center gap-1.5 rounded-xl px-2 py-2.5 text-[11px] font-bold ring-1 ${
                alarm
                  ? 'bg-fire-600/20 text-fire-200 ring-fire-600/60 shadow-[0_0_20px_-4px_rgba(220,38,38,0.55)]'
                  : 'bg-white/[0.04] text-slate-400 ring-white/10'
              }`}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  alarm
                    ? 'bg-fire-600 shadow-[0_0_8px_2px_rgba(220,38,38,0.7)] motion-safe:animate-pulse'
                    : 'bg-green-500 shadow-[0_0_6px_1px_rgba(34,197,94,0.55)]'
                }`}
              />
              <span className="phone">{alarm ? 'A' : 'Z'}</span>
              <span className="phone ms-auto">{String(zone).padStart(2, '0')}</span>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-black tracking-[0.16em]">
        <span className="rounded-lg bg-white/[0.06] py-2 text-center text-slate-300 ring-1 ring-white/10">
          SILENCE
        </span>
        <span className="rounded-lg bg-white/[0.06] py-2 text-center text-slate-300 ring-1 ring-white/10">
          RESET
        </span>
      </div>

      {/* Footer status */}
      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] font-bold">
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_6px_1px_rgba(34,197,94,0.55)]" />
          POWER
        </span>
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_6px_1px_rgba(34,197,94,0.55)]" />
          BATTERY
        </span>
        <span className="phone text-slate-300">24V DC</span>
      </div>
    </div>
  );
}