
# Technical Notes & Implementation Details

This document covers specific implementation strategies, complex logic, and "gotchas" within the codebase.

## 1. NCM Database & Caching Strategy (`ncmService.ts`)

Handling the NCM (Nomenclatura Comum do Mercosul) database represents a challenge due to its size (~2MB JSON).

*   **Problem**: Storing 2MB in `localStorage` blocks the main thread during parsing (`JSON.parse`) and consumes ~40% of the standard 5MB quota.
*   **Solution**: **Cache API (`window.caches`)**.
    1.  The service fetches the JSON from the external API (Siscomex/GitHub).
    2.  It creates a `Blob` and stores it as a "Virtual Response" in the browser's Cache Storage.
    3.  On reload, it fetches the `Response` from Cache and converts it to a Map.
    4.  **Benefit**: Async loading, larger storage limits, and non-blocking main thread execution.

## 2. AI Extraction Logic (`geminiService.ts`)

We do not use free-form text generation. We use **Structured Output** via `responseSchema`.

*   **Null-Bias**: The system prompt is engineered to return `null` rather than hallucinating data.
*   **Schema**: Defined using the `@google/genai` Type enum. This ensures strict typing for arrays (Line Items) and Enums (KG/LB).
*   **Model Selection**:
    *   Defaults to `gemini-2.5-flash-lite` for speed.
    *   `thinkingBudget` is set to 0 to minimize latency for this specific transactional task.

## 3. Compliance Engine (`useCompliance.ts`)

Validation is decoupled from the UI. It is a pure logic hook.

*   **Field Level**: Returns a `Record<string, string>` map of errors. If a field exists in this map, the UI input turns red.
*   **Business Logic**:
    *   **Weight**: `NetWeight` cannot be greater than `GrossWeight`.
    *   **Dates**: `DueDate` cannot be before `IssueDate`.
    *   **NCM**: Must pass Regex (`\d{8}`) AND exist in the `ncmService` database.
    *   **Bypass**: The code `9999.99.99` is hardcoded as valid for generic items.

## 4. Currency Fallback (`currencyService.ts`)

The PTAX rate (Official BCB rate) is not published on weekends or holidays.

*   **Algorithm**:
    1.  Attempt to fetch PTAX for `Today`.
    2.  If 404/Empty, decrement date by 1 day.
    3.  Repeat up to 5 times.
    4.  This ensures we always get the "Last Closing PTAX".

## 5. Mobile Optimization

*   **Input Scaling**: All inputs use `text-base` (16px) on screens `<640px` to prevent iOS Safari from zooming in when the user taps an input.
*   **Card View**: The `ItemsTable` switches from a standard HTML `<table>` (desktop) to a Flexbox Card layout (mobile) to avoid horizontal scrolling issues.

## 6. Excel Parsing (`fileService.ts`)

AI models struggle with raw `.xlsx` binary data.
*   **Strategy**: We use `SheetJS` to convert all spreadsheet tabs into a single **CSV String**.
*   **Prompting**: This CSV text is fed to the AI with a prompt: `[STRUCTURED DATA (CSV/EXCEL)]`. This yields significantly higher accuracy for tabular data than converting the Excel to an image.

## 7. SCUD Model & Extended Attributes

The "SCUD" industry model requires over 30 specific data points per line item (e.g., Regulatory Acts, Manufacturer Code, Detailed Product Attributes).

*   **UI Challenge**: Displaying 30+ columns in a table is not viable for UX.
*   **Solution**: 
    1.  **Main Table**: Displays only the critical "Trade" fields (Part Number, NCM, Qty, Price).
    2.  **Detail Modal**: A focused overlay allowing editing of the "Extended" fields (Atos Legais, Attributes, Manufacturer Info).
*   **Validation**: The `validators.ts` logic was updated to enforce these extended fields as mandatory, even if they are hidden behind the modal (the table row highlights red if missing).
*   **Calculation**: Subtotals are now calculated locally to ensure that if a user edits Quantity or Price in the table, the financial summary updates immediately, guaranteeing mathematical consistency.
