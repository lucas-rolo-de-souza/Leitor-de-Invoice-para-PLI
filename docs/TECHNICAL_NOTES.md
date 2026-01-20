# Technical Notes & Implementation Details

This document acts as the "Engine Room Manual" for the project. It details the specific low-level strategies, workarounds, and algorithms that power the architecture described in `ARCHITECTURE.md`.

---

## 1. ⚡ AI Engine & Prompt Engineering

### 1.1 The "Context Window" Problem

Financial documents are token-heavy. A 20-page invoice can easily exceed 30k tokens.

- **Strategy**: **Intelligent Pagination**. We do not send the entire PDF to Gemini at once if it exceeds 10 pages. We convert pages to `WebP` (70% quality) and stitch them vertically.
- **Prompting Secret**: We effectively "force" the AI to think it's a CLI tool.
  - _Bad Prompt_: "Please extract the line items."
  - _Our Prompt_: "You are a JSON Parser. Output ONLY raw JSON matching this TypeScript interface. Do not explain. Do not use code fences."

### 1.2 Robust JSON Repair (The "Closing Brace" Hack)

LLMs often cut off mid-stream when running out of output tokens. A standard `JSON.parse()` would crash.

- **Implementation**: `json-repair` library + Custom heuristic.
- **Algorithm**:
  1.  If `JSON.parse` fails, we check the last character.
  2.  If it's a comma `,`, remove it.
  3.  Count open brackets `[` and braces `{`.
  4.  Append the missing closing characters `]}` in reverse order.
  5.  Attempt parse again. This saves ~15% of "failed" extractions.

---

## 2. 🏗 Frontend Patterns (React 19)

### 2.1 The "No-UseEffect-For-State" Rule

We strictly avoid `useEffect` for syncing local state, as it causes double-renders and race conditions.

- **Pattern**: **Derivation during Render**.
  - _Anti-Pattern_: `useEffect(() => setTotal(qty * price), [qty, price])`
  - _Our Pattern_: `const total = qty * price;` (Calculated directly in the component body or memoized).
- **Why**: This guarantees that the UI never displays a "stale" frame where the Quantity is updated but the Total hasn't caught up.

### 2.2 SWR (Stale-While-Revalidate) for NCMs

The NCM database (10k+ items) is too big for a bundle but too static to fetch every time.

- **Implementation**:
  1.  **First Load**: Serve from `IndexedDB` (Speed: 50ms).
  2.  **Background**: Fetch `ncm_latest.json.mb5` (Hash check).
  3.  **Update**: If hash differs, download new file -> Notify User -> Swap DB in background.

---

## 3. 🛡 Compliance Logic Internals

### 3.1 The "Art. 557" Regex Beast

Customs regulations require extremely specific formatting for the NCM description.

- **Regex**: `/^(\d{4})\.(\d{2})\.(\d{2})$/`
- **Validation**: We don't just regex check. We do a **Lookup Verification**.
  - The user might type `1234.56.78` (Valid Format).
  - But if `1234.56.78` isn't in our `Siscomex` database, it's flagged as **"NCM Inexistente"** (Non-existent NCM). This prevents the user from submitting a typo that would cause a fine.

---

## 4. 🌍 Localization & Units

### 4.1 The "Floating Point" Hazard

JavaScript's `0.1 + 0.2 !== 0.3` is a killer in financial apps.

- **Solution**: **Integer Math**.
  - All prices are stored as `BigInt` (pennies) or handled via `Decimal.js` libraries for multiplication.
  - We _display_ floats (`10.00`) but _process_ integers (`1000`) whenever possible to avoid rounding drift on invoices totaling millions of dollars.

---

## 5. 📱 Browser Capabilities & Limits

### 5.1 System File Access (PWA)

We use the modern **File System Access API** to allow "Save" to overwrite the original file if granted permission.

- **Gotcha**: This only works on Chrome/Edge (Desktop).
- **Fallback**: On Firefox/Safari/Mobile, we transparently fall back to `<a download>` (Legacy Download), creating a new file copy (e.g., `Invoice (1).xlsx`).

### 5.2 Mobile Zoom Prevention

iOS Safari zooms in if an input font size is less than 16px.

- **Fix**: We use `text-base` (16px) for inputs on mobile, but scale down the UI container `transform: scale(0.95)` to keep density high without triggering the OS zoom.

---

## 6. 🐞 Debugging Tools

### 6.1 The "Time Travel" Logger

The `LogViewer` component isn't just `console.log`. It's a circular buffer implemented in memory.

- **Feature**: It captures the **Input Prompt** sent to Gemini.
- **Why**: When the AI hallucinates, developers can copy the _exact_ prompt from the Logs, paste it into AI Studio, and debug why the model failed. This provides "Replayability" for AI errors.
