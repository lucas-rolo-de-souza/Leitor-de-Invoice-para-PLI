# Project Technical Presentation: Leitor de Faturas AI

**Version**: 1.05.00.44  
**Date**: January 2026  
**Author**: Lucas R. de Souza

---

## 1. Executive Summary

**Leitor de Faturas AI para PLI** is a specialized, compliance-first SaaS platform designed to solve the "Last Mile Problem" in International Trade: the manual digitization of unstructured Invoice and Packing List documents for the specific purpose of **PLI (Import Licensing Process)**.

While traditional OCR tools rely on brittle regular expressions and rigid templates, our solution leverages **Gemini 2.5 Multimodal AI** to achieve human-level semantic understanding. It does not just "read" text; it interprets trade context, distinguishing between a "Net Weight" line item and a generic table footer, and correctly mapping commercial descriptions to the rigid **NCM (Mercosur Nomenclature)** standards.

Crucially, the platform acts as an automated **Compliance Officer**, enforcing Brazilian Customs Regulations (Instrução Normativa RA 680/02 - Article 557) in real-time. It validates NCM codes against the official Siscomex database, cross-checks mathematical consistency (Unit Price × Quantity = Total), and prevents common clerical errors that lead to costly fines during import declarations (DI/DUIMP).

From a technical perspective, it is a **Type-Safe, Offline-First Progressive Web App (PWA)** built for speed, relying on a deterministic AI pipeline to deliver structured, validated JSON data from chaos, whether the source is a scanned PDF, a photo, or a complex Excel spreadsheet.

---

## 2. Technical Architecture & Design Choices

The system is built on a **Modern Frontend Architecture** prioritizing speed, type safety, and offline-first capabilities.

### 2.1 Core Stack

### 2.1 Core Stack

- **Framework**: **React 19** + **Vite 7**
  - _Why_: We chose the latest React ecosystem to leverage concurrent rendering and upcoming Server Components support. Vite provides an instant dev server start (under 300ms) and optimized production builds using Rollup, essential for maintaining developer velocity in a rapid-iteration cycle.

- **Language**: **TypeScript 5.9** (Strict Mode)
  - _Why_: Given the complexity of Customs data (where a single Invoice can have 100+ varied properties), loose typing was not an option. We use Zod schemas inferred directly to TypeScript types, ensuring that the API response shape matches our frontend components 1:1. This catches 90% of "undefined is not a function" errors at compile time.

- **Styling**: **TailwindCSS 4**
  - _Why_: We avoided heavy component libraries (MUI/AntD) to maintain full control over the "Enterprise Premium" aesthetic. Tailwind v4's new JIT engine allows us to use semantic design tokens (e.g., `bg-surface-sunken`, `text-on-primary`) directly in markup, keeping our CSS bundle size minimal (<10kb gzipped) even as the app scales.

- **State Management**: **React Context + Hooks** (vs. Redux)
  - _Why_: We deliberately rejected Redux/Zustand to reduce architectural complexity.
    - **Scoped State**: Our state is naturally compartmentalized (Form State vs. Global App State).
    - **Performance**: By splitting contexts (`InvoiceContext`, `AuthContext`), we avoid unnecessary re-renders.
    - **Simplicity**: Custom hooks like `useInvoiceForm` wrap `useReducer` to manage complex logic (like recalculating totals when a single line item changes) without the boilerplate of actions/thunks.

### 2.2 Artificial Intelligence Strategy

We utilize a **Deterministic Multimodal Pipeline** to tame the stochastic nature of Large Language Models, ensuring that the critical data required for Import Declarations (DI/DUIMP) is extracted with near-perfect accuracy.

- **Model Selection**: **Gemini 2.5 Flash**
  - _Why_: We benchmarked against GPT-4o and Claude 3.5 Sonnet. Gemini 2.5 was chosen for its distinct advantage in high-resolution document understanding (up to 1M context window) at a fraction of the cost, and its superior speed (sub-3s latency for typical invoices), which is crucial for the "real-time" feel of the application.

- **Prompt Engineering & Persona**:
  - _Strategy_: The system prompt embeds the persona of a "Senior Customs Broker" (Despachante Aduaneiro). This biases the model to prioritize regulatory compliance (naming conventions, NCM format) over creative text generation. We enforce a strict **"Null-Bias Policy"**: if a field (like Incoterms) is ambiguous or missing, the AI is instructed to return `null` rather than hallucinate a probable value.

- **Hybrid Parsing Engine**:
  - _Why_: While Gemini behaves remarkably well with PDF/Images, spreadsheet structures (XLSX/CSV) can be misinterpreted as raw text.
  - _Implementation_: We built a pre-processing layer that converts Excel rows into a structured JSON intermediate representation _before_ sending it to the AI. This guarantees row-level fidelity and prevents "column shift" errors common in complex tabular data.

- **Structured Output Validation**:
  - _Implementation_: We don't rely on the LLM to output valid JSON. We use prompt constraints combined with a rigorous Zod Schema validation layer. If the AI output fails schema validation (e.g., returning a string for `netWeight` instead of a number), the system attempts a "Repair Pass" or flags the specific field for human review.

### 2.3 Data Persistence & Security

Our data strategy balances the need for instant local access with the security required for corporate trade data.

- **Hybrid Storage Model**:
  - **Local-First (Hot Data)**: User preferences, UI state, and massive read-only datasets (like the 25MB NCM table) are stored in `IndexedDB`/`CacheAPI` via a Stale-While-Revalidate pattern. This ensures the app loads instantly even on poor 4G connections typical of port areas.
  - **Cloud (Cold Data)**: Invoice history and user profiles are synchronized to Supabase (PostgreSQL). This allows users to start an invoice on their desktop and finish verifying it on a tablet in the warehouse.

- **Enterprise-Grade Security**:
  - **Row-Level Security (RLS)**: We leverage Postgres RLS policies to enforce data isolation at the database engine level. A compromised API endpoint cannot return data belonging to another user because the database query itself filters based on the `auth.uid()` of the JWT token.
  - **BYOK (Bring Your Own Key)**: To mitigate vendor lock-in and cost risks, the architecture supports a user-provided Gemini API Key. This key is stored in ephemeral memory (or secure local storage) and is never transmitted to our backend, ensuring that we never become a custodian of user credentials.
  - **Environment Isolation**: Strict separation of concerns where public keys (Supabase Anon) are exposed but restricted by RLS, while administrative keys are completely absent from the client-side bundle.

### 2.4 Performance Optimizations

To ensure a "native-like" feel on the web, we prioritized latency reduction and main-thread freedom.

- **SWR (Stale-While-Revalidate) Strategy**:
  - _Challenge_: The NCM (Mercosur Nomenclature) database is large and changes rarely.
  - _Solution_: We utilize a custom SWR hook that serves cached NCM descriptions instantly (0ms latency) from the browser's IDB/Cache API, while silently fetching updates from the Siscomex API in the background. This eliminates the "loading spinner" fatigue for frequent users.

- **Optimistic UI Updates**:
  - _Implementation_: When a user edits a line item (e.g., changing weight), the UI recalculates and updates totals _synchronously_ using local state, providing immediate visual feedback. Complex validations (like rigorous Art. 557 checks) run asynchronously/debounced, ensuring the interface never freezes during typing.

- **Bundle Optimization**:
  - _Technique_: Route-based code splitting via `React.lazy` and dynamic imports for heavy, isolated components (like the `LogViewer` and `SettingsModal`). This keeps the initial page load bundle (First Contentful Paint) under strict budgets, ensuring rapid loading even on 3G networks.

---

## 3. Timeline of Technical Evolution

The project has undergone three distinct evolutionary phases, shifting from a technical proof-of-concept to a scalable SaaS platform.

### Phase 1: The Generative Pilot (v1.00 - v1.02)

- **Context**: The initial challenge was to prove that LLMs could outperform traditional Regex/OCR templates for varied invoice formats.
- **Tech Stack**: React (SPA), Gemini 1.5 Pro (Preview), LocalStorage.
- **Key Achievements**:
  - Implemented "Zero-Shot" extraction capabilities, allowing the system to read layouts it had never seen before.
  - Established the "Art. 557" validation logic, proving the tool's value for compliance.
  - _Limitation_: Performance was slow (15s+ per extraction) and prone to JSON formatting errors.

### Phase 2: The Reliability Pivot (v1.03 - v1.04)

- **Context**: Moving from "It works mostly" to "It works always". Focus shifted to deterministic outputs and strict typing.
- **Tech Stack**: TypeScript Migration, Zod implementation, Gemini 2.0 Flash.
- **Key Achievements**:
  - **Zod Schema Validation**: Introduced runtime enforcement of data shapes, crashing gracefully instead of corrupting the UI.
  - **Hook-Based Architecture**: Decoupled UI components from business logic (`useInvoiceForm`), enabling unit testing.
  - **JSON Repair Strategy**: Developed a multi-pass parser to handle truncated or malformed JSON responses from the AI.

### Phase 3: The Enterprise Scale (v1.05 - Present)

- **Context**: Preparing for multi-user deployment and enterprise adoption.
- **Tech Stack**: Supabase (Postgres), Tailwind v4, i18n, Gemini 2.5.
- **Key Achievements**:
  - **Cloud Persistence**: Seamless sync of invoices to Supabase with RLS security.
  - **Performance**: Upgrade to Gemini 2.5 Flash reduced extraction time by 60% (avg 4s).
  - **Global Readiness**: Full internationalization (i18n) of the UI and validation messages.
  - **Design System Upgrade**: Transition to a high-fidelity "Flux/Material" aesthetic for professional appeal.

---

## 4. Key Features & Differentiators

## 4. Key Features & Differentiators

Our technical moats go beyond simple AI integration, focusing on domain-specific engineering.

### 4.1 Multimodal Extraction Pipeline

- **Visual Reasoning**: The system analyzes the _spatial layout_ of documents, understanding that a number in the rightmost column is likely the "Total Price" even if the header is obscured.
- **Format Agnosticism**: Handles native PDFs, scanned images (JPEG/PNG), and spreadsheet files (Excel/CSV) with a unified standard output.
- **Contextual Disambiguation**: Intelligently resolves common pitfalls, such as distinguishing "Part Number" (alphanumeric) from "NCM Code" (numeric, 8 digits), preventing costly misclassification.

### 4.2 The "Art. 557" Compliance Engine

- **Regulatory Guardrails**: We hard-coded the Brazilian Customs Regulation (Instrução Normativa RA 680/02, Art. 557) into typescript validation rules.
  - _Rule 1_: Description must be complete and in Portuguese.
  - _Rule 2_: Net Weight must be explicit per item.
  - _Rule 3_: Country of Origin is mandatory.
- **Real-Time Siscomex Validation**: Every NCM code extracted is instantly verified against the government's official API to check for expiration or non-existence, flagging invalid codes before they reach the registration stage.
- **Math Integrity Checks**: The system is intolerant to rounding errors. It creates a "Shadow Ledger" that sums all line items and compares them against the document's declared totals, alerting the user to any penny-variance.

### 4.3 Enterprise UX/UI

- **Collaborative State**: Supports a Google Docs-style editing experience where changes are saved instantly to the cloud.
- **Time-Travel Debugging**: Functional "Undo/Redo" stack allows users to revert accidental changes or experiment with AI corrections safely.
- **Accessibility & Localization**: WAI-ARIA compliant components and full i18n support (English/Portuguese), ready for global trade teams.

---

## 5. Future Projection (6-Month Roadmap)

Our strategic roadmap prioritizes **"Depth before Breadth"**. Our immediate objective is to fortify the foundation (Security & Performance) and validate assumptions with real-world usage data. Only after optimizing the individual user experience will we pivot to ecosystem expansion.

We are transitioning from a tool for individuals to a platform for Logistics Teams.

### Q1: Hardening & Validation (Months 1-2)

- **Theme**: The Trust Layer.
- **Objectives**: Security Auditing, Performance Tuning, and Real-World Data Gathering.
- **Technical Deliverables**:
  1.  **Security First (Pentesting & CSP)**:
      - Implementation of strict **Content Security Policy (CSP)** headers to mitigate XSS attacks.
      - Automated dependency auditing (`npm audit`) in CI pipelines.
      - Execution of a standard **Penetration Test** to validate RLS policies and API endpoints before mass rollout.
  2.  **Performance Optimization (Vital Core)**:
      - Goal: Sub-2s extraction times.
      - _Tech_: Specialized prompt tuning (reducing output token count) and aggressive **Stale-While-Revalidate (SWR)** caching strategies for static definition assets (NCM/Currency tables).
      - _Tech_: Implementation of Service Workers for full offline-mode capabilities (PWA).
  3.  **Beta Program Telemetry (Data-Driven Compliance)**:
      - Deploying privacy-focused analytics to track **"Correction Rates"**: a metric measuring how often a human edits a specific AI-extracted field.
      - _Outcome_: This loop provides the ground-truth data needed to fine-tune the Art. 557 compliance engine, identifying which NCM chapters require more specific prompting.

### Q2: The "Intelligence" Quarter (Months 3-6)

- **Theme**: Expanding Boundaries & Forensics.
- **Objectives**: Increase AI autonomy and extend the system's reach into the physical and corporate world.
- **Technical Deliverables**:
  1.  **Webhooks & API Gateway (Smart Ingestion)**:
      - _Scope_: Expose a secure, rate-limited REST API for external ERPs (SAP S/4HANA, Totvs Protheus).
      - _Function_: Allow legacy systems to "push" PDF invoices directly to our processing queue, bypassing the UI entirely, and receiving the validated JSON back via Webhooks.
  2.  **Mobile Scanner Module (Edge AI)**:
      - _Scope_: Upgrade the PWA with camera-first features for warehouse operations.
      - _Tech_: Implementation of **OpenCV.js (WASM)** or standard MediaDevices API for edge detection and perspective correction, allowing operators to snap photos of physical Packing Lists that are instantly digitized.
  3.  **Audit Logs & Forensics (AEO Readiness)**:
      - _Scope_: Moving beyond simple logs to legally defensible audit trails.
      - _Tech_: Implementation of immutable, cryptographically chained logs for every field edit. If an NCM code is changed from "8542.31" to "8542.39", the system records _Who_ (User ID), _When_ (ISO Timestamp), _From Value_, _To Value_, and _Reason Code_. This is a mandatory requirement for **AEO (Authorized Economic Operator)** certification.

---

## 6. Conclusion

The **Leitor de Faturas AI para PLI** has matured from a promising prototype into a resilient, enterprise-ready platform. By strictly adhering to software engineering best practices—**Type Safety, Runtime Validation, and Cloud Security**—we have successfully tamed the unpredictability of Generative AI, turning it into a reliable engine for International Trade compliance.

The next semester will be pivotal. As we move from stabilizing the core engine to integrating with the wider corporate ecosystem (ERPs and Mobile Operations), the focus remains unchanged: delivering **speed, accuracy, and regulatory safety** to the Brazilian logistics sector. We are not just building a document reader; we are building the digital infrastructure for the next generation of customs clearance.
