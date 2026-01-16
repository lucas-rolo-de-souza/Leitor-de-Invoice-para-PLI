# Technical Notes & Implementation Details

This document covers specific implementation strategies, complex logic, and "gotchas" within the codebase.

## 1. NCM Database & Caching Strategy (`ncmService.ts`)

Handling the NCM database (Siscomex) requires a balance between freshness and availability.

- **Problem**: The official API is unreliable (CORS/Downtime) and the file is large (~3MB).
- **Strategy**: **Stale-While-Revalidate + Multi-Proxy**.
  1.  **Immediate Boot**: On startup, the service loads data from `Cache API` instantly (~50ms) to allow the app to function offline or with poor connection.
  2.  **Background Update**: It _always_ triggers a background fetch to check for updates.
  3.  **Robust Fetching**:
      - **Priority 1**: Direct Official API (`portalunico.siscomex.gov.br`).
      - **Priority 2**: **Multi-Proxy Chain**. Uses `corsproxy.io` and `allorigins.win` to bypass CORS while still aiming for the official file.
      - **Priority 3**: GitHub Mirror (Static Fallback).
  4.  **Parsing**: Strict JSON validation for the official `Nomenclaturas` structure.

## 2. AI Extraction Logic (`geminiService.ts`)

We do not use free-form text generation. We use **Structured Output** via `responseSchema`.

- **Null-Bias**: The system prompt is engineered to return `null` rather than hallucinating data.
- **Schema**: Defined using the `@google/genai` Type enum. This ensures strict typing for arrays (Line Items) and Enums (KG/LB).
- **Model Selection**:
  - Defaults to `gemini-2.5-flash-lite` for speed.
  - `thinkingBudget` is set to 0 to minimize latency for this specific transactional task.

## 3. Compliance Engine (`useCompliance.ts`)

Validation is decoupled from the UI. It is a pure logic hook.

- **Field Level**: Returns a `Record<string, string>` map of errors. If a field exists in this map, the UI input turns red.
- **Business Logic**:
  - **Weight**: `NetWeight` cannot be greater than `GrossWeight`.
  - **Dates**: `DueDate` cannot be before `IssueDate`.
  - **NCM**: Must pass Regex (`\d{8}`) AND exist in the `ncmService` database.
  - **Bypass**: The code `9999.99.99` is hardcoded as valid for generic items.

## 4. Currency Fallback (`currencyService.ts`)

The PTAX rate (Official BCB rate) is not published on weekends or holidays.

- **Algorithm**:
  1.  Attempt to fetch PTAX for `Today`.
  2.  If 404/Empty, decrement date by 1 day.
  3.  Repeat up to 5 times.
  4.  This ensures we always get the "Last Closing PTAX".

## 5. Mobile Optimization

- **Input Scaling**: All inputs use `text-base` (16px) on screens `<640px` to prevent iOS Safari from zooming in when the user taps an input.
- **Card View**: The `ItemsTable` switches from a standard HTML `<table>` (desktop) to a Flexbox Card layout (mobile) to avoid horizontal scrolling issues.

## 6. Excel Parsing (`fileService.ts`)

AI models struggle with raw `.xlsx` binary data.

- **Strategy**: We use `SheetJS` to convert all spreadsheet tabs into a single **CSV String**.
- **Prompting**: This CSV text is fed to the AI with a prompt: `[STRUCTURED DATA (CSV/EXCEL)]`. This yields significantly higher accuracy for tabular data than converting the Excel to an image.

## 7. SCUD Model & Extended Attributes

The "SCUD" industry model requires over 30 specific data points per line item (e.g., Regulatory Acts, Manufacturer Code, Detailed Product Attributes).

- **UI Challenge**: Displaying 30+ columns in a table is not viable for UX.
- **Solution**:
  1.  **Main Table**: Displays only the critical "Trade" fields (Part Number, NCM, Qty, Price).
  2.  **Detail Modal**: A focused overlay allowing editing of the "Extended" fields (Atos Legais, Attributes, Manufacturer Info).
- **Validation**: The `validators.ts` logic was updated to enforce these extended fields as mandatory, even if they are hidden behind the modal (the table row highlights red if missing).
- **Calculation**: Subtotals are now calculated locally to ensure that if a user edits Quantity or Price in the table, the financial summary updates immediately, guaranteeing mathematical consistency.

## 8. Weight Calculation & Unit Normalization

Dealing with international invoices involves mixed units (KG, LB, OZ, Grams).

- **Problem**: A naive sum of `10 (KG)` + `1000 (G)` results in `1010`, which is physically incorrect.
- **Strategy**:
  - **Normalization**: All line item weights are converted to **Kilograms** (KG) before summation.
    - `10 KG` -> `10.0`
    - `1000 G` -> `1.0`
  - **Summation**: The normalized values are added: `10.0 + 1.0 = 11.0 KG`.
  - **Display**: The final total is converted to the user's preferred **Global Unit** (e.g., if user selected "LB", the internal 11.0 KG is displayed as ~24.25 LB).
- **Helpers**: The `converters.ts` utility module was expanded with `normalizeToKg(val, unit)` and `convertFromKg(val, unit)` to centralize this logic.
- **Trigger**: The `useInvoiceForm` hook monitors `weightUnit` changes to trigger immediate re-calculation.

## 9. Error Display Strategy

- **Constraint**: The `ItemsTable` cells often clip lengthy validation messages due to `overflow: hidden` or tight spacing.
- **Solution**: We implemented an **Absolute Positioned Error Banner** (z-index 50) in `WeightInputCard`. Instead of pushing layout (reflow) or being hidden (clipped), the error message floats _above_ the surrounding elements, ensuring critical feedback is never missed by the user.
