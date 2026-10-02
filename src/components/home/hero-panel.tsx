/**
 * Decorative hero illustration — a stylized fire control panel (mockup parity).
 * `aria-hidden`: it is graphics only; every glyph is a technical device code
 * (ZONE / ALARM / 24V DC) in the universal language of real panels (D-039),
 * not translatable UI copy.
 */

const ZONES = Array.from({ length: 8 }, (_, index) => index + 1);
const ALARM_ZONE = 3;

export function HeroPanel() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto w-full max-w-md rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,#111a2e_0%,#0b1220_100%)] p-5 shadow-[0_24px_60px_-18px_rgba(11,18,32,0.75)]"
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-3 text-[11px] font-black tracking-[0.16em] text-slate-200">
        <span>FIRE ALARM PANEL</span>
        <span className="text-green-400">SYSTEM NORMAL</span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {ZONES.map((zone) => {
          const alarm = zone === ALARM_ZONE;
          return (
            <div
              key={zone}
              className={`flex items-center gap-1.5 rounded-xl px-2 py-2.5 text-[11px] font-bold ${
                alarm ? 'bg-fire-50 text-fire-700 ring-1 ring-fire-200' : 'bg-navy-800 text-slate-400'
              }`}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  alarm ? 'bg-fire-600 animate-pulse' : 'bg-green-600'
                }`}
              />
              <span className="phone">{alarm ? 'A' : 'Z'}</span>
              <span className="phone ms-auto">{String(zone).padStart(2, '0')}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] font-bold">
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="h-2 w-2 rounded-full bg-green-600" />
          POWER
        </span>
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          BATTERY
        </span>
        <span className="phone text-slate-300">24V DC</span>
      </div>
    </div>
  );
}
