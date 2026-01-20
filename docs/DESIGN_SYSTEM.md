# Design System: "Enterprise Premium"

## 1. Design Philosophy

The **Invoice Reader AI para PLI** adopts an **"Enterprise Premium"** aesthetic, blending the robust, information-dense utility of **Flux** with the refined, accessible foundations of **Material Design 3 (M3)**.

Our guiding principles:

- **Information Density without Clutter**: We manage high-volume data (invoices with 100+ lines) using whitespace and subtle borders rather than heavy containers.
- **Systemic Trust**: The UI uses specific colors (Blue/Green/Red) _only_ to communicate status (Validation/Success/Error). We avoid decorative colors that could be mistaken for data signals.
- **Fluid Motion**: All state changes (sorting, filtering, opening modals) are animated to provide cognitive continuity, preserving the user's context.

### 1.1 Strategic Architecture: Why Tailwind over Material Libraries?

We deliberately chose **Material Design 3 (Principles)** + **Tailwind CSS (Implementation)** instead of using an off-the-shelf component library (like MUI or Material Web) for three critical reasons:

1.  **Identity (The "Google Clone" Problem)**:
    - Component libraries are opinionated. To achieve our unique "Enterprise Premium" look, we would spend more time overriding library defaults than writing actual styles. Tailwind allows us to build _our_ system from scratch using M3 only as a theoretical guide.
2.  **Information Density**:
    - Standard Material Design is mobile-first and "airy" (lots of padding). Our users need to see 50+ lines of an invoice at once. Tailwind lets us implement a "Flux-like" density—tighter spacing, smaller fonts—that heavy libraries fight against.
3.  **Performance Check**:
    - Libraries like MUI ship with heavy JavaScript runtimes (Emotion/Styled-Components). Tailwind compiles to raw, static CSS at build time, resulting in zero runtime overhead and instant page loads.

---

## 2. 🎨 Color System (Semantic Tokens)

We use a strictly semantic color system. **Never use hardcoded hex values or raw Tailwind colors (e.g., `blue-500`) in components.** Always use the semantic abstraction.

### 2.1 Brand & Action

| Token                  | Light (`#`) | Dark (`#`) | Usage                                         |
| :--------------------- | :---------- | :--------- | :-------------------------------------------- |
| `primary`              | `#2551b8`   | `#a8c7fa`  | Primary Buttons, Active States, Progress Bars |
| `on-primary`           | `#ffffff`   | `#002568`  | Text on Primary Backgrounds                   |
| `primary-container`    | `#eff6ff`   | `#003a94`  | Active Menu Items, Selected Chips             |
| `on-primary-container` | `#1d4ed8`   | `#dbfafe`  | Text inside Primary Container                 |

### 2.2 Surfaces & Backgrounds

| Token               | Light (`#`) | Dark (`#`) | Usage                                     |
| :------------------ | :---------- | :--------- | :---------------------------------------- |
| `surface`           | `#fef7ff`   | `#141218`  | **Page Background**. The deepest layer.   |
| `surface-container` | `#f3edf7`   | `#211f26`  | **Cards & Modals**. Rides above the page. |
| `surface-bright`    | `#ffffff`   | `#3b383e`  | **Input Fields & Highlighted Areas**.     |

### 2.3 Borders & Outlines

| Token             | Light (`#`) | Dark (`#`) | Usage                                 |
| :---------------- | :---------- | :--------- | :------------------------------------ |
| `outline`         | `#79747e`   | `#938f99`  | Input Borders (Default), Card Strokes |
| `outline-variant` | `#cac4d0`   | `#49454f`  | Dividers, Disabled Elements           |

### 2.4 Functional Status (Validation)

| Role        | Color         | Usage                                                  |
| :---------- | :------------ | :----------------------------------------------------- |
| **Error**   | `red-600`     | Critical failures, blocking validation errors.         |
| **Warning** | `amber-500`   | Non-blocking issues (e.g., potential weight mismatch). |
| **Success** | `emerald-600` | Validated NCMs, successful saves.                      |
| **Info**    | `blue-500`    | Neutral system messages.                               |

---

## 3. ✒️ Typography

We employ a **Dual-Typeface Stack** to create a professional, editorial feel that distinguishes us from generic admin dashboards.

### 3.1 Font Families

- **Headings**: `Merriweather` (Serif). Used for `h1`-`h3`. Adds Authority and Trust.
- **Interface**: `Inter` (Sans-Serif). Used for `body`, `inputs`, `tables`. Optimized for legibility at small sizes (12px-14px).

### 3.2 Type Scale

| Element          | Font         | Size/Weight          | Tracking | Usage                               |
| :--------------- | :----------- | :------------------- | :------- | :---------------------------------- |
| **Display**      | Merriweather | `text-4xl` / Bold    | `tight`  | Marketing pages, Empty States       |
| **H1**           | Merriweather | `text-2xl` / Bold    | `normal` | Page Titles                         |
| **H2**           | Merriweather | `text-xl` / SemiBold | `normal` | Section Headers (e.g., "Logistics") |
| **Body Large**   | Inter        | `text-lg` / Regular  | `normal` | Lead text, Modal descriptions       |
| **Body Default** | Inter        | `text-sm` / Regular  | `normal` | Standard input text, table cells    |
| **Caption**      | Inter        | `text-xs` / Medium   | `wide`   | Helper text, Labels, Badges         |

---

## 4. � Components & Patterns

### 4.1 The "Glass" Card (`backdrop-blur`)

We use a subtle glassmorphism effect for floating elements (Header, Sticky Actions) to maintain context while scrolling.

```css
.glass-panel {
  @apply bg-surface/80 backdrop-blur-md border-b border-outline-variant;
}
```

### 4.2 Validated Inputs

Inputs are not just text boxes; they are communication channels.

- **Idle**: Grey border (`outline-variant`).
- **Focus**: Primary Blue ring (`primary`).
- **Error**: Red border + Shake Animation + Helper Text (`error`).
- **Success**: Green Check icon right-aligned (`success`).

### 4.3 Floating Feedback (The "Toast")

We do not block the user's view with large alerts. Validation errors often appear as **Floating Banners** anchored to the specific card causing the issue, ensuring the user knows exactly _where_ to look without losing the overall context.

---

## 5. ⚡ Motion & Interaction

Motion is not decoration; it is navigation.

- **Duration**: `200ms` for micro-interactions (hover), `300ms` for layout changes (modal open).
- **Easing**: `ease-out` (Fast entrance, slow exit).
- **Stagger**: List items (like the Invoice Line Items) load with a `50ms` stagger to reduce perceived wait time.

---

## 6. ♿ Accessibility (A11y)

- **Contrast**: All text meets WCAG 2.1 AA (4.5:1 ratio).
- **Focus Indicators**: Custom focus rings ensure keyboard navigability without relying on browser defaults.
- **Reduce Motion**: All animations respect the `prefers-reduced-motion` media query.
