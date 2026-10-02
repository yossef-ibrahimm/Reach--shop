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
      className="border-navy-700 bg-navy-900 mx-auto w-full max-w-md rounded-lg border p-5 shadow-lg"
    >
      <div className="border-navy-700 flex items-center justify-between border-b pb-3 text-[11px] font-bold tracking-widest">
        <span>FIRE ALARM PANEL</span>
        <span className="text-green-600">SYSTEM NORMAL</span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {ZONES.map((zone) => {
          const alarm = zone === ALARM_ZONE;
          return (
            <div
              key={zone}
              className={`flex items-center gap-1.5 rounded-md px-2 py-2.5 text-[11px] font-bold ${
                alarm ? 'bg-fire-50 text-fire-700' : 'bg-navy-800 text-slate-400'
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

      <div className="border-navy-700 mt-4 flex items-center justify-between border-t pt-3 text-[11px] font-bold">
        <span className="flex items-center gap-1.5 text-slate-400">
          <span className="h-2 w-2 rounded-full bg-green-600" />
          POWER
        </span>
        <span className="flex items-center gap-1.5 text-slate-400">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          BATTERY
        </span>
        <span className="phone text-slate-400">24V DC</span>
      </div>
    </div>
  );
}
