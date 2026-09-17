# Invitación Digital Sebastián León Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a single static Next.js page that shows the wedding-style flyer for Sebastián León's baptism/birthday and turns its 3 visual CTAs (church Maps, reception Maps, WhatsApp confirmation) into real links.

**Architecture:** Static Next.js App Router page. The flyer is a single `next/image`; three absolutely-positioned, percentage-based `<a>` hotspots sit on top of it. No backend, no database, no analytics. Confirmation goes to a `wa.me` link instead of a form.

**Tech Stack:** Next.js (App Router) + TypeScript + Tailwind CSS, Vitest + React Testing Library for tests, `qrcode` for the post-deploy QR script, Vercel for hosting.

**Spec:** `docs/superpowers/specs/2026-09-16-invitacion-sebi-bautizo-design.md`

## Global Constraints

- Static site only: no backend, no database, no CMS, no admin panel, no analytics in v1 (spec §3, §11).
- `next/image` for the flyer must use fixed `width={779} height={2019}` (the real intrinsic size of the source asset), never `fill` (spec §5).
- Hotspots are real `<a>` elements positioned with `top`/`left`/`width`/`height` in **percentages**, never pixels (spec §5).
- Church Maps URL: `https://maps.app.goo.gl/YmkX9tMLW1qTpe8S7`
- Reception Maps URL: `https://maps.app.goo.gl/Ks5CrTZNgYBN41hj6`
- WhatsApp number: `50557253871` (already in `wa.me`-compatible international format, no `+`, no spaces).
- WhatsApp prefilled message (verbatim): `Hola soy {Tu_Nombre_Y_Acompañante} y ¡Sí, estaré presente! 🩵. Será un placer acompañarlos y compartir con ustedes ese día tan especial. 🕊️✨` — the `{Tu_Nombre_Y_Acompañante}` placeholder is intentional; encode with `encodeURIComponent`, never hand-encode (spec §6).
- All 3 links use `target="_blank" rel="noopener noreferrer"` (spec §6, §15 of the original plan).
- Flyer source asset is `assets/flyer_2x.png` (779×2019px), converted to `public/flyer.webp` — the original 1x jpeg is not used (spec §9).
- QR generation script lives at `scripts/generate-qr.mjs` and is committed; the PNG it produces is a disposable output, never committed (spec §10).
- Repo: `git@github.com:martinlariosdev/sebi-bautizo.git`, deploy target: Vercel (spec §2 decisions table).

---

### Task 1: Scaffold the Next.js project

**Files:**
- Create (via `create-next-app`, merged into the existing repo): `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `.eslintrc.json` (or `eslint.config.mjs`), `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `public/*` (default assets), `.gitignore`, `next-env.d.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a working Next.js App Router project skeleton that `npm run build` and `npm run dev` can run. Later tasks add `components/`, `lib/`, `scripts/` on top of this.

- [ ] **Step 1: Scaffold into a temp directory**

Run from `/Users/martinlarios/work/personal`:

```bash
npx --yes create-next-app@latest _scaffold_tmp \
  --typescript --tailwind --eslint --app \
  --src-dir=false --import-alias "@/*" --use-npm
```

- [ ] **Step 2: Merge the scaffold into the existing repo, keeping `docs/`, `assets/`, `.git`**

```bash
cd /Users/martinlarios/work/personal
rsync -a --exclude='.git' _scaffold_tmp/ sebi-bautizo/
rm -rf _scaffold_tmp
```

- [ ] **Step 3: Verify it builds**

Run: `cd /Users/martinlarios/work/personal/sebi-bautizo && npm run build`
Expected: build finishes with `Compiled successfully`.

- [ ] **Step 4: Commit**

```bash
cd /Users/martinlarios/work/personal/sebi-bautizo
git add -A
git commit -m "Scaffold Next.js + TypeScript + Tailwind project"
```

---

### Task 2: Testing infrastructure + `lib/links.ts` (TDD)

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`, `lib/links.test.ts`, `lib/links.ts`
- Modify: `package.json` (add devDependencies + `"test"` script)

**Interfaces:**
- Consumes: the scaffold from Task 1 (`tsconfig.json` path alias `@/*`).
- Produces: `eventLinks: { churchMaps: string; receptionMaps: string; whatsappConfirm: string }` exported from `lib/links.ts` — Task 3's `EventFlyer` component imports this exact object and these exact keys. Also produces the `npm test` command (`vitest run`) that every later TDD task reuses.

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Add the `test` script to `package.json`**

In the `"scripts"` block, add:

```json
"test": "vitest run"
```

- [ ] **Step 5: Write the failing test — `lib/links.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { eventLinks } from "./links";

describe("eventLinks", () => {
  it("points churchMaps at the provided Google Maps link", () => {
    expect(eventLinks.churchMaps).toBe("https://maps.app.goo.gl/YmkX9tMLW1qTpe8S7");
  });

  it("points receptionMaps at the provided Google Maps link", () => {
    expect(eventLinks.receptionMaps).toBe("https://maps.app.goo.gl/Ks5CrTZNgYBN41hj6");
  });

  it("builds a wa.me URL with the correct number", () => {
    expect(eventLinks.whatsappConfirm.startsWith("https://wa.me/50557253871?text=")).toBe(true);
  });

  it("URL-encodes the prefilled WhatsApp message", () => {
    const url = new URL(eventLinks.whatsappConfirm);
    const text = url.searchParams.get("text");
    expect(text).toBe(
      "Hola soy {Tu_Nombre_Y_Acompañante} y ¡Sí, estaré presente! 🩵. Será un placer acompañarlos y compartir con ustedes ese día tan especial. 🕊️✨"
    );
  });
});
```

- [ ] **Step 6: Run the test, verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './links'` (or similar), because `lib/links.ts` doesn't exist yet.

- [ ] **Step 7: Implement `lib/links.ts`**

```ts
const WHATSAPP_NUMBER = "50557253871";
const WHATSAPP_MESSAGE =
  "Hola soy {Tu_Nombre_Y_Acompañante} y ¡Sí, estaré presente! 🩵. Será un placer acompañarlos y compartir con ustedes ese día tan especial. 🕊️✨";

export const eventLinks = {
  churchMaps: "https://maps.app.goo.gl/YmkX9tMLW1qTpe8S7",
  receptionMaps: "https://maps.app.goo.gl/Ks5CrTZNgYBN41hj6",
  whatsappConfirm: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`,
};
```

- [ ] **Step 8: Run the test, verify it passes**

Run: `npm test`
Expected: PASS — 4 tests green.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json vitest.config.ts vitest.setup.ts lib/links.ts lib/links.test.ts
git commit -m "Add Vitest test harness and centralized event links config"
```

---

### Task 3: `EventFlyer` component with 3 hotspots (TDD)

**Files:**
- Create: `components/EventFlyer.test.tsx`, `components/EventFlyer.tsx`

**Interfaces:**
- Consumes: `eventLinks` from `lib/links.ts` (Task 2).
- Produces: `EventFlyer` — a named export, zero-prop React component — consumed by `app/page.tsx` in Task 4. Renders one `<img>` (via `next/image`) and exactly 3 `<a role="link">` elements with the `aria-label`s listed below; Task 6 only ever edits the `top`/`left`/`width`/`height` values inside this file, not its exports or structure.

- [ ] **Step 1: Write the failing test — `components/EventFlyer.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EventFlyer } from "./EventFlyer";

describe("EventFlyer", () => {
  it("renders the flyer image with a descriptive alt", () => {
    render(<EventFlyer />);
    const image = screen.getByRole("img");
    expect(image.getAttribute("alt")).toContain("bautizo y cumpleaños de Sebastián León");
  });

  it("renders a link to the church Maps location", () => {
    render(<EventFlyer />);
    const link = screen.getByRole("link", { name: "Ver ubicación de la iglesia en Google Maps" });
    expect(link).toHaveAttribute("href", "https://maps.app.goo.gl/YmkX9tMLW1qTpe8S7");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders a link to the reception Maps location", () => {
    render(<EventFlyer />);
    const link = screen.getByRole("link", { name: "Ver ubicación de la recepción en Google Maps" });
    expect(link).toHaveAttribute("href", "https://maps.app.goo.gl/Ks5CrTZNgYBN41hj6");
  });

  it("renders a WhatsApp confirmation link", () => {
    render(<EventFlyer />);
    const link = screen.getByRole("link", { name: "Confirmar asistencia por WhatsApp" });
    expect(link.getAttribute("href")).toContain("https://wa.me/50557253871?text=");
  });

  it("renders exactly 3 hotspot links", () => {
    render(<EventFlyer />);
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './EventFlyer'`.

- [ ] **Step 3: Implement `components/EventFlyer.tsx`**

Coordinates below are a first-pass visual estimate from the flyer image — Task 6 recalibrates them against a real screenshot before this ships.

```tsx
import Image from "next/image";
import { eventLinks } from "@/lib/links";

type Hotspot = {
  href: string;
  ariaLabel: string;
  top: string;
  left: string;
  width: string;
  height: string;
};

const hotspots: Hotspot[] = [
  {
    href: eventLinks.churchMaps,
    ariaLabel: "Ver ubicación de la iglesia en Google Maps",
    top: "61%",
    left: "18%",
    width: "22%",
    height: "2.3%",
  },
  {
    href: eventLinks.receptionMaps,
    ariaLabel: "Ver ubicación de la recepción en Google Maps",
    top: "61%",
    left: "59%",
    width: "22%",
    height: "2.3%",
  },
  {
    href: eventLinks.whatsappConfirm,
    ariaLabel: "Confirmar asistencia por WhatsApp",
    top: "80%",
    left: "20%",
    width: "60%",
    height: "2.5%",
  },
];

export function EventFlyer() {
  return (
    <div className="relative w-full max-w-[618px] mx-auto">
      <Image
        src="/flyer.webp"
        alt="Invitación al bautizo y cumpleaños de Sebastián León. Sábado 5 de diciembre de 2026. Ceremonia religiosa en Parroquia San Antonio a las 3:00 pm. Recepción en Casa club Residencial Camino verde. Dress code: cóctel jardín, evitar blanco."
        width={779}
        height={2019}
        preload
        className="block w-full h-auto"
      />
      {hotspots.map((hotspot) => (
        <a
          key={hotspot.ariaLabel}
          href={hotspot.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={hotspot.ariaLabel}
          className="absolute rounded-full transition hover:bg-white/10 active:bg-white/20"
          style={{
            top: hotspot.top,
            left: hotspot.left,
            width: hotspot.width,
            height: hotspot.height,
          }}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `npm test`
Expected: PASS — 5 tests green (9 total including Task 2's).

- [ ] **Step 5: Commit**

```bash
git add components/EventFlyer.tsx components/EventFlyer.test.tsx
git commit -m "Add EventFlyer component with 3 hotspot links"
```

---

### Task 4: Wire up `app/page.tsx` and `app/layout.tsx` metadata

**Files:**
- Modify: `app/layout.tsx`, `app/page.tsx`

**Interfaces:**
- Consumes: `EventFlyer` from `components/EventFlyer.tsx` (Task 3).
- Produces: the rendered page at `/`. No new exports for later tasks to consume.

No dedicated test file for this task: both files are declarative composition (metadata object, one component call) with no branching logic to unit test. Verified instead by a successful `next build` and the manual QA pass in Task 8.

- [ ] **Step 1: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bautizo y Cumpleaños de Sebastián León",
  description:
    "Invitación al bautizo y cumpleaños de Sebastián León. Sábado 5 de diciembre de 2026.",
  openGraph: {
    title: "Bautizo y Cumpleaños de Sebastián León",
    description:
      "Invitación al bautizo y cumpleaños de Sebastián León. Sábado 5 de diciembre de 2026.",
    images: ["/flyer.webp"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#f2efe9]">{children}</body>
    </html>
  );
}
```

(Keep whatever `import "./globals.css"` path Task 1's scaffold actually generated — adjust only if it differs from the line above.)

- [ ] **Step 2: Replace `app/page.tsx`**

```tsx
import { EventFlyer } from "@/components/EventFlyer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f2efe9] py-8 px-4">
      <EventFlyer />
    </main>
  );
}
```

- [ ] **Step 3: Run the full test suite (regression check)**

Run: `npm test`
Expected: PASS — still 9 tests green (this task adds no new tests).

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: `Compiled successfully`.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/page.tsx
git commit -m "Wire EventFlyer into the home page with SEO metadata"
```

---

### Task 5: Convert the flyer to WebP

**Files:**
- Create: `public/flyer.webp`

**Interfaces:**
- Consumes: `assets/flyer_2x.png` (already committed, 779×2019px).
- Produces: `public/flyer.webp` at the same 779×2019px, referenced by `components/EventFlyer.tsx` (already written in Task 3) and `app/layout.tsx`'s OG image (Task 4).

- [ ] **Step 1: Convert with `cwebp`**

```bash
cwebp -q 90 assets/flyer_2x.png -o public/flyer.webp
```

- [ ] **Step 2: Verify dimensions match the source (779×2019)**

Run: `sips -g pixelWidth -g pixelHeight public/flyer.webp`
Expected: `pixelWidth: 779` and `pixelHeight: 2019`.

- [ ] **Step 3: Visually confirm in the browser**

Run: `npm run dev` (leave running), open `http://localhost:3000` and confirm the flyer renders with the 3 (currently misaligned-by-estimate) hotspots on top of it. Stop the dev server after checking.

- [ ] **Step 4: Commit**

```bash
git add public/flyer.webp
git commit -m "Add WebP flyer asset converted from the 2x source"
```

---

### Task 6: Calibrate the hotspot coordinates against the real flyer

**Files:**
- Modify: `components/EventFlyer.tsx` (only the `top`/`left`/`width`/`height` values in the `hotspots` array)

**Interfaces:**
- Consumes: `public/flyer.webp` (Task 5), the running dev server.
- Produces: final, visually-verified percentage coordinates for the 3 hotspots. Nothing downstream depends on the exact values, only on the fact that they align with the image.

Task 3's estimated percentages were read off the flyer image by eye and are very likely slightly off. This task fixes that with a real rendered comparison instead of guessing further.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` (background/detached so subsequent steps can run).

- [ ] **Step 2: Make the hotspots visible temporarily**

In `components/EventFlyer.tsx`, temporarily change the hotspot `className` from
`"absolute rounded-full transition hover:bg-white/10 active:bg-white/20"`
to
`"absolute rounded-full bg-red-500/40 border-2 border-red-600"`
so the boxes are visible without hovering.

- [ ] **Step 3: Screenshot the running page**

Open `http://localhost:3000` (e.g. via the `claude-in-chrome` or `run` skill) and take a full-page screenshot at a mobile viewport width (390px) and at desktop width (768px+).

- [ ] **Step 4: Compare and adjust**

For each of the 3 red boxes, compare its position against the actual "VER EN MAPS" / "CONFIRMAR ASISTENCIA" pill buttons underneath. Adjust the `top`/`left`/`width`/`height` percentages in `components/EventFlyer.tsx` so each red box fully covers its button with minimal overhang. Re-screenshot after each adjustment.

- [ ] **Step 5: Repeat Step 4 until all 3 boxes are aligned at both viewport widths tested in Step 3.**

- [ ] **Step 6: Revert the debug styling**

Change the `className` back to
`"absolute rounded-full transition hover:bg-white/10 active:bg-white/20"`.

- [ ] **Step 7: Run the test suite (regression check)**

Run: `npm test`
Expected: PASS — coordinate changes don't touch href/aria-label/role assertions, so all 9 tests stay green.

- [ ] **Step 8: Stop the dev server.**

- [ ] **Step 9: Commit**

```bash
git add components/EventFlyer.tsx
git commit -m "Calibrate hotspot coordinates against the rendered flyer"
```

---

### Task 7: QR generation script (TDD)

**Files:**
- Create: `scripts/generate-qr.test.mjs`, `scripts/generate-qr.mjs`
- Modify: `package.json` (add `qrcode` devDependency), `.gitignore`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `generateQr(url: string, outputPath: string): Promise<void>`, exported from `scripts/generate-qr.mjs`, plus a CLI entrypoint (`node scripts/generate-qr.mjs <url> [output-path]`) used in Task 10.

- [ ] **Step 1: Install `qrcode`**

```bash
npm install -D qrcode
```

- [ ] **Step 2: Add a gitignore rule for generated QR PNGs**

Append to `.gitignore`:

```
*-qr.png
```

- [ ] **Step 3: Write the failing test — `scripts/generate-qr.test.mjs`**

```js
import { describe, it, expect, afterEach } from "vitest";
import { existsSync, statSync, rmSync } from "node:fs";
import { generateQr } from "./generate-qr.mjs";

const outputPath = "./test-qr.png";

describe("generateQr", () => {
  afterEach(() => {
    if (existsSync(outputPath)) rmSync(outputPath);
  });

  it("writes a non-empty PNG file for a given URL", async () => {
    await generateQr("https://sebi-bautizo.vercel.app", outputPath);
    expect(existsSync(outputPath)).toBe(true);
    expect(statSync(outputPath).size).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 4: Run the test, verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './generate-qr.mjs'`.

- [ ] **Step 5: Implement `scripts/generate-qr.mjs`**

```js
#!/usr/bin/env node
import QRCode from "qrcode";

export async function generateQr(url, outputPath) {
  await QRCode.toFile(outputPath, url, {
    width: 1024,
    margin: 2,
  });
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;

if (isMain) {
  const url = process.argv[2];
  const outputPath = process.argv[3] ?? "qr.png";

  if (!url) {
    console.error("Usage: node scripts/generate-qr.mjs <url> [output-path]");
    process.exit(1);
  }

  await generateQr(url, outputPath);
  console.log(`QR code for ${url} written to ${outputPath}`);
}
```

- [ ] **Step 6: Run the test, verify it passes**

Run: `npm test`
Expected: PASS — 10 tests green.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json .gitignore scripts/generate-qr.mjs scripts/generate-qr.test.mjs
git commit -m "Add QR generation script for the post-deploy production URL"
```

---

### Task 8: Manual cross-browser/device QA pass

**Files:** none (verification-only task, per spec §8).

**Interfaces:**
- Consumes: the finished page from Tasks 1–7.
- Produces: a pass/fail note reported back in this session; no code artifact.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`.

- [ ] **Step 2: Mobile viewport check**

Using the `claude-in-chrome` (or `run`) skill, emulate a 390×844 (iPhone-sized) viewport, load `http://localhost:3000`, and tap/click each of the 3 hotspots. Confirm each opens the correct destination (2 Maps links, 1 WhatsApp link with the prefilled message visible).

- [ ] **Step 3: Desktop viewport check**

Repeat at a 1440px-wide viewport. Confirm hotspots still align (percentages should hold) and links still work.

- [ ] **Step 4: Keyboard navigation check**

Tab through the page and confirm all 3 links receive visible focus and can be activated with Enter.

- [ ] **Step 5: Report results**

Summarize pass/fail for each check back to the user before moving to deployment. Fix and re-run any failing check before proceeding to Task 9.

- [ ] **Step 6: Stop the dev server.**

---

### Task 9: Push to GitHub and deploy to Vercel

**Files:** none.

**Interfaces:**
- Consumes: the committed repo from Tasks 1–8.
- Produces: a live production URL, needed by Task 10.

This task pushes to a real GitHub remote and creates a public production deployment — both are visible, shared-state actions. **Stop and get explicit user confirmation before Step 1**, even though the rest of this plan runs inline.

- [ ] **Step 1: Confirm with the user that it's OK to push `main` and deploy to production.**

- [ ] **Step 2: Push to GitHub**

```bash
git push -u origin main
```

- [ ] **Step 3: Connect the repo to Vercel and deploy**

If the user has the Vercel CLI authenticated already, run:

```bash
npx vercel --prod
```

Otherwise, guide the user to import `martinlariosdev/sebi-bautizo` from the Vercel dashboard (New Project → Import Git Repository) and deploy — no project-specific config is needed since it's a stock Next.js app.

- [ ] **Step 4: Record the production URL** for use in Task 10.

- [ ] **Step 5: Verify the WhatsApp share preview**

Paste the production URL into any WhatsApp chat (not sent, or sent to yourself) and confirm the link preview shows the flyer image and the title/description from `app/layout.tsx`'s Open Graph metadata (spec §8). This only works against the real deployed URL, not `localhost`.

---

### Task 10: Generate the final QR code

**Files:**
- Create (locally, not committed — matches `*-qr.png` in `.gitignore` from Task 7): `sebi-bautizo-qr.png`

**Interfaces:**
- Consumes: `generateQr` from `scripts/generate-qr.mjs` (Task 7), the production URL from Task 9.
- Produces: a PNG file handed to the user; nothing else depends on it.

- [ ] **Step 1: Generate the QR**

```bash
node scripts/generate-qr.mjs "<production-url-from-task-9>" sebi-bautizo-qr.png
```

- [ ] **Step 2: Verify it scans**

Open `sebi-bautizo-qr.png` and confirm it's a valid, scannable QR pointing at the production URL (scan with a phone camera or a QR decoder).

- [ ] **Step 3: Hand the file to the user.**

No commit — this file is a disposable deliverable, not part of the repo (spec §10).
