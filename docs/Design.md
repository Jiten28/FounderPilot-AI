# Design — FounderPilot AI

## Brand feel
Confident, modern SaaS product — closer to Linear/Notion/Vercel's dashboard aesthetic
than a generic admin panel. Dark mode by default (toggle to light available).

## Color palette

| Token | Hex | Use |
|---|---|---|
| `--primary` | `#6C5CE7` | Buttons, active nav, primary accents (indigo/violet) |
| `--primary-dark` | `#5A4BD1` | Hover states |
| `--success` | `#00D9A3` | Positive scores, "Low risk", healthy metrics (mint green) |
| `--warning` | `#FFB020` | Medium risk / caution states |
| `--danger` | `#FF6B6B` | High risk, error banners |
| `--background` | `#0B0D17` (dark) / `#F7F7FB` (light) | Page background |
| `--surface` | `#151826` (dark) / `#FFFFFF` (light) | Cards |
| `--text-primary` | `#F4F4F8` (dark) / `#14151F` (light) | Headings/body |
| `--text-muted` | `#8B8D9B` | Secondary text, captions |

Implemented as CSS custom properties in `frontend/src/index.css`, toggled by a `.light`
class on `<html>`/`<body>` (see `hooks/useTheme.ts`).

## Typography
- Headings: **Space Grotesk** (semibold/bold, `.font-display`)
- Body: **Inter**
- Numbers on score cards: Space Grotesk, large (36–42px), `tabular-nums`

Loaded via Google Fonts in `index.html`.

## Spacing & layout
- 8px base spacing unit (Tailwind default scale).
- Cards: `rounded-2xl`, subtle 1px border (`var(--border-subtle)`), soft shadow on hover
  only — no heavy drop shadows everywhere.
- Dashboard: 2-across (mobile) / 4-across (desktop) score-card grid.

## Component conventions (as implemented)
- **Score cards** (`ScoreCard.tsx`): big number, small label, colored left border tinted
  by success/warning/danger depending on value.
- **Risk/priority/impact badge** (`RiskBadge.tsx`): pill shape, colored per the exact
  enum string from the API (`Low`→success, `Medium`→warning, `High`→danger,
  `Immediate`→danger) — never invented label text.
- **Action plan** (`ActionPlan.tsx`): grouped by priority (Immediate/High/Medium/Low),
  same color mapping as risk badges.
- **Chat bubbles** (`MessageBubble.tsx`): founder messages right-aligned/primary tint,
  AI messages left-aligned/surface tint.
- **Charts** (`MetricsCharts.tsx`): Recharts, primary for revenue, danger for
  expenses/burn, muted gray for users. "Projected" badge shown whenever the API returns
  `projected: true`.

## Motion
Minimal: `animate-fade-slide-in` (~220ms, ease-out) on card mount, no bouncy/elastic
easing. Respects `prefers-reduced-motion`.
