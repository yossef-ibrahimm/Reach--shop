import React, { useEffect, useState, useSyncExternalStore } from 'react';

type Locale = 'ar' | 'en';
type DeviceType = 'smoke' | 'heat' | 'mcp' | 'siren';
type Stage = 0 | 1 | 2 | 3;

type Device = {
  id: string;
  type: DeviceType;
  x: number;
  y: number;
  name: Record<Locale, string>;
};

type Room = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fire?: boolean;
};

type HeroCopy = {
  badge: string;
  title: string;
  highlight: string;
  sub: string;
  ctaPrimary: string;
  ctaSecondary: string;
  stats: { value: string; label: string }[];
  panelTitle: string;
  stages: [string, string, string, string];
  captions: [string, string, string, string];
  types: Record<DeviceType, string>;
  exit: string;
};

type HeroPanelProps = {
  lang?: Locale;
  onBrowse?: () => void;
  onContact?: () => void;
};

type FloorPlanProps = {
  stage: Stage;
  copy: HeroCopy;
  reduced: boolean;
  onHover: (device: Device | null) => void;
};

/* ---------- المحتوى (AR / EN) ---------- */
const COPY: Record<Locale, HeroCopy> = {
  ar: {
    badge: 'موزع معتمد لأنظمة الإنذار',
    title: 'حماية متكاملة لمنشأتك',
    highlight: 'قبل ما تحتاجها',
    sub: 'كواشف دخان وحرارة، لوحات تحكم، وسارينات من أقوى الماركات العالمية، بتكشف الخطر بدري وتخلي الإخلاء آمن وسريع.',
    ctaPrimary: 'تصفح المنتجات',
    ctaSecondary: 'تواصل معنا',
    stats: [
      { value: '65+', label: 'منتج متاح' },
      { value: '24/7', label: 'دعم فني' },
      { value: '100%', label: 'منتجات أصلية' },
    ],
    panelTitle: 'محاكاة مباشرة',
    stages: ['طبيعي', 'كشف', 'إنذار', 'إخلاء'],
    captions: [
      'كل الأجهزة تعمل بشكل طبيعي',
      'تم رصد ارتفاع في الحرارة في المطبخ',
      'تم تفعيل الإنذار في كل المبنى',
      'الإخلاء جارٍ عبر المخرج الآمن',
    ],
    types: { smoke: 'كاشف دخان', heat: 'كاشف حرارة', mcp: 'نقطة نداء يدوية', siren: 'سارينة' },
    exit: 'مخرج',
  },
  en: {
    badge: 'Accredited fire alarm distributor',
    title: 'Complete protection for your facility',
    highlight: 'before you need it',
    sub: 'Smoke and heat detectors, control panels and sirens from leading global brands, detecting danger early and making evacuation fast and safe.',
    ctaPrimary: 'Browse products',
    ctaSecondary: 'Contact us',
    stats: [
      { value: '65+', label: 'Products' },
      { value: '24/7', label: 'Tech support' },
      { value: '100%', label: 'Genuine' },
    ],
    panelTitle: 'Live simulation',
    stages: ['Normal', 'Detect', 'Alarm', 'Evacuate'],
    captions: [
      'All devices operating normally',
      'Heat rise detected in the kitchen',
      'Alarm activated across the building',
      'Evacuation in progress via the safe exit',
    ],
    types: { smoke: 'Smoke detector', heat: 'Heat detector', mcp: 'Manual call point', siren: 'Sounder' },
    exit: 'EXIT',
  },
};

/* ---------- بيانات المخطط ---------- */
const STAGE_MS = 2800;
const FIRE_DEVICE = 'd3';
const STAGES = [0, 1, 2, 3] as const;

const DEVICES: Device[] = [
  { id: 'd1', type: 'smoke', x: 110, y: 75, name: { ar: 'الاستقبال', en: 'Reception' } },
  { id: 'd2', type: 'smoke', x: 290, y: 75, name: { ar: 'المكتب', en: 'Office' } },
  { id: 'd3', type: 'heat', x: 290, y: 190, name: { ar: 'المطبخ', en: 'Kitchen' } },
  { id: 'd4', type: 'smoke', x: 110, y: 190, name: { ar: 'المخزن', en: 'Storage' } },
  { id: 'd5', type: 'mcp', x: 182, y: 118, name: { ar: 'الممر', en: 'Corridor' } },
  { id: 'd6', type: 'siren', x: 182, y: 45, name: { ar: 'الممر', en: 'Corridor' } },
];

const ROOMS: Room[] = [
  { id: 'r1', x: 20, y: 20, w: 180, h: 110 },
  { id: 'r2', x: 200, y: 20, w: 180, h: 110 },
  { id: 'r3', x: 20, y: 130, w: 180, h: 110 },
  { id: 'r4', x: 200, y: 130, w: 180, h: 110, fire: true },
];

/* ---------- Hook: احترام prefers-reduced-motion ---------- */
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeToReducedMotion(onChange: () => void) {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener('change', onChange);
  return () => mediaQuery.removeEventListener('change', onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function useReducedMotion() {
  return useSyncExternalStore(subscribeToReducedMotion, getReducedMotionSnapshot, () => false);
}

/* ---------- ألوان الجهاز حسب المرحلة ---------- */
function deviceTone(stage: Stage, isFireOrigin: boolean) {
  if (stage >= 2) return { fill: '#ef4444', glow: 'rgba(239,68,68,0.9)' };
  if (stage === 1 && isFireOrigin) return { fill: '#f59e0b', glow: 'rgba(245,158,11,0.9)' };
  return { fill: '#10b981', glow: 'rgba(16,185,129,0.7)' };
}

/* ---------- المخطط ---------- */
function FloorPlan({ stage, copy, reduced, onHover }: FloorPlanProps) {
  return (
    <svg viewBox="0 0 400 270" className="w-full" role="img" aria-label={copy.captions[stage]}>
      <defs>
        <radialGradient id="fireGlow">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* الغرف */}
      {ROOMS.map((r) => {
        const alarmTint = stage === 2 ? 'rgba(239,68,68,0.07)' : stage === 3 ? 'rgba(16,185,129,0.07)' : 'rgba(148,163,184,0.04)';
        return <rect key={r.id} x={r.x} y={r.y} width={r.w} height={r.h} fill={alarmTint} style={{ transition: 'fill 500ms' }} />;
      })}

      {/* توهج الحريق */}
      <circle cx="290" cy="190" r="70" fill="url(#fireGlow)" style={{ opacity: stage >= 1 && stage <= 2 ? 1 : 0, transition: 'opacity 600ms' }} />

      {/* الجدران */}
      <g stroke="#475569" strokeWidth="3" strokeLinecap="round" fill="none">
        <rect x="20" y="20" width="360" height="220" rx="6" />
        <path d="M200 20V95M200 125V240M20 130H85M115 130H285M315 130H380" strokeWidth="2" />
      </g>

      {/* باب المخرج */}
      <rect
        x="170" y="237" width="60" height="6" rx="3"
        fill={stage === 3 ? '#10b981' : '#334155'}
        style={{ transition: 'fill 400ms', filter: stage === 3 ? 'drop-shadow(0 0 8px rgba(16,185,129,0.9))' : 'none' }}
      />
      <text x="200" y="260" textAnchor="middle" fontSize="10" fontWeight="700" letterSpacing="1.5"
        fill={stage === 3 ? '#34d399' : '#64748b'} style={{ transition: 'fill 400ms' }}>
        {copy.exit}
      </text>

      {/* الأجهزة */}
      {DEVICES.map((d) => {
        const tone = deviceTone(stage, d.id === FIRE_DEVICE);
        const pulsing = (stage === 1 && d.id === FIRE_DEVICE) || stage === 2;
        const isSquare = d.type === 'mcp';
        return (
          <g
            key={d.id}
            tabIndex={0}
            onMouseEnter={() => onHover(d)}
            onFocus={() => onHover(d)}
            onMouseLeave={() => onHover(null)}
            onBlur={() => onHover(null)}
            className="cursor-pointer outline-none"
          >
            {pulsing && !reduced && (
              <circle cx={d.x} cy={d.y} r="9" fill="none" stroke={tone.fill} strokeWidth="2">
                <animate attributeName="r" from="9" to="26" dur="1.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.8" to="0" dur="1.2s" repeatCount="indefinite" />
              </circle>
            )}
            {d.type === 'siren' && stage === 2 && !reduced && (
              <circle cx={d.x} cy={d.y} r="9" fill="none" stroke="#ef4444" strokeWidth="1.5">
                <animate attributeName="r" from="9" to="38" dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="1.6s" repeatCount="indefinite" />
              </circle>
            )}
            {isSquare ? (
              <rect x={d.x - 8} y={d.y - 8} width="16" height="16" rx="3" fill={tone.fill}
                style={{ filter: `drop-shadow(0 0 6px ${tone.glow})`, transition: 'fill 400ms' }} />
            ) : (
              <circle cx={d.x} cy={d.y} r={d.type === 'siren' ? 7 : 8} fill={tone.fill}
                stroke="#0f172a" strokeWidth="2"
                style={{ filter: `drop-shadow(0 0 6px ${tone.glow})`, transition: 'fill 400ms' }} />
            )}
            <circle cx={d.x} cy={d.y} r="3" fill="#0f172a" opacity="0.55" />
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- الهيرو ---------- */
export function HeroPanel({ lang = 'ar', onBrowse, onContact }: HeroPanelProps) {
  const copy = COPY[lang];
  const reduced = useReducedMotion();
  const [stage, setStage] = useState<Stage>(0);
  const [hovered, setHovered] = useState<Device | null>(null);

  // المحاكاة بتوقف لما الزائر يعمل hover على جهاز
  useEffect(() => {
    if (hovered || reduced) return undefined;
    const t = setInterval(
      () => setStage((current) => STAGES[(STAGES.indexOf(current) + 1) % STAGES.length]),
      STAGE_MS,
    );
    return () => clearInterval(t);
  }, [hovered, reduced]);

  const stageColor = [
    'text-emerald-400',
    'text-amber-400',
    'text-red-400',
    'text-emerald-400',
  ][stage];
  const caption = hovered ? `${copy.types[hovered.type]} · ${hovered.name[lang] ?? hovered.name.ar}` : copy.captions[stage];

  return (
    <section className="relative isolate overflow-hidden bg-slate-950">
      {/* خلفية: شبكة + توهج */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />
      <div aria-hidden="true" className="absolute -top-32 end-0 -z-10 h-96 w-96 rounded-full bg-red-600/15 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-32 start-0 -z-10 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-24">
        {/* ====== النص ====== */}
        <div className="text-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-xs font-bold text-red-300">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            {copy.badge}
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.25] text-white sm:text-5xl lg:text-6xl">
            {copy.title}
            <span className="mt-1 block bg-gradient-to-r from-red-400 via-orange-400 to-amber-300 bg-clip-text text-transparent rtl:bg-gradient-to-l">
              {copy.highlight}
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-slate-400 sm:text-lg">{copy.sub}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onBrowse}
              className="group inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/25 transition hover:bg-red-500 hover:shadow-red-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
            >
              {copy.ctaPrimary}
              <span aria-hidden="true" className="transition group-hover:-translate-x-1 ltr:group-hover:translate-x-1 ltr:rotate-180 rtl:rotate-0">←</span>
            </button>
            <button
              type="button"
              onClick={onContact}
              className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-900/60 px-6 py-3.5 text-sm font-bold text-slate-200 backdrop-blur transition hover:border-slate-500 hover:bg-slate-800/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
            >
              {copy.ctaSecondary}
            </button>
          </div>

          {/* شريط الثقة */}
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-slate-800 pt-6">
            {copy.stats.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-2xl font-extrabold text-white">{s.value}</dd>
                <p className="mt-0.5 text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </dl>
        </div>

        {/* ====== اللوحة التفاعلية ====== */}
        <div className="relative mx-auto w-full max-w-lg" dir="ltr">
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
            {/* الهيدر */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <span className="relative flex h-2 w-2">
                  {!reduced && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${stage === 2 ? 'bg-red-400' : 'bg-emerald-400'}`} />}
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${stage === 2 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                </span>
                {copy.panelTitle}
              </div>
              <span className={`rounded-md border border-slate-700 bg-slate-950 px-2 py-0.5 font-mono text-[10px] font-bold ${stageColor}`}>
                {COPY.en.stages[stage].toUpperCase()}
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2">
              <FloorPlan stage={stage} copy={copy} reduced={reduced} onHover={setHovered} />
            </div>

            {/* التعليق الحي */}
            <p dir={lang === 'ar' ? 'rtl' : 'ltr'} className="mt-3 min-h-[1.25rem] text-center text-sm font-semibold text-slate-300" aria-live="polite">
              {caption}
            </p>

            {/* مؤشر المراحل */}
            <ol className="mt-3 grid grid-cols-4 gap-2" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              {STAGES.map((i) => {
                const label = copy.stages[i];
                return (
                  <li key={label}>
                    <button
                      type="button"
                      onClick={() => setStage(i)}
                      className={`w-full rounded-lg border px-2 py-2 text-[11px] font-bold transition ${
                        i === stage
                          ? 'border-red-500/50 bg-red-500/15 text-red-300'
                          : 'border-slate-800 bg-slate-900/60 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {label}
                    </button>
                    <div className="mt-1.5 h-0.5 overflow-hidden rounded bg-slate-800">
                      {i === stage && !hovered && !reduced && (
                        <div key={`${stage}-bar`} className="h-full origin-left bg-red-500" style={{ animation: `heroFill ${STAGE_MS}ms linear forwards` }} />
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>

      <style>{`@keyframes heroFill { from { transform: scaleX(0) } to { transform: scaleX(1) } }`}</style>
    </section>
  );
}