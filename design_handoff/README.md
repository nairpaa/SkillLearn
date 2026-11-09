# Handoff: SkillLearn — Web (React) + Mobile (React Native) + API (Express/MongoDB)

## Overview
SkillLearn is a mini learning platform for high-school and university students to learn practical skills outside formal classes: **Programming, Graphic Design, Digital Marketing, Technology**. Content types: **Article, Video tutorial, Quiz, Practice**. Users must **register and log in** to access any material; they can **save favorites** and see their **learning history**.

Deliverables this package supports (assignment LO 3):
- Web app, React — 12 screens
- Mobile app, React Native (Expo) — 13 screens
- REST API, Node.js + Express + MongoDB Atlas
- Figma file (generated from this package, see "Figma")

## About the design files
Everything in `design/` is a **design reference built in HTML** — a clickable prototype showing the intended look, copy, states and behaviour. It is **not production code**. Recreate the screens in React (web) and React Native (mobile) using normal component patterns; do not ship or port the HTML/`.dc.html` runtime.

Open any file in a browser (serve the folder, see "Run the prototype"). `sl-data.js` holds the mock data and demo logic (favorites in localStorage, simulated 450 ms API latency) — replace it with real API calls (`api/openapi.yaml`).

## Fidelity
**High-fidelity.** Colors, type, spacing, radii, copy and states are final. Recreate pixel-accurately with the tokens in `tokens/`. Course thumbnails and the video player are **placeholders** (striped category-tinted blocks) — replace with real images / YouTube embeds.

---

## Package contents
| Path | What |
|---|---|
| `design/SkillLearn UI.dc.html` | Master canvas: foundations, logo, app flow, state reference (S1–S10), state inventory table, links to every page |
| `design/Web - *.dc.html` (12) | Full-length web pages, clickable |
| `design/Mobile - *.dc.html` (13) | Full-length mobile pages (390 px column), clickable |
| `design/WebNav`, `MobileTabBar`, `StatusBlock` `.dc.html` | Shared pieces (top nav, tab bar, loading/error/not-found block) |
| `design/SkillLearn Architecture and Security.dc.html` | Technical doc (Indonesian): architecture, flows + sequence diagrams, security controls, free deployment, security tests. Print to PDF from the browser. |
| `design/sl-data.js` | Mock data: categories, 8 courses, lessons, quiz, history, code samples, syntax highlighter |
| `tokens/tokens.json` | Design tokens (W3C format) — source of truth; imported by the Figma plugin |
| `tokens/tokens.css` | CSS custom properties for the React web app |
| `tokens/theme.ts` | Theme object for React Native |
| `api/openapi.yaml` | API contract (all endpoints, schemas, error codes) |
| `screens.json` | Screen + state inventory (used by the capture script) |
| `screenshots/` | **36 full-length PNGs** of every screen + state (web 18, mobile 18) with an index `screenshots/README.md` — look here first |
| `figma/` | Screenshot capture script + Figma importer plugin |

### Run the prototype
```bash
cd figma && npm install
npm run serve        # → http://localhost:4321  (lists every page URL)
```
Start at `Web - Login.dc.html` or `Mobile - Splash.dc.html`. Demo triggers:
- `#error=1` on any data page → API error state; `#c=xyz` on Course Detail/Category → not found
- Login `#expired=1` → session-expired banner; email `wrong@student.ac.id` → invalid credentials (5× → rate-limited)
- Register any new email → "Check your inbox" → log in with that email → **new-user** Home/Profile
- Profile pages have an `emptyState` prop (empty Favorites/History)

---

## Figma
Figma's REST API cannot create layers, so this package ships a **local development plugin** plus a **capture script**. The developer (or designer) runs both; nothing needs publishing.

```bash
cd figma
npm install && npx playwright install chromium
npm run capture      # → figma/out/*.png  (every screen + state from screens.json, full-page, 2x)
```
Then in **Figma desktop**: *Plugins → Development → Import plugin from manifest…* → `figma/plugin/manifest.json` → run **SkillLearn Importer**:
1. Pick `tokens/tokens.json` → creates Variables collection **SkillLearn** (all colors, spacing, radius, sizes), **text styles** `SkillLearn/*` (needs Plus Jakarta Sans + JetBrains Mono, both available in Figma) and **effect styles** (shadows).
2. Pick all PNGs in `figma/out/` (or the bundled `screenshots/` for a quick start) → creates pages **Web**, **Mobile**, **Reference** with one frame per screen, states laid out left→right, named `W07 course detail / not-found`.

Frames are image references for layout/redlines. For **editable layers**, additionally import pages with an HTML-to-Figma plugin (e.g. html.to.design) pointing at the URLs printed by `npm run serve` (expose with a tunnel such as `npx localtunnel --port 4321` if the plugin needs a public URL), then rebuild components on top of the variables/styles above.

---

## Design tokens (summary — full list in `tokens/tokens.json`)
**Color**
| Token | Hex | Use |
|---|---|---|
| primary | `#0E5E52` | Primary buttons, active nav/tab, links, progress, logo |
| primary-hover | `#0B4D43` | Hover (web) / pressed (mobile) |
| primary-busy | `#4F8C82` | Primary button while loading |
| primary-tint | `#E7F3F0` | Current lesson row, success/selected chips, icon tiles |
| primary-border | `#9FC5BC` | Course-card hover border |
| primary-on-dark | `#CFE6E0` | Secondary text on teal |
| accent | `#F2A93B` | Avatar bg, progress fill on teal, logo dot, current-lesson number, Run button |
| accent-tint / border / ink | `#FBF3DF` / `#F0E2B8` / `#7A5510` | Info banners, new-user card, **inline code** |
| ink / body / muted / subtle | `#16211F` / `#2E3A38` / `#4A5856` / `#8A9693` | Text levels; ink also = dark surfaces (code, video) |
| line / strong / soft / control / dashed | `#E3E8E6` / `#D5DDDA` / `#EEF1F0` / `#B9C4C1` / `#C9D3D0` | Card border / input border / row divider / checkbox / empty-state |
| page / card | `#F6F8F7` / `#FFFFFF` | Backgrounds |
| danger / hover / ink / tint / field | `#C2412D` / `#A33522` / `#9A3322` / `#FBE9E5` / `#FFF8F6` | Errors, destructive |
| category tint / ink | Programming `#DCE8F7`/`#1F4E8C` · Design `#F8E3DA`/`#A4472A` · Marketing `#F6ECCF`/`#7A5510` · Technology `#DCEEE3`/`#2D6B4A` | Thumbnails, category labels |
| code | bg `#16211F` text `#E7F3F0` comment `#8A9693` *italic* string `#9FD8C6` tag `#8FB8F0` keyword `#F2A93B` function `#E9D59A` attribute `#F4B9A4` punctuation `#B9C4C1` line-no `#5E6E6B` | Syntax highlighting |

**Typography** — `Plus Jakarta Sans` 400/500/600/700/800 for UI; `JetBrains Mono` 500 for code and uppercase eyebrow labels.
| Style | Size / weight / line-height / tracking | Where |
|---|---|---|
| display | 40 / 800 / 1.1 / −0.02em | Web auth side panel |
| page-title-lg | 34 / 800 / 1.2 / −0.02em | Web Home greeting, Article title |
| page-title | 30 / 800 / −0.02em | Web Search, Course Detail, Edit Profile |
| screen-title | 28 / 800 / −0.02em | Auth form titles (web+mobile), mobile Article |
| mobile-title | 24 / 800 / −0.02em | Mobile Home name, Search, Profile |
| section | 22 / 700 / −0.01em | Web section headings ("Categories", "Popular courses") |
| heading | 18 / 700 | Card headings, mobile section headings |
| title | 16 / 700 / 1.35 | Course card titles |
| body-lg | 16 / 400 / 1.7–1.75, color body | Article paragraphs |
| body | 15 / 400 / 1.6 | Default text, web inputs (mobile inputs 16 to avoid iOS zoom) |
| ui | 14 / 600 | Buttons, nav, lesson titles |
| small | 13 / 500–600 | Meta, field labels (600), chips |
| caption | 12 / 600 | Field errors (danger), hints |
| tab | 11 / 600 | Mobile tab labels |
| eyebrow | JetBrains Mono 10–11 / 500 / +0.08em / UPPERCASE | "CONTINUE LEARNING", "LESSON 2 · ARTICLE" |
| code | JetBrains Mono 14/1.7 (web block), 13.5/1.75 (editor), 11–11.5 (mobile) | Code |

**Spacing** 4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 24 · 28 · 32 · 36 · 40 · 48 · 56 · 64. Prefer flex/grid `gap`.
**Radius** 6 (inline code) · 8 (small) · 10 (web inputs/buttons/thumbs) · 12 (mobile inputs/buttons, banners, code blocks) · 14 (cards) · 16 (panels, dialogs) · 20 (bottom sheet top) · 999 (pills, avatars).
**Shadow** card hover `0 8px 24px rgba(14,94,82,.10)` · tile hover `0 4px 14px rgba(14,94,82,.08)` · dialog `0 20px 50px rgba(0,0,0,.2)` · toast `0 8px 24px rgba(0,0,0,.2)`. Nothing else has shadows; separation comes from 1px `line` borders.
**Motion** hover/press 150 ms ease (background, border-color, box-shadow, transform, color); card hover `translateY(-2px)`; quiz progress width 300 ms; spinner 800 ms linear infinite; skeleton pulse 1.4 s ease-in-out (opacity 1→.45); toast 3.5 s. Respect `prefers-reduced-motion`.

**Layout**
- Web: fluid; content `max-width:1200px; margin:0 auto; padding:36px 40px 64px`. Sticky top nav 68 px. Course grid `repeat(auto-fill, minmax(260px,1fr))`, gap 20.
- Mobile: 390 pt design width (fluid to device), screen padding 20 (auth 24), status-bar area 50, bottom tab bar 84 (Home · Search · Profile), touch targets ≥ 44.
- Control heights: web input/primary button 48, secondary 42–44; mobile input 52, button 54.

---

## Shared components
**Logo** — 32×32 rounded square (rx 9) `primary` with white stepped path `M8 23h5v-5h5v-5h5` (stroke 3, round caps/joins) and accent dot (cx 23.5, cy 8.5, r 2.6). Inverted on teal: white square, teal path. Wordmark "SkillLearn" 18–20/800. SVG is inline in every page.

**Button**
| Variant | Style | Hover (web) | Pressed (mobile) | Busy |
|---|---|---|---|---|
| Primary | bg primary, white 15/700 (mobile 16), radius 10 (12) | bg primary-hover | bg primary-hover | bg primary-busy, disabled, 16 px spinner (2px ring white 35%, top white) + label "Logging in…/Creating account…/Sending…/Saving…" |
| Secondary | white bg, 1px line-strong, ink 14/600 | bg page, border control | opacity .7 | — |
| Destructive | bg danger, white 700 | bg danger-hover | — | — |
| Ghost/link | transparent, primary or muted 600 | — | opacity .6 | — |

**Text field** — label 13/600 above (gap 6); input 1px line-strong, radius 10/12, padding 0 14/16, focus outline primary. **Error**: border danger, bg danger-field, message below 12/600 danger, `aria-invalid="true"`. Password fields have a "Show/Hide" text toggle inside the right edge.

**Form banner** — padding 12×14, radius 10/12, 13/600: error (danger-tint / danger-ink), info (accent-tint + accent-border / accent-ink-strong), success (primary / white).

**Course card (web)** — white, 1px line, radius 14, overflow hidden. Thumb 150 px category tint + 135° white stripes (`repeating-linear-gradient(135deg,rgba(255,255,255,.4) 0 10px,transparent 10px 20px)` — placeholder), category pill top-left (white, category-ink 12/700, radius 999, padding 5×10), bookmark button top-right (34 circle white; filled primary when saved). Body padding 16, gap 8: title 16/700, meta 13 muted ("Video · 12 lessons · 3h 20m"), row level 13/600 muted + "★ 4.8" 13/700. Hover: border primary-border, card-hover shadow, translateY(-2px).
**Course row (mobile)** — white, 1px line, radius 14, padding 10, thumb 72×72 radius 10, category 11/700 category-ink, title 14/700, meta 12 muted; bookmark 44×44 hit area at right.

**Lesson row** — 28 px circle: done = primary bg + white "✓"; current = accent bg + number; todo = line-soft bg + number. Title 14/600, meta "Video · 14 min" 12 muted. Current row bg primary-tint. Rows link to the lesson screen by type.

**Nav (web)** — white, bottom 1px line, height 68, padding 0 40, gap 32: logo · links Home / Favorites / History (14/600, active primary, others muted; Favorites/History → Profile) · spacer · search field (320 px, bg page, 1px line, radius 10, Enter → Search) · avatar 38 circle accent with initials (ring `0 0 0 2px #fff, 0 0 0 4px primary` on Profile).
**Tab bar (mobile)** — white, top 1px line, height 84 (incl. home indicator), 3 equal tabs with 22 px stroke icons + 11/600 label; active primary, inactive muted.

**StatusBlock** — one component for loading/error/not-found on every data screen:
- Loading: skeleton matching the screen (cards grid / rows / detail) in line + line-soft, pulsing; `aria-busy`.
- Error: card with 56 px danger-tint icon tile, "Couldn't load content", "Check your internet connection and try again. Your progress is saved.", **Try again** (primary) + **Back to Home** (secondary), mono caption `ERR_NETWORK · GET /api/courses`.
- Not found: same card, neutral icon, "Course not found" / "Category not found", "The link may be broken, or this item is no longer available.", Back to Home.

**Toast** — ink bg, white 14/600, radius 12, padding 10/10/10/16, shadow toast; action "Undo" accent 700. Web bottom-left 24 px; mobile centered 100 px from bottom (above tab bar). "Saved to favorites" / "Removed from favorites". Auto-dismiss 3.5 s.

**Dialog / sheet (Log out)** — scrim ink 45%. Web: centered 400 max, radius 16, padding 24, title 20/800 "Log out of SkillLearn?", body 14 muted "Your progress and favorites stay saved to your account. You'll need to log in again to keep learning.", actions right: Cancel (secondary) + Log out (destructive). Mobile: bottom sheet radius 20 top, grab handle 40×4, full-width stacked buttons (Log out, Cancel). Click scrim / Cancel closes.

**Code block** — ink bg radius 12; header 36 px (label "JSX" mono 10.5 subtle-on-dark `#B9C4C1`, "Copy" → "Copied"); body padding 14×18, mono 14/1.7, token colors above. Editor variant has 20 px right-aligned line numbers. **Inline code**: mono .88em, accent-tint bg, accent-ink text, 1px accent-border, radius 6, padding 1×6.

**Empty state** — white, 1px **dashed** line-dashed, radius 12–16, centered: 48–56 px icon tile, title 16–20/700, one-line help 13–14 muted, one action.

---

## Screens
IDs match `screens.json`, Figma frame names and the master canvas. Web (W) and mobile (M) share copy and behaviour unless noted.

### W01 / M01 — Login
- **Web**: 2-column grid `minmax(380px,520px) 1fr`, min-height 100vh. Left panel primary, padding 48, space-between: logo (white variant) · "Learn a new skill, one step at a time." (display) + 3 accent-dot bullets (15, on-dark): "Articles and video tutorials", "Quizzes and hands-on practice", "Save favorites, track your history" · "© 2026 SkillLearn". Right: centered form max 400, gap 18.
- **Mobile**: white, back arrow (→ Splash), title block, fields, "Forgot password?" right-aligned, spacer, button pinned near bottom, "New here? Create an account".
- Copy: "Welcome back" / "Log in to continue learning." Fields Email, Password (+ "Forgot password?" link in label row on web). Button "Log in". Footer "New to SkillLearn? **Create an account**".
- Validation (client, on submit): email required / "Enter a valid email, e.g. name@student.ac.id."; password required / "Password must be at least 8 characters."
- Server states: 401 → banner "Email or password is incorrect. Check both and try again." · 429 → "Too many attempts. Try again in 15 minutes." · session expired (redirect with `?expired`) → info banner "Your session expired. Log in again to continue where you left off."
- Success → Home.

### W02 / M02 — Register
- Same shell as Login (web left panel: "Practical skills, outside the classroom." + 4 category pills).
- Fields: Full name, Email, Password + Confirm password (side-by-side on web), password strength meter (3 bars 28×4: weak danger / good accent / strong primary + hint text), Terms checkbox (18–22 px, primary when checked).
- Validation: name ≥ 2 · valid email · password ≥ 8 with a digit · confirm matches ("Passwords don't match.") · terms accepted ("Accept the Terms to continue.").
- Submit → busy → **always** "Check your inbox" panel (mail icon tile, "We sent a verification link to {email}. Open it to activate your account, then log in.", "Go to log in"). Same response for already-registered emails (no user enumeration — the API emails the owner instead).

### W03 / M03 — Forgot Password
- Web: centered card max 440 on page bg with logo above. Mobile: full screen, back → Login.
- "Reset your password" / "Enter the email you registered with. We'll send a link to set a new password." → "Send reset link".
- Sent state: "Check your inbox" — "If an account exists for {email}, a reset link is on its way. The link expires in 30 minutes." Resend button with 30 s cooldown ("Resend available in 12s"). "← Back to log in".

### M00 — Splash (mobile only)
Full primary background: white logo 64, "Practical skills, outside the classroom." (36/800), subline, 4 category pills, spacer, **Create account** (white button, primary text) · **Log in** (outline white 50%) · "An account is required to access all materials."

### W04 / M04 — Home
- Greeting "Good morning, {firstName}" + sub "You have 2 courses in progress. Keep your streak going."
- **Returning user**: Continue card (primary bg, radius 16, padding 22/18): eyebrow "CONTINUE LEARNING", course title 18/700, "Next: Lesson 3 · Components & props (14 min)", 6 px progress (accent on white 20%) + "64%", "Resume" (white button).
- **New user**: Get-started card (accent-tint + accent-border): "GET STARTED", "Start your first course", "React Fundamentals is a good first pick: 12 short lessons for beginners.", "Start course". Sub copy "Your account is ready. Pick a course to get started."
- Categories: web 4 tiles (white, radius 14, 44 px striped tint swatch, name 15/700, "2 courses"); mobile 2×2 grid. → Category.
- "Popular courses" + "See all" (→ Search): web card grid, mobile rows. Bookmark toggles favorite + toast.
- States: loading skeleton, error.

### W05 / M05 — Search
- Title "Search"; 56 px (mobile 52) field with 2px primary border, search icon, Clear button when not empty. Placeholder "Try “React”, “SEO” or “Figma”".
- Type filter chips: All · Video · Article · Quiz · Practice (selected = ink bg, white text). Result count "8 courses".
- Live filtering (debounce 250 ms → `GET /courses?q=&type=`). Matches title, category, description, author.
- **No results**: dashed empty state "No results for “{q}”" / "Check the spelling, try a shorter keyword, or browse a category." + 4 category chips.

### W06 / M06 — Category
- Hero band in category tint with 135° stripes: breadcrumb "Home / Categories", name 38/800 (mobile 30) in category ink, description, "2 courses".
- Course cards (with description), then "Other categories" chips.
- Not found for unknown id.

### W07 / M07 — Course Detail
- Web: breadcrumb Home / {Category} / {Title}; grid `1fr 360px`, gap 28. Left: 16:9 video (ink, centered 72 play button; play/pause toggles; progress 4 px accent; "NOW PLAYING · LESSON 3 — COMPONENTS & PROPS"), eyebrow "{CATEGORY} · {LEVEL}", title 30/800, "by {author}", actions **Save/Saved** (secondary w/ bookmark) + **Continue lesson 3** / **Start course**; 4 fact tiles (Lessons, Duration, Level, Rating); "About this course". Right: sticky "Course content" panel with progress bar + lesson rows.
- Mobile: video 16:10 under dark status area, back button; title block + bookmark 44 square; tabs Lessons / About; sticky bottom CTA 54.
- States: in progress, not started (progress 0), loading, error, not found.

### W08 / M08 — Lesson: Article
- Web: article card (padding 44×56) + sticky lesson sidebar. Eyebrow "LESSON 2 · ARTICLE · 6 MIN READ", title 34/800, author line, Save button; paragraphs max 680 px body-lg; H2 20/700; highlighted code block with Copy; numbered "Rules to remember" (mono 01–03 primary); tip box (primary-tint); footer prev (secondary) / "Next: Components & props →" (primary).
- Mobile: sticky header (back · "Lesson 2 of 12" · bookmark), same content stacked, sticky bottom bar (prev square + next).
- Markdown content rendered with sanitization (see security doc).

### W09 / M09 — Lesson: Quiz
- Header: "✕ Exit quiz", centered title "Quiz: Components & props" / "React Fundamentals · Lesson 5", step "1 / 3". 4 px progress bar under header (mobile: inline 6 px bar).
- Body max 720: "QUESTION 1 OF 3", question 26/700 (mobile 21), 4 option buttons (min-height 60/56, radius 12, 2px border; key tile A–D 30 px). Code options use mono.
- On select: correct option → primary-tint + primary border + white-on-primary key; wrong pick → danger-tint + danger border. Feedback banner "Correct. …" / "Not quite. …" with explanation. "Next question" disabled (bg `#9FB5B0`) until answered; last → "See results".
- Results: "QUIZ COMPLETE", score 56/800 primary "2/3 correct", verdict, per-question review rows (✓/✕ dots), "Retry quiz" + "Next: Practice →".
- Production: answers scored server-side (`POST /quizzes/:id/attempts`); correct answers never sent before submit.

### W10 / M10 — Lesson: Practice
- Web: header (back · title · "Submit practice"); grid `400px 1fr`. Left: eyebrow "PRACTICE · ~30 MIN", instructions with inline code, "Tasks · 2 of 4 done" checklist (toggle), optional hint box (accent-tint), "Show hint". Right: dark editor (tab "App.jsx", "▶ Run code" accent) with line numbers + preview panel (input + Add + list; "2 of 4 checks passed").
- Mobile: segmented Tasks / Code / Preview; Run switches to Preview; sticky "Submit practice".
- Submit: all tasks done → success banner (primary) "Practice submitted. React Fundamentals lesson 6 is complete." else info "Finish all 4 tasks before submitting."

### W11 / M11 — Profile
- Header card: avatar 84 (mobile 64) initials, name 24/800, "{email} · Joined {Month YYYY}", 3 stat tiles (In progress · Completed · Quiz average), Edit profile, Log out (danger text).
- Web: 2 columns Favorites (thumb 72×56, title, "category · meta", remove bookmark) and Learning history (mono type tag in primary-tint, lesson title, course title, relative time). Mobile: segmented Favorites / History.
- Empty: "No favorites yet" / "Tap the bookmark on any course to keep it here for later." + Browse courses · "No learning history yet" / "Lessons you open will appear here, newest first." + Start a course. New users see both empty and stats 0 / 0 / –.
- Log out → confirmation dialog (web) / bottom sheet (mobile) → Login (web) / Splash (mobile).

### W12 / M12 — Edit Profile
- Web: max 760 form. Mobile: header Cancel · "Edit profile" · Save.
- Avatar with initials (live from name) + Upload photo / Remove; Full name, Email, Short bio (textarea, counter "42/160", max 160), Interests (4 toggle chips, selected = primary-tint + primary border), Change password (current + new).
- Validation per field; Save → busy → success banner "Profile updated." → back to Profile after ~1 s.

---

## Interactions & behaviour
- **Auth guard**: every screen except Splash/Login/Register/Forgot requires a valid access token; on 401 the client calls `/auth/refresh` once and retries; if refresh fails → Login with session-expired banner.
- **Favorites**: optimistic toggle on every card, detail and article; toast with Undo; `PUT/DELETE /me/favorites/:courseId`.
- **History**: `POST /me/history` when a lesson opens; Profile shows newest first.
- **Hover (web)**: primary → primary-hover; secondary → page bg + control border; course card lift; category tile border primary + tile shadow; list rows → page bg; chips border/text primary. **Pressed (mobile)**: opacity .7 (primary buttons → primary-hover).
- **Focus**: visible 2px outline in primary on all interactive elements; inputs use `outline-color: primary`.
- **Loading** on first fetch of each data screen (skeleton), buttons busy while submitting, never double-submit.
- **Responsive (web)**: grids use auto-fill; below ~900 px collapse two-column layouts (detail sidebar under content, auth panel hidden or stacked).
- **Accessibility**: text contrast ≥ 4.5:1 (subtle `#8A9693` only for placeholders/captions), labels on all inputs, `aria-invalid` + message on errors, `role="alert"` on error banners, `role="status"` on toasts, dialog `aria-modal` + focus trap, 44 px touch targets.

## State management (suggested)
- `auth`: `{ user, accessToken (memory), status: 'unknown'|'authed'|'guest' }`; refresh token in httpOnly cookie (web) / `expo-secure-store` (mobile). Never in localStorage/AsyncStorage.
- Server state with React Query/TanStack Query (web + RN): `courses(q,type,category)`, `course(slug)`, `quiz(id)`, `me`, `favorites`, `history`. Each query maps to StatusBlock states: `isLoading` → skeleton, `isError` → error + `refetch`, 404 → not found.
- Local UI state: form values + per-field errors + busy; quiz `{ index, selected, answers[] }`; practice `{ tasksDone[], ran, tab }`; profile segment; dialog open.

## Backend & security
Implement exactly as specified in `design/SkillLearn Architecture and Security.dc.html` and `api/openapi.yaml`: argon2id, PASETO v4.public 15 min + rotating refresh tokens with reuse detection, generic auth responses (no user enumeration), Mongo-backed rate limits, owner-scoped queries (no IDOR), zod `.strict()` validation + Mongoose `sanitizeFilter`, helmet + CSP/HSTS/X-Frame-Options via `vercel.json`, CORS allowlist. The doc's section 6 lists the security tests to screenshot for the assignment.

**Suggested repo layout**
```
skilllearn/
  web/      React + Vite (tokens.css, React Router, TanStack Query)
  mobile/   Expo + React Navigation (theme.ts, expo-secure-store)
  server/   Express + Mongoose (src/routes, src/auth, src/models, src/middleware)
  docs/     this handoff + assignment report
```
**Free hosting**: web on Vercel (or Cloudflare Pages / Firebase Hosting), API on Render free, DB MongoDB Atlas M0, email Resend free, mobile via Expo Go QR / EAS APK.

## Assets
- Logo: inline SVG (see Shared components). No other image assets.
- Icons: simple 24-grid stroke icons drawn inline (home, search, user, bookmark, play, mail, clock, alert). Swap for a library such as Lucide (`home`, `search`, `user`, `bookmark`, `play`, `mail`, `clock`, `alert-triangle`) at stroke 2.
- Thumbnails / video: placeholders. Use real course images (16:9, ≥ 640 px) and YouTube unlisted embeds via `youtube-nocookie.com`.
- Fonts: Google Fonts — Plus Jakarta Sans, JetBrains Mono (OFL).

## Known gaps / decisions for the developer
- Article, Quiz and Practice content in the prototype is always React Fundamentals; real content comes from the API per course.
- "Forgot password" reset page (the link target, set new password) and "verify email" landing page are not drawn — reuse the Forgot Password card layout with a password field / success message.
- Admin course management is API-only (no UI in scope).
