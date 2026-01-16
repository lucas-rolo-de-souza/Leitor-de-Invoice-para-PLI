# System Architecture

## Overview

The **Invoice Reader AI** is a client-side Single Page Application (SPA) built with React 19 and TypeScript. It leverages a functional/modular architecture designed for maintainability, strict typing (using `type` aliases exclusively), and separation of concerns.

## 🏗 High-Level Design

```mermaid
graph TD
    User[User] -->|Uploads PDF/Image| FileUpload
    FileUpload -->|Base64| GeminiService
    GeminiService -->|Structured JSON| AppController
    AppController -->|Initial State| UseInvoiceForm

    subgraph "Core Logic (Hooks)"
        UseInvoiceForm[useInvoiceForm]
        UseCompliance[useCompliance]
        CalculatedTotals[Auto-Calculation]
    end

    UseInvoiceForm <-->|Sync| InvoiceEditor
    UseInvoiceForm -->|Data| UseCompliance
    UseCompliance -->|Errors/Checklist| InvoiceEditor

    subgraph "External Services"
        NCMService[NCM Service (Cache API)]
        CurrencyService[Currency Service (PTAX)]
        UsageService[Usage Monitor]
        LoggerService[Logger]
    end

    InvoiceEditor -->|Validation| NCMService
    AppController -->|Usage Stats| UsageService

    InvoiceEditor -->|Export| ExportService
    ExportService -->|XLSX/PDF| User
```

## 📂 Directory Structure

The project follows a feature-based and layered structure:

- **`docs/`**: Documentation including `ARCHITECTURE.md`, `CHANGELOG.md`, and the new **`DESIGN_SYSTEM.md`**.
- **`components/`**: Pure UI components.
  - `editor/`: specialized complex components (LogisticsSection, ItemsTable).
  - `ui/`: Reusable atomic elements (ValidatedInput, Autocomplete).
- **`hooks/`**: Business logic encapsulation.
  - `useInvoiceForm.ts`: Manages the complex state of the invoice and line items. **(Refactored: Stateless/Controlled)**.
  - `useCompliance.ts`: The "Rule Engine" that validates data against Customs regulations.
- **`services/`**: Integration with external APIs and browser capabilities.
  - `geminiService.ts`: AI interaction with **Robust JSON Repair**.
  - `ncmService.ts`: Handling of large NCM datasets via Cache API.
- **`utils/`**: Pure helper functions and constants.
  - `converters.ts`: **New** engine for unit normalization (KG, LB, G, OZ) and currency handling.
- **`types.ts`**: The single source of truth for the Data Model (`InvoiceData`).

## 🔄 Data Flow

1.  **Ingestion**: Files are converted to Base64 (Images/PDF) or parsed to CSV text (Excel).
2.  **Extraction**: `GeminiService` sends data to Google's API.
    - _New_: Includes a **Robust JSON Repair** mechanism. If the AI response is truncated (common with large token limits), the service uses a multi-pass strategy to artificially close the JSON structure, preserving valid data.
3.  **Normalization**: The raw JSON is cleaned (null-bias) and typed into `InvoiceData`.
4.  **State Management**:
    - The app maintains three copies of state for Version Control: `Original`, `Saved`, and `Current`.
    - `useInvoiceForm` is a **pure logic controller**. It does not hold internal state (useEffect/useState) to avoid race conditions.
    - **Local Calculation**: Financial totals (Subtotal) are calculated locally in real-time by summing line item values (`qty * price`). This ensures the UI always displays mathematically correct data, even if the AI hallucinated the total.
5.  **Validation**: `useCompliance` runs on every render/change, producing a `fieldErrors` map and a `checklist` array.

## 🧩 Key Components

### `App.tsx` (Controller)

Acts as the brain. It handles the API call, manages the high-level versioning state, and switches views (Upload vs. Editor).

### `InvoiceEditor.tsx` (Orchestrator)

Combines the form state and compliance state to render the specific sections. It ensures that validation errors are passed down to inputs.

### `ItemsTable.tsx` (Complex View)

Now includes a **Details Modal** to handle the extensive fields required by the SCUD model (Manufacturer Info, Regulatory Acts, Attributes) without cluttering the main table view.

### `NcmService` (Data Provider)

A singleton service that manages the 10,000+ record NCM database using a sophisticated browser caching strategy (Cache API).

### `LogViewer.tsx` (Debugging)

A real-time log visualization tool accessible via the UI. It hooks into the `LoggerService` to display validation errors, API calls, and system events with filtering capabilities.

## 🛡 Security & Privacy

- **Client-Side Processing**: Files are processed in memory.
- **API Key**: Injected via environment variables.
- **Persistence**: Data is only stored in RAM during the session (except for NCM cache and usage logs which are local).
