'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

type Locale = 'ar' | 'en';
type Stage = 0 | 1 | 2 | 3;
type DeviceType = 'smoke' | 'heat' | 'callPoint' | 'siren';

type Device = {
  id: string;
  type: DeviceType;
  x: number;
  y: number;
  room: string;
};

type Copy = {
  title: string;
  demo: string;
  exit: string;
  safeExit: string;
  stages: [string, string, string, string];
  captions: [string, string, string, string];
  rooms: Record<string, string>;
  deviceTypes: Record<DeviceType, string>;
  legend: string;
};

type Props = {
  lang: Locale;
};

const STAGE_DURATION = 3200;
const STAGES = [0, 1, 2, 3] as const;
const FIRE_DEVICE = 'heat-kitchen';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const COPY: Record<Locale, Copy> = {
  ar: {
    title: 'محاكاة توضيحية لنظام إنذار',
    demo: 'عرض توضيحي',
    exit: 'مخرج',
    safeExit: 'مخرج آمن',
    stages: ['طبيعي', 'اكتشاف', 'إنذار', 'إخلاء'],
    captions: [
      'النظام في الوضع الطبيعي — جميع الأجهزة جاهزة',
      'كاشف الحرارة يرصد ارتفاعًا في المطبخ',
      'تم تفعيل الإنذار لتنبيه الموجودين',
      'إشارة الإخلاء توجّه إلى المخرج الآمن',
    ],
    rooms: {
      reception: 'الاستقبال',
      office: 'المكتب',
      storage: 'المخزن',
      kitchen: 'المطبخ',
      corridor: 'الممر',
    },
    deviceTypes: {
      smoke: 'كاشف دخان',
      heat: 'كاشف حرارة',
      callPoint: 'نقطة نداء',
      siren: 'سارينة',
    },
    legend: 'توزيع توضيحي للأجهزة',
  },
  en: {
    title: 'Fire alarm system simulation',
    demo: 'DEMO',
    exit: 'EXIT',
    safeExit: 'SAFE EXIT',
    stages: ['Normal', 'Detection', 'Alarm', 'Evacuation'],
    captions: [
      'System normal — all devices are ready',
      'Heat detector senses a rise in the kitchen',
      'Alarm activated to alert building occupants',
      'Evacuation signal points to the safe exit',
    ],
    rooms: {
      reception: 'Reception',
      office: 'Office',
      storage: 'Storage',
      kitchen: 'Kitchen',
      corridor: 'Corridor',
    },
    deviceTypes: {
      smoke: 'Smoke detector',
      heat: 'Heat detector',
      callPoint: 'Manual call point',
      siren: 'Sounder',
    },
    legend: 'Illustrative device layout',
  },
};

const DEVICES: Device[] = [
  { id: 'smoke-reception', type: 'smoke', x: 105, y: 80, room: 'reception' },
  { id: 'smoke-office', type: 'smoke', x: 315, y: 80, room: 'office' },
  { id: FIRE_DEVICE, type: 'heat', x: 315, y: 225, room: 'kitchen' },
  { id: 'smoke-storage', type: 'smoke', x: 105, y: 225, room: 'storage' },
  { id: 'call-corridor', type: 'callPoint', x: 210, y: 160, room: 'corridor' },
  { id: 'siren-corridor', type: 'siren', x: 210, y: 54, room: 'corridor' },
];

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

function stageTone(stage: Stage, device: Device) {
  if (stage >= 2) return { fill: '#ef4444', glow: 'rgba(239,68,68,0.55)' };
  if (stage === 1 && device.id === FIRE_DEVICE) {
    return { fill: '#f59e0b', glow: 'rgba(245,158,11,0.6)' };
  }
  return { fill: '#34d399', glow: 'rgba(52,211,153,0.35)' };
}

function FloorPlan({
  stage,
  copy,
  lang,
  reducedMotion,
  onDeviceFocus,
}: {
  stage: Stage;
  copy: Copy;
  lang: Locale;
  reducedMotion: boolean;
  onDeviceFocus: (device: Device | null) => void;
}) {
  const roomFill = (room: string) => {
    if (stage === 2) return 'rgba(239,68,68,0.09)';
    if (stage === 3) return 'rgba(52,211,153,0.08)';
    if (stage === 1 && room === 'kitchen') return 'rgba(245,158,11,0.11)';
    return 'rgba(148,163,184,0.025)';
  };

  return (
    <svg
      viewBox="0 0 420 300"
      className="block h-auto w-full"
      role="img"
      aria-label={copy.captions[stage]}
    >
      <defs>
        <radialGradient id="detector-glow">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect
        x="28"
        y="24"
        width="364"
        height="238"
        rx="12"
        fill="rgba(11,18,32,0.35)"
        stroke="#334155"
        strokeWidth="2"
      />
      <rect x="34" y="30" width="176" height="112" fill={roomFill('reception')} />
      <rect x="210" y="30" width="176" height="112" fill={roomFill('office')} />
      <rect x="34" y="142" width="176" height="114" fill={roomFill('storage')} />
      <rect x="210" y="142" width="176" height="114" fill={roomFill('kitchen')} />

      <g fill="none" stroke="#334155" strokeWidth="2">
        <path d="M210 30v76m0 36v114" />
        <path d="M34 142h50m34 0h268" />
      </g>
      <path
        d="M210 272v-14m-24 14h48"
        fill="none"
        stroke={stage === 3 ? '#34d399' : '#475569'}
        strokeWidth="4"
        strokeLinecap="round"
        className="transition-colors duration-300"
      />
      <text
        x="210"
        y="292"
        textAnchor="middle"
        fill={stage === 3 ? '#6ee7b7' : '#94a3b8'}
        fontSize="10"
        fontWeight="700"
        letterSpacing={lang === 'en' ? '1.4' : '0'}
      >
        {stage === 3 ? copy.safeExit : copy.exit}
      </text>

      <g
        fill="#94a3b8"
        fontSize="10"
        fontWeight="600"
        direction={lang === 'ar' ? 'rtl' : 'ltr'}
        textAnchor={lang === 'ar' ? 'end' : 'start'}
      >
        <text x={lang === 'ar' ? '194' : '48'} y="52">
          {copy.rooms.reception}
        </text>
        <text x={lang === 'ar' ? '378' : '224'} y="52">
          {copy.rooms.office}
        </text>
        <text x={lang === 'ar' ? '194' : '48'} y="164">
          {copy.rooms.storage}
        </text>
        <text x={lang === 'ar' ? '378' : '224'} y="164">
          {copy.rooms.kitchen}
        </text>
      </g>

      <path
        d="M105 80H315V225H105V80M210 54V160H315"
        fill="none"
        stroke="#64748b"
        strokeOpacity="0.4"
        strokeWidth="1.5"
        strokeDasharray="5 6"
      />

      {stage === 1 && (
        <circle
          cx="315"
          cy="225"
          r="48"
          fill="url(#detector-glow)"
          className="pointer-events-none"
        />
      )}

      {DEVICES.map((device) => {
        const tone = stageTone(stage, device);
        const isAlarmSource = stage === 1 && device.id === FIRE_DEVICE;
        const isAlerting = isAlarmSource || stage === 2;
        const isCallPoint = device.type === 'callPoint';
        const label = `${copy.deviceTypes[device.type]} · ${copy.rooms[device.room]}`;

        return (
          <g
            key={device.id}
            tabIndex={0}
            role="img"
            aria-label={label}
            onMouseEnter={() => onDeviceFocus(device)}
            onFocus={() => onDeviceFocus(device)}
            onMouseLeave={() => onDeviceFocus(null)}
            onBlur={() => onDeviceFocus(null)}
            className="cursor-help outline-none"
          >
            {isAlerting && !reducedMotion && (
              <circle
                cx={device.x}
                cy={device.y}
                r="10"
                fill="none"
                stroke={tone.fill}
                strokeWidth="2"
                opacity="0.85"
              >
                <animate attributeName="r" from="10" to="26" dur="1.5s" repeatCount="indefinite" />
                <animate
                  attributeName="opacity"
                  from="0.75"
                  to="0"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </circle>
            )}
            <circle
              cx={device.x}
              cy={device.y}
              r="13"
              fill={tone.glow}
              className="transition-colors duration-300"
            />
            {isCallPoint ? (
              <rect
                x={device.x - 7}
                y={device.y - 7}
                width="14"
                height="14"
                rx="3"
                fill={tone.fill}
                stroke="#0b1220"
                strokeWidth="2"
              />
            ) : (
              <circle
                cx={device.x}
                cy={device.y}
                r={device.type === 'siren' ? 7 : 8}
                fill={tone.fill}
                stroke="#0b1220"
                strokeWidth="2"
              />
            )}
            <circle cx={device.x} cy={device.y} r="2.5" fill="#0b1220" opacity="0.75" />
          </g>
        );
      })}
    </svg>
  );
}

export function HeroPanel({ lang }: Props) {
  const copy = COPY[lang];
  const reducedMotion = useReducedMotion();
  const [stage, setStage] = useState<Stage>(0);
  const [focusedDevice, setFocusedDevice] = useState<Device | null>(null);

  useEffect(() => {
    if (focusedDevice || reducedMotion) return;

    const timer = window.setInterval(() => {
      setStage((current) => STAGES[(STAGES.indexOf(current) + 1) % STAGES.length]);
    }, STAGE_DURATION);

    return () => window.clearInterval(timer);
  }, [focusedDevice, reducedMotion]);

  const activeCaption = focusedDevice
    ? `${copy.deviceTypes[focusedDevice.type]} · ${copy.rooms[focusedDevice.room]}`
    : copy.captions[stage];

  return (
    <div className="relative mx-auto w-full max-w-[560px]" dir="ltr">
      <div
        aria-hidden="true"
        className="border-navy-700/70 absolute -inset-3 rounded-[28px] border"
      />
      <div className="border-navy-700 bg-navy-900/95 relative overflow-hidden rounded-2xl border shadow-2xl shadow-black/30">
        <div className="border-navy-700/80 flex items-center justify-between gap-4 border-b px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div
              aria-hidden="true"
              className="bg-navy-800 border-navy-700 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
            >
              <span className="border-fire-600 flex h-4 w-4 items-center justify-center rounded-full border-2">
                <span className="bg-fire-600 h-1.5 w-1.5 rounded-full" />
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-100 sm:text-sm">{copy.title}</p>
              <p className="mt-0.5 text-[10px] font-medium text-slate-400 sm:text-xs">
                {copy.legend}
              </p>
            </div>
          </div>
          <span className="border-navy-700 bg-navy-950 inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold tracking-wider text-slate-200 sm:text-[10px]">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-green-600" />
            {copy.demo}
          </span>
        </div>

        <div className="px-2 pt-2 sm:px-4 sm:pt-4">
          <div className="bg-navy-950/70 border-navy-700/70 overflow-hidden rounded-xl border px-1 py-2 sm:px-3">
            <FloorPlan
              stage={stage}
              copy={copy}
              lang={lang}
              reducedMotion={reducedMotion}
              onDeviceFocus={setFocusedDevice}
            />
          </div>
        </div>

        <div className="px-4 pt-3 sm:px-5">
          <p
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            aria-live="polite"
            className="text-center text-xs leading-6 font-semibold text-slate-200 sm:min-h-6 sm:text-sm"
          >
            {activeCaption}
          </p>
        </div>

        <div className="px-4 pt-4 pb-4 sm:px-5 sm:pb-5">
          <ol
            aria-label={copy.title}
            className="border-navy-700 bg-navy-950/70 grid grid-cols-4 gap-1 rounded-xl border p-1"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            {STAGES.map((item) => {
              const isActive = item === stage;
              return (
                <li key={copy.stages[item]}>
                  <button
                    type="button"
                    aria-current={isActive ? 'step' : undefined}
                    onClick={() => setStage(item)}
                    className={`focus-visible:outline-fire-600 min-h-10 w-full rounded-lg px-1.5 text-[10px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 sm:px-2 sm:text-xs ${
                      isActive
                        ? 'bg-navy-800 text-white'
                        : 'hover:bg-navy-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          isActive ? 'bg-fire-600' : 'bg-navy-700'
                        }`}
                      />
                      <span className="truncate">{copy.stages[item]}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
