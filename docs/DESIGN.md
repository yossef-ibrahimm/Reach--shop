# DESIGN SYSTEM — Fire Alarm & Sensors Showcase (AR/EN)

> Direction: **"Control Panel"** — مستوحى من لوحات إنذار الحريق الحقيقية: خلفية كحلي/فحمي عميقة، أسطح نظيفة، ولون أحمر حريق مُقيَّد يُستخدم فقط للإجراءات والتنبيهات. احترافي، موثوق، صناعي — بدون مبالغة أو إحصائيات مخترعة.
> RTL-first: التصميم بالعربي أولاً، والإنجليزي مرآة له عبر الخصائص المنطقية (logical properties).

---

## 1. Principles
1. **الثقة قبل الزخرفة** — مساحات بيضاء واسعة، تسلسل نصي واضح، بدون تأثيرات مبهرجة.
2. **الأحمر للفعل فقط** — CTA رئيسي، شارة "تنبيه"، حالة focus. ممنوع كخلفية مساحات كبيرة.
3. **RTL أولاً** — `margin-inline`, `padding-inline`, `inset-inline-start`, `text-align: start`. ممنوع left/right.
4. **أرقام الهاتف معزولة** — `dir="ltr"` + `unicode-bidi: isolate` دائماً.
5. **إتاحة WCAG AA** — تباين ≥ 4.5:1 للنص، focus ظاهر، احترام `prefers-reduced-motion`.

---

## 2. Color tokens

| Token | Hex | الاستخدام |
|---|---|---|
| `--navy-950` | `#0B1220` | خلفية الهيرو/الفوتر |
| `--navy-900` | `#111A2E` | أسطح داكنة، هيدر الأدمن |
| `--navy-800` | `#1B2640` | كروت على الخلفية الداكنة |
| `--navy-700` | `#2A3756` | حدود على الداكن |
| `--slate-600` | `#4A5672` | نص ثانوي |
| `--slate-400` | `#8A94AB` | نص مساعد / placeholder |
| `--slate-200` | `#DDE2EC` | حدود فاتحة |
| `--slate-100` | `#EEF1F6` | خلفية أقسام بديلة |
| `--paper` | `#F7F8FA` | خلفية الصفحة |
| `--white` | `#FFFFFF` | الكروت |
| `--fire-600` | `#D7261E` | **Primary accent** — أزرار CTA |
| `--fire-700` | `#B01E17` | hover / pressed |
| `--fire-50` | `#FDECEB` | خلفية شارات حمراء |
| `--amber-500` | `#E8A317` | حالة "كمية محدودة" |
| `--green-600` | `#1E8E5A` | حالة "متوفر" |
| `--blue-600` | `#2F6FD6` | حالة "حسب الطلب" / روابط |
| `--whatsapp` | `#1FAF5A` | زر واتساب فقط |

### Semantic mapping
```
--bg            : var(--paper)
--surface       : var(--white)
--surface-alt   : var(--slate-100)
--surface-inverse: var(--navy-950)
--text          : var(--navy-950)
--text-muted    : var(--slate-600)
--text-inverse  : #F2F4F8
--border        : var(--slate-200)
--primary       : var(--fire-600)
--primary-hover : var(--fire-700)
--focus-ring    : 0 0 0 3px rgba(215,38,30,.35)
```

---

## 3. Typography
- **Arabic:** Cairo (400 / 600 / 700 / 800)
- **English:** Inter (400 / 500 / 600 / 700)
- **Specs / codes / phone numbers:** JetBrains Mono (500) — للأرقام التقنية فقط.

| Token | Size / Line | Weight | الاستخدام |
|---|---|---|---|
| `display` | 48 / 1.15 (mobile 34) | 800 | عنوان الهيرو |
| `h1` | 36 / 1.2 | 700 | عنوان الصفحة |
| `h2` | 28 / 1.25 | 700 | عناوين الأقسام |
| `h3` | 20 / 1.35 | 600 | عناوين الكروت |
| `body-lg` | 18 / 1.7 | 400 | مقدمات |
| `body` | 16 / 1.7 | 400 | نص أساسي (العربي يحتاج line-height أعلى) |
| `small` | 14 / 1.55 | 500 | labels، metadata |
| `eyebrow` | 13 / 1.4 | 700 | عنوان صغير فوق الأقسام، letter-spacing .08em (EN فقط) |

---

## 4. Spacing, radius, shadow
- **Spacing scale (4px base):** 4, 8, 12, 16, 24, 32, 48, 64, 96
- **Container:** max 1200px، padding-inline 16 (mobile) / 24 (tablet) / 32 (desktop)
- **Section padding:** 64 (mobile) / 96 (desktop)
- **Radius:** `sm 6` (badges, inputs) · `md 10` (buttons, cards) · `lg 16` (gallery, modals) · `full` (chips)
- **Shadows:**
  - `--shadow-sm: 0 1px 2px rgba(11,18,32,.06)`
  - `--shadow-md: 0 6px 20px -6px rgba(11,18,32,.14)`
  - `--shadow-lg: 0 20px 40px -12px rgba(11,18,32,.22)`

## 5. Grid & breakpoints
`sm 640` · `md 768` · `lg 1024` · `xl 1280`
- Products grid: 1 → 2 (sm) → 3 (lg) → 4 (xl) أعمدة، gap 24.
- Listing: sidebar فلاتر 280px على lg+، drawer على الموبايل.

---

## 6. Components

### Buttons
| Variant | Style |
|---|---|
| `primary` | bg fire-600، نص أبيض، hover fire-700 |
| `secondary` | bg navy-950، نص أبيض |
| `outline` | border slate-200، نص navy، hover surface-alt |
| `ghost` | شفاف، للأيقونات والنافيجيشن |
| `whatsapp` | bg #1FAF5A + أيقونة واتساب |
Sizes: `sm 36px` · `md 44px` (default، touch target) · `lg 52px`. Radius md. أيقونة على جهة `inline-start`.

### Availability badge
- `in_stock` → أخضر، "متوفر / In stock"
- `limited` → كهرماني، "كمية محدودة / Limited"
- `on_request` → أزرق، "حسب الطلب / On request"
شكل: نقطة 8px + نص، bg بلون شفاف 12%.

### Product card
صورة 4:3 بخلفية بيضاء (المنتجات صور منتج على أبيض) → chip البراند → الاسم (h3، سطرين max) → سطر specs مختصر (mono) → availability badge + سهم. Hover: رفع 2px + shadow-md + border أحمر خفيف في الأعلى (شريط 3px يظهر).

### Category tile
أيقونة lucide داخل مربع 48px navy → اسم القسم → عدد المنتجات. خلفية بيضاء، border.

### Specs table
صفوف متبادلة surface/surface-alt، العمود الأول label (muted، 40%)، الثاني القيمة (mono + unit).

### Filters
Checkbox list مع عداد النتائج على `inline-end`. Chips للفلاتر النشطة مع زر ×. Search input بأيقونة على `inline-start`.

### Header
خلفية بيضاء، sticky، شريط علوي navy رفيع فيه رقم الهاتف وساعات العمل. Logo → nav → language switch → زر اتصال outline + زر واتساب.

### Floating WhatsApp
دائرة 56px، `inset-inline-end: 24px; bottom: 24px`، ظل lg.

### Admin
نفس التوكنز، كثافة أعلى: جداول بارتفاع صف 56px، sidebar navy-900 بعرض 248px، tabs AR/EN في نماذج المحتوى.

---

## 7. Motion
- Duration: 150ms (hover) / 250ms (drawer, modal). Easing: `cubic-bezier(.2,.7,.2,1)`.
- بدون parallax أو animations متكررة. `@media (prefers-reduced-motion: reduce)` → إلغاء كل transitions.

## 8. Iconography & imagery
- lucide-react بسمك 1.75، مقاس 20 (UI) / 24 (tiles).
- صور المنتجات: خلفية بيضاء، aspect-ratio ثابت، `loading="lazy"`.
- أيقونات الأقسام المقترحة: لوحات تحكم → `cpu`، كواشف دخان → `cloud`، كواشف حرارة → `thermometer`، سارينات → `bell-ring`، بطاريات → `battery`، كابلات → `cable`.

## 9. Do / Don't
- ✅ أحمر واحد مُقيَّد · ✅ نص عربي بـ line-height 1.7 · ✅ أرقام ltr معزولة
- ❌ gradients بنفسجي · ❌ إحصائيات مخترعة ("+1000 عميل") · ❌ أسعار · ❌ `left/right` في layout
