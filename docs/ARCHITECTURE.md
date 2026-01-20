# System Architecture

## 1. Overview

The **Invoice Reader AI para PLI** acts as a secure, ephemeral bridge between unstructured data (PDFs/Images) and structured compliance. It is architected as a **Local-First, Cloud-Enhanced PWA**.

- **Core Principle**: "Client is King". All heavy lifting (Validation, Calculation, Correction) happens in the user's browser.
- **Security Model**: "Trust No One". The backend (Supabase) assumes all client data is hostile until validated by RLS policies. The AI API keys are custodied by the client (BYOK).

---

## 2. 🏗 High-Level Design

The system follows a **Layered Hexagonal Architecture** (Ports & Adapters) adapted for the frontend. This ensures that the core domain logic (Invoice Processing) is isolated from the external world (UI, API, Database).

```mermaid
graph TD
    Client[Client Browser (PWA)]

    subgraph "Layer 1: Presentation (React)"
        UI[Components] <-->|Render| Store[State Manager]
        Upload[File Handler] -->|Bytes| GeminiService
    end

    subgraph "Layer 2: Core Domain (Logic)"
        Store -->|State| ComplianceEngine[Art. 557 Validator]
        RepairEngine[JSON Repair Engine] -->|Typed Data| Store
    end

    subgraph "Layer 3: Infrastructure (Services)"
        GeminiService -->|Raw JSON| RepairEngine
        SyncService -->|CRUD| Supabase
        CacheService -->|Read/Write| IndexedDB
    end

    subgraph "Layer 4: External World"
        Gemini[Google Gemini 2.5 API]
        Supabase[Supabase Platform]
    end

    GeminiService <-->|HTTPS| Gemini
    SyncService <-->|HTTPS/WSS| Supabase
```

### 2.1 Architectural Layers

#### Layer 1: Presentation (The "Skin")

- **Responsibility**: Rendering UI, capturing user events, and displaying feedback.
- **Tech Stack**: React 19, Tailwind CSS 4, Framer Motion.
- **Key Concept**: **"Dumb UI, Smart Hooks"**. Components like `ItemsTable.tsx` receive data via props or strict selectors; they contain no business logic, only display logic.

#### Layer 2: Core Domain (The "Brain")

- **Responsibility**: Validating trade rules, performing calculations, and managing session state.
- **Tech Stack**: TypeScript 5.9, Zod, React Context/Zustand.
- **Key Concept**: **"The Compliance Loop"**. Every update triggers a recalculation of the `ValidationReport`. If the `Unit Price` changes, the system auto-recalculates `Subtotal`, then `Total`, then checks `Art. 557` compliance—all in a single synchronous pass.

#### Layer 3: Infrastructure (The "Limbs")

- **Responsibility**: Talking to the outside world (AI, Database, Browser APIs).
- **Tech Stack**: `fetch`, `Cache API`, `Supabase Client`.
- **Key Concept**: **"Adapter Pattern"**. The UI never calls `fetch('google.com')` directly. It calls `GeminiService.extract()`. This allows us to swap the AI provider (e.g., to OpenAI or infinite-local-LLM) without changing a single line of React code.

#### Layer 4: External World

- **Responsibility**: Persistent storage and heavy compute.
- **Components**: Google Vertex AI (Gemini 2.5), Supabase (PostgreSQL 16 + Auth).

---

## 3. 🧩 Key Systems

### 3.1 The "Hybrid" AI Pipeline

We do not rely solely on the LLM. We use a **Deterministic Sandwich** approach:

1.  **Pre-Processing**: Files are converted to optimized formats (WebP for images) to reduce token cost.
2.  **Stochastic Core**: Gemini 2.5 Multimodal processes the visual context.
3.  **Post-Processing (The Repair Engine)**:
    - **JSON Repair**: Uses a custom stack-based parser to fix truncated JSON from the LLM.
    - **Type Guarding**: Zod schemas enforce rigid data types before the application even sees the data. If the AI returns a string for "Net Weight", the Zod layer coerces or rejects it.

### 3.2 Data Persistence Strategy

We use a **Tiered Storage Model** to balance speed and permanence.

| Tier              | Technology              | Data Type                            | Behavior                                                             |
| :---------------- | :---------------------- | :----------------------------------- | :------------------------------------------------------------------- |
| **Hot (Session)** | React Context           | Form State, UI Toggles               | Lost on refresh. High speed.                                         |
| **Warm (Cache)**  | `IndexedDB` / Cache API | NCM Tables (10MB+), User Preferences | Persists across sessions. Offline ready. Served via **SWR** pattern. |
| **Cold (Cloud)**  | Supabase (PostgreSQL)   | Validated Invoices, Audit Logs       | Permanent record. Secured by RLS.                                    |

### 3.3 Security & Trust Layer

- **BYOK (Bring Your Own Key)**: The application does not bundle Gemini API keys. The user provides them, and they are stored in the browser's `localStorage` (encrypted). They travel directly from Browser -> Google, never touching our backend.
- **RLS (Row-Level Security)**: Database policies strictly enforce data isolation.
  - `SELECT * FROM invoices WHERE user_id = auth.uid()`
  - This ensures that even if the API is compromised, users can only access their own data.

---

## 4. 📂 Directory Structure

The project follows a **Feature-Sliced Design** (light version) approach:

- **`docs/`**: The "Brain". `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `PROJECT_PRESENTATION_TECHNICAL.md`.
- **`src/`**
  - **`components/`**: Pure UI.
    - `ui/`: Design System Primitives (Buttons, Cards).
    - `domain/`: Business-aware components (InvoiceTable, NcmPicker).
  - **`hooks/`**: The "Nervous System".
    - `useInvoiceForm`: Manages the complex state machine.
    - `useCompliance`: The "Rule Engine" watching every keystroke.
  - **`services/`**: The "Limbs" (External Tools).
    - `gemini/`: AI Logic & Prompt Engineering.
    - `supabase/`: Database & Auth connectors.
  - **`lib/`**: Static definitions (Zod Schemas, Type Definitions).

---

## 5. 🔄 Data Flow (The Lifecycle)

1.  **Ingestion**: User drops a PDF.
2.  **Extraction**: `GeminiService` engages. Interactive "Loading" state is shown.
3.  **Normalization**: Raw text -> JSON -> Zod Validation -> `InvoiceData` Type.
4.  **Interaction**: User edits data. `useCompliance` re-runs validation on every keystroke (debounced 300ms).
5.  **Commit**: User clicks "Save". Data is optimistically updated in UI, then pushed to Supabase.

---

## 6. Performance Optimizations

- **Virtualization**: Large tables (500+ items) use `react-window` concepts to only render visible rows.
- **Code Splitting**: Heavy dependencies (Chart.js, PDF generators) are explicitly lazy-loaded using `React.lazy`.
- **Asset Hashing**: NCM tables are hashed. The client only downloads the 10MB update if the hash changes.
