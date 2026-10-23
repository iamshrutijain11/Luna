# LUNA — Paperwork, simplified.
## AI-Powered Personal Paperwork Assistant | Amazon Developer Hackathon 2026 — Alexa+ Track

LUNA is an advanced agentic paperwork assistant that transforms complex personal documents (warranties, purchase receipts, utility bills, insurance claims) into actionable, evidence-backed workflows.

---

### Complete Seven-Screen Application

1. **Screen 1 — Overview**:
   - Welcome banner with live time-based greeting (*"Good evening, Palak — Paperwork, simplified."*).
   - Metric summary cards: Documents (`12`), Pending Workflows (`3`), Important Dates (`5`), Actions Due Soon (`2`).
   - Document Upload Area: Frosted drop zone & file picker supporting PDF, JPG, PNG up to 20MB with real-time validation and progress feedback.
   - **Important Dates Section**: Structured date badges (`15 OCT`, `25 OCT`, `12 NOV`) with urgency tags and `+ Add important date` quick action.
   - **Recent Documents Section**: Categorized document list (`Invoice`, `Warranty`, `Bill`, `Insurance`) with file sizes and 3-dots context menu.
   - **Upcoming Actions Section**: Action checklist cards with category badges and workflow navigation.
   - **LUNA AI Assistant Entry Point**: Signature microphone control with silver ring and lavender halo, simulated Alexa+ badge, and suggested prompt chips.
   - **Vertical Process Guide**: Signature header accent bar (`Organize`, `Understand`, `Take Action →`).

2. **Screen 2 — My Documents**:
   - Comprehensive paperwork vault with Grid and List views.
   - Category filtering: Invoices, Warranties, Insurance, Bills, Health, Agreements, Statements.
   - Instant full-text search with highlighting and empty state handling.
   - Document cards with visual thumbnail sheets, metadata, and context menu.

3. **Screen 3 — Document Intelligence**:
   - Interactive two-panel inspection workspace.
   - Left panel: Multi-page document viewer (e.g. TechWorld Invoice #INV-2026-001) with pagination, zoom (75%–150%), and thumbnail strips.
   - Right panel: Tabbed intelligence workspace for **Analysis**, **Details**, **Citations**, and **Missing Information**.
   - Evidence grounding: Verifiable citations linking claims directly to document pages and quotes.

4. **Screen 4 — LUNA AI Assistant**:
   - Full conversational assistant with multi-turn memory.
   - Centerpiece microphone control with concentric silver rings, lavender halo glow, and animated voice waveforms.
   - Suggested query chips, speech synthesis support, and citation cards.

5. **Screen 5 — Workflows**:
   - Structured action center with status filter tabs (**All**, **Draft**, **Pending**, **Completed**, **Failed**).
   - Interactive workflow review modal with verified requirements checklists.
   - Human-in-the-loop: Explicit user approval confirmation and draft artifact downloading.

6. **Screen 6 — Activity**:
   - Chronological audit feed with date-range selector and category filters (**All**, **Documents**, **Workflows**, **Assistant**, **Actions**).
   - Relative and formatted timestamps with direct navigation to linked entities.

7. **Screen 7 — Settings**:
   - Two-column configuration suite covering Account Information (Palak Bhardwaj), Appearance (lunar theme and glassmorphism), Notifications, Alexa+ Language & Voice (speech rate, pitch), Privacy & Security (zero-knowledge local vault controls), and Help & Documentation.

---

### Design System & Visual Architecture

- **Moonlight Ivory Canvas**: Warm `#F4F0E8` base with oversized 45° diagonal geometric ribbons, pearl-white facets, and precision drafting lines.
- **Glassmorphic Dark Sidebar**: Floating cut-glass monolith on desktop (`#14141A` base) with translucent diagonal bands, specular architectural light rays, and glowing Halo Lavender navigation pill.
- **Frosted Pearl Cards**: Translucent white surfaces (`rgba(255, 255, 255, 0.85)` with `backdrop-filter: blur(16px)`), fine borders, and soft realistic shadows.
- **Accessibility & Motion**: High contrast, visible focus rings, keyboard navigable, and `@media (prefers-reduced-motion: reduce)` compliance.

---

### Tech Stack

- **Framework**: React 18 with Strict TypeScript
- **Styling**: Tailwind CSS 3.4 with custom lunar tokens
- **Bundler & Tooling**: Vite 5, PostCSS, Autoprefixer
- **Icons & Motion**: Lucide React, Framer Motion
- **Quality & Testing**: Vitest 2.1, ESLint 8.57, TypeScript 5.6

---

### Getting Started

#### Prerequisites
- Node.js 18+ (tested on Node v24.12.0)
- npm 9+ (tested on npm 11.6.2)

#### Installation
```bash
cd frontend
npm install
```

#### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration connects to the local FastAPI backend at `http://127.0.0.1:8000`.

#### Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173`.

#### Running Quality Checks
```bash
# Typecheck
npm run typecheck

# Lint
npm run lint

# Unit tests
npm run test

# Production build
npm run build
```
