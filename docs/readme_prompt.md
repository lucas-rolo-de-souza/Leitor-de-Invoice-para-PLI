# AI Blueprint Prompt

**Role:** World-Class Senior Frontend Engineer / AI Architect.

**Objective:** Maintain the code base of a sophisticated, production-ready web application named **"Leitor de Faturas AI" (Invoice Reader AI)** clean coded, bug free, secure, dynamically coded, modular and maintainable.

**Context:** This application automates the extraction, validation, and processing of International Trade documents (Commercial Invoices & Packing Lists) for Brazilian Customs Compliance (Art. 557 of the Brazilian Decree 6.759/2009). It uses **Google Gemini 2.5 Flash** for multimodal data extraction.

---

## 🛠 Tech Stack Specification

- **Core**: React 19 (Functional Components, Hooks), TypeScript, Vite/CRA.
- **Styling**: Tailwind CSS (Utility-first, responsive, `slate`/`brand-blue` palette).
- **Icons**: `lucide-react`.
- **AI SDK**: `@google/genai` (v1.30+).
- **Libraries**: `xlsx` (SheetJS), `jspdf`, `jspdf-autotable`.

---

## 📂 Architecture & File Structure

### 1. Type Definitions (`types.ts`)

Define a robust interface `InvoiceData` mapping fields required by Brazilian Decree 6.759/2009:

- **Identifiers**: `invoiceNumber`, `packingListNumber`, `date`, `dueDate`.
- **Entities**: `exporterName`, `exporterAddress`, `importerName`, `importerAddress`.
- **Logistics**: `incoterm`, `paymentTerms`, `countryOfOrigin`, `countryOfAcquisition`, `totalNetWeight`, `totalGrossWeight`, `totalVolumes`.
- **Financials**: `currency`, `subtotal`, `freight`, `insurance`, `grandTotal`.
- **LineItems**: Array of `{ description, partNumber, quantity, unitPrice, total, netWeight, ncm }`.

### 2. Services Layer

- **`services/geminiService.ts`**:
- Initialize `GoogleGenAI` with API Key.
- Implement `extractInvoiceData(files, modelId)`.
- **Crucial**: Use `responseSchema` (JSON Schema) to force structured output from Gemini.
- **Robust Parsing**: Implement a `safeJsonParse` utility with a repair strategy. If the LLM output is truncated (incomplete JSON), the service must attempt to append closing braces (`]}`, `}`) to salvage the valid data.
- Prompt strategy: "Zero Hallucination Policy. Return null for missing fields. Do not guess NCMs."
- **`services/exportService.ts`**:
- `exportToExcel`: Generate multi-tab .xlsx (Header, Items, Validation Errors).
- `exportToPDF`: Generate professional PDF layout using `jspdf-autotable`.

### 3. Business Logic (Hooks)

- **`hooks/useInvoiceForm.ts`**:
- **Stateless Pattern**: Must not use internal `useState`. It should function as a pure logic controller receiving `formData` via props.
- Implement `handleLineItemChange` with atomic calculation (`qty * price = total`).
- Logic Update: Treat empty strings as `0` during calculation to ensure totals update correctly when fields are cleared.
- **`hooks/useCompliance.ts`**:
- **The Brain of the App**. Validate data against rules:
  - `NetWeight <= GrossWeight`.
  - `NCM` must be exactly 8 digits (Regex/Length check).
  - Mandatory fields presence (Exporter, Importer, Currency).
  - Incoterms validity against a standard list.
- Return `fieldErrors` map and a `checklist` array for the UI.

### 4. UI Components

- **`components/FileUpload.tsx`**: Drag & drop zone, supports multiple files (PDF/Image/Excel).
- **`components/InvoiceEditor.tsx`**: The main orchestrator.
- **Sections**: Break down form into `HeaderSection`, `EntitiesSection`, `LogisticsSection`, `ItemsTable`, `FinancialSummary`.
- **Components**: Use `ValidatedInput` (custom wrapper with error highlighting and tooltips).
- **`components/ui/VersionBar.tsx`**: A button to toggle between:
- **Original**: Raw AI extraction (Read-only).
- **Saved**: User checkpoint.
- **Current**: Working draft.

---

## 🎨 UI/UX & Responsive Design Guidelines

- **Mobile-First**:
- Inputs must use `text-base` (16px) on mobile to prevent iOS zoom, scaling down to `text-sm` on desktop.
  - Use `grid-cols-1` on mobile, expanding to `grid-cols-4` on large screens.
  - Touch targets min 44px.
  - Is a desktop oriented application, but the ui must be mobile-friendly.
- **Visuals**:
- Background: `bg-slate-50`.
- Cards: White with `shadow-sm`, rounded-xl borders.
- Feedback: Red/Orange icons for errors, Green for compliance.
- Animation: Smooth transitions on hover/focus.

## 📝 Implementation Instructions

1. Set up the React root and imports.
2. Implement the `ncmValidator` utility (8-digit logic).
3. Build the `geminiService` with strict typing and JSON repair logic.
4. Construct the complex UI using the modular components described.
5. Ensure the "Compliance Widget" updates in real-time as the user edits the form.

**Output:** Generate the complete codebase based on this blueprint.
